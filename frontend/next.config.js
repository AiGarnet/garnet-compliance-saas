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
    console.log('Using backend URL:', backendUrl);
    
    return [
      {
        source: '/api/waitlist/:path*',
        destination: `${backendUrl}/api/waitlist/:path*`,
        // Add explicit CORS header configuration to fix Netlify to Railway routing
        has: [
          {
            type: 'header',
            key: 'Content-Type',
            value: '(.*)',
          },
        ],
      },
      {
        source: '/api/answer',
        destination: `${backendUrl}/api/answer`,
      },
    ]
  },

  // Add headers configuration to enable CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}

module.exports = nextConfig 