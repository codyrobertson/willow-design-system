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

// Step 3: Verify Storybook static files exist
console.log('\n📚 Checking Storybook static files...');
const storybookPath = path.join(process.cwd(), 'public', 'storybook');
if (fs.existsSync(storybookPath)) {
  console.log('✓ Storybook static files found in public/storybook');
} else {
  console.log('⚠️  Storybook static files not found. Run: npm run build:storybook-local');
  console.log('   This will build Storybook and copy it to public/storybook for deployment.');
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