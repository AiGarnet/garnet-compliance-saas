# Netlify Deployment Guide

This document provides instructions for deploying this Next.js application on Netlify.

## Prerequisites

- A Netlify account
- PostgreSQL database (can use Netlify add-ons like Heroku Postgres, Supabase, or any other PostgreSQL provider)

## Setup Steps

1. **Create a new site in Netlify**:
   - Connect your GitHub repository
   - Select the `frontend` directory as the base directory

2. **Configure build settings**:
   - Build command: `npm run build:netlify`
   - Publish directory: `.next`

3. **Environment variables**:
   Set the following environment variables in Netlify site settings:
   
   ```
   DATABASE_URL=postgresql://user:password@hostname:5432/database?sslmode=require
   JWT_SECRET=your-secure-secret-key-change-this-in-production
   JWT_EXPIRY=7d
   NETLIFY=true
   ```

4. **Database initialization**:
   - The database will be automatically initialized during the first deployment
   - You can also manually trigger initialization by visiting `/api/init-db` after deployment

## Troubleshooting

- **Function errors**: Check the Netlify Functions log in the Netlify dashboard
- **Database connection issues**: Verify your DATABASE_URL and ensure the database is accessible from Netlify
- **Build failures**: Check if you need to update dependencies in package.json

## Testing Locally

To test Netlify functions locally:

```bash
npm install -g netlify-cli
netlify dev
```

## Health Check

After deployment, visit `/api/health` to verify that Netlify Functions are working properly.

## API Routes

The following API routes are available:

- `/api/auth/signup` - User registration
- `/api/auth/login` - User login
- `/api/health` - Health check for Netlify Functions
- `/api/init-db` - Database initialization 