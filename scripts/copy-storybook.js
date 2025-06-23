#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📚 Copying Storybook static files to public directory...\n');

const storybookSource = path.join(process.cwd(), 'storybook-static');
const storybookDest = path.join(process.cwd(), 'public', 'storybook');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Check if storybook-static exists
  if (!fs.existsSync(storybookSource)) {
    console.error('❌ Error: storybook-static directory not found.');
    console.error('   Please run "npm run build-storybook" first.');
    process.exit(1);
  }
  
  // Remove existing public/storybook if it exists
  if (fs.existsSync(storybookDest)) {
    console.log('🗑️  Removing existing public/storybook...');
    fs.rmSync(storybookDest, { recursive: true });
  }
  
  // Copy storybook-static to public/storybook
  console.log('📂 Copying storybook-static to public/storybook...');
  copyDir(storybookSource, storybookDest);
  
  // Verify the copy was successful
  if (fs.existsSync(storybookDest)) {
    const files = fs.readdirSync(storybookDest);
    console.log(`✅ Success! Copied ${files.length} files/folders to public/storybook`);
    console.log('\n📍 Storybook will be available at: /storybook');
    console.log('🚀 Ready for Vercel deployment!');
  } else {
    throw new Error('Copy operation failed');
  }
  
} catch (error) {
  console.error('❌ Error copying Storybook files:', error.message);
  process.exit(1);
}