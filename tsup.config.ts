import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/components/ui/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true, // Enable code splitting for better tree shaking
  sourcemap: process.env.NODE_ENV !== 'production', // Skip sourcemaps in production
  clean: true,
  external: [
    'react', 
    'react-dom',
    'lucide-react',
    '@radix-ui/react-slot',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'tailwindcss-animate',
    'next-themes',
    'focus-trap-react'
  ],
  minify: true,
  treeshake: true,
  // Optimize bundle size
  target: 'es2020',
  keepNames: false,
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
    // Additional optimizations
    options.drop = ['console', 'debugger'];
    options.legalComments = 'none';
    options.treeShaking = true;
  },
  // Generate multiple entry points for better tree shaking
  onSuccess: async () => {
    console.log('✅ Build completed with optimizations');
  },
});