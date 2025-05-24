# Railway Deployment Guide

This Node.js Express backend is configured for easy deployment to Railway.

## Prerequisites

- [Railway account](https://railway.app/)
- [Node.js](https://nodejs.org/) (v16 or higher)
- Git

## Project Structure

```
├── controllers/             # Request handlers
├── models/                  # Data models
├── routes/                  # API routes
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── server.js                # Main entry point
```

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```
   npm run dev
   ```

## Deploying to Railway

### Method 1: Railway CLI

1. Install the Railway CLI:
   ```
   npm i -g @railway/cli
   ```

2. Login to your Railway account:
   ```
   railway login
   ```

3. Link to your Railway project:
   ```
   railway link
   ```

4. Deploy your application:
   ```
   railway up
   ```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Create a new project in Railway dashboard
3. Select "Deploy from GitHub"
4. Choose your repository
5. Railway will automatically build and deploy your application

### Environment Variables

Make sure to set up the following environment variables in Railway dashboard:

- `PORT` (Railway sets this automatically)
- `NODE_ENV` (e.g., production)
- Any database credentials or API keys used in your application

## API Endpoints

- `GET /`: Server status
- `GET /health`: API health check
- `GET /api/v1/examples`: Get all examples
- `GET /api/v1/examples/:id`: Get example by ID
- `POST /api/v1/examples`: Create new example
- `PUT /api/v1/examples/:id`: Update example
- `DELETE /api/v1/examples/:id`: Delete example

## Maintenance

To update your deployed application, simply push changes to your GitHub repository or run `railway up` again. 