#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const TEST_DIR = './debug-install';

function setup() {
  if (fs.existsSync(TEST_DIR)) {
    execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
  }
  
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  
  // Create package.json
  const packageJson = {
    name: 'debug-install',
    version: '1.0.0'
  };
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  // Create lib/utils.ts  
  fs.mkdirSync('lib', { recursive: true });
  const utilsContent = `export function cn(...inputs: any[]) { return inputs.join(' '); }`;
  fs.writeFileSync('lib/utils.ts', utilsContent);
  
  // Create components.json
  const componentsConfig = {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": true,
    "tsx": true,
    "tailwind": {
      "config": "tailwind.config.js",
      "css": "app/globals.css",
      "baseColor": "neutral",
      "cssVariables": true
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils"
    }
  };
  fs.writeFileSync('components.json', JSON.stringify(componentsConfig, null, 2));
}

function cleanup() {
  process.chdir('..');
  if (fs.existsSync(TEST_DIR)) {
    execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
  }
}

try {
  setup();
  
  console.log('🔍 Installing button component...');
  execSync('npx shadcn@latest add https://iridescent-brigadeiros-fe4174.netlify.app/r/button.json --yes', { 
    stdio: 'inherit'
  });
  
  console.log('\n📁 Files created:');
  execSync('find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules', { stdio: 'inherit' });
  
  console.log('\n📂 Directory structure:');
  execSync('ls -la components/', { stdio: 'inherit' });
  
  if (fs.existsSync('components/ui')) {
    console.log('\n📂 UI directory:');
    execSync('ls -la components/ui/', { stdio: 'inherit' });
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  cleanup();
}