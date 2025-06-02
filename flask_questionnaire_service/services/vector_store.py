import os
import logging
from typing import List, Dict, Any, Optional
import json
import time
from abc import ABC, abstractmethod

# Get the application logger
logger = logging.getLogger('questionnaire_service')

class AbstractVectorStore(ABC):
    """Abstract interface for vector stores."""
    
    @abstractmethod
    def add(self, id: str, embedding: List[float], metadata: dict) -> bool:
        """
        Add an embedding with metadata to the vector store.
        
        Args:
            id: Unique identifier for the embedding
            embedding: The embedding vector
            metadata: Additional metadata to store with the embedding
            
        Returns:
            bool: True if successful, False otherwise
        """
        pass
    
    @abstractmethod
    def query(self, embedding: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Query the vector store for similar embeddings.
        
        Args:
            embedding: The query embedding vector
            top_k: Number of results to return
            
        Returns:
            List[Dict]: List of metadata for the most similar embeddings
        """
        pass
    
    @abstractmethod
    def get_status(self) -> str:
        """
        Get the status of the vector store.
        
        Returns:
            str: Status string (e.g., "connected", "error")
        """
        pass

class InMemoryVectorStore(AbstractVectorStore):
    """
    In-memory implementation of a vector store.
    Used for development, testing, or when no external vector DB is available.
    """
    
    def __init__(self):
        """Initialize the in-memory vector store."""
        self.store = {}  # Dictionary to store embeddings and metadata
        self.status = "connected"
        logger.info("In-memory vector store initialized")
    
    def add(self, id: str, embedding: List[float], metadata: dict) -> bool:
        """Add an embedding with metadata to the in-memory store."""
        try:
            # Store the embedding and metadata
            self.store[id] = {
                "embedding": embedding,
                "metadata": metadata
            }
            return True
        except Exception as e:
            logger.error(f"Error adding to vector store: {e}")
            self.status = "error"
            return False
    
    def query(self, embedding: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
        """Query the in-memory store for similar embeddings using dot product similarity."""
        try:
            # Compute similarity scores
            scores = []
            for id, item in self.store.items():
                # Simple dot product similarity
                similarity = self._dot_product(embedding, item["embedding"])
                scores.append((id, similarity, item["metadata"]))
            
            # Sort by similarity (highest first)
            scores.sort(key=lambda x: x[1], reverse=True)
            
            # Return top_k results
            return [{"id": id, "score": score, **metadata} for id, score, metadata in scores[:top_k]]
        except Exception as e:
            logger.error(f"Error querying vector store: {e}")
            self.status = "error"
            return []
    
    def get_status(self) -> str:
        """Get the status of the in-memory vector store."""
        return self.status
    
    def _dot_product(self, v1: List[float], v2: List[float]) -> float:
        """Compute the dot product between two vectors."""
        if len(v1) != len(v2):
            raise ValueError("Vectors must have the same dimension")
        return sum(a * b for a, b in zip(v1, v2))


# In the future, add FAISS-based vector store implementation:
"""
class FaissVectorStore(AbstractVectorStore):
    def __init__(self, dimension: int = 1536, index_path: Optional[str] = None):
        import faiss
        # Implementation details...
"""

# Function to get the appropriate vector store implementation
def get_vector_store() -> AbstractVectorStore:
    """
    Factory function to get the appropriate vector store implementation.
    In the future, this could select between different implementations
    based on configuration.
    
    Returns:
        AbstractVectorStore: A vector store implementation
    """
    # For now, always return the in-memory implementation
    # In the future, this could be expanded to support other implementations
    return InMemoryVectorStore()

# Function to get vector store status
def get_vector_store_status() -> str:
    """
    Get the status of the vector store.
    
    Returns:
        str: Status string (e.g., "connected", "error")
    """
    try:
        store = get_vector_store()
        return store.get_status()
    except Exception as e:
        logger.error(f"Error getting vector store status: {e}")
        return "error"

# Singleton instance
_vector_store_instance = None

# Create a singleton VectorStore class that wraps the factory
class VectorStore:
    """
    Singleton wrapper for vector store implementations.
    Ensures only one vector store instance is created.
    """
    def __new__(cls):
        global _vector_store_instance
        if _vector_store_instance is None:
            _vector_store_instance = get_vector_store()
        return _vector_store_instance 