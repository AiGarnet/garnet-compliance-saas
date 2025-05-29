# Waitlist Server for GARNET AI

This is a Node.js Express backend server that handles the waitlist functionality for the GARNET AI platform.

## Deployed Instance

The waitlist server is deployed and available at:
https://garnet-compliance-saas-production.up.railway.app/

To test the deployed API:
```bash
curl -X POST https://garnet-compliance-saas-production.up.railway.app/join-waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "company": "Test Company",
    "role": "Developer"
  }'
```

To check the API health:
```bash
curl https://garnet-compliance-saas-production.up.railway.app/
```

## Features

- Accepts form submissions from the landing page
- Connects to PostgreSQL database
- Dynamically creates/modifies database tables based on form fields
- Handles CORS for Netlify frontend
- Provides error handling and response validation

## Setup Instructions

### Prerequisites

- Node.js 16+
- PostgreSQL database (can use Railway, Render, AWS, etc.)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the backend directory with the following variables:
   ```
   # Database Connection
   DATABASE_URL=postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway

   # Server Configuration
   PORT=3001
   ```

### Running the Server

Start the waitlist server:
```
npm run waitlist
```

The server will start on port 3001 (or the port specified in your `.env` file).

## API Endpoints

### GET / (Health Check)

Returns information about the API's status.

**Response:**
```json
{
  "status": "ok",
  "message": "Waitlist API is running",
  "version": "1.0.0",
  "endpoints": [
    {
      "path": "/join-waitlist",
      "method": "POST",
      "description": "Add a user to the waitlist"
    }
  ]
}
```

### POST /join-waitlist

Adds a new entry to the waitlist.

**Request Body:**

The API accepts any JSON fields from the frontend form. At minimum, it requires:

```json
{
  "email": "user@example.com"
}
```

Additional fields can be added and will be automatically stored in the database:

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "company": "Example Corp",
  "role": "Developer",
  "interests": "AI, Compliance",
  "custom_field": "Any value"
}
```

**Responses:**

- `201 Created`: Successfully added to waitlist
- `400 Bad Request`: Missing required fields or invalid data
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Server error

## Testing the API

You can test the API using curl:

**Local:**
```bash
curl -X POST http://localhost:3001/join-waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "company": "Test Company",
    "role": "Developer",
    "interests": "AI, Compliance"
  }'
```

**Production:**
```bash
curl -X POST https://garnet-compliance-saas-production.up.railway.app/join-waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "company": "Test Company",
    "role": "Developer",
    "interests": "AI, Compliance"
  }'
```

## Frontend Integration

Update your frontend code to use the production API endpoint:

```javascript
// For production
const apiUrl = 'https://garnet-compliance-saas-production.up.railway.app/join-waitlist';

// For local development
// const apiUrl = 'http://localhost:3001/join-waitlist';
```

## Deployment to Railway

1. Push your code to a GitHub repository
2. Sign up for Railway (railway.app)
3. Create a new project and link your GitHub repository
4. Add a PostgreSQL database service to your project
5. Set up environment variables:
   - `DATABASE_URL` (will be automatically linked to your PostgreSQL instance)
   - `PORT` (optional, Railway sets this automatically)
6. Deploy your application

Railway will automatically deploy your server and provide you with a public URL.

## Security Considerations

- The database connection string is stored in the `.env` file and should be kept secure
- CORS is configured to only allow requests from specified domains
- Email validation is performed to ensure data integrity 