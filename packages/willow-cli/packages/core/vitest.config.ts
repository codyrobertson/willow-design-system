import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@willow-cli/types': resolve(__dirname, '../types/src'),
      '@willow-cli/parser': resolve(__dirname, '../parser/src'),
      '@willow-cli/transformer': resolve(__dirname, '../transformer/src'),
      '@willow-cli/generator': resolve(__dirname, '../generator/src'),
      '@willow-cli/validator': resolve(__dirname, '../validator/src'),
      '@willow-cli/config': resolve(__dirname, '../config/src'),
    },
  },
});