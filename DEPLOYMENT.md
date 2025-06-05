# Deployment Guide

## Overview
This guide covers deploying the backend to Railway and the frontend to Netlify.

## Backend Deployment to Railway

### Prerequisites
1. Railway account
2. GitHub repository
3. OpenAI API key
4. PostgreSQL database (Railway provides this)

### Environment Variables for Railway
Set these environment variables in your Railway project:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production

# Database (Railway auto-provides DATABASE_URL, but these are fallbacks)
DB_SSL=true

# Optional
PORT=5000  # Railway will override this
```

### Deployment Steps
1. Connect your GitHub repository to Railway
2. Select the backend folder as the source
3. Railway will automatically detect the Dockerfile
4. Set the environment variables above
5. Deploy!

### Railway Configuration
- Uses `backend/Dockerfile` for container build
- Uses `backend/railway.json` for deployment settings
- Health check endpoint: `/health`
- Main API endpoints:
  - `GET /` - Welcome message
  - `GET /health` - Health check
  - `POST /ask` - AI question answering
  - `POST /api/waitlist/signup` - Waitlist signup
  - `GET /api/status` - API status

## Frontend Deployment to Netlify

### Prerequisites
1. Netlify account
2. GitHub repository

### Environment Variables for Netlify
Set these in Netlify's environment variables:

```bash
# API URL (points to your Railway backend)
NEXT_PUBLIC_API_URL=https://garnet-compliance-saas-production.up.railway.app

# Optional
NODE_ENV=production
```

### Deployment Steps
1. Connect your GitHub repository to Netlify
2. Select the Dev-testing branch
3. Build settings are configured in `netlify.toml`
4. Set environment variables above
5. Deploy!

### Netlify Configuration
- Build command: `cd frontend && npm install && npm run build`
- Publish directory: `frontend/out`
- Uses static export for optimal performance
- Configured in `netlify.toml`

## Post-Deployment Verification

### Backend Health Check
Visit: `https://garnet-compliance-saas-production.up.railway.app/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "service": "questionnaire-api",
  "openai_configured": true,
  "compliance_data_loaded": true
}
```

### Frontend API Integration Test
1. Navigate to your Netlify site
2. Go to questionnaires section
3. Ask a test question
4. Verify AI response is generated

### Test API Endpoints

#### Test Question Answering
```bash
curl -X POST https://garnet-compliance-saas-production.up.railway.app/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Do you have a privacy policy?"}'
```

#### Test Waitlist Signup
```bash
curl -X POST https://garnet-compliance-saas-production.up.railway.app/join-waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "full_name": "Test User"}'
```

## Branch Strategy
- Backend: Deploy from `Backend-railway` branch
- Frontend: Deploy from `Dev-testing` branch

## Troubleshooting

### Common Issues
1. **CORS Errors**: Backend is configured to allow all origins (`origin: '*'`)
2. **Database Connection**: Ensure DATABASE_URL is set by Railway
3. **OpenAI API**: Verify API key is correct and has sufficient quota
4. **Build Failures**: Check logs in Railway/Netlify for specific errors

### Debug Endpoints
- `GET /health` - Check if backend is running
- `GET /api/status` - Check API status and data loading
- Check Railway logs for detailed error messages

## Performance Optimization
- Backend uses production Docker build
- Frontend uses static export for fast loading
- Images are unoptimized for static export compatibility
- Console logs removed in production builds 