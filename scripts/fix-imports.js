#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in src/components
const files = glob.sync('src/components/**/*.{ts,tsx}', {
  ignore: ['**/*.stories.tsx', '**/*.test.tsx', '**/*.spec.tsx']
});

console.log(`Found ${files.length} files to process`);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  
  // Replace @/lib/utils imports
  let updatedContent = content.replace(
    /from ['"]@\/lib\/utils['"]/g,
    (match) => {
      // Calculate relative path from current file to lib/utils
      const relativePath = path.relative(dir, 'src/lib/utils');
      const normalizedPath = relativePath.replace(/\\/g, '/');
      
      // If we're already in src/lib, just use ./utils
      if (normalizedPath === 'utils') {
        return `from './utils'`;
      }
      
      // Otherwise use the relative path
      return `from '${normalizedPath.startsWith('../') ? normalizedPath : './' + normalizedPath}'`;
    }
  );
  
  // Replace @/lib/tokens imports
  updatedContent = updatedContent.replace(
    /from ['"]@\/lib\/tokens['"]/g,
    (match) => {
      const relativePath = path.relative(dir, 'src/lib/tokens');
      const normalizedPath = relativePath.replace(/\\/g, '/');
      
      if (normalizedPath === 'tokens') {
        return `from './tokens'`;
      }
      
      return `from '${normalizedPath.startsWith('../') ? normalizedPath : './' + normalizedPath}'`;
    }
  );
  
  // Replace @/lib/theme-colors imports
  updatedContent = updatedContent.replace(
    /from ['"]@\/lib\/theme-colors['"]/g,
    (match) => {
      const relativePath = path.relative(dir, 'src/lib/theme-colors');
      const normalizedPath = relativePath.replace(/\\/g, '/');
      
      if (normalizedPath === 'theme-colors') {
        return `from './theme-colors'`;
      }
      
      return `from '${normalizedPath.startsWith('../') ? normalizedPath : './' + normalizedPath}'`;
    }
  );
  
  // Replace @/components imports
  updatedContent = updatedContent.replace(
    /from ['"]@\/components\/(.*)['"]/g,
    (match, componentPath) => {
      const targetPath = path.join('src/components', componentPath);
      const relativePath = path.relative(dir, targetPath);
      const normalizedPath = relativePath.replace(/\\/g, '/');
      
      // If it's the same directory, use ./
      if (normalizedPath === path.basename(componentPath)) {
        return `from './${normalizedPath}'`;
      }
      
      return `from '${normalizedPath.startsWith('../') ? normalizedPath : './' + normalizedPath}'`;
    }
  );
  
  if (content !== updatedContent) {
    fs.writeFileSync(file, updatedContent);
    console.log(`✅ Updated: ${file}`);
  }
});

console.log('\nImport paths fixed! Now update tailwind.config.ts and lib files...');