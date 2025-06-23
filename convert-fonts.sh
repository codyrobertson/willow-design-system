#!/bin/bash

# Font conversion script for Willow Design System

echo "🔄 Font Conversion Script for Willow Design System"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -d "public/cdn/fonts" ]; then
    echo "❌ Error: public/cdn/fonts directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if woff2_compress is installed
if ! command -v woff2_compress &> /dev/null; then
    echo "⚠️  woff2_compress is not installed!"
    echo ""
    echo "To install on macOS:"
    echo "  brew install woff2"
    echo ""
    echo "To install on Ubuntu/Debian:"
    echo "  sudo apt-get install woff2"
    echo ""
    echo "Alternatively, use online converters:"
    echo "  - https://cloudconvert.com/otf-to-woff2"
    echo "  - https://convertio.co/otf-woff2/"
    echo ""
    exit 1
fi

echo "✅ woff2_compress found!"
echo ""
echo "Converting fonts in public/cdn/fonts/..."
echo ""

cd public/cdn/fonts

# Convert each OTF file to WOFF2
for font in *.otf; do
    if [ -f "$font" ]; then
        echo "📝 Converting: $font"
        woff2_compress "$font"
        
        if [ $? -eq 0 ]; then
            woff2_file="${font%.otf}.woff2"
            if [ -f "$woff2_file" ]; then
                echo "   ✅ Created: $woff2_file"
            else
                echo "   ❌ Failed to create WOFF2 file"
            fi
        else
            echo "   ❌ Conversion failed"
        fi
        echo ""
    fi
done

# Check results
echo "📊 Conversion Summary:"
echo "---------------------"
echo "OTF files: $(ls -1 *.otf 2>/dev/null | wc -l)"
echo "WOFF2 files: $(ls -1 *.woff2 2>/dev/null | wc -l)"
echo ""

# List all font files
echo "📁 Font files in directory:"
ls -la *.otf *.woff2 *.woff 2>/dev/null | grep -E '\.(otf|woff2?)'

echo ""
echo "✨ Done! Next steps:"
echo "1. Commit the new WOFF2 files"
echo "2. Deploy to Netlify"
echo "3. Test font loading in browser"