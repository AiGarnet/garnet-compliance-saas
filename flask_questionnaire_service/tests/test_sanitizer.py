"""
Tests for the sanitizer module.
"""
import sys
import os
import unittest

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.sanitizer import (
    mask_pii, 
    mask_emails, 
    mask_phone_numbers, 
    mask_credit_cards,
    mask_ssns, 
    mask_ip_addresses,
    mask_urls
)

class TestSanitizer(unittest.TestCase):
    """Test cases for the sanitizer module."""
    
    def test_mask_emails(self):
        """Test email masking."""
        # Test various email formats
        test_cases = [
            ("Contact us at info@example.com for more details.", "Contact us at [EMAIL] for more details."),
            ("Multiple emails: test@example.com and user.name@domain.co.uk", "Multiple emails: [EMAIL] and [EMAIL]"),
            ("No email here", "No email here"),
            ("Invalid email: @example.com", "Invalid email: @example.com"),
        ]
        
        for input_text, expected_output in test_cases:
            self.assertEqual(mask_emails(input_text), expected_output)
    
    def test_mask_phone_numbers(self):
        """Test phone number masking."""
        # Test various phone number formats
        test_cases = [
            ("Call us at 123-456-7890", "Call us at [PHONE]"),
            ("Different formats: (123) 456-7890, 123.456.7890, and 123 456 7890", 
             "Different formats: [PHONE], [PHONE], and [PHONE]"),
            ("International: +1-123-456-7890", "International: [PHONE]"),
            ("No phone number here", "No phone number here"),
        ]
        
        for input_text, expected_output in test_cases:
            self.assertEqual(mask_phone_numbers(input_text), expected_output)
    
    def test_mask_credit_cards(self):
        """Test credit card masking."""
        # Test various credit card formats
        test_cases = [
            ("Card number: 4111-1111-1111-1111", "Card number: [CREDIT_CARD]"),
            ("Without separators: 4111111111111111", "Without separators: [CREDIT_CARD]"),
            ("Multiple cards: 4111-1111-1111-1111 and 5555555555554444", 
             "Multiple cards: [CREDIT_CARD] and [CREDIT_CARD]"),
            ("No credit card here", "No credit card here"),
        ]
        
        for input_text, expected_output in test_cases:
            self.assertEqual(mask_credit_cards(input_text), expected_output)
    
    def test_mask_ssns(self):
        """Test SSN masking."""
        # Test various SSN formats
        test_cases = [
            ("SSN: 123-45-6789", "SSN: [SSN]"),
            ("Without separators: 123456789", "Without separators: [SSN]"),
            ("Multiple SSNs: 123-45-6789 and 987654321", "Multiple SSNs: [SSN] and [SSN]"),
            ("No SSN here", "No SSN here"),
        ]
        
        for input_text, expected_output in test_cases:
            self.assertEqual(mask_ssns(input_text), expected_output)
    
    def test_mask_ip_addresses(self):
        """Test IP address masking."""
        # Test various IP address formats
        test_cases = [
            ("IPv4: 192.168.1.1", "IPv4: [IP_ADDRESS]"),
            ("Multiple IPs: 10.0.0.1 and 172.16.0.1", "Multiple IPs: [IP_ADDRESS] and [IP_ADDRESS]"),
            ("No IP address here", "No IP address here"),
        ]
        
        for input_text, expected_output in test_cases:
            self.assertEqual(mask_ip_addresses(input_text), expected_output)
    
    def test_mask_urls(self):
        """Test URL masking."""
        # Test various URL formats
        test_cases = [
            ("Website: https://example.com", "Website: [URL]"),
            ("Multiple URLs: http://example.com and https://test.org", 
             "Multiple URLs: [URL] and [URL]"),
            ("No URL here", "No URL here"),
        ]
        
        for input_text, expected_output in test_cases:
            self.assertEqual(mask_urls(input_text), expected_output)
    
    def test_mask_pii_combined(self):
        """Test the combined PII masking function."""
        # Test all PII types together
        input_text = """
        Contact us at info@example.com or call 123-456-7890.
        Payment: 4111-1111-1111-1111
        SSN: 123-45-6789
        Server IP: 192.168.1.1
        Website: https://example.com
        """
        
        expected_output = """
        Contact us at [EMAIL] or call [PHONE].
        Payment: [CREDIT_CARD]
        SSN: [SSN]
        Server IP: [IP_ADDRESS]
        Website: [URL]
        """
        
        self.assertEqual(mask_pii(input_text), expected_output)

if __name__ == '__main__':
    unittest.main() 