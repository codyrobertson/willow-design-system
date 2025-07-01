import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['**/*.integration.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    
    // Longer timeouts for integration tests
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Run integration tests sequentially to avoid resource conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    
    // Environment setup
    environment: 'node',
    globals: true,
    
    // Coverage settings for integration tests
    coverage: {
      enabled: false, // Usually skip coverage for integration tests
    },
    
    // Reporter configuration
    reporters: process.env.CI 
      ? ['json', 'junit'] 
      : ['verbose'],
    
    outputFile: {
      json: './test-results/integration.json',
      junit: './test-results/integration.xml',
    },
    
    // Setup files
    setupFiles: ['./vitest.setup.ts'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});