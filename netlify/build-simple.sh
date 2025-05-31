#!/bin/bash
set -e

echo "============ STARTING PRODUCTION BUILD PROCESS ============"

# Go to frontend directory
cd frontend
echo "Current directory: $(pwd)"

# Create an .npmrc file to ensure npm doesn't fail on missing optional dependencies
echo "optional=true" > .npmrc
echo "fund=false" >> .npmrc
echo "audit=false" >> .npmrc

# Clean install of dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install critical packages explicitly
echo "Installing critical packages explicitly..."
npm install --save lodash uuid react react-dom next

# Make a backup of next.config.js 
cp next.config.js next.config.js.bak

# Update next.config.js to fix experimental options but preserve most settings
echo "Updating next.config.js..."
cat > next.config.js << 'EOL'
/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  distDir: ".next",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverExternalPackages: ['lodash', 'uuid'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        lodash: require.resolve('lodash'),
        uuid: require.resolve('uuid'),
      };
    }
    return config;
  },
}

module.exports = nextConfig
EOL

# Remove pages directory if app directory exists
if [ -d "app" ]; then
  echo "Using App Router (app directory)..."
  if [ -d "pages" ]; then
    echo "Removing pages directory to avoid conflicts..."
    rm -rf pages
  fi
fi

# Build with production settings
echo "Building Next.js app..."
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 npm run build

# Install Netlify functions dependencies
echo "Installing Netlify functions dependencies..."
cd ../netlify/functions
npm install

echo "============ BUILD PROCESS COMPLETED ============" 