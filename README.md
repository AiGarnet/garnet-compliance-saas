# Garnet AI Backend

Backend API and services for the Garnet AI vendor compliance and onboarding platform. Built with Node.js, TypeScript, Express, and PostgreSQL.

## Project Overview

This is the backend application for Garnet AI's vendor compliance platform. It provides REST APIs for managing vendor onboarding, compliance questionnaires, risk assessments, and trust portal functionality.

## Features

### 🤖 AI Chatbot Microservice
- **OpenAI GPT-4 Integration**: All answers generated using OpenAI API
- **Compliance Context**: Uses internal policy data for accurate responses  
- **Input Sanitization**: Automatically removes PII and sensitive information
- **Specialized Prompts**: GDPR, SOC 2, HIPAA, and general compliance expertise
- **Security Features**: Input validation, XSS protection, rate limiting ready
- **Health Monitoring**: Built-in endpoints for service health and status
- **Integration Ready**: Works seamlessly with existing questionnaire system

### Core APIs
- **Vendor Management**: CRUD operations for vendor data and risk assessments
- **Questionnaire System**: Manage compliance questionnaires and responses
- **Trust Portal**: Public-facing compliance information endpoints
- **Evidence Management**: File upload and compliance documentation
- **User Management**: Authentication and authorization
- **Waitlist System**: User registration and management

### Database Features
- **PostgreSQL Integration**: Robust relational database with migrations
- **Data Validation**: Comprehensive input validation with Zod
- **Migration System**: Database schema versioning and updates
- **Seed Data**: Sample data for development and testing

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Custom repository pattern
- **Validation**: Zod
- **Authentication**: bcryptjs
- **AI Integration**: OpenAI GPT-4
- **Deployment**: Railway, Docker

## Project Structure

```
backend/
├── src/
│   ├── config/           # Database and app configuration
│   ├── controllers/      # Request handlers
│   ├── db/              # Database repositories and migrations
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   └── types/           # TypeScript type definitions
├── chatbot/             # Flask-based AI chatbot microservice
├── test-*.js           # API and database tests
└── *.js               # Utility scripts and migrations
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- Python 3.8+ (for chatbot service)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install chatbot dependencies:
   ```bash
   cd chatbot
   pip install -r requirements.txt
   ```

### Environment Setup

Create a `.env` file in the backend directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=garnet_ai
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI Configuration (for chatbot)
OPENAI_API_KEY=your_openai_api_key_here
```

### Database Setup

1. **Create PostgreSQL Database:**
   ```bash
   createdb garnet_ai
   ```

2. **Run Migrations:**
   ```bash
   npm run migrate
   ```

3. **Seed Sample Data:**
   ```bash
   npm run seed
   ```

### Development

#### Start Backend Server

```bash
cd backend
npm run dev
```

The API will be available at [http://localhost:5000](http://localhost:5000).

#### Start AI Chatbot Service

```bash
cd chatbot
python app.py
```

The chatbot service will start on [http://localhost:5001](http://localhost:5001) with these endpoints:
- `GET /health` - Health check
- `GET /status` - Service status and configuration  
- `POST /ask` - Ask compliance questions

### API Endpoints

#### Vendors
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id` - Get vendor details
- `POST /api/vendors` - Create new vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

#### Questionnaires
- `GET /api/questionnaires` - List questionnaires
- `GET /api/questionnaires/:id` - Get questionnaire details
- `POST /api/questionnaires` - Create questionnaire
- `PUT /api/questionnaires/:id` - Update questionnaire

#### Trust Portal
- `GET /api/trust-portal` - Get public trust information
- `GET /api/trust-portal/certifications` - Get certifications

#### Evidence Management
- `POST /api/evidence/upload` - Upload evidence files
- `GET /api/evidence/:id` - Get evidence details

### Testing

Run the test suite:

```bash
# Test database connection
npm run test:db

# Test API endpoints
npm run test:api

# Run all tests
npm test
```

### Docker Deployment

Build and run with Docker:

```bash
# Build the image
docker build -t garnet-ai-backend .

# Run the container
docker run -p 5000:5000 --env-file .env garnet-ai-backend
```

### Railway Deployment

This backend is configured for deployment on Railway:

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy using the provided `railway.toml` configuration

## Database Schema

The application uses PostgreSQL with the following main tables:

- `vendors` - Vendor information and risk assessments
- `questionnaires` - Compliance questionnaire templates
- `questionnaire_responses` - User responses to questionnaires
- `evidence_files` - Uploaded compliance documentation
- `users` - User accounts and authentication
- `waitlist` - User registration waitlist

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests to ensure everything works
4. Submit a pull request

## Security

- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- Rate limiting ready
- Environment variable configuration
- Secure file upload handling

## Performance

- Database connection pooling
- Efficient query patterns
- Proper indexing
- Caching strategies
- Optimized API responses 