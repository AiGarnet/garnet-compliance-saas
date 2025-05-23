"""
Input sanitization utilities for removing PII and sensitive information.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Patterns for detecting and masking sensitive information
PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
    'ssn': r'\b\d{3}-?\d{2}-?\d{4}\b',
    'credit_card': r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
    'ip_address': r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
    'url': r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?',
    'api_key': r'\b[A-Za-z0-9]{32,}\b',
    'password_like': r'\b(?:password|pwd|pass|secret|key|token)\s*[:=]\s*\S+\b'
}

def sanitize_input(text: str) -> str:
    """
    Sanitize user input by removing or masking PII and sensitive information.
    
    Args:
        text (str): The input text to sanitize
        
    Returns:
        str: Sanitized text with sensitive information masked
    """
    if not text or not isinstance(text, str):
        return ""
    
    sanitized = text.strip()
    
    # Log original length for monitoring
    original_length = len(sanitized)
    
    # Apply sanitization patterns
    sanitized = re.sub(PATTERNS['email'], '[EMAIL_REDACTED]', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(PATTERNS['phone'], '[PHONE_REDACTED]', sanitized)
    sanitized = re.sub(PATTERNS['ssn'], '[SSN_REDACTED]', sanitized)
    sanitized = re.sub(PATTERNS['credit_card'], '[CARD_REDACTED]', sanitized)
    sanitized = re.sub(PATTERNS['ip_address'], '[IP_REDACTED]', sanitized)
    sanitized = re.sub(PATTERNS['url'], '[URL_REDACTED]', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(PATTERNS['api_key'], '[API_KEY_REDACTED]', sanitized)
    sanitized = re.sub(PATTERNS['password_like'], '[CREDENTIAL_REDACTED]', sanitized, flags=re.IGNORECASE)
    
    # Remove excessive whitespace
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    
    # Log if sanitization occurred
    if len(sanitized) != original_length:
        logger.info(f"Input sanitized: original length {original_length}, sanitized length {len(sanitized)}")
    
    return sanitized

def validate_question_length(question: str, max_length: int = 1000) -> bool:
    """
    Validate that the question is within acceptable length limits.
    
    Args:
        question (str): The question to validate
        max_length (int): Maximum allowed length
        
    Returns:
        bool: True if valid, False otherwise
    """
    return len(question.strip()) <= max_length

def is_safe_question(question: str) -> bool:
    """
    Check if the question appears to be safe and appropriate.
    
    Args:
        question (str): The question to check
        
    Returns:
        bool: True if safe, False otherwise
    """
    if not question or not isinstance(question, str):
        return False
    
    # Check for minimum length
    if len(question.strip()) < 5:
        return False
    
    # Check for maximum length
    if not validate_question_length(question):
        return False
    
    # Check for potentially harmful patterns
    harmful_patterns = [
        r'<script',
        r'javascript:',
        r'eval\(',
        r'exec\(',
        r'system\(',
        r'import\s+os',
        r'__import__'
    ]
    
    question_lower = question.lower()
    for pattern in harmful_patterns:
        if re.search(pattern, question_lower, re.IGNORECASE):
            logger.warning(f"Potentially harmful pattern detected: {pattern}")
            return False
    
    return True 