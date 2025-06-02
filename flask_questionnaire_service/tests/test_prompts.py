"""
Tests for the prompts module.
"""
import sys
import os
import unittest

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.prompts import (
    COMPLIANCE_PROMPT,
    format_compliance_prompt,
    DOCUMENT_EXTRACTION_PROMPT,
    FALLBACK_PROMPT,
    DOCUMENT_SUMMARY_PROMPT
)

class TestPrompts(unittest.TestCase):
    """Test cases for the prompts module."""
    
    def test_compliance_prompt_format(self):
        """Test compliance prompt formatting."""
        # Test with a question and no context
        question = "What is your organization's approach to GDPR compliance?"
        prompt = format_compliance_prompt(question)
        
        # Check that the question is included
        self.assertIn(question, prompt)
        
        # Check that the no-context message is included
        self.assertIn("No specific context is provided", prompt)
        
        # Check that the basic prompt structure is maintained
        self.assertIn("You are a compliance assistant", prompt)
        self.assertIn("Answer the question thoroughly but concisely", prompt)
    
    def test_compliance_prompt_with_context(self):
        """Test compliance prompt formatting with context."""
        # Test with both question and context
        question = "What is your organization's approach to GDPR compliance?"
        context = "Our company follows strict GDPR guidelines including data minimization and consent management."
        prompt = format_compliance_prompt(question, context)
        
        # Check that both question and context are included
        self.assertIn(question, prompt)
        self.assertIn(context, prompt)
        
        # Check that the context is properly labeled
        self.assertIn("Context:", prompt)
        
        # Check that the basic prompt structure is maintained
        self.assertIn("You are a compliance assistant", prompt)
        self.assertIn("Answer the question thoroughly but concisely", prompt)
    
    def test_document_extraction_prompt(self):
        """Test document extraction prompt."""
        # Test document text inclusion
        document_text = "This document outlines GDPR requirements including data protection officer appointment."
        prompt = DOCUMENT_EXTRACTION_PROMPT.format(document_text=document_text)
        
        # Check that the document text is included
        self.assertIn(document_text, prompt)
        
        # Check that the extraction instructions are included
        self.assertIn("Extract the following information:", prompt)
        self.assertIn("Relevant compliance requirements", prompt)
        self.assertIn("Specific regulations mentioned", prompt)
    
    def test_fallback_prompt(self):
        """Test fallback prompt."""
        # Test question inclusion
        question = "What cybersecurity measures do you have in place?"
        prompt = FALLBACK_PROMPT.format(question=question)
        
        # Check that the question is included
        self.assertIn(question, prompt)
        
        # Check that the fallback instructions are included
        self.assertIn("general guidance rather than specific", prompt)
        self.assertIn("do not make specific claims about the vendor's practices", prompt)
    
    def test_document_summary_prompt(self):
        """Test document summary prompt."""
        # Test document text inclusion
        document_text = "This policy outlines data retention periods and breach notification procedures."
        prompt = DOCUMENT_SUMMARY_PROMPT.format(document_text=document_text)
        
        # Check that the document text is included
        self.assertIn(document_text, prompt)
        
        # Check that the summary instructions are included
        self.assertIn("Summarize the key points", prompt)
        self.assertIn("concise summary (3-5 bullets)", prompt)

if __name__ == '__main__':
    unittest.main() 