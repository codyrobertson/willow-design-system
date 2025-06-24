/**
 * Enhanced Font Loader for Willow Design System
 * Handles multiple formats and provides fallbacks
 */

(function() {
  'use strict';
  
  // Configuration
  const FONT_FAMILY = 'Codec Pro';
  const FONT_TIMEOUT = 3000; // 3 seconds
  const BASE_URL = 'https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/';
  
  // Font configurations with multiple formats
  const fontConfigs = [
    {
      weight: 400,
      style: 'normal',
      files: ['Codec-Pro-Regular.woff2', 'Codec-Pro-Regular.woff', 'Codec-Pro-Regular.otf']
    },
    {
      weight: 700,
      style: 'normal',
      files: ['Codec-Pro-Bold.woff2', 'Codec-Pro-Bold.woff', 'Codec-Pro-Bold.otf']
    },
    {
      weight: 300,
      style: 'normal',
      files: ['Codec-Pro-Light.woff2', 'Codec-Pro-Light.woff', 'Codec-Pro-Light.otf']
    }
  ];
  
  // Check if Font Loading API is supported
  const supportsFontLoading = 'fonts' in document;
  
  // Function to get font format from filename
  function getFontFormat(filename) {
    if (filename.endsWith('.woff2')) return 'woff2';
    if (filename.endsWith('.woff')) return 'woff';
    if (filename.endsWith('.otf')) return 'opentype';
    if (filename.endsWith('.ttf')) return 'truetype';
    return 'opentype';
  }
  
  // Function to load a font with fallback formats
  async function loadFontWithFallback(config) {
    if (!supportsFontLoading) {
      // For older browsers, just add @font-face rules
      return addFontFaceRule(config);
    }
    
    // Try each format in order
    for (const file of config.files) {
      try {
        const fontUrl = BASE_URL + file;
        const format = getFontFormat(file);
        
        const fontFace = new FontFace(FONT_FAMILY, `url(${fontUrl}) format('${format}')`, {
          weight: config.weight,
          style: config.style,
          display: 'swap'
        });
        
        const loadedFont = await fontFace.load();
        document.fonts.add(loadedFont);
        
        console.log(`✅ Loaded ${FONT_FAMILY} ${config.weight} from ${file}`);
        return true;
      } catch (err) {
        console.warn(`Failed to load ${file}:`, err.message);
        // Continue to next format
      }
    }
    
    console.error(`❌ Failed to load ${FONT_FAMILY} ${config.weight} in any format`);
    return false;
  }
  
  // Fallback: Add @font-face rule directly
  function addFontFaceRule(config) {
    const style = document.createElement('style');
    const sources = config.files.map(file => {
      const format = getFontFormat(file);
      return `url(${BASE_URL}${file}) format('${format}')`;
    }).join(',\n       ');
    
    style.textContent = `
      @font-face {
        font-family: '${FONT_FAMILY}';
        src: ${sources};
        font-weight: ${config.weight};
        font-style: ${config.style};
        font-display: swap;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Main loading function
  async function loadFonts() {
    const loadPromises = fontConfigs.map(config => loadFontWithFallback(config));
    
    try {
      const results = await Promise.all(loadPromises);
      const successCount = results.filter(r => r === true).length;
      
      if (successCount > 0) {
        document.documentElement.classList.add('fonts-loaded');
        console.log(`✅ Willow fonts loaded: ${successCount}/${fontConfigs.length}`);
      } else {
        document.documentElement.classList.add('fonts-failed');
        console.warn('⚠️ Willow fonts failed to load, using system fonts');
      }
    } catch (err) {
      console.error('Font loading error:', err);
      document.documentElement.classList.add('fonts-failed');
    }
  }
  
  // Start loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFonts);
  } else {
    loadFonts();
  }
  
  // Also set a timeout to mark fonts as failed if they don't load
  setTimeout(() => {
    if (!document.documentElement.classList.contains('fonts-loaded')) {
      document.documentElement.classList.add('fonts-failed');
      console.warn('⚠️ Font loading timeout, using fallbacks');
    }
  }, FONT_TIMEOUT);
})();