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
    // Get backend URL from env or use Railway URL as default
    const backendUrl = process.env.BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    
    return [
      {
        source: '/api/waitlist/:path*',
        destination: `${backendUrl}/api/waitlist/:path*`,
      },
      {
        source: '/api/answer',
        destination: `${backendUrl}/api/answer`,
      },
    ]
  },
}

module.exports = nextConfig 