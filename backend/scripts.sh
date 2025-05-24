#!/bin/bash

# Build script
build() {
  echo "Installing dependencies..."
  npm install
  
  echo "Building project..."
  npm run build
}

# Start script
start() {
  echo "Starting application..."
  node dist/index.js
}

# Execute based on argument
case "$1" in
  build)
    build
    ;;
  start)
    start
    ;;
  *)
    echo "Usage: $0 {build|start}"
    exit 1
    ;;
esac 