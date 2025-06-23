#!/usr/bin/env python3

import os
import subprocess
import sys

FONTS_DIR = os.path.join(os.path.dirname(__file__), '../public/cdn/fonts')
FONTS_TO_CONVERT = [
    'Codec-Pro-Regular.otf',
    'Codec-Pro-Bold.otf',
    'Codec-Pro-Light.otf',
    'Codec-Pro-Italic.otf',
    'Codec-Pro-Bold-Italic.otf',
    'Codec-Pro-Extrabold.otf'
]

print('🔄 Font Conversion Instructions\n')
print('Since font conversion tools may not be installed, here are manual steps:\n')

print('1. Install conversion tools:')
print('   macOS:')
print('   brew install woff2')
print('   ')
print('   Ubuntu/Debian:')
print('   sudo apt-get install woff2')
print('   ')

print('2. Convert fonts manually:')
print('   cd public/cdn/fonts')
print('   ')

for font in FONTS_TO_CONVERT:
    font_name = font.replace('.otf', '')
    print(f'   # Convert {font}')
    print(f'   woff2_compress {font}')
    print('   ')

print('3. Or use online converters:')
print('   - https://cloudconvert.com/otf-to-woff2')
print('   - https://convertio.co/otf-woff2/')
print('   - https://www.fontsquirrel.com/tools/webfont-generator')
print('   ')

print('4. For now, let\'s create a better font loading CSS that handles failures gracefully...\n')