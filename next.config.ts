import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Core optimizations
  trailingSlash: true,
  generateBuildId: async () => {
    return 'willow-design-system'
  },
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
  
  // Static generation optimizations
  distDir: '.next',
  
  // Image optimization (if using next/image)
  images: {
    unoptimized: true, // Required for static export
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Ensure registry/lib directory is always resolved
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/registry/lib': '/Users/Cody/code_projects/willow-design-system/registry/lib',
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
