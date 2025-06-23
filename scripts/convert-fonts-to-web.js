#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const FONTS_DIR = path.join(__dirname, '../public/cdn/fonts');
const FONTS_TO_CONVERT = [
  'Codec-Pro-Regular.otf',
  'Codec-Pro-Bold.otf',
  'Codec-Pro-Light.otf',
  'Codec-Pro-Italic.otf',
  'Codec-Pro-Bold-Italic.otf',
  'Codec-Pro-Extrabold.otf'
];

console.log('🔄 Converting OTF fonts to web formats...\n');

// Check if conversion tools are installed
function checkTools() {
  const tools = {
    woff2: 'woff2_compress',
    ttf2woff: 'ttf2woff'
  };
  
  const missing = [];
  
  for (const [name, command] of Object.entries(tools)) {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
    } catch {
      missing.push({ name, command });
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required tools:\n');
    missing.forEach(({ name, command }) => {
      console.error(`   - ${name}: ${command}`);
    });
    console.error('\nInstall them with:');
    console.error('   macOS: brew install woff2');
    console.error('   Ubuntu: sudo apt-get install woff2 ttf2woff\n');
    
    console.log('\n📦 Alternatively, you can use npm packages:');
    console.log('   npm install -g ttf2woff2 ttf2woff\n');
    return false;
  }
  
  return true;
}

// Convert single font file
async function convertFont(fontFile) {
  const fontPath = path.join(FONTS_DIR, fontFile);
  const fontName = path.basename(fontFile, '.otf');
  
  if (!fs.existsSync(fontPath)) {
    console.warn(`⚠️  Font not found: ${fontFile}`);
    return;
  }
  
  console.log(`📝 Converting ${fontFile}...`);
  
  try {
    // First convert OTF to TTF (required for some converters)
    const ttfPath = path.join(FONTS_DIR, `${fontName}.ttf`);
    
    // Try using fontforge if available
    try {
      execSync(`fontforge -lang=ff -c "Open('${fontPath}'); Generate('${ttfPath}')"`, { stdio: 'ignore' });
    } catch {
      console.log(`   ⚠️  Skipping TTF conversion (fontforge not available)`);
    }
    
    // Convert to WOFF2
    const woff2Path = path.join(FONTS_DIR, `${fontName}.woff2`);
    try {
      if (fs.existsSync(ttfPath)) {
        execSync(`woff2_compress "${ttfPath}" "${woff2Path}"`, { stdio: 'ignore' });
      } else {
        // Try direct OTF to WOFF2
        execSync(`woff2_compress "${fontPath}" "${woff2Path}"`, { stdio: 'ignore' });
      }
      console.log(`   ✅ Created ${fontName}.woff2`);
    } catch (err) {
      console.error(`   ❌ Failed to create WOFF2: ${err.message}`);
    }
    
    // Convert to WOFF
    const woffPath = path.join(FONTS_DIR, `${fontName}.woff`);
    try {
      if (fs.existsSync(ttfPath)) {
        execSync(`ttf2woff "${ttfPath}" "${woffPath}"`, { stdio: 'ignore' });
      }
      console.log(`   ✅ Created ${fontName}.woff`);
    } catch (err) {
      console.error(`   ❌ Failed to create WOFF: ${err.message}`);
    }
    
    // Clean up TTF if it was created
    if (fs.existsSync(ttfPath)) {
      fs.unlinkSync(ttfPath);
    }
    
  } catch (error) {
    console.error(`   ❌ Error converting ${fontFile}: ${error.message}`);
  }
}

// Alternative: Use npm packages for conversion
async function convertWithNpmPackages() {
  console.log('\n🔧 Using npm packages for conversion...\n');
  
  // Install packages locally if not present
  try {
    require.resolve('ttf2woff2');
    require.resolve('ttf2woff');
  } catch {
    console.log('📦 Installing conversion packages...');
    execSync('npm install --no-save ttf2woff2 ttf2woff otf2ttf', { stdio: 'inherit' });
  }
  
  const ttf2woff2 = require('ttf2woff2');
  const ttf2woff = require('ttf2woff');
  
  for (const fontFile of FONTS_TO_CONVERT) {
    const fontPath = path.join(FONTS_DIR, fontFile);
    const fontName = path.basename(fontFile, '.otf');
    
    if (!fs.existsSync(fontPath)) {
      console.warn(`⚠️  Font not found: ${fontFile}`);
      continue;
    }
    
    console.log(`📝 Converting ${fontFile}...`);
    
    try {
      const otfBuffer = fs.readFileSync(fontPath);
      
      // For OTF to TTF conversion, we'll skip this step and work with OTF directly
      // Most modern browsers support OTF anyway
      
      // Convert to WOFF2
      try {
        const woff2Buffer = ttf2woff2(otfBuffer);
        const woff2Path = path.join(FONTS_DIR, `${fontName}.woff2`);
        fs.writeFileSync(woff2Path, woff2Buffer);
        console.log(`   ✅ Created ${fontName}.woff2`);
      } catch (err) {
        console.log(`   ⚠️  WOFF2 conversion failed, keeping OTF`);
      }
      
      // Convert to WOFF
      try {
        const woffBuffer = ttf2woff(otfBuffer);
        const woffPath = path.join(FONTS_DIR, `${fontName}.woff`);
        fs.writeFileSync(woffPath, woffBuffer);
        console.log(`   ✅ Created ${fontName}.woff`);
      } catch (err) {
        console.log(`   ⚠️  WOFF conversion failed, keeping OTF`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  // Check if system tools are available
  const hasTools = checkTools();
  
  if (hasTools) {
    // Use system tools
    for (const font of FONTS_TO_CONVERT) {
      await convertFont(font);
    }
  } else {
    // Use npm packages as fallback
    await convertWithNpmPackages();
  }
  
  console.log('\n✨ Font conversion complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Update codec-pro.css to use the new formats');
  console.log('   2. Test font loading in browsers');
  console.log('   3. Commit and deploy the new font files\n');
}

// Run the conversion
main().catch(console.error);