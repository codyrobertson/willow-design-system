#!/usr/bin/env node

/**
 * Build script for canary release
 */

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Building canary release...');

// Create dist directory
mkdirSync(join(__dirname, 'dist'), { recursive: true });

// Copy the simplified CLI
copyFileSync(
  join(__dirname, 'src/cli-simple.ts'),
  join(__dirname, 'dist/cli-simple.js')
);

// Create a wrapper that handles TypeScript
const wrapperContent = `#!/usr/bin/env node

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('tsx/esm', pathToFileURL('./'));

await import('./dist/cli-simple.js');
`;

writeFileSync(join(__dirname, 'cli.js'), wrapperContent);

// Make it executable
if (process.platform !== 'win32') {
  execSync(`chmod +x ${join(__dirname, 'cli.js')}`);
}

// Update bin/index.js to use the wrapper
const binContent = `#!/usr/bin/env node

// Import and run the CLI
import('../cli.js').catch(error => {
  console.error('Failed to load CLI:', error);
  process.exit(1);
});
`;

writeFileSync(join(__dirname, 'bin/index.js'), binContent);

// Make bin/index.js executable
if (process.platform !== 'win32') {
  execSync(`chmod +x ${join(__dirname, 'bin/index.js')}`);
}

console.log('✓ Canary build complete!');
console.log('\nTo test locally:');
console.log('  npm link');
console.log('  willow --help');
console.log('\nTo publish:');
console.log('  npm publish --tag canary');