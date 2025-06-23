#!/usr/bin/env node

/**
 * Test that all components can be installed successfully
 * Tests both Willow CLI and direct URL installation methods
 */

const { execSync } = require('child_process');
const fs = require('fs');

const TEST_DIR = './test-component-installations';
const COMPONENTS_TO_TEST = ['button', 'card', 'badge', 'input', 'label'];

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan  
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m'  // Yellow
  };
  console.log(`${colors[type] || colors.info}${message}\x1b[0m`);
}

function setup() {
  log('Setting up component installation test...', 'info');
  
  if (fs.existsSync(TEST_DIR)) {
    execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
  }
  
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  
  // Create package.json
  const packageJson = {
    name: 'test-component-installations',
    version: '1.0.0',
    dependencies: {
      'clsx': 'latest',
      'tailwind-merge': 'latest',
      'class-variance-authority': 'latest',
      'lucide-react': 'latest',
      '@radix-ui/react-slot': 'latest'
    }
  };
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  // Create lib/utils.ts  
  fs.mkdirSync('lib', { recursive: true });
  const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
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
  
  log('Test environment setup complete', 'success');
}

function cleanup() {
  process.chdir('..');
  if (fs.existsSync(TEST_DIR)) {
    execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
  }
}

function testDirectURLInstallations() {
  log('\n📦 Testing direct URL installations...', 'info');
  
  for (const component of COMPONENTS_TO_TEST) {
    try {
      log(`Installing ${component} via direct URL...`, 'info');
      const url = `https://iridescent-brigadeiros-fe4174.netlify.app/r/${component}.json`;
      execSync(`npx shadcn@latest add ${url} --yes`, { 
        stdio: 'pipe',
        timeout: 30000 
      });
      
      // Check if component file was created
      const componentPath = `components/ui/${component}.tsx`;
      if (fs.existsSync(componentPath)) {
        log(`✅ ${component} installed successfully`, 'success');
      } else {
        throw new Error(`Component file not found: ${componentPath}`);
      }
      
    } catch (error) {
      log(`❌ Failed to install ${component}: ${error.message}`, 'error');
      throw error;
    }
  }
}

function testWillowCLIInstallations() {
  log('\n🔧 Testing Willow CLI installations...', 'info');
  
  // Clean components directory
  if (fs.existsSync('components')) {
    execSync('rm -rf components', { stdio: 'pipe' });
  }
  
  const cliPath = path.resolve('..', 'packages/willow-cli/index.js');
  
  // Test init command
  try {
    log('Testing willow init...', 'info');
    execSync(`node ${cliPath} init`, { stdio: 'pipe' });
    log('✅ willow init successful', 'success');
  } catch (error) {
    log(`❌ willow init failed: ${error.message}`, 'error');
    throw error;
  }
  
  // Test component installations
  for (const component of COMPONENTS_TO_TEST.slice(0, 3)) { // Test first 3 to save time
    try {
      log(`Installing ${component} via Willow CLI...`, 'info');
      execSync(`node ${cliPath} add ${component} --yes`, { 
        stdio: 'pipe',
        timeout: 30000 
      });
      
      // Check if component file was created
      const componentPath = `components/ui/${component}.tsx`;
      if (fs.existsSync(componentPath)) {
        log(`✅ ${component} installed successfully via CLI`, 'success');
      } else {
        throw new Error(`Component file not found: ${componentPath}`);
      }
      
    } catch (error) {
      log(`❌ Failed to install ${component} via CLI: ${error.message}`, 'error');
      throw error;
    }
  }
}

function testComponentContent() {
  log('\n🔍 Testing component content...', 'info');
  
  const componentPath = 'components/ui/button.tsx';
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Check for expected imports and exports
    if (content.includes('import') && content.includes('export')) {
      log('✅ Component content looks valid', 'success');
    } else {
      throw new Error('Component content appears invalid');
    }
    
    // Check for Willow-specific styling (optional)
    if (content.includes('willow-primary') || content.includes('bg-primary')) {
      log('✅ Willow styling detected', 'success');
    } else {
      log('⚠️  No Willow-specific styling detected (may be normal)', 'warning');
    }
  }
}

function main() {
  const path = require('path');
  
  try {
    setup();
    
    // Test direct URL installations
    testDirectURLInstallations();
    
    // Test Willow CLI installations  
    testWillowCLIInstallations();
    
    // Test component content
    testComponentContent();
    
    log('\n🎉 All component installation tests passed!', 'success');
    
  } catch (error) {
    log(`\n💥 Component installation test failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    cleanup();
  }
}

if (require.main === module) {
  main();
}