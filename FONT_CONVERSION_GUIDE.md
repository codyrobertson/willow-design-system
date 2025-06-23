# Font Conversion Guide for Willow Design System

## Why Convert Fonts?

The browser errors you're seeing ("downloadable font: rejected by sanitizer") occur because:
1. Some browsers have strict security policies for OTF fonts
2. WOFF/WOFF2 formats are optimized for web use
3. Better compression = faster loading

## Quick Conversion Options

### Option 1: Online Converters (Easiest)
1. **CloudConvert**: https://cloudconvert.com/otf-to-woff2
2. **Convertio**: https://convertio.co/otf-woff2/
3. **Font Squirrel**: https://www.fontsquirrel.com/tools/webfont-generator

Upload these files:
- `public/cdn/fonts/Codec-Pro-Regular.otf`
- `public/cdn/fonts/Codec-Pro-Bold.otf`
- `public/cdn/fonts/Codec-Pro-Light.otf`
- `public/cdn/fonts/Codec-Pro-Italic.otf`
- `public/cdn/fonts/Codec-Pro-Bold-Italic.otf`
- `public/cdn/fonts/Codec-Pro-Extrabold.otf`

Download both WOFF and WOFF2 versions.

### Option 2: Command Line Tools

#### macOS:
```bash
# Install tools
brew install woff2

# Convert fonts
cd public/cdn/fonts
for font in *.otf; do
  woff2_compress "$font"
done
```

#### Ubuntu/Linux:
```bash
# Install tools
sudo apt-get install woff2

# Convert fonts
cd public/cdn/fonts
for font in *.otf; do
  woff2_compress "$font"
done
```

### Option 3: Node.js (Cross-platform)
```bash
# Install globally
npm install -g ttf2woff2

# Convert (might need TTF intermediate)
cd public/cdn/fonts
for font in *.otf; do
  ttf2woff2 "$font"
done
```

## After Conversion

1. Place the `.woff` and `.woff2` files in `public/cdn/fonts/`
2. The CSS is already configured to use them (see `codec-pro.css`)
3. Test in browser - fonts should load without errors

## Current Setup

The CSS files are already configured to look for multiple formats:
```css
src: url('./Codec-Pro-Regular.woff2') format('woff2'),  /* Try this first */
     url('./Codec-Pro-Regular.woff') format('woff'),    /* Then this */
     url('./Codec-Pro-Regular.otf') format('opentype'); /* Fallback */
```

## Temporary Solution

While you convert the fonts, the system will:
1. Try to load the web formats first (WOFF2/WOFF)
2. Fall back to OTF if needed
3. Use system fonts if all fail

## Testing

After adding the converted fonts:
```bash
# Deploy to Netlify
netlify deploy --prod

# Test font loading
curl -I https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Regular.woff2
```

The font loading errors should disappear once the WOFF/WOFF2 files are in place!