#!/usr/bin/env node

/**
 * Ensures registry/lib/utils.ts exists to prevent build failures
 * This script runs before build to create necessary utility files
 */

const fs = require('fs');
const path = require('path');

const registryLibDir = path.join(__dirname, '..', 'registry', 'lib');
const registryComponentsDir = path.join(__dirname, '..', 'registry', 'components', 'ui');
const registryIconDir = path.join(__dirname, '..', 'registry', 'components', 'ui', 'icon');
const utilsPath = path.join(registryLibDir, 'utils.ts');
const componentUtilsPath = path.join(registryComponentsDir, 'utils.ts');
const iconUtilsPath = path.join(registryIconDir, 'utils.ts');

const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

// Ensure directories exist
if (!fs.existsSync(registryLibDir)) {
  fs.mkdirSync(registryLibDir, { recursive: true });
  console.log('✅ Created registry/lib directory');
}

if (!fs.existsSync(registryComponentsDir)) {
  fs.mkdirSync(registryComponentsDir, { recursive: true });
  console.log('✅ Created registry/components/ui directory');
}

if (!fs.existsSync(registryIconDir)) {
  fs.mkdirSync(registryIconDir, { recursive: true });
  console.log('✅ Created registry/components/ui/icon directory');
}

// Ensure utils.ts exists in both locations
if (!fs.existsSync(utilsPath)) {
  fs.writeFileSync(utilsPath, utilsContent);
  console.log('✅ Created registry/lib/utils.ts');
} else {
  console.log('✅ registry/lib/utils.ts already exists');
}

if (!fs.existsSync(componentUtilsPath)) {
  fs.writeFileSync(componentUtilsPath, utilsContent);
  console.log('✅ Created registry/components/ui/utils.ts');
} else {
  console.log('✅ registry/components/ui/utils.ts already exists');
}

if (!fs.existsSync(iconUtilsPath)) {
  fs.writeFileSync(iconUtilsPath, utilsContent);
  console.log('✅ Created registry/components/ui/icon/utils.ts');
} else {
  console.log('✅ registry/components/ui/icon/utils.ts already exists');
}

// Create symlink for components/lib if it doesn't exist
const symlinkPath = path.join(__dirname, '..', 'registry', 'components', 'lib');
const targetPath = path.join('..', 'lib');

try {
  if (!fs.existsSync(symlinkPath)) {
    // Ensure components directory exists
    const componentsDir = path.join(__dirname, '..', 'registry', 'components');
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }
    
    fs.symlinkSync(targetPath, symlinkPath, 'dir');
    console.log('✅ Created symlink registry/components/lib -> ../lib');
  } else {
    console.log('✅ Symlink registry/components/lib already exists');
  }
} catch (error) {
  // Symlink creation might fail on some systems, just continue
  console.log('⚠️  Could not create symlink, but utils.ts exists directly');
}

console.log('✅ Registry utils setup complete');