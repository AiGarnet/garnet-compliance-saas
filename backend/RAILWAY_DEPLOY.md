# GarnetAI Backend - Railway Deployment Guide

This guide provides instructions for deploying the GarnetAI backend service to Railway.

## Prerequisites

- A Railway account (https://railway.app/)
- Git installed on your local machine

## Deployment Steps

1. Log in to Railway with your account
2. Create a new project from GitHub repository
3. Select the "Backend-railway" branch
4. Configure the following environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 5000 (default)
   - `NODE_ENV`: production
   
## Connection with Netlify Frontend

The backend API deployed on Railway needs to be connected to the Netlify frontend.

1. After Railway deployment, get your Railway project URL from the "Settings" tab
2. In your Netlify dashboard, go to your site settings
3. Add the following environment variable:
   - `VITE_API_BASE_URL`: Your Railway app URL (e.g., https://garnetai-backend.up.railway.app)

## Troubleshooting

- If you're experiencing CORS issues, make sure the CORS configuration in the backend is set up correctly
- For deployment issues, check the Railway logs in the "Deployments" tab
- For configuration issues, verify your environment variables in both Railway and Netlify 