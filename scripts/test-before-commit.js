#!/usr/bin/env node

/**
 * Pre-commit hook script to run all necessary tests
 * This ensures that the CLI, registry, and components work before committing
 */

const { execSync } = require('child_process');
const path = require('path');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔍 ${description}...`, 'info');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} - PASSED`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${description} - FAILED`, 'error');
    return false;
  }
}

function main() {
  log('🚀 Running pre-commit tests for Willow Design System', 'info');
  log('=' .repeat(60), 'info');
  
  let allTestsPassed = true;
  
  // 1. Run CLI functionality tests
  if (!runCommand('node tests/cli.test.js', 'CLI Functionality Tests')) {
    allTestsPassed = false;
  }
  
  // 2. Check TypeScript compilation
  if (!runCommand('npx tsc --noEmit', 'TypeScript Compilation Check')) {
    allTestsPassed = false;
  }
  
  // 3. Run Jest tests
  if (!runCommand('npm test -- --passWithNoTests', 'Jest Unit Tests')) {
    allTestsPassed = false;
  }
  
  // 4. Build registry
  if (!runCommand('npm run build-registry', 'Registry Build')) {
    allTestsPassed = false;
  }
  
  // 5. Test component installations
  if (!runCommand('node scripts/test-component-installations.js', 'Component Installation Test')) {
    allTestsPassed = false;
  }
  
  log('\n' + '=' .repeat(60), 'info');
  
  if (allTestsPassed) {
    log('🎉 All tests passed! Ready to commit.', 'success');
    process.exit(0);
  } else {
    log('💥 Some tests failed. Please fix issues before committing.', 'error');
    log('\nFor help debugging:', 'warning');
    log('- Check registry endpoints: https://iridescent-brigadeiros-fe4174.netlify.app/r/', 'warning');
    log('- Test CLI manually: cd packages/willow-cli && node index.js list', 'warning');
    log('- Check TypeScript errors: npx tsc --noEmit', 'warning');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}