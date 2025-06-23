#!/usr/bin/env node

/**
 * Pre-commit tests for Willow CLI functionality
 * Tests that components can be installed and CLI commands work
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_DIR = './test-cli-functionality';
const WILLOW_CLI_PATH = './packages/willow-cli/index.js';
const REGISTRY_BASE_URL = 'https://iridescent-brigadeiros-fe4174.netlify.app/r';

// Components to test
const COMPONENTS_TO_TEST = ['button', 'card', 'badge', 'input'];

// Test results tracker
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runTest(testName, testFn) {
  try {
    log(`Running test: ${testName}`, 'info');
    testFn();
    testResults.passed++;
    log(`Test passed: ${testName}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`Test failed: ${testName} - ${error.message}`, 'error');
  }
}

function setup() {
  log('Setting up test environment...', 'info');
  
  // Clean up any existing test directory
  if (fs.existsSync(TEST_DIR)) {
    execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
  }
  
  // Create test directory
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
  
  // Create minimal package.json
  const packageJson = {
    name: 'test-willow-cli',
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
  
  // Install dependencies silently
  try {
    execSync('npm install --silent', { stdio: 'pipe', timeout: 60000 });
    log('Dependencies installed', 'success');
  } catch (error) {
    log('Warning: Could not install dependencies', 'warning');
  }
  
  log('Test environment setup complete', 'success');
}

function cleanup() {
  log('Cleaning up test environment...', 'info');
  process.chdir('..');
  if (fs.existsSync(TEST_DIR)) {
    execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
  }
  log('Cleanup complete', 'success');
}

function testRegistryAccessibility() {
  COMPONENTS_TO_TEST.forEach(component => {
    const url = `${REGISTRY_BASE_URL}/${component}.json`;
    try {
      // Use curl to test URL accessibility
      execSync(`curl -s --fail ${url}`, { stdio: 'pipe' });
      log(`Registry accessible for ${component}`, 'success');
    } catch (error) {
      throw new Error(`Registry not accessible for ${component} at ${url}`);
    }
  });
}

function testWillowCLIExists() {
  const cliPath = path.resolve('..', WILLOW_CLI_PATH);
  if (!fs.existsSync(cliPath)) {
    throw new Error(`Willow CLI not found at ${cliPath}`);
  }
  log('Willow CLI file exists', 'success');
}

function testWillowCLIList() {
  const cliPath = path.resolve('..', WILLOW_CLI_PATH);
  try {
    const output = execSync(`node ${cliPath} list`, { encoding: 'utf8', stdio: 'pipe' });
    if (!output.includes('Willow Design System Components')) {
      throw new Error('CLI list command output is incorrect');
    }
    
    // Check that test components are listed
    COMPONENTS_TO_TEST.forEach(component => {
      if (!output.includes(component)) {
        throw new Error(`Component ${component} not found in CLI list output`);
      }
    });
    
    log('CLI list command works correctly', 'success');
  } catch (error) {
    throw new Error(`CLI list command failed: ${error.message}`);
  }
}

function testWillowCLIInit() {
  const cliPath = path.resolve('..', WILLOW_CLI_PATH);
  try {
    execSync(`node ${cliPath} init`, { stdio: 'pipe' });
    
    // Check that components.json was created
    if (!fs.existsSync('components.json')) {
      throw new Error('components.json was not created by init command');
    }
    
    // Check that lib/utils.ts was created
    if (!fs.existsSync('lib/utils.ts')) {
      throw new Error('lib/utils.ts was not created by init command');
    }
    
    log('CLI init command works correctly', 'success');
  } catch (error) {
    throw new Error(`CLI init command failed: ${error.message}`);
  }
}

function testDirectRegistryInstallation() {
  try {
    // Test installing button component directly
    const componentUrl = `${REGISTRY_BASE_URL}/button.json`;
    execSync(`npx shadcn@latest add ${componentUrl} --yes`, { 
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // Check multiple possible locations for the button component
    const possiblePaths = [
      'components/ui/button.tsx',
      'components/ui/Button.tsx',
      'src/components/ui/button.tsx',
      'src/components/ui/Button.tsx'
    ];
    
    let componentFound = false;
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        componentFound = true;
        log(`Button component found at: ${path}`, 'success');
        break;
      }
    }
    
    if (!componentFound) {
      // List all files that were created
      const allFiles = execSync('find . -name "*.tsx" -o -name "*.ts" | head -20', { encoding: 'utf8' });
      log(`Files created: ${allFiles}`, 'info');
      throw new Error('Button component was not installed in expected locations');
    }
    
    log('Direct registry installation works', 'success');
  } catch (error) {
    throw new Error(`Direct registry installation failed: ${error.message}`);
  }
}

function testComponentJsonStructure() {
  COMPONENTS_TO_TEST.forEach(component => {
    try {
      const url = `${REGISTRY_BASE_URL}/${component}.json`;
      const response = execSync(`curl -s ${url}`, { encoding: 'utf8' });
      const componentData = JSON.parse(response);
      
      // Check required fields
      const requiredFields = ['name', 'type', 'files'];
      requiredFields.forEach(field => {
        if (!componentData[field]) {
          throw new Error(`Component ${component} missing required field: ${field}`);
        }
      });
      
      // Check that files array has content
      if (!Array.isArray(componentData.files) || componentData.files.length === 0) {
        throw new Error(`Component ${component} has no files`);
      }
      
      log(`Component JSON structure valid for ${component}`, 'success');
    } catch (error) {
      throw new Error(`Component JSON structure invalid for ${component}: ${error.message}`);
    }
  });
}

function testFontCDNAccessibility() {
  try {
    const fontCssUrl = 'https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css';
    execSync(`curl -s --fail ${fontCssUrl}`, { stdio: 'pipe' });
    log('Font CDN is accessible', 'success');
  } catch (error) {
    throw new Error('Font CDN is not accessible');
  }
}

function testStorybookAccessibility() {
  try {
    const storybookUrl = 'https://iridescent-brigadeiros-fe4174.netlify.app/storybook';
    execSync(`curl -s --fail ${storybookUrl}`, { stdio: 'pipe' });
    log('Storybook is accessible', 'success');
  } catch (error) {
    log('Storybook accessibility test failed (non-critical)', 'warning');
  }
}

function runAllTests() {
  log('Starting Willow CLI pre-commit tests...', 'info');
  
  try {
    setup();
    
    // Core functionality tests
    runTest('Registry Accessibility', testRegistryAccessibility);
    runTest('Willow CLI Exists', testWillowCLIExists);
    runTest('CLI List Command', testWillowCLIList);
    runTest('CLI Init Command', testWillowCLIInit);
    runTest('Direct Registry Installation', testDirectRegistryInstallation);
    runTest('Component JSON Structure', testComponentJsonStructure);
    runTest('Font CDN Accessibility', testFontCDNAccessibility);
    runTest('Storybook Accessibility', testStorybookAccessibility);
    
  } finally {
    cleanup();
  }
  
  // Print test results
  log('\n=== TEST RESULTS ===', 'info');
  log(`Total tests: ${testResults.passed + testResults.failed}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  
  if (testResults.errors.length > 0) {
    log('\n=== FAILED TESTS ===', 'error');
    testResults.errors.forEach(({ test, error }) => {
      log(`${test}: ${error}`, 'error');
    });
  }
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    log('\n❌ Some tests failed. Please fix issues before committing.', 'error');
    process.exit(1);
  } else {
    log('\n✅ All tests passed! Ready to commit.', 'success');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
};