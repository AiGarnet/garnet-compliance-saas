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

echo "Building frontend..."
npm run build

echo "Build completed successfully!" 