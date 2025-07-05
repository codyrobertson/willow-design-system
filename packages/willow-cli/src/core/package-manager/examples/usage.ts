/**
 * Package Manager Usage Examples
 * Shows how to use the package manager abstraction layer
 */

import {
  PackageManagerFactory,
  PackageManagerDetector,
  CommandTranslator,
  PackageManagerInterface
} from '../index.js';

// Example 1: Auto-detect and use package manager
async function example1() {
  console.log('Example 1: Auto-detect package manager');
  
  // Auto-detect the package manager
  const pm = await PackageManagerFactory.createAuto();
  
  console.log(`Detected: ${pm.name}`);
  console.log(`Version: ${await pm.getVersion()}`);
  console.log(`Lockfile: ${pm.lockfileName}`);
  
  // Install dependencies
  const installResult = await pm.install();
  console.log(`Install success: ${installResult.success}`);
  
  // Add a package
  const addResult = await pm.add(['lodash'], { dev: true });
  console.log(`Add lodash as dev dependency: ${addResult.success}`);
  
  // Run a script
  const runResult = await pm.run('build');
  console.log(`Run build script: ${runResult.success}`);
}

// Example 2: Use specific package manager
async function example2() {
  console.log('\nExample 2: Use specific package manager');
  
  // Create a specific package manager instance
  const pnpm = PackageManagerFactory.create('pnpm');
  
  // Check if available
  if (await pnpm.isAvailable()) {
    console.log('pnpm is available');
    
    // List workspaces
    const workspaces = await pnpm.getWorkspaces();
    console.log(`Found ${workspaces.length} workspaces`);
    
    // Install in a specific workspace
    await pnpm.install({ workspace: '@myapp/core' });
  }
}

// Example 3: Command translation
function example3() {
  console.log('\nExample 3: Command translation');
  
  const managers = ['npm', 'yarn', 'pnpm', 'bun'] as const;
  
  // Translate generic commands
  for (const manager of managers) {
    const cmd = CommandTranslator.buildCommandString('add-dev', manager, ['jest', '@types/jest']);
    console.log(`${manager}: ${cmd}`);
  }
}

// Example 4: Detect lockfiles
async function example4() {
  console.log('\nExample 4: Detect lockfiles');
  
  const lockfiles = await PackageManagerDetector.detectLockfiles();
  
  for (const lockfile of lockfiles) {
    console.log(`Found ${lockfile.manager} lockfile at ${lockfile.path}`);
  }
}

// Example 5: Workspace operations
async function example5() {
  console.log('\nExample 5: Workspace operations');
  
  const pm = await PackageManagerFactory.createAuto();
  
  // Check if in a workspace
  if (await pm.isWorkspace()) {
    console.log('Current directory is part of a workspace');
    
    const root = await pm.getWorkspaceRoot();
    console.log(`Workspace root: ${root}`);
    
    // Run command in specific workspace
    await pm.run('test', [], { workspace: '@myapp/ui' });
  }
}

// Example 6: Error handling
async function example6() {
  console.log('\nExample 6: Error handling');
  
  const pm = await PackageManagerFactory.createAuto();
  
  try {
    // Try to get info for a non-existent package
    const info = await pm.getPackageInfo('@nonexistent/package');
    console.log(info);
  } catch (error) {
    console.error('Failed to get package info:', error);
  }
  
  // Check if package is installed before removing
  if (await pm.isPackageInstalled('lodash')) {
    await pm.remove(['lodash']);
  }
}

// Example 7: Package manager capabilities
async function example7() {
  console.log('\nExample 7: Package manager capabilities');
  
  const managers = ['npm', 'yarn', 'pnpm', 'bun'] as const;
  
  for (const managerName of managers) {
    const pm = PackageManagerFactory.create(managerName);
    console.log(`\n${managerName} capabilities:`);
    console.log(`  Workspaces: ${pm.capabilities.workspaces}`);
    console.log(`  Resolutions: ${pm.capabilities.resolutions}`);
    console.log(`  Protocols: ${pm.capabilities.protocols.join(', ')}`);
  }
}

// Example 8: Batch operations
async function example8() {
  console.log('\nExample 8: Batch operations');
  
  const pm = await PackageManagerFactory.createAuto();
  
  // Install multiple packages
  const packages = ['express', 'cors', 'helmet'];
  const result = await pm.add(packages, { exact: true });
  
  if (result.success) {
    console.log('Successfully installed packages');
    
    // List installed packages
    const installed = await pm.list({ depth: 0 });
    console.log(`Total packages: ${installed.length}`);
  }
}

// Run examples (comment out in production)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await example1();
      await example2();
      example3();
      await example4();
      await example5();
      await example6();
      await example7();
      await example8();
    } catch (error) {
      console.error('Example failed:', error);
    }
  })();
}