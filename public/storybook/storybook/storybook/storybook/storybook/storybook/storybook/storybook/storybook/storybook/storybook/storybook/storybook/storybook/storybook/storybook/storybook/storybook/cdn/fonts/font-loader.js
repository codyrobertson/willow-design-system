/**
 * Font Loader with Fallback
 * Attempts to load Codec Pro fonts with error handling
 */

(function() {
  const fontFaces = [
    {
      family: 'Codec Pro',
      src: 'https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Regular.otf',
      weight: 400,
      style: 'normal'
    },
    {
      family: 'Codec Pro',
      src: 'https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Bold.otf',
      weight: 700,
      style: 'normal'
    },
    {
      family: 'Codec Pro',
      src: 'https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Light.otf',
      weight: 300,
      style: 'normal'
    }
  ];

  fontFaces.forEach(font => {
    try {
      const fontFace = new FontFace(font.family, `url(${font.src})`, {
        weight: font.weight,
        style: font.style,
        display: 'swap'
      });

      fontFace.load().then(loadedFont => {
        document.fonts.add(loadedFont);
      }).catch(err => {
        console.warn(`Failed to load ${font.family} (${font.weight})`, err);
      });
    } catch (e) {
      console.warn('FontFace API not supported or font loading failed', e);
    }
  });

  // Add fallback class if fonts fail to load
  setTimeout(() => {
    if (!document.fonts.check('16px Codec Pro')) {
      document.documentElement.classList.add('codec-pro-failed');
    }
  }, 3000);
})();