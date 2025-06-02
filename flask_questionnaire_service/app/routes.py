from flask import Blueprint, request, jsonify, current_app
from app import limiter
import requests
import time
import os
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import logging

# Get the application logger
logger = logging.getLogger('questionnaire_service')

# Create the blueprint
bp = Blueprint('routes', __name__, url_prefix='/api')

# Import services
try:
    from services.backend_connector import BackendConnector
    from services.openai_client import embed_text
    from services.vector_store import VectorStore
    from utils.sanitizer import mask_pii
    from models.prompts import COMPLIANCE_PROMPT
    from ingestion.parser import process_document
    backend_connector = BackendConnector()
    vector_store = VectorStore()
except ImportError as e:
    logger.warning(f"Service module import error: {e}")
    backend_connector = None
    vector_store = None

# Fallback answers (moved from app.py)
FALLBACK_ANSWERS = {
    # Privacy and Data Protection
    "privacy policy": "Yes, our organization maintains a comprehensive Privacy Policy that is publicly available on our website. Our policy details what data we collect, how we use it, and the rights of data subjects. We regularly review and update it to reflect changes in regulations and our business practices.",
    
    # Additional fallback answers...
    # (shortened for brevity - will move the entire fallback dictionary from app.py)
}

@bp.route('/answer', methods=['POST'])
@limiter.limit("20 per minute")
def answer():
    """
    Process a questionnaire by answering a question.
    
    This endpoint expects a JSON payload with a 'question' field.
    It forwards the request to the backend or processes it locally
    and returns the response with appropriate context.
    """
    # Get the question from the request
    data = request.json
    
    if not data or 'question' not in data:
        return jsonify({"error": "Question is required"}), 400
    
    question = data['question']
    
    # Sanitize the question to remove PII
    try:
        sanitized_question = mask_pii(question)
    except Exception as e:
        logger.error(f"Error sanitizing question: {e}")
        sanitized_question = question
    
    # Create trace ID for request tracking
    trace_id = str(uuid.uuid4())
    logger.info(f"Request received [trace_id: {trace_id}] - Processing question")
    
    # Try to get context from vector store if available
    context = ""
    try:
        if vector_store:
            # Get question embedding
            embedding = embed_text(sanitized_question)
            if embedding:
                # Query vector store for relevant context
                results = vector_store.query(embedding, top_k=3)
                if results:
                    context = "\n\n".join([r.get('text', '') for r in results])
                    logger.info(f"[trace_id: {trace_id}] Retrieved context from vector store")
    except Exception as e:
        logger.error(f"[trace_id: {trace_id}] Error retrieving context: {e}")
    
    # Add delay for retries with the backend
    max_retries = 2
    retry_count = 0
    
    while retry_count <= max_retries:
        try:
            # Forward the request to the backend if connector is available
            if backend_connector:
                response_data = backend_connector.get_answer(
                    question=sanitized_question,
                    context=context,
                    trace_id=trace_id
                )
                
                if response_data:
                    response_data['trace_id'] = trace_id
                    return jsonify(response_data)
            
            # If backend unavailable or no response, use fallback
            logger.warning(f"[trace_id: {trace_id}] Using fallback answer")
            fallback_answer = get_fallback_answer(question)
            
            return jsonify({
                "question": question,
                "answer": fallback_answer,
                "trace_id": trace_id,
                "is_fallback": True,
                "timestamp": datetime.now().isoformat()
            })
        
        except Exception as e:
            # Retry on error
            retry_count += 1
            if retry_count <= max_retries:
                time.sleep(1)  # Wait before retrying
                continue
            
            # If all retries failed, return fallback
            logger.error(f"[trace_id: {trace_id}] Error getting answer after retries: {e}")
            fallback_answer = get_fallback_answer(question)
            
            return jsonify({
                "question": question,
                "answer": fallback_answer,
                "error": str(e),
                "trace_id": trace_id,
                "is_fallback": True,
                "timestamp": datetime.now().isoformat()
            })

@bp.route('/upload', methods=['POST'])
@limiter.limit("5 per minute")
def upload_document():
    """
    Upload and process a document for embedding and context retrieval.
    
    This endpoint expects a file upload in multipart/form-data.
    It processes the document, creates embeddings, and stores the data.
    """
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    # If user does not select file, browser also submits an empty part without filename
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Create trace ID for request tracking
    trace_id = str(uuid.uuid4())
    logger.info(f"File upload received [trace_id: {trace_id}] - {file.filename}")
    
    # Check if the file has an allowed extension
    allowed_extensions = {'csv', 'txt', 'json', 'md'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"error": f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"}), 400
    
    try:
        # Save the file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(current_app.instance_path, filename)
        file.save(temp_path)
        
        # Process the document and create embeddings
        document_id = f"doc-{uuid.uuid4()}"
        chunks = process_document(temp_path, document_id)
        
        # Create embeddings and store in vector store
        if chunks and vector_store:
            chunks_processed = 0
            for chunk in chunks:
                # Get embedding for chunk
                embedding = embed_text(chunk['text'])
                if embedding:
                    # Store in vector store
                    vector_store.add(
                        id=f"{document_id}-{chunk['chunk_id']}",
                        embedding=embedding,
                        metadata={
                            'text': chunk['text'],
                            'document_id': document_id,
                            'chunk_id': chunk['chunk_id'],
                            'source': filename,
                            'upload_time': datetime.now().isoformat()
                        }
                    )
                    chunks_processed += 1
            
            logger.info(f"[trace_id: {trace_id}] Document processed: {chunks_processed} chunks")
            
            # Clean up temp file
            os.remove(temp_path)
            
            return jsonify({
                "status": "success",
                "message": "Document processed successfully",
                "document_id": document_id,
                "chunks_processed": chunks_processed,
                "trace_id": trace_id
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Could not process document or vector store unavailable",
                "trace_id": trace_id
            }), 500
            
    except Exception as e:
        logger.error(f"[trace_id: {trace_id}] Error processing document: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error processing document: {str(e)}",
            "trace_id": trace_id
        }), 500

def get_fallback_answer(question):
    """Find the best fallback answer for a question."""
    # Convert question to lowercase for case-insensitive matching
    question_lower = question.lower()
    
    # First try to find an exact phrase match
    for key, value in FALLBACK_ANSWERS.items():
        if key in question_lower:
            return value
    
    # If no exact match, try to find related keywords
    keywords = extract_keywords(question_lower)
    for keyword in keywords:
        for key, value in FALLBACK_ANSWERS.items():
            if keyword in key:
                return value
    
    # If still no match, provide a generic answer
    return "Our organization handles this in accordance with our company policies and applicable regulations. We ensure compliance with all relevant laws and industry best practices. For specific details, please contact our compliance team who can provide you with more information."

def extract_keywords(question):
    """Extract meaningful keywords from a question."""
    import re
    
    # Remove common words and keep only potential compliance-related terms
    common_words = {'do', 'does', 'is', 'are', 'have', 'has', 'the', 'a', 'an', 'your', 'you', 
                   'organization', 'company', 'compliance', 'and', 'or', 'for', 'in', 'with', 
                   'to', 'what', 'how', 'when', 'where', 'why', 'who', 'which'}
    
    # Split the question into words
    words = re.findall(r'\b\w+\b', question.lower())
    
    # Filter out common words and keep only words longer than 3 characters
    keywords = [word for word in words if word not in common_words and len(word) > 3]
    
    return keywords 