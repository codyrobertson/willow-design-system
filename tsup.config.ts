import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/components/ui/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  minify: true,
  treeshake: true,
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});