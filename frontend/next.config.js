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
  
  // Experimental features for better Netlify compatibility
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
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