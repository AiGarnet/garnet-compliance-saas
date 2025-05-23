"""
Unit tests for the chatbot microservice.
"""
import pytest
import json
import os
from unittest.mock import patch, MagicMock

# Import the modules to test
from utils.sanitizer import sanitize_input, is_safe_question, validate_question_length
from models.prompts import PromptTemplates
from services.openai_client import OpenAIClient
from app import app, load_compliance_data, find_relevant_compliance_data

class TestSanitizer:
    """Test cases for input sanitization."""
    
    def test_sanitize_email(self):
        """Test email sanitization."""
        text = "Contact us at admin@example.com for help"
        result = sanitize_input(text)
        assert "[EMAIL_REDACTED]" in result
        assert "admin@example.com" not in result
    
    def test_sanitize_phone(self):
        """Test phone number sanitization."""
        text = "Call us at (555) 123-4567"
        result = sanitize_input(text)
        assert "[PHONE_REDACTED]" in result
        assert "555" not in result
    
    def test_sanitize_ssn(self):
        """Test SSN sanitization."""
        text = "My SSN is 123-45-6789"
        result = sanitize_input(text)
        assert "[SSN_REDACTED]" in result
        assert "123-45-6789" not in result
    
    def test_sanitize_credit_card(self):
        """Test credit card sanitization."""
        text = "Card number: 4532 1234 5678 9012"
        result = sanitize_input(text)
        assert "[CARD_REDACTED]" in result
        assert "4532" not in result
    
    def test_sanitize_url(self):
        """Test URL sanitization."""
        text = "Visit https://example.com/secret"
        result = sanitize_input(text)
        assert "[URL_REDACTED]" in result
        assert "example.com" not in result
    
    def test_sanitize_api_key(self):
        """Test API key sanitization."""
        text = "API key: sk-1234567890abcdef1234567890abcdef"
        result = sanitize_input(text)
        assert "[API_KEY_REDACTED]" in result
        assert "sk-1234567890abcdef1234567890abcdef" not in result
    
    def test_sanitize_password(self):
        """Test password-like content sanitization."""
        text = "password: mySecretPass123"
        result = sanitize_input(text)
        assert "[CREDENTIAL_REDACTED]" in result
        assert "mySecretPass123" not in result
    
    def test_sanitize_clean_text(self):
        """Test that clean text passes through unchanged."""
        text = "What are the GDPR requirements for data processing?"
        result = sanitize_input(text)
        assert result == text
    
    def test_sanitize_empty_input(self):
        """Test empty input handling."""
        assert sanitize_input("") == ""
        assert sanitize_input(None) == ""
        assert sanitize_input("   ") == ""
    
    def test_validate_question_length(self):
        """Test question length validation."""
        short_question = "What is GDPR?"
        long_question = "x" * 1001
        
        assert validate_question_length(short_question) == True
        assert validate_question_length(long_question) == False
        assert validate_question_length(long_question, max_length=1500) == True
    
    def test_is_safe_question(self):
        """Test question safety validation."""
        safe_question = "What are the GDPR data subject rights?"
        unsafe_script = "<script>alert('xss')</script>"
        unsafe_eval = "eval(malicious_code)"
        too_short = "Hi"
        too_long = "x" * 1001
        
        assert is_safe_question(safe_question) == True
        assert is_safe_question(unsafe_script) == False
        assert is_safe_question(unsafe_eval) == False
        assert is_safe_question(too_short) == False
        assert is_safe_question(too_long) == False

class TestPromptTemplates:
    """Test cases for prompt templates."""
    
    def test_detect_question_type_gdpr(self):
        """Test GDPR question type detection."""
        gdpr_questions = [
            "What are GDPR data subject rights?",
            "How do we handle data breach notifications?",
            "What is the right to be forgotten?",
            "Do we need a data protection officer?"
        ]
        
        for question in gdpr_questions:
            assert PromptTemplates.detect_question_type(question) == 'gdpr'
    
    def test_detect_question_type_soc2(self):
        """Test SOC 2 question type detection."""
        soc2_questions = [
            "What are SOC 2 security controls?",
            "How do we meet SOC 2 availability criteria?",
            "What is required for SOC 2 audit?",
            "What are trust service criteria?"
        ]
        
        for question in soc2_questions:
            assert PromptTemplates.detect_question_type(question) == 'soc2'
    
    def test_detect_question_type_hipaa(self):
        """Test HIPAA question type detection."""
        hipaa_questions = [
            "What are HIPAA requirements?",
            "How do we protect PHI?",
            "What is protected health information?",
            "HIPAA compliance for healthcare data"
        ]
        
        for question in hipaa_questions:
            assert PromptTemplates.detect_question_type(question) == 'hipaa'
    
    def test_detect_question_type_general(self):
        """Test general question type detection."""
        general_questions = [
            "What is our data retention policy?",
            "How do we handle vendor assessments?",
            "What are our security procedures?"
        ]
        
        for question in general_questions:
            assert PromptTemplates.detect_question_type(question) == 'general'
    
    def test_create_compliance_prompt(self):
        """Test compliance prompt creation."""
        question = "What are GDPR requirements?"
        context_data = [{
            'name': 'GDPR',
            'type': 'Regulation',
            'description': 'EU data protection regulation',
            'jurisdiction': 'European Union',
            'category': 'Data Privacy',
            'requirement': 'Protect personal data',
            'effective_date': '2018-05-25',
            'domains': ['Data Protection']
        }]
        
        prompt = PromptTemplates.create_compliance_prompt(question, context_data)
        
        assert question in prompt
        assert 'GDPR' in prompt
        assert 'European Union' in prompt
        assert 'Data Protection' in prompt
    
    def test_summarize_context_empty(self):
        """Test context summarization with empty data."""
        result = PromptTemplates._summarize_context([])
        assert result == "No specific compliance context available."
    
    def test_summarize_context_with_data(self):
        """Test context summarization with data."""
        context_data = [{
            'name': 'Test Regulation',
            'type': 'Law',
            'description': 'Test description',
            'jurisdiction': 'Test Jurisdiction',
            'category': 'Test Category',
            'requirement': 'Test requirement',
            'effective_date': '2023-01-01',
            'domains': ['Test Domain']
        }]
        
        result = PromptTemplates._summarize_context(context_data)
        
        assert 'Test Regulation' in result
        assert 'Test Jurisdiction' in result
        assert 'Test Category' in result

class TestOpenAIClient:
    """Test cases for OpenAI client."""
    
    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'})
    def test_client_initialization(self):
        """Test OpenAI client initialization."""
        client = OpenAIClient()
        assert client.api_key == 'test-key'
        assert client.model == 'gpt-4'
        assert client.temperature == 0.1
    
    def test_client_initialization_no_key(self):
        """Test OpenAI client initialization without API key."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="OPENAI_API_KEY environment variable is required"):
                OpenAIClient()
    
    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'})
    def test_estimate_tokens(self):
        """Test token estimation."""
        client = OpenAIClient()
        text = "This is a test string"
        estimated = client.estimate_tokens(text)
        assert estimated == len(text) // 4
    
    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'})
    def test_validate_prompt_length(self):
        """Test prompt length validation."""
        client = OpenAIClient()
        short_prompt = "Short prompt"
        long_prompt = "x" * 25000  # Very long prompt
        
        assert client.validate_prompt_length(short_prompt, short_prompt) == True
        assert client.validate_prompt_length(long_prompt, long_prompt) == False
    
    @patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'})
    def test_get_model_info(self):
        """Test getting model information."""
        client = OpenAIClient()
        info = client.get_model_info()
        
        assert info['model'] == 'gpt-4'
        assert info['temperature'] == 0.1
        assert info['api_key_configured'] == True

class TestFlaskApp:
    """Test cases for Flask application."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get('/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'status' in data
        assert 'compliance_data_loaded' in data
        assert 'compliance_records_count' in data
    
    def test_status_endpoint(self, client):
        """Test status endpoint."""
        response = client.get('/status')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['service'] == 'Compliance Chatbot Microservice'
        assert 'compliance_data' in data
        assert 'endpoints' in data
    
    def test_ask_endpoint_no_json(self, client):
        """Test ask endpoint with non-JSON request."""
        response = client.post('/ask', data='not json')
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert 'error' in data
        assert 'JSON' in data['error']
    
    def test_ask_endpoint_no_question(self, client):
        """Test ask endpoint without question field."""
        response = client.post('/ask', json={})
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert 'error' in data
        assert 'required' in data['error']
    
    def test_ask_endpoint_empty_question(self, client):
        """Test ask endpoint with empty question."""
        response = client.post('/ask', json={'question': ''})
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_ask_endpoint_unsafe_question(self, client):
        """Test ask endpoint with unsafe question."""
        response = client.post('/ask', json={'question': '<script>alert("xss")</script>'})
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert 'error' in data
        assert 'unsafe' in data['error']
    
    def test_404_handler(self, client):
        """Test 404 error handler."""
        response = client.get('/nonexistent')
        assert response.status_code == 404
        
        data = json.loads(response.data)
        assert 'error' in data
        assert 'not found' in data['error'].lower()

class TestComplianceDataFunctions:
    """Test cases for compliance data functions."""
    
    def test_find_relevant_compliance_data_empty(self):
        """Test finding relevant data with empty dataset."""
        result = find_relevant_compliance_data("test question", [])
        assert result == []
    
    def test_find_relevant_compliance_data_with_matches(self):
        """Test finding relevant data with matches."""
        test_data = [
            {
                'name': 'GDPR',
                'category': 'Data Privacy',
                'description': 'European data protection regulation',
                'domains': ['Data Protection'],
                'jurisdiction': 'European Union'
            },
            {
                'name': 'HIPAA',
                'category': 'Healthcare Privacy',
                'description': 'US healthcare data protection',
                'domains': ['Healthcare'],
                'jurisdiction': 'United States'
            }
        ]
        
        # Test GDPR question
        gdpr_result = find_relevant_compliance_data("What are GDPR requirements?", test_data)
        assert len(gdpr_result) > 0
        assert gdpr_result[0]['name'] == 'GDPR'
        
        # Test HIPAA question
        hipaa_result = find_relevant_compliance_data("HIPAA compliance requirements", test_data)
        assert len(hipaa_result) > 0
        assert hipaa_result[0]['name'] == 'HIPAA'
    
    def test_find_relevant_compliance_data_no_matches(self):
        """Test finding relevant data with no matches."""
        test_data = [
            {
                'name': 'Unrelated Regulation',
                'category': 'Other',
                'description': 'Something completely different',
                'domains': ['Other'],
                'jurisdiction': 'Nowhere'
            }
        ]
        
        result = find_relevant_compliance_data("GDPR requirements", test_data)
        assert result == []

if __name__ == '__main__':
    pytest.main([__file__]) 