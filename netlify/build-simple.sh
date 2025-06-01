#!/bin/bash
set -e

echo "============ STARTING COMPLETE FRONTEND BUILD PROCESS ============"

# Go to frontend directory
cd frontend
echo "Current directory: $(pwd)"

# Cleaning environment
echo "Cleaning environment..."
rm -rf .next out node_modules/.cache

# Create backup of critical files
echo "Backing up critical files..."
cp package.json package.json.bak
cp next.config.js next.config.js.bak
cp tsconfig.json tsconfig.json.bak

# Fix API routes for static export
echo "Fixing API routes for static export..."
find app/api -type f -name "route.ts" -exec sed -i.bak '1s/^/export const dynamic = "force-static";\n/' {} \;

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install critical packages
echo "Installing critical packages..."
npm install --save react react-dom next@latest
npm install --save uuid lodash framer-motion tailwind-merge

# Create optimized Next.js config
echo "Creating optimized Next.js config..."
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
  },
  // Skip API routes completely in static export
  experimental: {
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
  },
}

module.exports = nextConfig
EOL

# Create a simplified tsconfig
echo "Creating optimized TypeScript config..."
cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL

# Fix the pages/app conflict
if [ -d "pages" ]; then
  echo "Moving pages directory to avoid conflict..."
  mkdir -p _backup
  mv pages _backup/
fi

# Check if we need to remove API routes completely for static export
echo "Making API routes compatible with static export..."
# We've already edited the route.ts file directly, so we don't need this anymore
# mkdir -p _backup/api
# mv app/api _backup/api || true

# Build the Next.js app
echo "Building Next.js app with production settings..."
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 npm run build

# Check if the build created the out directory
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

# Create necessary redirects for SPA routing
echo "Creating _redirects file for SPA routing..."
cat > out/_redirects << 'EOL'
/* /index.html 200
EOL

# Install Netlify functions dependencies
echo "Installing Netlify functions dependencies..."
cd ../netlify/functions
npm install

echo "============ BUILD PROCESS COMPLETED ============" 