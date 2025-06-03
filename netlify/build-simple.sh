#!/bin/bash
set -e

echo "Installing project dependencies..."
npm install

echo "Installing unplugin-icons and @iconify/json explicitly..."
npm install --save-dev unplugin-icons @iconify/json
npm install --save @iconify/react

echo "Changing to frontend directory..."
cd frontend

echo "Installing frontend dependencies..."
npm install

echo "Building frontend with static export..."
npm run build:export

# Create the 'out' directory if it doesn't exist and ensure output is copied there
echo "Ensuring build output is in the correct location..."
mkdir -p out

# Copy output files to the out directory
if [ -d ".next/out" ]; then
  echo "Found .next/out directory, copying to out..."
  cp -r .next/out/* out/
elif [ -d ".next/standalone" ]; then
  echo "Found .next/standalone directory, copying to out..."
  cp -r .next/standalone/* out/
elif [ -d ".next" ]; then
  echo "Copying Next.js output to out directory..."
  cp -r .next out/
  # Also copy any static files
  if [ -d "public" ]; then
    cp -r public/* out/
  fi
elif [ -d "dist" ]; then
  echo "Copying Vite dist output to out directory..."
  cp -r dist/* out/
fi

echo "Adding SPA fallback for routing..."
echo "/* /index.html 200" > out/_redirects

echo "Build completed successfully!" 