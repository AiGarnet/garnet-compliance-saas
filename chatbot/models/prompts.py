"""
Prompt templates for OpenAI API interactions.
"""
import json
from typing import List, Dict, Any

class PromptTemplates:
    """Templates for generating structured prompts for the OpenAI API."""
    
    SYSTEM_PROMPT = """You are a professional compliance assistant with expertise in data privacy, cybersecurity, and regulatory compliance. Your role is to provide accurate, confident, and actionable answers based on the internal compliance policies and regulations provided.

Guidelines:
- Provide clear, professional, and confident responses
- Base your answers strictly on the provided reference context
- Use specific regulatory names, requirements, and procedures when available
- Structure your responses with clear sections and bullet points when appropriate
- If information is not available in the context, clearly state this limitation
- Always maintain a professional tone suitable for business compliance discussions
- Include relevant compliance framework references (GDPR, SOC 2, HIPAA, etc.) when applicable"""

    @staticmethod
    def create_compliance_prompt(question: str, context_data: List[Dict[str, Any]]) -> str:
        """
        Create a structured prompt for compliance questions.
        
        Args:
            question (str): The sanitized user question
            context_data (List[Dict]): Relevant compliance data from data_new.json
            
        Returns:
            str: Formatted prompt for OpenAI API
        """
        # Summarize context data
        context_summary = PromptTemplates._summarize_context(context_data)
        
        prompt = f"""You are a compliance assistant. Based on the following internal compliance policies and the question provided, generate a confident, professional, and accurate response:

Question: "{question}"

Reference Context:
{context_summary}

Please provide a comprehensive answer that:
1. Directly addresses the question
2. References specific compliance frameworks or regulations when applicable
3. Provides actionable guidance or steps if relevant
4. Maintains professional compliance language

Answer:"""
        
        return prompt

    @staticmethod
    def create_gdpr_prompt(question: str, context_data: List[Dict[str, Any]]) -> str:
        """
        Create a GDPR-specific prompt template.
        
        Args:
            question (str): The sanitized user question
            context_data (List[Dict]): Relevant GDPR compliance data
            
        Returns:
            str: GDPR-focused prompt for OpenAI API
        """
        context_summary = PromptTemplates._summarize_context(context_data)
        
        prompt = f"""You are a GDPR compliance specialist. Based on the GDPR requirements and policies provided, answer the following question with specific reference to GDPR articles, requirements, and procedures:

Question: "{question}"

GDPR Context:
{context_summary}

Please provide a detailed response that includes:
1. Relevant GDPR articles or requirements
2. Specific data subject rights if applicable
3. Required procedures or documentation
4. Compliance deadlines or timeframes if relevant
5. Potential penalties or risks for non-compliance

Answer:"""
        
        return prompt

    @staticmethod
    def create_soc2_prompt(question: str, context_data: List[Dict[str, Any]]) -> str:
        """
        Create a SOC 2-specific prompt template.
        
        Args:
            question (str): The sanitized user question
            context_data (List[Dict]): Relevant SOC 2 compliance data
            
        Returns:
            str: SOC 2-focused prompt for OpenAI API
        """
        context_summary = PromptTemplates._summarize_context(context_data)
        
        prompt = f"""You are a SOC 2 compliance expert. Based on the SOC 2 Trust Service Criteria and internal policies provided, answer the following question with specific reference to SOC 2 requirements:

Question: "{question}"

SOC 2 Context:
{context_summary}

Please provide a comprehensive response that includes:
1. Relevant Trust Service Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy)
2. Required controls or procedures
3. Evidence or documentation requirements
4. Implementation guidance
5. Monitoring and testing requirements

Answer:"""
        
        return prompt

    @staticmethod
    def _summarize_context(context_data: List[Dict[str, Any]]) -> str:
        """
        Summarize compliance context data for prompt inclusion.
        
        Args:
            context_data (List[Dict]): Compliance data to summarize
            
        Returns:
            str: Formatted context summary
        """
        if not context_data:
            return "No specific compliance context available."
        
        summaries = []
        for item in context_data[:5]:  # Limit to top 5 most relevant items
            summary = f"""
**{item.get('name', 'Unknown Regulation')}** ({item.get('type', 'Unknown Type')})
- Jurisdiction: {item.get('jurisdiction', 'Not specified')}
- Category: {item.get('category', 'Not specified')}
- Description: {item.get('description', 'No description available')}
- Requirements: {item.get('requirement', 'No specific requirements listed')}
- Effective Date: {item.get('effective_date', 'Not specified')}
- Domains: {', '.join(item.get('domains', []))}
"""
            summaries.append(summary.strip())
        
        return "\n\n".join(summaries)

    @staticmethod
    def detect_question_type(question: str) -> str:
        """
        Detect the type of compliance question to use appropriate prompt template.
        
        Args:
            question (str): The user's question
            
        Returns:
            str: Question type ('gdpr', 'soc2', 'hipaa', 'general')
        """
        question_lower = question.lower()
        
        # GDPR keywords
        gdpr_keywords = ['gdpr', 'data subject', 'right to be forgotten', 'data protection officer', 
                        'consent', 'data breach', 'privacy by design', 'data portability']
        
        # SOC 2 keywords
        soc2_keywords = ['soc 2', 'soc2', 'trust service', 'security controls', 'availability', 
                        'processing integrity', 'confidentiality', 'audit', 'internal controls']
        
        # HIPAA keywords
        hipaa_keywords = ['hipaa', 'phi', 'protected health information', 'healthcare', 
                         'medical records', 'health data']
        
        if any(keyword in question_lower for keyword in gdpr_keywords):
            return 'gdpr'
        elif any(keyword in question_lower for keyword in soc2_keywords):
            return 'soc2'
        elif any(keyword in question_lower for keyword in hipaa_keywords):
            return 'hipaa'
        else:
            return 'general'

    @staticmethod
    def get_prompt_for_question_type(question: str, context_data: List[Dict[str, Any]], 
                                   question_type: str = None) -> str:
        """
        Get the appropriate prompt template based on question type.
        
        Args:
            question (str): The sanitized user question
            context_data (List[Dict]): Relevant compliance data
            question_type (str): Optional question type override
            
        Returns:
            str: Formatted prompt for OpenAI API
        """
        if question_type is None:
            question_type = PromptTemplates.detect_question_type(question)
        
        if question_type == 'gdpr':
            return PromptTemplates.create_gdpr_prompt(question, context_data)
        elif question_type == 'soc2':
            return PromptTemplates.create_soc2_prompt(question, context_data)
        else:
            return PromptTemplates.create_compliance_prompt(question, context_data) 