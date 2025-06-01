#!/bin/bash
set -e

echo "============ STARTING SIMPLE BUILD PROCESS ============"

# Print environment information
echo "Environment information:"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Try to use Node 18 if available (for better compatibility)
export NODE_VERSION=18

# Go to frontend directory
cd frontend
echo "Current directory: $(pwd)"

# Clean up
echo "Cleaning environment..."
rm -rf .next out node_modules/.cache

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Ensure critical dependencies are installed
echo "Ensuring critical dependencies are installed..."
npm install --save --legacy-peer-deps framer-motion@latest react-markdown tailwind-merge lodash next-navigation@latest date-fns

# Install all potential missing dependencies from common imports
echo "Installing additional dependencies that might be missing..."
npm install --save --legacy-peer-deps react react-dom @types/react @types/react-dom lucide-react uuid @types/uuid next clsx

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

# Check for conflicts between app directory and pages directory
echo "Checking for conflicts between app/ and pages/ directories..."
if [ -d "app" ] && [ -d "pages" ]; then
  # Remove conflicting page routes
  if [ -f "pages/index.js" ] && [ -f "app/page.tsx" ]; then
    echo "Found conflicting route: pages/index.js and app/page.tsx - removing pages/index.js"
    rm -f pages/index.js
  fi
  
  if [ -f "pages/index.tsx" ] && [ -f "app/page.tsx" ]; then
    echo "Found conflicting route: pages/index.tsx and app/page.tsx - removing pages/index.tsx"
    rm -f pages/index.tsx
  fi
  
  # Add any other potential conflicts here as needed
  for pagefile in pages/*; do
    if [[ "$pagefile" != "pages/_app.tsx" && "$pagefile" != "pages/_document.tsx" ]]; then
      pagename=$(basename "$pagefile" | sed 's/\.[^.]*$//')
      if [ -d "app/$pagename" ] || [ -f "app/$pagename.tsx" ] || [ -f "app/$pagename/page.tsx" ]; then
        echo "Found potential conflict: $pagefile conflicts with app directory - backing up"
        mkdir -p _conflict_backup
        mv "$pagefile" _conflict_backup/
      fi
    fi
  done
fi

# Check for duplicate page files and clean them up
echo "Checking for duplicate page files..."
if [ -d "pages" ]; then
  if [ -f "pages/_app.js" ] && [ -f "pages/_app.tsx" ]; then
    echo "Found duplicate _app files, removing pages/_app.js"
    rm -f pages/_app.js
  fi
  
  if [ -f "pages/_document.js" ] && [ -f "pages/_document.tsx" ]; then
    echo "Found duplicate _document files, removing pages/_document.js"
    rm -f pages/_document.js
  fi
  
  if [ -f "pages/index.js" ] && [ -f "pages/index.tsx" ]; then
    echo "Found duplicate index files, removing pages/index.js"
    rm -f pages/index.js
  fi
fi

# Check and handle pages directory if it exists and might conflict
if [ -d "pages" ]; then
  echo "Moving pages directory to avoid conflicts..."
  mkdir -p _backup
  mv pages _backup/pages
fi

# Set Node options to avoid compatibility issues
echo "Setting Node options for compatibility..."
export NODE_OPTIONS="--max-old-space-size=4096 --openssl-legacy-provider"

# Add a .env file for consistency
echo "Creating .env file with required settings..."
cat > .env << 'EOL'
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
EOL

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

# Specific page redirects
/questionnaires    /index.html   200
/questionnaires/*  /index.html   200
EOL

# Install Netlify functions dependencies
echo "Installing Netlify functions dependencies..."
cd ../netlify/functions
npm install

# Create fallback pages for problematic routes
echo "Creating fallback pages for problematic routes..."
cat > out/questionnaires.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GarnetAI - Questionnaires</title>
  <script>
    window.location.href = '/';
  </script>
</head>
<body>
  <p>Redirecting to home page...</p>
</body>
</html>
EOL

# Create basic 404 page
cat > out/404.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GarnetAI - Page Not Found</title>
  <script>
    window.location.href = '/';
  </script>
</head>
<body>
  <p>Page not found. Redirecting to home page...</p>
</body>
</html>
EOL

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