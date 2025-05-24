/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use standalone output for Netlify deployment
  output: 'standalone',
  trailingSlash: true,
  distDir: '.next',
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
  
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Adding webpack configuration for handling node modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark pg and other server-only modules as external
      // This prevents them from being bundled by webpack
      config.externals.push('pg', 'pg-native', 'bcryptjs', 'jose');
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