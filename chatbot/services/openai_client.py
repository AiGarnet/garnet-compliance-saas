"""
OpenAI API client wrapper for handling all AI communication.
"""
import os
import logging
from typing import Optional, Dict, Any
import openai
from openai import OpenAI

logger = logging.getLogger(__name__)

class OpenAIClient:
    """Wrapper class for OpenAI API interactions."""
    
    def __init__(self):
        """Initialize the OpenAI client with API key from environment."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4"  # Default to GPT-4 as specified
        self.max_tokens = 1500
        self.temperature = 0.1  # Low temperature for consistent, factual responses
        
        logger.info("OpenAI client initialized successfully")

    def generate_answer(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """
        Generate an answer using OpenAI's chat completion API.
        
        Args:
            system_prompt (str): The system prompt defining the AI's role
            user_prompt (str): The user's question with context
            
        Returns:
            Dict[str, Any]: Response containing answer, token usage, and metadata
        """
        try:
            logger.info(f"Generating answer for prompt length: {len(user_prompt)} characters")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            
            # Extract response data
            answer = response.choices[0].message.content
            usage = response.usage
            
            # Log token usage for monitoring
            logger.info(f"OpenAI API call successful. Tokens used: {usage.total_tokens} "
                       f"(prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens})")
            
            return {
                "answer": answer,
                "model": self.model,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                },
                "success": True
            }
            
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            return {
                "answer": "I'm currently experiencing high demand. Please try again in a moment.",
                "error": "rate_limit_exceeded",
                "success": False
            }
            
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication failed: {e}")
            return {
                "answer": "Authentication error. Please check the API configuration.",
                "error": "authentication_failed",
                "success": False
            }
            
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            return {
                "answer": "I'm experiencing technical difficulties. Please try again later.",
                "error": "api_error",
                "success": False
            }
            
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI client: {e}")
            return {
                "answer": "An unexpected error occurred. Please consult the compliance officer.",
                "error": "unexpected_error",
                "success": False
            }

    def test_connection(self) -> bool:
        """
        Test the OpenAI API connection.
        
        Returns:
            bool: True if connection is successful, False otherwise
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Test connection"}],
                max_tokens=10,
                temperature=0
            )
            logger.info("OpenAI connection test successful")
            return True
            
        except Exception as e:
            logger.error(f"OpenAI connection test failed: {e}")
            return False

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model configuration.
        
        Returns:
            Dict[str, Any]: Model configuration details
        """
        return {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "api_key_configured": bool(self.api_key)
        }

    def estimate_tokens(self, text: str) -> int:
        """
        Estimate the number of tokens in a text string.
        This is a rough estimation based on the rule of thumb that 1 token ≈ 4 characters.
        
        Args:
            text (str): The text to estimate tokens for
            
        Returns:
            int: Estimated number of tokens
        """
        return len(text) // 4

    def validate_prompt_length(self, system_prompt: str, user_prompt: str) -> bool:
        """
        Validate that the combined prompt length doesn't exceed model limits.
        
        Args:
            system_prompt (str): The system prompt
            user_prompt (str): The user prompt
            
        Returns:
            bool: True if within limits, False otherwise
        """
        total_estimated_tokens = self.estimate_tokens(system_prompt + user_prompt)
        # Leave room for the response (GPT-4 has 8192 token context window)
        max_input_tokens = 6000
        
        if total_estimated_tokens > max_input_tokens:
            logger.warning(f"Prompt too long: {total_estimated_tokens} estimated tokens "
                          f"(max: {max_input_tokens})")
            return False
        
        return True

# Global client instance
_client_instance: Optional[OpenAIClient] = None

def get_openai_client() -> OpenAIClient:
    """
    Get or create the global OpenAI client instance.
    
    Returns:
        OpenAIClient: The global client instance
    """
    global _client_instance
    if _client_instance is None:
        _client_instance = OpenAIClient()
    return _client_instance

def reset_client():
    """Reset the global client instance (useful for testing)."""
    global _client_instance
    _client_instance = None 