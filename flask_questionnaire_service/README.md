# Flask Questionnaire Service

This is a Flask-based service that integrates with the backend to provide questionnaire answer generation capabilities.

## Features

- Acts as a proxy to the backend's AI-powered answer generation endpoint
- Simple REST API for processing questionnaires
- Configurable backend integration
- Containerized deployment support

## Setup

### Local Development

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set the backend API URL environment variable (optional):
   ```bash
   export BACKEND_API_URL=http://localhost:5000  # On Windows: set BACKEND_API_URL=http://localhost:5000
   ```

4. Run the Flask app:
   ```bash
   python app.py
   ```

The service will be available at http://localhost:5001.

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t flask-questionnaire-service .
   ```

2. Run the container:
   ```bash
   docker run -p 5001:5001 -e BACKEND_API_URL=http://your-backend-url:5000 flask-questionnaire-service
   ```

## API Endpoints

### `GET /`
Returns basic information about the service.

### `GET /health`
Health check endpoint.

### `POST /questionnaire/answer`
Processes a questionnaire and returns an AI-generated answer with both question and answer fields.

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
  "answer": "GDPR (General Data Protection Regulation) is an EU regulation that..."
}
```

### `POST /ask`
Direct question-answering endpoint that returns just the answer field, compatible with frontend expectations.

**Request:**
```json
{
  "question": "What is GDPR and how does it affect my business?"
}
```

**Response:**
```json
{
  "answer": "GDPR (General Data Protection Regulation) is an EU regulation that..."
}
```

## Integration with Backend

This service integrates with the backend's `/api/answer` and `/ask` endpoints, which use OpenAI to generate answers based on the compliance framework data. The integration is done via HTTP requests, making it easy to deploy the services separately or together. 