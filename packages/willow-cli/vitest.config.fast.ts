import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [
        ...baseConfig.test?.exclude || [],
        '**/*.integration.test.{ts,tsx}',
        '**/integration/**',
        '**/*.improved.test.ts',
        '**/stress/**',
        '**/performance/**',
        '**/adapters/integration/**',
        '**/adapters/**/*.integration.test.ts',
        '**/adapters/**/*.improved.test.ts',
      ],
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: false,
          maxThreads: 8,
          minThreads: 4,
        }
      }
    },
  })
);