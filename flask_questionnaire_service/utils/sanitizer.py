"""
Sanitization utilities for handling and masking PII data.
"""
import re
import logging

# Get the application logger
logger = logging.getLogger('questionnaire_service')

def mask_pii(text: str) -> str:
    """
    Masks personally identifiable information (PII) in text.
    
    Args:
        text: The text to sanitize
        
    Returns:
        str: Text with PII masked
    """
    if not text:
        return ""
        
    # Track original text length for logging
    original_length = len(text)
    
    # Apply all sanitization functions
    text = mask_emails(text)
    text = mask_phone_numbers(text)
    text = mask_credit_cards(text)
    text = mask_ssns(text)
    text = mask_ip_addresses(text)
    text = mask_urls(text)
    
    # Log if sanitization occurred
    if len(text) != original_length:
        logger.info(f"PII sanitization applied - modified text length")
        
    return text

def mask_emails(text: str) -> str:
    """
    Masks email addresses in text.
    
    Args:
        text: The text to sanitize
        
    Returns:
        str: Text with email addresses masked
    """
    # Pattern for email addresses
    pattern = r'\b[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}\b'
    
    # Replace with [EMAIL]
    return re.sub(pattern, '[EMAIL]', text)

def mask_phone_numbers(text: str) -> str:
    """
    Masks phone numbers in various formats.
    
    Args:
        text: The text to sanitize
        
    Returns:
        str: Text with phone numbers masked
    """
    # Pattern for common phone number formats
    patterns = [
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # 123-456-7890, 123.456.7890, 123 456 7890
        r'\b\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}\b',  # (123)-456-7890, (123) 456-7890
        r'\b\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # +1-123-456-7890, +1 123 456 7890
    ]
    
    # Apply all patterns
    for pattern in patterns:
        text = re.sub(pattern, '[PHONE]', text)
        
    return text

def mask_credit_cards(text: str) -> str:
    """
    Masks credit card numbers.
    
    Args:
        text: The text to sanitize
        
    Returns:
        str: Text with credit card numbers masked
    """
    # Pattern for credit card numbers (13-19 digits, possibly with separators)
    pattern = r'\b(?:\d{4}[-.\s]?){3}\d{4}\b|\b\d{13,19}\b'
    
    # Replace with [CREDIT_CARD]
    return re.sub(pattern, '[CREDIT_CARD]', text)

def mask_ssns(text: str) -> str:
    """
    Masks Social Security Numbers (SSNs).
    
    Args:
        text: The text to sanitize
        
    Returns:
        str: Text with SSNs masked
    """
    # Pattern for SSNs (123-45-6789 or 123456789)
    pattern = r'\b\d{3}[-]?\d{2}[-]?\d{4}\b'
    
    # Replace with [SSN]
    return re.sub(pattern, '[SSN]', text)

def mask_ip_addresses(text: str) -> str:
    """
    Masks IP addresses (IPv4 and IPv6).
    
    Args:
        text: The text to sanitize
        
    Returns:
        str: Text with IP addresses masked
    """
    # Pattern for IPv4
    ipv4_pattern = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
    
    # Pattern for IPv6 (simplified)
    ipv6_pattern = r'\b[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){7}\b'
    
    # Replace with [IP_ADDRESS]
    text = re.sub(ipv4_pattern, '[IP_ADDRESS]', text)
    text = re.sub(ipv6_pattern, '[IP_ADDRESS]', text)
    
    return text

def mask_urls(text: str) -> str:
    """
    Masks URLs.
    
    Args:
        text: The text to sanitize
        
    Returns:
        str: Text with URLs masked
    """
    # Pattern for URLs (simplified)
    pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
    
    # Replace with [URL]
    return re.sub(pattern, '[URL]', text) 