import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        'packages/*/tests/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['packages/*/src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'build'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@willow-cli/types': resolve(__dirname, './packages/types/src'),
      '@willow-cli/core': resolve(__dirname, './packages/core/src'),
      '@willow-cli/parser': resolve(__dirname, './packages/parser/src'),
      '@willow-cli/transformer': resolve(__dirname, './packages/transformer/src'),
      '@willow-cli/generator': resolve(__dirname, './packages/generator/src'),
      '@willow-cli/validator': resolve(__dirname, './packages/validator/src'),
      '@willow-cli/config': resolve(__dirname, './packages/config/src'),
      '@willow-cli/plugins': resolve(__dirname, './packages/plugins/src'),
    },
  },
  define: {
    // Handle Node.js built-in modules in tests
    global: 'globalThis',
  },
  // Explicitly handle Node.js built-ins
  optimizeDeps: {
    exclude: ['fs', 'path', 'os', 'crypto', 'buffer', 'stream'],
  },
});