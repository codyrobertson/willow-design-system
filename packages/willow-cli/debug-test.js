#!/usr/bin/env node

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, 'dist', 'index.js');
const targetDir = '/Users/Cody/Downloads/project 6';

console.log('🔍 Debug test: Running CLI and capturing all output...');

try {
  const output = execSync(
    `cd "${targetDir}" && node "${cliPath}" init --force --debug --no-install`,
    { 
      encoding: 'utf-8',
      stdio: 'pipe'
    }
  );
  
  console.log('✅ CLI Output:');
  console.log(output);
} catch (error) {
  console.log('❌ CLI Error:');
  console.log('STDOUT:', error.stdout?.toString());
  console.log('STDERR:', error.stderr?.toString());
  console.log('Error:', error.message);
}