import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000, // Longer timeout for integration tests
    include: [
      'src/**/*.integration.test.ts',
      'src/core/network/__tests__/integration.test.ts',
      'src/core/network/__tests__/HTTPClient.test.ts',
      'src/utils/__tests__/component-fetcher.test.ts'
    ],
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        maxForks: 2, // Limit parallel execution for integration tests
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './'),
    },
  },
});