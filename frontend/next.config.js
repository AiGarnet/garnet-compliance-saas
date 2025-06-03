/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed: output: 'export' to support dynamic routes
  trailingSlash: true,
  distDir: '.next',
  // This option is no longer supported in Next.js 14+
  // outDir: 'out',
  images: {
    // Using remotePatterns instead of unoptimized for production builds
    unoptimized: process.env.NODE_ENV === 'development',
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
    serverComponentsExternalPackages: ['lodash', 'uuid', 'react-icons'],
  },

  // Note: When using 'output: export', rewrites and headers won't work
  // They are removed since they're incompatible with static export
  
  // Configure webpack to properly handle dependencies
  webpack: (config, { isServer }) => {
    // This ensures dependencies are properly bundled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        lodash: require.resolve('lodash'),
        uuid: require.resolve('uuid'),
        'react-icons': require.resolve('react-icons'),
        'react-icons/fa': require.resolve('react-icons/fa'),
      };
    }
    return config;
  },
}

module.exports = nextConfig 