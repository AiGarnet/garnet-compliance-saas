from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import logging
from logging.handlers import RotatingFileHandler

# Create a logger
logger = logging.getLogger('questionnaire_service')
logger.setLevel(logging.INFO)

# Ensure log directory exists
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(log_dir, exist_ok=True)

# Configure file handler with rotation
file_handler = RotatingFileHandler(
    os.path.join(log_dir, 'questionnaire_service.log'),
    maxBytes=5*1024*1024,  # 5MB
    backupCount=3
)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# Add console handler in development mode
if os.environ.get('FLASK_ENV') == 'development':
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(console_handler)

# Rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

def create_app(test_config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)
    
    # Load default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key-not-for-production'),
        MAX_CONTENT_LENGTH=5 * 1024 * 1024,  # 5MB max upload size
        BACKEND_API_URL=os.environ.get('BACKEND_API_URL', 'http://localhost:5000'),
        OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY'),
        USE_STUB_EMBEDDINGS=os.environ.get('USE_STUB_EMBEDDINGS', 'false').lower() == 'true',
    )
    
    # Load test config if passed
    if test_config:
        app.config.update(test_config)
        
    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass
    
    # Initialize CORS
    CORS(app)
    
    # Initialize rate limiter
    limiter.init_app(app)
    
    # Register blueprints
    from app.health import bp as health_bp
    app.register_blueprint(health_bp)
    
    from app.routes import bp as routes_bp
    app.register_blueprint(routes_bp)
    
    # Validate OpenAI API key at startup if not using stubs
    if not app.config['USE_STUB_EMBEDDINGS'] and app.config['OPENAI_API_KEY']:
        from services.openai_client import validate_api_key
        if not validate_api_key(app.config['OPENAI_API_KEY']):
            logger.warning("Invalid or missing OpenAI API key. Embedding functionality will be disabled.")
    
    # Add security headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Content-Security-Policy'] = "default-src 'self'"
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response
    
    return app 