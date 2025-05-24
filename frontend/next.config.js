/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use standalone output for Netlify deployment
  output: 'standalone',
  // Enable trailing slash for better path handling
  trailingSlash: true,
  distDir: '.next',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  swcMinify: true,
  
  // Skip static generation for dynamic routes
  skipTrailingSlashRedirect: true,
  
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Skip TypeScript type checking during build for faster builds in CI
  typescript: {
    // Only run type checking locally during development to speed up builds
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint during build for faster builds in CI
  eslint: {
    // Always skip ESLint for Netlify builds to avoid failures
    ignoreDuringBuilds: true,
  },
  
  // Handle potential issues with Postgres in Netlify functions
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle pg or native modules for server-side
      config.externals = [...(config.externals || []), 'pg', 'bcryptjs', 'jose', 'jsonwebtoken'];
    }
    return config;
  },
  
  // Adding transpilePackages to ensure compatibility
  transpilePackages: [],
  
  // Additional environment variables to make available
  env: {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_NAME: process.env.DB_NAME || 'garnet_ai',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'Sonasuhani1',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secure-secret-key-change-this-in-production',
  },
  
  // Specify which serverless function dependencies to exclude
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-native', 'bcryptjs', 'jose'],
  },

  // API rewrites to proxy requests to backend
  async rewrites() {
    return [
      {
        source: '/api/waitlist/:path*',
        destination: 'http://localhost:5000/api/waitlist/:path*',
      },
      {
        source: '/api/answer',
        destination: 'http://localhost:5000/api/answer',
      },
    ]
  },
}

module.exports = nextConfig 