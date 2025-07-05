import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    bail: 1, // Stop on first test failure
    reporters: ['dot'], // Minimal output for pre-commit
    include: [
      'src/**/*.test.{ts,tsx}',
      'packages/**/*.test.{ts,tsx}',
      'lib/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '.next',
      'coverage',
      'storybook-static',
    ],
    coverage: {
      enabled: false, // Disable coverage for pre-commit speed
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@lib': resolve(__dirname, './lib'),
    },
  },
});