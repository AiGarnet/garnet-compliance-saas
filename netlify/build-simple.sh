#!/bin/bash
set -e

# Go to frontend directory
cd frontend

# Clean install without scripts
npm install --ignore-scripts

# Install dependencies
npm install --save lodash uuid @types/lodash @types/uuid

# Temporarily use simplified tsconfig for the build
echo "Using simplified tsconfig for build..."
cp tsconfig.build.json tsconfig.json

# Build Next.js app with type checking disabled
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 ESLINT_NO_DEV_ERRORS=true npm run build

# Install Netlify functions dependencies
cd ../netlify/functions
npm install 