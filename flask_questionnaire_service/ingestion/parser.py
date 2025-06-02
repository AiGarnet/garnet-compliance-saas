"""
Document parsing module for processing various file formats.
"""
import os
import csv
import json
import logging
from typing import List, Dict, Any, Optional
import re

# Get the application logger
logger = logging.getLogger('questionnaire_service')

def process_document(file_path: str, document_id: str) -> List[Dict[str, Any]]:
    """
    Process a document file and convert it to chunks for embedding.
    
    Args:
        file_path: Path to the document file
        document_id: Unique identifier for the document
        
    Returns:
        List[Dict]: List of text chunks with metadata
    """
    # Check file extension
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    
    # Process based on file type
    if ext == '.csv':
        return process_csv(file_path, document_id)
    elif ext == '.txt':
        return process_text(file_path, document_id)
    elif ext == '.json':
        return process_json(file_path, document_id)
    elif ext == '.md':
        return process_markdown(file_path, document_id)
    else:
        logger.error(f"Unsupported file type: {ext}")
        raise ValueError(f"Unsupported file type: {ext}")

def process_csv(file_path: str, document_id: str) -> List[Dict[str, Any]]:
    """
    Process a CSV file.
    
    Args:
        file_path: Path to the CSV file
        document_id: Unique identifier for the document
        
    Returns:
        List[Dict]: List of text chunks with metadata
    """
    chunks = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Read CSV file
            csv_reader = csv.reader(f)
            headers = next(csv_reader, None)  # Get headers if present
            
            if not headers:
                logger.warning(f"CSV file has no headers: {file_path}")
                return []
            
            # Process each row
            for i, row in enumerate(csv_reader):
                if not row or len(row) != len(headers):
                    continue  # Skip empty or malformed rows
                
                # Create a text representation of the row
                row_text = "\n".join([f"{headers[j]}: {row[j]}" for j in range(len(headers))])
                
                # Add to chunks
                chunks.append({
                    'text': row_text,
                    'chunk_id': i,
                    'document_id': document_id,
                    'metadata': {
                        'source': 'csv',
                        'row': i + 1  # 1-indexed row number
                    }
                })
    except Exception as e:
        logger.error(f"Error processing CSV file: {e}")
        raise
    
    return chunks

def process_text(file_path: str, document_id: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
    """
    Process a text file, splitting into chunks.
    
    Args:
        file_path: Path to the text file
        document_id: Unique identifier for the document
        chunk_size: Maximum number of characters per chunk
        
    Returns:
        List[Dict]: List of text chunks with metadata
    """
    chunks = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Read the entire file
            text = f.read()
            
            # Normalize whitespace
            text = re.sub(r'\s+', ' ', text)
            
            # Remove empty lines
            text = re.sub(r'^\s*$\n', '', text, flags=re.MULTILINE)
            
            # Split into chunks, trying to preserve paragraphs
            paragraphs = re.split(r'\n\s*\n', text)
            
            current_chunk = ""
            chunk_id = 0
            
            for para in paragraphs:
                # If adding this paragraph would exceed chunk size, add current chunk to list
                if len(current_chunk) + len(para) > chunk_size and current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'chunk_id': chunk_id,
                        'document_id': document_id,
                        'metadata': {
                            'source': 'text',
                            'chunk': chunk_id
                        }
                    })
                    current_chunk = ""
                    chunk_id += 1
                
                # Add paragraph to current chunk
                current_chunk += para + "\n\n"
            
            # Add the last chunk if it exists
            if current_chunk:
                chunks.append({
                    'text': current_chunk.strip(),
                    'chunk_id': chunk_id,
                    'document_id': document_id,
                    'metadata': {
                        'source': 'text',
                        'chunk': chunk_id
                    }
                })
    
    except Exception as e:
        logger.error(f"Error processing text file: {e}")
        raise
    
    return chunks

def process_json(file_path: str, document_id: str) -> List[Dict[str, Any]]:
    """
    Process a JSON file.
    
    Args:
        file_path: Path to the JSON file
        document_id: Unique identifier for the document
        
    Returns:
        List[Dict]: List of text chunks with metadata
    """
    chunks = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Parse JSON
            data = json.load(f)
            
            # Process based on structure
            if isinstance(data, list):
                # If it's a list, process each item
                for i, item in enumerate(data):
                    if isinstance(item, dict):
                        # Convert dict to text
                        item_text = json_to_text(item)
                        chunks.append({
                            'text': item_text,
                            'chunk_id': i,
                            'document_id': document_id,
                            'metadata': {
                                'source': 'json',
                                'index': i
                            }
                        })
            elif isinstance(data, dict):
                # If it's a single object, process it
                item_text = json_to_text(data)
                chunks.append({
                    'text': item_text,
                    'chunk_id': 0,
                    'document_id': document_id,
                    'metadata': {
                        'source': 'json',
                        'index': 0
                    }
                })
    
    except Exception as e:
        logger.error(f"Error processing JSON file: {e}")
        raise
    
    return chunks

def process_markdown(file_path: str, document_id: str) -> List[Dict[str, Any]]:
    """
    Process a Markdown file, splitting by headers.
    
    Args:
        file_path: Path to the Markdown file
        document_id: Unique identifier for the document
        
    Returns:
        List[Dict]: List of text chunks with metadata
    """
    chunks = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Read the entire file
            text = f.read()
            
            # Split by headers (## or higher)
            sections = re.split(r'^#{2,}\s+', text, flags=re.MULTILINE)
            
            # First section might not have a header
            if sections and not sections[0].strip():
                sections = sections[1:]
            
            # Process each section
            for i, section in enumerate(sections):
                if section.strip():
                    chunks.append({
                        'text': section.strip(),
                        'chunk_id': i,
                        'document_id': document_id,
                        'metadata': {
                            'source': 'markdown',
                            'section': i
                        }
                    })
    
    except Exception as e:
        logger.error(f"Error processing Markdown file: {e}")
        raise
    
    return chunks

def json_to_text(data: Dict[str, Any], prefix: str = "") -> str:
    """
    Convert a JSON object to text representation.
    
    Args:
        data: The JSON object to convert
        prefix: Prefix for nested objects
        
    Returns:
        str: Text representation of the JSON object
    """
    result = []
    
    for key, value in data.items():
        if isinstance(value, dict):
            # Recursively process nested dictionaries
            nested_text = json_to_text(value, f"{prefix}{key}.")
            result.append(nested_text)
        elif isinstance(value, list):
            # Process lists
            if value and isinstance(value[0], dict):
                # List of objects
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        nested_text = json_to_text(item, f"{prefix}{key}[{i}].")
                        result.append(nested_text)
            else:
                # Simple list
                result.append(f"{prefix}{key}: {', '.join(str(v) for v in value)}")
        else:
            # Simple key-value pair
            result.append(f"{prefix}{key}: {value}")
    
    return "\n".join(result) 