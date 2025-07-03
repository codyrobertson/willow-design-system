#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of workspace dependencies to relative paths
const workspaceMap = {
  '@willow-cli/types': '../types',
  '@willow-cli/parser': '../parser',
  '@willow-cli/transformer': '../transformer',
  '@willow-cli/generator': '../generator',
  '@willow-cli/validator': '../validator',
  '@willow-cli/config': '../config',
};

// Find all package.json files in packages directory
const packagesDir = path.join(__dirname, 'packages');
const packages = fs.readdirSync(packagesDir);

packages.forEach(pkg => {
  const packageJsonPath = path.join(packagesDir, pkg, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;
    
    // Fix dependencies
    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach(dep => {
        if (packageJson.dependencies[dep] === 'workspace:*' && workspaceMap[dep]) {
          packageJson.dependencies[dep] = `file:${workspaceMap[dep]}`;
          modified = true;
          console.log(`Fixed ${dep} in ${pkg}/package.json`);
        }
      });
    }
    
    // Fix devDependencies
    if (packageJson.devDependencies) {
      Object.keys(packageJson.devDependencies).forEach(dep => {
        if (packageJson.devDependencies[dep] === 'workspace:*' && workspaceMap[dep]) {
          packageJson.devDependencies[dep] = `file:${workspaceMap[dep]}`;
          modified = true;
          console.log(`Fixed ${dep} in ${pkg}/package.json (dev)`);
        }
      });
    }
    
    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    }
  }
});

console.log('Done fixing workspace references!');