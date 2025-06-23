import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ensure this is NOT a static export - we need server functions
  // dynamicParams: true, // Remove this as it's for dynamic routes, not forcing SSR
  
  // Core optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Bundle analysis and optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations
  swcMinify: true,
  
  // Build optimizations
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Ensure registry/lib directory is always resolved
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/registry/lib': path.resolve('./registry/lib'),
    };
    
    // Only apply optimizations in production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for framework code
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?:react|react-dom)/,
              priority: 40,
              enforce: true,
            },
            // UI library chunk
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 30,
              chunks: 'all',
            },
            // Common chunks
            common: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              chunks: 'all',
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
