# Flask Questionnaire Service

This is a Flask-based microservice that integrates with the backend to provide AI-powered questionnaire handling capabilities for compliance onboarding.

## Folder Structure

```
flask_questionnaire/
├── app/
│   ├── __init__.py
│   ├── routes.py
│   └── health.py
├── services/
│   ├── openai_client.py
│   └── backend_connector.py
├── models/
│   └── prompts.py
├── utils/
│   └── sanitizer.py
├── ingestion/
│   └── parser.py
├── tests/
│   ├── test_health.py
│   ├── test_sanitizer.py
│   └── test_prompts.py
├── logs/
│   └── .gitkeep
├── requirements.txt
├── app.py
├── README.md
└── Dockerfile
```

## Features

- Acts as a proxy to the backend's AI-powered answer generation endpoint
- Provides fallback patterns when backend is unavailable
- Direct OpenAI integration for embeddings and document processing
- Sanitization of PII data from questionnaires
- Structured prompt templating for consistent AI responses
- Vector store for efficient document retrieval
- Containerized deployment support

## Setup

### Prerequisites

- Python 3.10 or higher
- OpenAI API key (optional, only if using direct embedding functionality)
- Backend API access (configurable)

### Environment Variables

- `BACKEND_API_URL`: URL of the backend service (default: http://localhost:5000)
- `OPENAI_API_KEY`: Your OpenAI API key (required for direct embedding functionality)
- `USE_STUB_EMBEDDINGS`: Set to "true" for using stub embeddings in tests (default: "false")
- `PORT`: Port to run the service on (default: 5001)
- `FLASK_ENV`: Set to "development" for development mode, "production" for production
- `SECRET_KEY`: Flask secret key for session security (required in production)

### How to Run Locally

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set required environment variables:
   ```bash
   # On Linux/Mac
   export FLASK_ENV=development
   export BACKEND_API_URL=http://localhost:5000
   export SECRET_KEY=your-secret-key
   
   # On Windows
   set FLASK_ENV=development
   set BACKEND_API_URL=http://localhost:5000
   set SECRET_KEY=your-secret-key
   ```

4. Run the Flask app:
   ```bash
   python app.py
   ```

The service will be available at http://localhost:5001.

### How to Run in Mock Mode

For testing without a backend connection:

1. Set the USE_STUB_EMBEDDINGS environment variable:
   ```bash
   # On Linux/Mac
   export USE_STUB_EMBEDDINGS=true
   
   # On Windows
   set USE_STUB_EMBEDDINGS=true
   ```

2. Run the app in development mode:
   ```bash
   python app.py
   ```

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t flask-questionnaire-service .
   ```

2. Run the container:
   ```bash
   docker run -p 5001:5001 \
     -e BACKEND_API_URL=http://your-backend-url:5000 \
     -e SECRET_KEY=your-secret-key \
     -e FLASK_ENV=production \
     flask-questionnaire-service
   ```

## API Endpoints

### `GET /health`
Health check endpoint reporting service status and connections.

**Response:**
```json
{
  "status": "healthy",
  "vector_store": "connected",
  "backend": "connected",
  "uptime": "2h 15m",
  "disk_space": "75% free"
}
```

### `POST /api/answer`
Processes a questionnaire and returns an AI-generated answer.

**Request:**
```json
{
  "question": "What is GDPR and how does it affect my business?"
}
```

**Response:**
```json
{
  "question": "What is GDPR and how does it affect my business?",
  "answer": "GDPR (General Data Protection Regulation) is an EU regulation that...",
  "is_fallback": false
}
```

### `POST /api/upload`
Uploads and processes a document for embedding and context retrieval.

**Request:**
```
multipart/form-data
- file: [document.csv, document.txt]
```

**Response:**
```json
{
  "status": "success",
  "message": "Document processed successfully",
  "document_id": "doc-123",
  "chunks_processed": 15
}
```

## Testing

Run the test suite with:

```bash
pytest
```

For test coverage report:

```bash
pytest --cov=app tests/
```

## Security Features

- PII sanitization for sensitive data
- Rate limiting on API endpoints
- API key validation (if configured)
- Secret key rotation mechanism
- Health check with detailed system status 