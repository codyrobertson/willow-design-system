import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to incremental build issue
  clean: true,
  sourcemap: true,
  external: ['@willow-cli/types', '@willow-cli/parser', 'typescript', 'ts-morph'],
});