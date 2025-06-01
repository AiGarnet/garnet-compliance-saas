#!/bin/bash
set -e

echo "============ STARTING SIMPLE BUILD PROCESS ============"

# Print environment information
echo "Environment information:"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

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

# Create .env.local file to configure NextJS
echo "Creating environment config..."
cat > .env.local << 'EOL'
NEXT_STATIC_EXPORT=true
NEXT_PUBLIC_API_BASE_URL=/api
EOL

# Check and handle pages directory if it exists and might conflict
if [ -d "pages" ]; then
  echo "Moving pages directory to avoid conflicts..."
  mkdir -p _backup
  mv pages _backup/pages
fi

# Set Node options to avoid compatibility issues
echo "Setting Node options for compatibility..."
export NODE_OPTIONS="--max-old-space-size=4096"

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
  elif [ -d ".next/export" ]; then
    echo "Found .next/export directory, using that..."
    mkdir -p out
    cp -r .next/export/* out/
  elif [ -d ".next" ]; then
    echo "Running export command to generate static output..."
    NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 npx next export
    if [ -d "out" ]; then
      echo "Export successful!"
    else
      echo "ERROR: Export failed to create output directory."
      exit 1
    fi
  else
    echo "ERROR: Could not find output directory."
    exit 1
  fi
fi

# Create SPA redirects
echo "Creating _redirects file for SPA routing..."
cat > out/_redirects << 'EOL'
# Netlify redirects file
# These rules will change if you change your site's custom domains or HTTPS settings

# SPA fallback
/*    /index.html   200
EOL

# Install Netlify functions dependencies
echo "Installing Netlify functions dependencies..."
cd ../netlify/functions
npm install

# Create next-env.d.ts if it doesn't exist (sometimes needed for types)
if [ ! -f "next-env.d.ts" ]; then
  echo "Creating next-env.d.ts file..."
  cat > next-env.d.ts << 'EOL'
/// <reference types="next" />
/// <reference types="next/navigation" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
EOL
fi

echo "============ BUILD PROCESS COMPLETED ============" 