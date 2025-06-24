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

    // Update paths in both index.html and iframe.html
    const filesToUpdate = ['index.html', 'iframe.html'];
    
    for (const filename of filesToUpdate) {
      const filePath = path.join(publicStorybookPath, filename);
      if (fs.existsSync(filePath)) {
        let content = await fs.readFile(filePath, 'utf8');
        // Update base path for assets - use absolute paths from root
        content = content.replace(/src="\.\//g, 'src="/storybook/');
        content = content.replace(/href="\.\//g, 'href="/storybook/');
        // Also update import paths for ES modules
        content = content.replace(/import '\.\//g, "import '/storybook/");
        // Fix font paths in CSS
        content = content.replace(/url\('\.\//g, "url('/storybook/");
        // Also handle URLs without quotes
        content = content.replace(/url\(\.\//g, "url(/storybook/");
        await fs.writeFile(filePath, content);
        console.log(`🔧 Updated Storybook ${filename} paths`);
      }
    }

    // Update JavaScript files to fix runtime path resolution
    const jsFiles = await fs.readdir(publicStorybookPath);
    const runtimeFiles = jsFiles.filter(file => file.includes('runtime') && file.endsWith('.js'));
    
    for (const filename of runtimeFiles) {
      const filePath = path.join(publicStorybookPath, 'sb-manager', filename);
      if (fs.existsSync(filePath)) {
        try {
          let content = await fs.readFile(filePath, 'utf8');
          // Replace common patterns that might cause runtime issues
          content = content.replace(/['"]\.\/index\.json['"]/g, '"/storybook/index.json"');
          content = content.replace(/['"]\.\/iframe\.html['"]/g, '"/storybook/iframe.html"');
          content = content.replace(/['"]index\.json['"]/g, '"/storybook/index.json"');
          content = content.replace(/['"]iframe\.html['"]/g, '"/storybook/iframe.html"');
          await fs.writeFile(filePath, content);
          console.log(`🔧 Updated runtime file ${filename}`);
        } catch (error) {
          // Skip files that can't be processed
          console.log(`⚠️  Skipped ${filename} (${error.message})`);
        }
      }
    }

    console.log('📚 Storybook is now available at /storybook on your site');
  } catch (error) {
    console.error('❌ Error copying Storybook:', error);
    process.exit(1);
  }
}

copyStorybook();