/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static export to enable registry API routes
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  
  // Disable ESLint during builds to avoid blocking on warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ensure fonts and other assets are properly handled
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://willow-design-system.vercel.app' : '',
  
  // Configure image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  // Redirects only work in development (not with static export)
  async redirects() {
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/',
          destination: '/docs',
          permanent: false,
        },
      ];
    }
    return [];
  },
  
  // Copy storybook build to public folder during build
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV === 'production') {
      // Custom webpack config if needed
    }
    return config;
  },
}

export default nextConfig;