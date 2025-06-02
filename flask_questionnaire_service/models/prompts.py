"""
This module contains prompt templates for AI interactions.
Templates are designed to be formatted with specific variables.
"""

# Main compliance question answering prompt
COMPLIANCE_PROMPT = """You are a compliance assistant for a vendor onboarding process.
Your task is to provide accurate, helpful answers to compliance questions.

Question: {question}

{context_section}

Answer the question thoroughly but concisely from the vendor's perspective (using "we" and "our").
If you can't answer based on the provided information, explain what information would be needed.
Cite specific regulations or requirements where relevant.
"""

# Helper function to format the prompt with context
def format_compliance_prompt(question: str, context: str = "") -> str:
    """
    Format the compliance prompt with the given question and context.
    
    Args:
        question: The compliance question to answer
        context: Optional context to include in the prompt
        
    Returns:
        str: The formatted prompt
    """
    # Include context section if provided
    if context:
        context_section = f"Context:\n{context}"
    else:
        context_section = "No specific context is provided. Use your general knowledge of compliance requirements."
    
    # Format the prompt
    return COMPLIANCE_PROMPT.format(
        question=question,
        context_section=context_section
    )

# Document processing prompt for extracting structured information
DOCUMENT_EXTRACTION_PROMPT = """You are a document analysis assistant.
Extract the key compliance information from the following document text.

Document text:
{document_text}

Extract the following information:
1. Relevant compliance requirements
2. Specific regulations mentioned
3. Key deadlines or timeframes
4. Required actions or documentation
5. Risk levels mentioned (if any)

Format your response as structured information that can be used for compliance assessment.
"""

# Fallback prompt when no specific information is available
FALLBACK_PROMPT = """You are a compliance assistant.
Provide a general, helpful response to the following question based on common compliance practices.
Do not make specific claims about the vendor's practices since you don't have that information.

Question: {question}

Your response should be helpful but make it clear that this is general guidance rather than specific 
to the vendor's actual practices or policies.
"""

# Prompt for summarizing uploaded documents
DOCUMENT_SUMMARY_PROMPT = """You are a document summarization assistant.
Summarize the key points from the following document text, focusing on compliance-related information.

Document text:
{document_text}

Provide a concise summary (3-5 bullets) of the key compliance points from this document.
""" 