"""
Flask Questionnaire Service Main App

This is the entry point for the Flask Questionnaire Service.
It initializes the application and runs the development server.
"""
import os
from app import create_app, logger

# Create the Flask application
app = create_app()

# Run the application if executed directly
if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5001))
    
    # Log startup information
    logger.info(f"Starting Flask Questionnaire Service on port {port}")
    logger.info(f"Backend API URL: {app.config['BACKEND_API_URL']}")
    logger.info(f"OpenAI API Key configured: {'Yes' if app.config['OPENAI_API_KEY'] else 'No'}")
    logger.info(f"Using stub embeddings: {app.config['USE_STUB_EMBEDDINGS']}")
    
    # Run the app in development mode
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development') 