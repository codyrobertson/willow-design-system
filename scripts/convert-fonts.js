#!/usr/bin/env node

/**
 * Font Conversion Script
 * 
 * This script would convert OTF fonts to WOFF2 format for better web compatibility.
 * Note: This requires font conversion tools to be installed.
 * 
 * For now, we'll document the process for manual conversion:
 * 
 * 1. Install woff2 tools:
 *    brew install woff2 (macOS)
 *    apt-get install woff2 (Ubuntu/Debian)
 * 
 * 2. Convert each font:
 *    woff2_compress Codec-Pro-Regular.otf
 *    woff2_compress Codec-Pro-Bold.otf
 *    woff2_compress Codec-Pro-Light.otf
 * 
 * 3. Update font face declarations to use WOFF2 with OTF fallback:
 *    src: url('font.woff2') format('woff2'),
 *         url('font.otf') format('opentype');
 */

console.log(`
Font Conversion Instructions:

1. OTF fonts may have issues with some browsers' sanitizers.
2. Consider converting to WOFF2 format for better compatibility.
3. Use the commands above to convert fonts manually.
4. Update CSS to serve WOFF2 with OTF fallback.

Alternative: Use a CDN service that automatically converts fonts:
- Google Fonts
- Adobe Fonts
- fonts.com
`);