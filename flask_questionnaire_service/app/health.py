from flask import Blueprint, jsonify, current_app
import os
import time
import shutil
import requests
from datetime import datetime, timedelta

bp = Blueprint('health', __name__, url_prefix='/health')

# Track service start time
service_start_time = datetime.now()

@bp.route('', methods=['GET'])
def health_check():
    """
    Health check endpoint that reports detailed service status.
    Includes backend connectivity, vector store status, uptime, and disk space.
    """
    health_data = {
        "status": "healthy",
        "uptime": get_uptime_string(),
        "disk_space": get_disk_space(),
    }
    
    # Check backend connectivity
    backend_status = check_backend_connection()
    health_data["backend"] = backend_status
    
    # Check vector store connectivity (will be implemented later)
    vector_store_status = "not_configured"
    try:
        from services.vector_store import get_vector_store_status
        vector_store_status = get_vector_store_status()
    except (ImportError, AttributeError):
        pass
    health_data["vector_store"] = vector_store_status
    
    # Determine overall health status
    if backend_status != "connected" and not current_app.config.get('USE_STUB_EMBEDDINGS', False):
        health_data["status"] = "degraded"
    
    return jsonify(health_data)

def get_uptime_string():
    """Calculate and format the service uptime."""
    uptime = datetime.now() - service_start_time
    
    days = uptime.days
    hours, remainder = divmod(uptime.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m {seconds}s"

def get_disk_space():
    """Get available disk space as a percentage."""
    try:
        total, used, free = shutil.disk_usage(os.path.abspath(os.sep))
        free_percent = (free / total) * 100
        return f"{round(free_percent)}% free"
    except Exception:
        return "unknown"

def check_backend_connection():
    """Check if the backend API is accessible."""
    backend_url = current_app.config.get('BACKEND_API_URL')
    try:
        response = requests.get(f'{backend_url}/health', timeout=2)
        if response.status_code == 200:
            return "connected"
        else:
            return f"error_status_{response.status_code}"
    except requests.exceptions.RequestException:
        return "unreachable" 