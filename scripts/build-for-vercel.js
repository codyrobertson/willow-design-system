#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Willow Design System for Vercel deployment...\n');

// Step 1: Prepare fonts
console.log('📁 Preparing fonts for CDN...');
try {
  execSync('npm run prepare-fonts', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to prepare fonts:', error);
  process.exit(1);
}

// Step 2: Build the registry (only in production)
if (process.env.SKIP_REGISTRY_BUILD !== 'true') {
  console.log('\n📦 Building component registry...');
  try {
    execSync('npm run build-registry', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to build registry:', error);
    process.exit(1);
  }
} else {
  console.log('\n⏭️  Skipping registry build (SKIP_REGISTRY_BUILD=true)');
}

// Step 3: Build Storybook
console.log('\n📚 Building Storybook...');
try {
  execSync('npm run build-storybook', { stdio: 'inherit' });
  
  // Move storybook-static to public/storybook for serving
  const storybookSource = path.join(process.cwd(), 'storybook-static');
  const storybookDest = path.join(process.cwd(), 'public', 'storybook');
  
  if (fs.existsSync(storybookDest)) {
    fs.rmSync(storybookDest, { recursive: true });
  }
  
  if (fs.existsSync(storybookSource)) {
    fs.renameSync(storybookSource, storybookDest);
    console.log('✓ Moved Storybook build to public/storybook');
  }
} catch (error) {
  console.error('Failed to build Storybook:', error);
  process.exit(1);
}

// Step 4: Build Next.js site
console.log('\n🏗️  Building Next.js documentation site...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to build Next.js:', error);
  process.exit(1);
}

// Step 5: Create deployment info file
const deploymentInfo = {
  version: require('../package.json').version,
  buildDate: new Date().toISOString(),
  registry: 'https://willow-design-system.vercel.app/registry',
  storybook: 'https://willow-design-system.vercel.app/storybook',
  fonts: 'https://willow-design-system.vercel.app/cdn/fonts/codec-pro.css',
  npm: 'npm install willow-design-system'
};

fs.writeFileSync(
  path.join(process.cwd(), 'public', 'deployment-info.json'),
  JSON.stringify(deploymentInfo, null, 2)
);

console.log('\n✅ Build complete! Ready for Vercel deployment.');
console.log('\nDeployment URLs:');
console.log(`  📖 Documentation: https://willow-design-system.vercel.app`);
console.log(`  📚 Storybook: https://willow-design-system.vercel.app/storybook`);
console.log(`  📦 Registry: https://willow-design-system.vercel.app/registry`);
console.log(`  🔤 Fonts CDN: https://willow-design-system.vercel.app/cdn/fonts/`);
console.log('\nTo deploy: npm run deploy');