#\!/usr/bin/env node

/**
 * Convert OTF fonts to WOFF2 and WOFF for better web compatibility
 * This script uses Python's fonttools to convert fonts
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const FONTS_DIR = './public/cdn/fonts';
const fontFiles = [
  'Codec-Pro-Regular.otf',
  'Codec-Pro-Bold.otf',
  'Codec-Pro-Light.otf',
  'Codec-Pro-Extrabold.otf',
  'Codec-Pro-Italic.otf',
  'Codec-Pro-Bold-Italic.otf'
];

console.log('🔄 Converting OTF fonts to web formats...');

// Check if fonttools is available
try {
  execSync('python3 -c "import fonttools"', { stdio: 'ignore' });
  console.log('✓ fonttools found');
} catch (error) {
  console.log('Installing fonttools...');
  try {
    execSync('pip3 install fonttools[woff]', { stdio: 'inherit' });
    console.log('✓ fonttools installed');
  } catch (installError) {
    console.error('❌ Failed to install fonttools. Please install manually:');
    console.error('pip3 install fonttools[woff]');
    process.exit(1);
  }
}

// Convert each font file
for (const fontFile of fontFiles) {
  const otfPath = join(FONTS_DIR, fontFile);
  
  if (\!existsSync(otfPath)) {
    console.log(`⚠️  Font file not found: ${fontFile}`);
    continue;
  }

  const baseName = fontFile.replace('.otf', '');
  const woff2Path = join(FONTS_DIR, `${baseName}.woff2`);
  const woffPath = join(FONTS_DIR, `${baseName}.woff`);

  try {
    // Convert to WOFF2 (best compression)
    if (\!existsSync(woff2Path)) {
      console.log(`Converting ${fontFile} to WOFF2...`);
      execSync(`python3 -m fonttools.ttLib.woff2 compress "${otfPath}"`, { stdio: 'inherit' });
      console.log(`✓ Created ${baseName}.woff2`);
    } else {
      console.log(`✓ ${baseName}.woff2 already exists`);
    }

    // Convert to WOFF (fallback)
    if (\!existsSync(woffPath)) {
      console.log(`Converting ${fontFile} to WOFF...`);
      execSync(`python3 -c "
from fonttools.ttLib import TTFont
from fonttools.ttLib.tables._g_l_y_f import Glyph
import sys

# Load the OTF font
font = TTFont('${otfPath}')

# Save as WOFF
font.flavor = 'woff'
font.save('${woffPath}')
print('WOFF conversion complete')
"`, { stdio: 'inherit' });
      console.log(`✓ Created ${baseName}.woff`);
    } else {
      console.log(`✓ ${baseName}.woff already exists`);
    }

  } catch (error) {
    console.error(`❌ Failed to convert ${fontFile}:`, error.message);
  }
}

console.log('\n✅ Font conversion complete\!');
console.log('📁 Web fonts available in:', FONTS_DIR);
EOF < /dev/null