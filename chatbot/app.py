"""
Flask-based chatbot microservice for compliance questions.
"""
import os
import json
import logging
from typing import List, Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from services.openai_client import get_openai_client
from models.prompts import PromptTemplates
from utils.sanitizer import sanitize_input, is_safe_question

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variables for compliance data
compliance_data: List[Dict[str, Any]] = []

def load_compliance_data():
    """Load compliance data from data_new.json file."""
    global compliance_data
    
    try:
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'data_new.json')
        with open(data_path, 'r', encoding='utf-8') as file:
            compliance_data = json.load(file)
        
        logger.info(f"Successfully loaded {len(compliance_data)} compliance records")
        return True
        
    except FileNotFoundError:
        logger.error(f"Compliance data file not found at {data_path}")
        return False
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing compliance data JSON: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error loading compliance data: {e}")
        return False

def find_relevant_compliance_data(question: str, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Find relevant compliance data based on the question.
    
    Args:
        question (str): The user's question
        data (List[Dict]): The compliance data to search
        
    Returns:
        List[Dict]: Relevant compliance data items
    """
    if not data:
        return []
    
    question_lower = question.lower()
    scored_items = []
    
    for item in data:
        score = 0
        
        # High priority matches
        if item.get('name', '').lower() in question_lower:
            score += 20
        
        # Category matches
        category = item.get('category', '').lower()
        if category and category in question_lower:
            score += 15
        
        # Domain matches
        domains = item.get('domains', [])
        for domain in domains:
            if domain.lower() in question_lower:
                score += 10
        
        # Jurisdiction matches
        jurisdiction = item.get('jurisdiction', '').lower()
        if jurisdiction and any(j.strip().lower() in question_lower for j in jurisdiction.split(',')):
            score += 8
        
        # Description keyword matches
        description = item.get('description', '').lower()
        question_words = [word for word in question_lower.split() if len(word) > 3]
        
        for word in question_words:
            if word in description:
                score += 2
            if word in item.get('requirement', '').lower():
                score += 3
        
        # Special keyword boosting
        special_keywords = {
            'gdpr': ['gdpr', 'general data protection regulation'],
            'hipaa': ['hipaa', 'health insurance portability'],
            'soc': ['soc', 'service organization control'],
            'ccpa': ['ccpa', 'california consumer privacy'],
            'audit': ['audit', 'auditing', 'compliance audit'],
            'breach': ['breach', 'data breach', 'security incident'],
            'consent': ['consent', 'user consent', 'data consent']
        }
        
        for keyword_group, keywords in special_keywords.items():
            if any(kw in question_lower for kw in keywords):
                if any(kw in description or kw in item.get('name', '').lower() for kw in keywords):
                    score += 12
        
        if score > 0:
            scored_items.append((item, score))
    
    # Sort by score and return top 5
    scored_items.sort(key=lambda x: x[1], reverse=True)
    return [item[0] for item in scored_items[:5]]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        # Test OpenAI connection
        client = get_openai_client()
        openai_status = client.test_connection()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': str(os.times()),
            'compliance_data_loaded': len(compliance_data) > 0,
            'compliance_records_count': len(compliance_data),
            'openai_connection': openai_status
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/ask', methods=['POST'])
def ask_question():
    """
    Main endpoint for asking compliance questions.
    
    Expected JSON payload: {"question": "..."}
    Returns: {"answer": "..."}
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({'error': 'Question field is required'}), 400
        
        raw_question = data['question']
        
        # Sanitize and validate input
        sanitized_question = sanitize_input(raw_question)
        
        if not sanitized_question:
            return jsonify({'error': 'Invalid or empty question'}), 400
        
        if not is_safe_question(sanitized_question):
            return jsonify({'error': 'Question contains unsafe content or is too long'}), 400
        
        logger.info(f"Processing question: {sanitized_question[:100]}...")
        
        # Find relevant compliance data
        relevant_data = find_relevant_compliance_data(sanitized_question, compliance_data)
        
        if not relevant_data:
            logger.warning("No relevant compliance data found for question")
            return jsonify({
                'answer': 'I could not find relevant information in the current compliance dataset. Please consult the compliance officer for assistance with this specific question.'
            })
        
        # Generate prompt based on question type
        prompt_templates = PromptTemplates()
        user_prompt = prompt_templates.get_prompt_for_question_type(
            sanitized_question, 
            relevant_data
        )
        
        # Get OpenAI client and generate answer
        client = get_openai_client()
        
        # Validate prompt length
        if not client.validate_prompt_length(prompt_templates.SYSTEM_PROMPT, user_prompt):
            return jsonify({
                'error': 'Question is too complex. Please try breaking it into smaller, more specific questions.'
            }), 400
        
        # Generate answer
        response = client.generate_answer(prompt_templates.SYSTEM_PROMPT, user_prompt)
        
        if not response['success']:
            logger.error(f"OpenAI API error: {response.get('error', 'unknown')}")
            return jsonify({
                'answer': response['answer'],
                'error': response.get('error')
            }), 500
        
        # Log successful response
        logger.info(f"Successfully generated answer. Tokens used: {response['usage']['total_tokens']}")
        
        return jsonify({
            'answer': response['answer'],
            'metadata': {
                'relevant_sources': len(relevant_data),
                'tokens_used': response['usage']['total_tokens'],
                'model': response['model']
            }
        })
        
    except Exception as e:
        logger.error(f"Error processing question: {e}")
        return jsonify({
            'error': 'An internal error occurred while processing your question. Please try again later.'
        }), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Get detailed status information about the service."""
    try:
        client = get_openai_client()
        model_info = client.get_model_info()
        
        return jsonify({
            'service': 'Compliance Chatbot Microservice',
            'version': '1.0.0',
            'status': 'operational',
            'compliance_data': {
                'loaded': len(compliance_data) > 0,
                'record_count': len(compliance_data),
                'categories': list(set(item.get('category', 'Unknown') for item in compliance_data))
            },
            'openai_config': model_info,
            'endpoints': {
                'health': '/health',
                'ask': '/ask (POST)',
                'status': '/status'
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return jsonify({
            'service': 'Compliance Chatbot Microservice',
            'status': 'error',
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'error': 'Endpoint not found',
        'available_endpoints': ['/health', '/ask', '/status']
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'Please try again later or contact support'
    }), 500

# Initialize the application
def create_app():
    """Application factory function."""
    # Load compliance data on startup
    if not load_compliance_data():
        logger.error("Failed to load compliance data. Service may not function properly.")
    
    # Test OpenAI connection on startup
    try:
        client = get_openai_client()
        if client.test_connection():
            logger.info("OpenAI connection verified successfully")
        else:
            logger.warning("OpenAI connection test failed")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")
    
    return app

if __name__ == '__main__':
    # Create and run the app
    app = create_app()
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Flask chatbot microservice on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug) 