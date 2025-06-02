"""
Start service script for Flask Questionnaire Service.

This script provides a convenient way to start the Flask Questionnaire Service
with proper logging and error handling.
"""
import os
import subprocess
import sys
import time
import requests
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

# Set up logging
logger = logging.getLogger('questionnaire_service_starter')
logger.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_format)
logger.addHandler(console_handler)

# File handler with rotation
file_handler = RotatingFileHandler(
    os.path.join(log_dir, 'service_starter.log'),
    maxBytes=5*1024*1024,  # 5MB
    backupCount=3
)
file_handler.setLevel(logging.INFO)
file_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_format)
logger.addHandler(file_handler)

def is_service_running(port=5001):
    """Check if the service is already running on the specified port"""
    try:
        response = requests.get(f'http://localhost:{port}/health', timeout=2)
        if response.status_code == 200:
            return True
    except requests.exceptions.RequestException:
        pass
    return False

def check_backend_connection(backend_url):
    """Check if the backend API is accessible"""
    try:
        response = requests.get(f'{backend_url}/health', timeout=5)
        if response.status_code == 200:
            logger.info(f"Successfully connected to backend at {backend_url}")
            return True
        else:
            logger.warning(f"Backend health check failed with status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Could not connect to backend at {backend_url}: {e}")
    return False

def check_openai_key():
    """Check if the OpenAI API key is set"""
    api_key = os.environ.get('OPENAI_API_KEY')
    if api_key:
        logger.info("OpenAI API key is set")
        return True
    else:
        logger.warning("OpenAI API key is not set. Embedding functionality will be disabled.")
        return False

def start_service():
    """Start the Flask questionnaire service"""
    
    # Check if service is already running
    if is_service_running():
        logger.info("Questionnaire service is already running at http://localhost:5001")
        return True
    
    # Get environment variables or use defaults
    port = os.environ.get('PORT', '5001')
    backend_url = os.environ.get('BACKEND_API_URL', 'http://localhost:5000')
    flask_env = os.environ.get('FLASK_ENV', 'development')
    
    # Verify backend connection
    if not check_backend_connection(backend_url):
        logger.warning(f"Backend at {backend_url} is not accessible. Service will use fallback answers.")
    
    # Check OpenAI API key
    check_openai_key()
    
    # Prepare the command
    try:
        # Python executable path
        python_path = sys.executable
        app_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.py')
        
        # Log the start attempt
        logger.info(f"Starting questionnaire service on port {port}, connecting to backend at {backend_url}")
        logger.info(f"Environment: {flask_env}")
        
        # Start the service in a subprocess
        env_vars = {
            **os.environ,
            'PORT': port,
            'BACKEND_API_URL': backend_url,
            'FLASK_ENV': flask_env
        }
        
        # Set a default SECRET_KEY if not provided
        if 'SECRET_KEY' not in env_vars:
            env_vars['SECRET_KEY'] = 'dev-key-only-for-development'
            logger.warning("No SECRET_KEY provided. Using a default key - not secure for production!")
        
        process = subprocess.Popen(
            [python_path, app_path],
            env=env_vars,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit for the service to start
        time.sleep(2)
        
        # Check if it started successfully
        if is_service_running(int(port)):
            logger.info(f"Questionnaire service started successfully at http://localhost:{port}")
            
            # Start monitoring the process output in a non-blocking way
            def log_output():
                while True:
                    stdout_line = process.stdout.readline() if process.stdout else ""
                    stderr_line = process.stderr.readline() if process.stderr else ""
                    
                    if not stdout_line and not stderr_line and process.poll() is not None:
                        break
                    
                    if stdout_line:
                        logger.info(f"[Service Output] {stdout_line.strip()}")
                    if stderr_line:
                        logger.error(f"[Service Error] {stderr_line.strip()}")
                    
                    time.sleep(0.1)
            
            # Start output monitoring in a separate thread
            import threading
            output_thread = threading.Thread(target=log_output, daemon=True)
            output_thread.start()
            
            return True
        else:
            # Service failed to start
            logger.error("Questionnaire service failed to start")
            stdout, stderr = process.communicate(timeout=5)
            logger.error(f"Process stdout: {stdout}")
            logger.error(f"Process stderr: {stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Error starting questionnaire service: {e}")
        return False

if __name__ == "__main__":
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Start the Flask Questionnaire Service')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the service on')
    parser.add_argument('--backend', type=str, default='http://localhost:5000', help='Backend API URL')
    parser.add_argument('--env', type=str, default='development', choices=['development', 'production'], help='Environment mode')
    parser.add_argument('--key', type=str, help='OpenAI API key (optional)')
    args = parser.parse_args()
    
    # Set environment variables
    os.environ['PORT'] = str(args.port)
    os.environ['BACKEND_API_URL'] = args.backend
    os.environ['FLASK_ENV'] = args.env
    
    if args.key:
        os.environ['OPENAI_API_KEY'] = args.key
    
    # Start the service
    if start_service():
        print(f"Questionnaire service is running at http://localhost:{args.port}")
        print("Press Ctrl+C to exit")
        try:
            # Keep the script running to maintain the service
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Shutting down")
    else:
        print("Failed to start questionnaire service")
        sys.exit(1) 