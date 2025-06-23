#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const storybookStaticPath = path.join(process.cwd(), 'storybook-static');
const publicStorybookPath = path.join(process.cwd(), 'public', 'storybook');

async function copyStorybook() {
  try {
    // Check if storybook-static exists
    if (!fs.existsSync(storybookStaticPath)) {
      console.log('⚠️  storybook-static directory not found. Run: npm run build-storybook first');
      process.exit(1);
    }

    // Remove existing public/storybook if it exists
    if (fs.existsSync(publicStorybookPath)) {
      await fs.remove(publicStorybookPath);
      console.log('🗑️  Removed existing public/storybook');
    }

    // Copy storybook-static to public/storybook
    await fs.copy(storybookStaticPath, publicStorybookPath);
    console.log('✅ Copied Storybook to public/storybook');

    // Update any hardcoded URLs in the Storybook files to work with the new path
    const indexPath = path.join(publicStorybookPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      let indexContent = await fs.readFile(indexPath, 'utf8');
      // Update base path for assets if needed
      indexContent = indexContent.replace(/src="\.\//g, 'src="./storybook/');
      indexContent = indexContent.replace(/href="\.\//g, 'href="./storybook/');
      await fs.writeFile(indexPath, indexContent);
      console.log('🔧 Updated Storybook index.html paths');
    }

    console.log('📚 Storybook is now available at /storybook on your site');
  } catch (error) {
    console.error('❌ Error copying Storybook:', error);
    process.exit(1);
  }
}

copyStorybook();