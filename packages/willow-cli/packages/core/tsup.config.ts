import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@willow-cli/types',
    '@willow-cli/parser',
    '@willow-cli/transformer',
    '@willow-cli/generator',
    '@willow-cli/validator',
    '@willow-cli/config',
  ],
});