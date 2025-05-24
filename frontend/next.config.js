/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use export output for static site generation
  output: 'export',
  trailingSlash: true,
  distDir: '.next',
  // Specify the output directory for the static export
  // This should match the publish directory in netlify.toml
  outDir: 'out',
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

  // Note: When using 'output: export', rewrites and headers won't work
  // They are removed since they're incompatible with static export
}

module.exports = nextConfig 