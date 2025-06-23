#!/bin/bash

# Quick font conversion script - no frills version

cd "$(dirname "$0")/public/cdn/fonts" || exit 1

echo "🔄 Converting OTF fonts to WOFF2..."
echo ""

# Check if woff2_compress exists
if ! command -v woff2_compress &> /dev/null; then
    echo "❌ woff2_compress not found!"
    echo ""
    echo "Install with:"
    echo "  macOS:  brew install woff2"
    echo "  Linux:  sudo apt-get install woff2"
    exit 1
fi

# Convert all OTF files
for font in *.otf; do
    [ -f "$font" ] || continue
    echo "Converting: $font"
    woff2_compress "$font"
done

echo ""
echo "✅ Done! Found:"
ls -1 *.woff2 2>/dev/null | wc -l | xargs echo "  WOFF2 files:"
ls -1 *.otf 2>/dev/null | wc -l | xargs echo "  OTF files:"