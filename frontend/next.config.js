/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static export for Netlify deployment
  output: 'export',
  trailingSlash: true,
  distDir: '.next',
  // Ensure proper static generation
  generateBuildId: () => 'build',
  // Static export output directory - Next.js 13+ with output: 'export' outputs to 'out' by default
  images: {
    // Static export requires unoptimized images
    unoptimized: true,
  },
  swcMinify: true,
  
  // Environment variables for static export
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: 'true',
  },
  
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
  
  // TypeScript configuration
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Experimental features for better Netlify compatibility
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['lodash', 'uuid'],
    // Allow missing generate static params in development
    missingSuspenseWithCSRBailout: false,
  },

  // Note: When using 'output: export', rewrites and headers won't work
  // They are removed since they're incompatible with static export
  
  // Configure webpack to properly handle lodash
  webpack: (config, { isServer }) => {
    // This ensures lodash is properly bundled
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