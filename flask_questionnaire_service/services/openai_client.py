import os
import logging
from typing import List, Optional
import time

# Get the application logger
logger = logging.getLogger('questionnaire_service')

# Determine if we should use stub embeddings (for testing/development)
USE_STUB_EMBEDDINGS = os.environ.get('USE_STUB_EMBEDDINGS', 'false').lower() == 'true'

# Initialize OpenAI client if not using stubs
if not USE_STUB_EMBEDDINGS:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        logger.info("OpenAI client initialized")
    except ImportError:
        logger.warning("OpenAI SDK not installed. Install with: pip install openai")
        client = None
    except Exception as e:
        logger.error(f"Error initializing OpenAI client: {e}")
        client = None
else:
    logger.info("Using stub embeddings - OpenAI client not initialized")
    client = None

def validate_api_key(api_key: str) -> bool:
    """
    Validate the OpenAI API key by making a lightweight API call.
    
    Args:
        api_key: The OpenAI API key to validate
        
    Returns:
        bool: True if the key is valid, False otherwise
    """
    if USE_STUB_EMBEDDINGS:
        return True
        
    if not api_key:
        return False
        
    try:
        # Create a temporary client with the provided key
        temp_client = OpenAI(api_key=api_key)
        
        # Make a lightweight API call to validate the key
        # We use the models.list endpoint as it's relatively fast and cheap
        response = temp_client.models.list()
        
        # If we get here, the key is valid
        return True
    except Exception as e:
        logger.error(f"API key validation failed: {e}")
        return False

def embed_text(text: str, retry_attempts: int = 2) -> Optional[List[float]]:
    """
    Generate embeddings for a text string using OpenAI's embedding API.
    
    Args:
        text: The text to embed
        retry_attempts: Number of retry attempts for rate limits
        
    Returns:
        List[float] or None: The embedding vector or None if embedding fails
    """
    if USE_STUB_EMBEDDINGS:
        # For testing, return a deterministic "embedding" based on text length
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        hash_bytes = hash_obj.digest()
        # Create a 1536-dimension "embedding" from the hash
        return [float(b % 10) / 10 for b in hash_bytes] * (1536 // len(hash_bytes) + 1)[:1536]
    
    if not client:
        logger.error("OpenAI client not initialized. Cannot generate embeddings.")
        return None
        
    # Retry logic for rate limits
    for attempt in range(retry_attempts + 1):
        try:
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            if "rate limit" in str(e).lower() and attempt < retry_attempts:
                # If rate limited and we have retries left, wait and retry
                wait_time = (2 ** attempt) * 1  # Exponential backoff: 1s, 2s, 4s...
                logger.warning(f"Rate limited, retrying in {wait_time}s... (Attempt {attempt+1}/{retry_attempts+1})")
                time.sleep(wait_time)
                continue
            else:
                logger.error(f"Error generating embeddings: {e}")
                return None
    
    return None 