#!/usr/bin/env node

// Test script to run the CLI in the Bolt project directory
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, 'dist', 'index.js');
const targetDir = '/Users/Cody/Downloads/project 6';

console.log('🧪 Testing Willow CLI in Bolt project...');
console.log(`CLI path: ${cliPath}`);
console.log(`Target directory: ${targetDir}`);

// Change to target directory and run CLI
process.chdir(targetDir);
console.log(`Current directory: ${process.cwd()}`);

// Spawn the CLI process
const child = spawn('node', [cliPath, 'init', '--force', '--debug', '--no-install'], {
  stdio: 'inherit',
  cwd: targetDir
});

child.on('close', (code) => {
  console.log(`\n🏁 CLI process exited with code ${code}`);
});

child.on('error', (error) => {
  console.error(`❌ Error running CLI: ${error.message}`);
});