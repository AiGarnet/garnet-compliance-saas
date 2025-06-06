# Netlify Functions Documentation

This directory contains all serverless functions for the Garnet AI platform. All functions are deployed automatically via Netlify when code is pushed to the main branch.

## Functions Overview

### **Waitlist & Authentication**

#### `waitlist-signup.js`
- **Purpose**: Handles waitlist signup submissions from the landing page
- **Endpoint**: `/.netlify/functions/waitlist-signup`
- **Method**: `POST`
- **Backend**: Forwards to Railway at `/join-waitlist`

#### `auth-login.js`
- **Purpose**: User authentication login
- **Endpoint**: `/.netlify/functions/auth-login`
- **Method**: `POST`
- **Backend**: Forwards to Railway auth endpoints

#### `auth-signup.js`
- **Purpose**: User registration and signup
- **Endpoint**: `/.netlify/functions/auth-signup`
- **Method**: `POST`
- **Backend**: Forwards to Railway auth endpoints

### **Vendor Management**

#### `vendors.js`
- **Purpose**: Fetch all vendors/compliance frameworks
- **Endpoint**: `/.netlify/functions/vendors`
- **Method**: `GET`
- **Backend**: Forwards to Railway vendor endpoints

#### `vendor-by-id.js`
- **Purpose**: Fetch specific vendor by ID
- **Endpoint**: `/.netlify/functions/vendor-by-id`
- **Method**: `GET`
- **Backend**: Forwards to Railway vendor endpoints

#### `vendor-stats.js`
- **Purpose**: Get vendor statistics and analytics
- **Endpoint**: `/.netlify/functions/vendor-stats`
- **Method**: `GET`
- **Backend**: Forwards to Railway vendor endpoints

### **Questionnaire System**

#### `questionnaire.js`
- **Purpose**: Handle questionnaire operations
- **Endpoint**: `/.netlify/functions/questionnaire`
- **Methods**: `GET`, `POST`
- **Backend**: Forwards to Railway questionnaire endpoints

#### `answer.js`
- **Purpose**: Handle questionnaire answers submission
- **Endpoint**: `/.netlify/functions/answer`
- **Method**: `POST`
- **Backend**: Forwards to Railway answer endpoints

### **API & Utilities**

#### `api.js`
- **Purpose**: General API proxy and routing
- **Endpoint**: `/.netlify/functions/api`
- **Methods**: Multiple
- **Backend**: General Railway API forwarding

#### `health.js`
- **Purpose**: Health check for the system
- **Endpoint**: `/.netlify/functions/health`
- **Method**: `GET`
- **Backend**: Health status from Railway

#### `test-backend.js`
- **Purpose**: Backend connectivity testing
- **Endpoint**: `/.netlify/functions/test-backend`
- **Method**: `GET`
- **Backend**: Railway connectivity test

#### `init-db.js`
- **Purpose**: Database initialization utilities
- **Endpoint**: `/.netlify/functions/init-db`
- **Method**: `POST`
- **Backend**: Railway database operations

#### `index.js`
- **Purpose**: Main entry point/router
- **Endpoint**: `/.netlify/functions/index`
- **Method**: `GET`
- **Backend**: General routing

## Architecture

```
Frontend (Netlify) → Netlify Functions → Railway Backend → PostgreSQL Database
```

All functions follow the same pattern:
1. **CORS handling** for cross-origin requests
2. **Request validation** and sanitization  
3. **Forwarding to Railway backend** with proper headers
4. **Response processing** and error handling
5. **Consistent error responses** with appropriate HTTP status codes

## Backend Integration

All functions forward requests to the Railway backend at:
`https://garnet-compliance-saas-production.up.railway.app`

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Override default Railway backend URL (optional)
- `NODE_ENV`: Environment setting (development/production)

## Development

### Local Testing
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run functions locally
netlify dev

# Functions available at:
# http://localhost:8888/.netlify/functions/[function-name]
```

### Testing Individual Functions
```bash
# Test waitlist signup
curl -X POST http://localhost:8888/.netlify/functions/waitlist-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","full_name":"Test User"}'

# Test health check
curl http://localhost:8888/.netlify/functions/health

# Test vendors
curl http://localhost:8888/.netlify/functions/vendors
```

## Error Handling

All functions return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (duplicate resources)
- `500`: Internal Server Error
- `503`: Service Unavailable (backend down)

## Monitoring

- **Netlify Dashboard**: Functions → Function logs
- **Railway Dashboard**: Backend service logs
- **Error Tracking**: Console logs in both Netlify and Railway

## Security

- All functions validate input data
- CORS headers properly configured
- Sensitive data (passwords, tokens) not logged
- Request size limits enforced
- Rate limiting handled by Netlify

## Deployment

Functions are automatically deployed when:
1. Code is pushed to the main branch
2. Netlify detects changes in `.netlify/functions/`
3. Build process completes successfully

No manual deployment required - everything is automated via CI/CD. 