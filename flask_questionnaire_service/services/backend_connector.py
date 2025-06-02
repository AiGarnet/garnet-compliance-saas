import requests
import logging
import json
import os
from typing import Optional, Dict, Any

# Get the application logger
logger = logging.getLogger('questionnaire_service')

class BackendConnector:
    """
    Connector class for communicating with the main backend API.
    Handles API requests, retries, and error handling.
    """
    
    def __init__(self, backend_url: Optional[str] = None):
        """
        Initialize the backend connector with the backend URL.
        
        Args:
            backend_url: URL of the backend API (defaults to BACKEND_API_URL env var)
        """
        self.backend_url = backend_url or os.environ.get('BACKEND_API_URL', 'http://localhost:5000')
        self.timeout = 15  # Default timeout in seconds
        logger.info(f"Backend connector initialized with URL: {self.backend_url}")
    
    def get_answer(self, question: str, context: str = "", trace_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Get an answer from the backend API.
        
        Args:
            question: The question to ask
            context: Optional context to provide for the question
            trace_id: Optional trace ID for request tracking
            
        Returns:
            Dict or None: The response data if successful, None otherwise
        """
        try:
            # Prepare request payload
            payload = {
                "question": question
            }
            
            # Add context if provided
            if context:
                payload["context"] = context
                
            # Add trace ID if provided
            if trace_id:
                payload["trace_id"] = trace_id
            
            # Make the request to the backend
            response = requests.post(
                f"{self.backend_url}/api/answer",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout
            )
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Parse and return the response
            response_data = response.json()
            logger.info(f"Backend answered question successfully [trace_id: {trace_id}]")
            return response_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error contacting backend: {e} [trace_id: {trace_id}]")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing backend response: {e} [trace_id: {trace_id}]")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in backend connector: {e} [trace_id: {trace_id}]")
            return None
    
    def check_health(self) -> bool:
        """
        Check if the backend API is healthy.
        
        Returns:
            bool: True if healthy, False otherwise
        """
        try:
            response = requests.get(
                f"{self.backend_url}/health", 
                timeout=5
            )
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False 