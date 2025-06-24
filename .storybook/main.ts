import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-docs"
    // Removed onboarding addon to reduce bundle size
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {}
  },
  staticDirs: [
    "../public"
  ],
  managerHead: (head) => `
    ${head}
    <base href="/storybook/">
    <script>
      // Set the base path for runtime requests
      window.__STORYBOOK_ADDONS_CHANNEL__ = window.__STORYBOOK_ADDONS_CHANNEL__ || {};
      window.STORYBOOK_ENV = 'production';
      window.PUBLIC_URL = '/storybook';
    </script>
  `,
  webpack: (config, { configType }) => {
    // Production optimizations
    if (configType === 'PRODUCTION') {
      // Disable source maps to reduce bundle size significantly
      config.devtool = false;
      
      // Optimize bundle size
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // ~240KB chunks
          cacheGroups: {
            vendor: {
              test: /[\\/\\]node_modules[\\/\\]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000,
            },
            lucide: {
              test: /[\\/\\]node_modules[\\/\\]lucide-react[\\/\\]/,
              name: 'lucide',
              chunks: 'all',
              priority: 10,
            },
          },
        },
        minimize: true,
      };
    }
    
    return config;
  },
  features: {
    // Disable unnecessary features
    storyStoreV7: true,
    buildStoriesJson: false,
  }
};

export default config;