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
    // Turbo config moved to turbopack (deprecated)
  },
  
  // Disable linting during builds for faster deployment  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Bundle analysis and optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations (swcMinify is now default in Next.js 15)
  
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
    
    // Fix source map issues
    if (!dev) {
      config.devtool = false; // Disable source maps in production
    }
    
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // Optimize chunk splitting for better caching
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 20,
              chunks: 'all',
            },
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?:react|react-dom)/,
              priority: 40,
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
