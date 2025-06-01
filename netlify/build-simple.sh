#!/bin/bash
set -e

echo "============ STARTING SIMPLE BUILD PROCESS ============"

# Go to frontend directory
cd frontend
echo "Current directory: $(pwd)"

# Clean up
echo "Cleaning environment..."
rm -rf .next out node_modules/.cache

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Create simplified Next.js config
echo "Creating simplified Next.js config..."
cat > next.config.js << 'EOL'
/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  distDir: ".next",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
EOL

# Check and handle pages directory if it exists and might conflict
if [ -d "pages" ]; then
  echo "Moving pages directory to avoid conflicts..."
  mkdir -p _backup
  mv pages _backup/pages
fi

# Build the app
echo "Building Next.js app..."
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 npm run build

# Check output directory
if [ ! -d "out" ]; then
  echo "No 'out' directory found, attempting to fix..."
  if [ -d ".next/out" ]; then
    echo "Found .next/out directory, using that..."
    mkdir -p out
    cp -r .next/out/* out/
  else
    echo "ERROR: Could not find output directory."
    exit 1
  fi
fi

# Create SPA redirects
echo "Creating _redirects file for SPA routing..."
cat > out/_redirects << 'EOL'
/* /index.html 200
EOL

# Install Netlify functions dependencies
echo "Installing Netlify functions dependencies..."
cd ../netlify/functions
npm install

echo "============ BUILD PROCESS COMPLETED ============" 