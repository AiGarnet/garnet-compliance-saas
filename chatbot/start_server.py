#!/usr/bin/env python3
"""
Simple startup script for the Flask chatbot microservice.
"""
import os
import sys
from app import create_app

def main():
    """Start the Flask chatbot microservice."""
    print("🤖 Starting Flask Chatbot Microservice")
    print("=" * 40)
    
    # Check if .env file exists
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(env_file):
        print("⚠️  Warning: No .env file found!")
        print("   Create a .env file with your OpenAI API key:")
        print("   OPENAI_API_KEY=your_openai_api_key_here")
        print()
    
    # Check if data file exists
    data_file = os.path.join(os.path.dirname(__file__), 'data', 'data_new.json')
    if not os.path.exists(data_file):
        print("❌ Error: data/data_new.json not found!")
        print("   Make sure the compliance data file is in the data/ directory")
        return 1
    
    # Create and run the app
    try:
        app = create_app()
        
        port = int(os.getenv('PORT', 5000))
        debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
        
        print(f"🚀 Starting server on http://localhost:{port}")
        print("📋 Available endpoints:")
        print(f"   GET  http://localhost:{port}/health")
        print(f"   GET  http://localhost:{port}/status")
        print(f"   POST http://localhost:{port}/ask")
        print()
        print("💡 Use Ctrl+C to stop the server")
        print("🧪 Run 'python test_integration.py' in another terminal to test")
        print()
        
        app.run(host='0.0.0.0', port=port, debug=debug)
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
        return 0
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main()) 