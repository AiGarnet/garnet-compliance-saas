# Flask Chatbot Microservice

A complete Flask-based chatbot microservice that uses OpenAI GPT-4 to answer compliance questions based on internal policy data.

## 🚀 Features

- **OpenAI GPT-4 Integration**: All answers generated using OpenAI API
- **Compliance Data Context**: Uses `data_new.json` for contextual reference
- **Input Sanitization**: Removes PII and sensitive information from questions
- **Prompt Engineering**: Specialized prompts for GDPR, SOC 2, HIPAA, and general compliance
- **Comprehensive Logging**: Tracks API usage, errors, and token consumption
- **Health Monitoring**: Built-in health checks and status endpoints
- **Unit Testing**: Complete test suite for all components

## 📁 Project Structure

```
/chatbot/
├── app.py                    # Main Flask application
├── data/data_new.json       # Compliance data (copied from root)
├── services/openai_client.py # OpenAI API wrapper
├── models/prompts.py        # Prompt templates
├── utils/sanitizer.py       # Input sanitization utilities
├── test_chatbot.py          # Unit tests
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd chatbot
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the chatbot directory:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000

# Logging Configuration
LOG_LEVEL=INFO
```

**Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 3. Run the Application

```bash
python app.py
```

The service will start on `http://localhost:5000`

## 🌐 API Endpoints

### Health Check
```http
GET /health
```

Returns service health status and OpenAI connection status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "compliance_data_loaded": true,
  "compliance_records_count": 150,
  "openai_connection": true
}
```

### Ask Question
```http
POST /ask
Content-Type: application/json

{
  "question": "How do we handle data subject access requests under GDPR?"
}
```

**Response:**
```json
{
  "answer": "Under GDPR Article 15, data subjects have the right to access their personal data...",
  "metadata": {
    "relevant_sources": 3,
    "tokens_used": 245,
    "model": "gpt-4"
  }
}
```

### Service Status
```http
GET /status
```

Returns detailed service information including loaded compliance data and configuration.

## 🧪 Testing

Run the test suite:

```bash
pytest test_chatbot.py -v
```

Run specific test categories:

```bash
# Test sanitization
pytest test_chatbot.py::TestSanitizer -v

# Test prompt templates
pytest test_chatbot.py::TestPromptTemplates -v

# Test Flask endpoints
pytest test_chatbot.py::TestFlaskApp -v
```

## 📝 Usage Examples

### Example 1: GDPR Question
```bash
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key GDPR data subject rights?"}'
```

### Example 2: SOC 2 Question
```bash
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What steps are required to meet SOC 2 confidentiality criteria?"}'
```

### Example 3: Internal Audit Question
```bash
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Are internal audits part of our compliance system?"}'
```

## 🔒 Security Features

### Input Sanitization
The service automatically sanitizes user input to remove:
- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- URLs
- API keys
- Password-like content

### Question Validation
- Minimum and maximum length validation
- XSS and injection attack prevention
- Malicious code pattern detection

## 🎯 Prompt Engineering

The service uses specialized prompt templates based on question type:

- **GDPR**: Focuses on data subject rights, articles, and compliance requirements
- **SOC 2**: Emphasizes Trust Service Criteria and control requirements
- **HIPAA**: Highlights healthcare data protection and PHI requirements
- **General**: Provides comprehensive compliance guidance

## 📊 Monitoring and Logging

The service logs:
- Question processing events
- OpenAI API usage and token consumption
- Input sanitization events
- Error conditions and API failures
- Performance metrics

## 🚨 Error Handling

The service provides graceful error handling for:
- Invalid or missing questions
- OpenAI API rate limits
- Authentication failures
- Network connectivity issues
- Malformed requests

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | None |
| `FLASK_ENV` | Flask environment | development |
| `FLASK_DEBUG` | Enable debug mode | True |
| `PORT` | Service port | 5000 |
| `LOG_LEVEL` | Logging level | INFO |

### OpenAI Configuration

The service is configured to use:
- **Model**: GPT-4 (for high-quality responses)
- **Temperature**: 0.1 (for consistent, factual answers)
- **Max Tokens**: 1500 (for comprehensive responses)

## 🔄 Integration with Frontend

The chatbot microservice is designed to integrate with the existing frontend questionnaire system. The frontend can send questions via the `/ask` endpoint and display the AI-generated responses.

### Frontend Integration Example

```javascript
async function askQuestion(question) {
  try {
    const response = await fetch('http://localhost:5000/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });
    
    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error asking question:', error);
    return 'Error getting response. Please try again.';
  }
}
```

## 📈 Performance Considerations

- **Token Usage**: Monitor OpenAI token consumption through logs
- **Response Time**: Typical response time is 2-5 seconds depending on question complexity
- **Rate Limits**: Implement appropriate rate limiting for production use
- **Caching**: Consider implementing response caching for frequently asked questions

## 🚀 Production Deployment

For production deployment:

1. Set `FLASK_ENV=production`
2. Use a production WSGI server like Gunicorn:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
3. Implement proper logging and monitoring
4. Set up rate limiting and authentication
5. Use environment-specific configuration management

## 🤝 Contributing

1. Run tests before submitting changes
2. Follow the existing code style and structure
3. Add tests for new functionality
4. Update documentation as needed

## 📄 License

This project is part of the GARNET AI SaaS platform. 