#!/bin/bash
set -e

# Print environment information
echo "=============== ENVIRONMENT INFO ==============="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Working directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "==============================================="

# Go to frontend directory
cd frontend
echo "Now in frontend directory: $(pwd)"
echo "Frontend directory contents:"
ls -la

# Clean install without scripts
echo "=============== INSTALLING DEPENDENCIES ==============="
echo "Installing frontend dependencies..."
npm install --ignore-scripts

# Explicitly install critical dependencies
echo "Installing specific critical dependencies..."
npm install --save lodash uuid @types/lodash @types/uuid

# Print dependency information
echo "=============== DEPENDENCY CHECKS ==============="
echo "Checking uuid package:"
npm list uuid || echo "UUID package not found!"
echo "Checking lodash package:"
npm list lodash || echo "Lodash package not found!"
echo "==============================================="

# Fix potential issues with Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Build the Next.js app with verbose output
echo "=============== BUILDING NEXT.JS APP ==============="
NODE_ENV=production npm run build --verbose
echo "==============================================="

# Install Netlify functions dependencies
echo "=============== INSTALLING FUNCTIONS DEPENDENCIES ==============="
cd ../netlify/functions
echo "Now in functions directory: $(pwd)"
npm install
echo "==============================================="

echo "Build process completed successfully!" 