#!/usr/bin/env node

// Test the willow CLI in a clean environment
const { execSync } = require('child_process');
const fs = require('fs');

const TEST_DIR = './test-willow-final';

async function testWillowCLI() {
  console.log('🧪 Testing Willow CLI...\n');

  try {
    // Clean up
    if (fs.existsSync(TEST_DIR)) {
      execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
    }

    // Create test directory
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);

    // Create minimal package.json
    const packageJson = {
      name: 'test-willow-final',
      version: '1.0.0'
    };
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

    console.log('🎯 Testing: node ../packages/willow-cli/index.js init');
    try {
      execSync('node ../packages/willow-cli/index.js init', { stdio: 'inherit' });
      console.log('✅ willow init works!');
    } catch (error) {
      console.log('❌ willow init failed');
    }

    console.log('\n🎯 Testing: node ../packages/willow-cli/index.js list');
    try {
      execSync('node ../packages/willow-cli/index.js list', { stdio: 'inherit' });
      console.log('✅ willow list works!');
    } catch (error) {
      console.log('❌ willow list failed');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    // Clean up
    process.chdir('..');
    if (fs.existsSync(TEST_DIR)) {
      execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
    }
  }
}

testWillowCLI().catch(console.error);