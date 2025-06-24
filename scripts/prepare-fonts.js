const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a fonts directory in public for CDN serving
const publicFontsDir = path.join(process.cwd(), 'public', 'cdn', 'fonts');

// Ensure directory exists
if (!fs.existsSync(publicFontsDir)) {
  fs.mkdirSync(publicFontsDir, { recursive: true });
}

// Copy only the necessary Codec Pro fonts for web use
const codecFonts = [
  'Codec-Pro-Regular.otf',
  'Codec-Pro-Bold.otf',
  'Codec-Pro-Light.otf',
  'Codec-Pro-Extrabold.otf',
  'Codec-Pro-Italic.otf',
  'Codec-Pro-Bold-Italic.otf'
];

const sourceFontsDir = path.join(process.cwd(), 'public', 'fonts');

codecFonts.forEach(font => {
  const sourcePath = path.join(sourceFontsDir, font);
  const destPath = path.join(publicFontsDir, font);
  
  if (fs.existsSync(sourcePath)) {
    // Copy original OTF - fonts will be served directly by Netlify from the repository
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${font}`);
  } else {
    console.warn(`⚠ Font not found: ${font}`);
  }
});

// Create a CSS file for @font-face declarations with optimized loading
const fontCSS = `/* Willow Design System - Codec Pro Font */
/* Optimized for performance and browser compatibility */

@font-face {
  font-family: 'Codec Pro';
  src: url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Italic.otf') format('opentype');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Light.otf') format('opentype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Bold-Italic.otf') format('opentype');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Extrabold.otf') format('opentype');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Preload hint for performance */
/* Add this to your HTML head for faster loading:
<link rel="preload" href="https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Regular.otf" as="font" type="font/otf" crossorigin>
<link rel="preload" href="https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Bold.otf" as="font" type="font/otf" crossorigin>
*/

/* Alternative import method for users */
/* @import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css'); */
`;

// Write the CSS file
fs.writeFileSync(path.join(publicFontsDir, 'codec-pro.css'), fontCSS);
console.log('✓ Created codec-pro.css');

// Create a sample HTML snippet for documentation
const fontUsageHTML = `<!-- Willow Design System - Font Usage -->
<!-- Option 1: Link in HTML head -->
<link rel="stylesheet" href="https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css">

<!-- Option 2: Import in CSS -->
<style>
  @import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');
  
  body {
    font-family: 'Codec Pro', system-ui, -apple-system, sans-serif;
  }
</style>

<!-- Option 3: Self-host the fonts -->
<!-- Download from: https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/ -->
`;

fs.writeFileSync(path.join(publicFontsDir, 'usage.html'), fontUsageHTML);
console.log('✓ Created usage documentation');

console.log('\n✅ Font preparation complete!');
console.log('Fonts will be available at: https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/');