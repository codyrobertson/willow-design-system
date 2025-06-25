#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Run tests using npx vitest
try {
  console.log('Running component mapping schema tests...\n');
  execSync('npx vitest run src/schemas/__tests__/component-mapping.schema.test.ts', {
    stdio: 'inherit',
    cwd: __dirname,
  });
  
  console.log('\nRunning mapping validator tests...\n');
  execSync('npx vitest run src/utils/__tests__/mapping-validator.test.ts', {
    stdio: 'inherit',
    cwd: __dirname,
  });
  
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Tests failed!');
  process.exit(1);
}