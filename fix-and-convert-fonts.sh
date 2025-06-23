#!/bin/bash

# Fix and convert fonts script

echo "🔧 Fixing font files and converting to WOFF2..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Directories
FONTS_SOURCE="public/fonts"
FONTS_DEST="public/cdn/fonts"

# Fonts we need for the web
FONTS_TO_COPY=(
    "Codec-Pro-Regular.otf"
    "Codec-Pro-Bold.otf"
    "Codec-Pro-Light.otf"
    "Codec-Pro-Italic.otf"
    "Codec-Pro-Bold-Italic.otf"
    "Codec-Pro-Extrabold.otf"
)

echo -e "${YELLOW}📁 Step 1: Copying real font files...${NC}"
for font in "${FONTS_TO_COPY[@]}"; do
    if [ -f "$FONTS_SOURCE/$font" ]; then
        echo "  Copying $font..."
        cp "$FONTS_SOURCE/$font" "$FONTS_DEST/$font"
    else
        echo "  ⚠️  $font not found in $FONTS_SOURCE"
    fi
done

echo ""
echo -e "${YELLOW}📊 Checking file sizes:${NC}"
ls -lh "$FONTS_DEST"/*.otf | grep -E "Codec-Pro-(Regular|Bold|Light|Italic|Bold-Italic|Extrabold).otf"

echo ""
echo -e "${YELLOW}🔄 Step 2: Converting to WOFF2...${NC}"
cd "$FONTS_DEST"

if command -v woff2_compress &> /dev/null; then
    for font in "${FONTS_TO_COPY[@]}"; do
        if [ -f "$font" ]; then
            echo "  Converting $font..."
            woff2_compress "$font"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Conversion complete!${NC}"
    echo ""
    echo "WOFF2 files created:"
    ls -lh *.woff2 2>/dev/null
else
    echo "❌ woff2_compress not found. Install with: brew install woff2"
fi

echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. git add public/cdn/fonts/*.otf public/cdn/fonts/*.woff2"
echo "2. git commit -m \"Add real font files and WOFF2 conversions\""
echo "3. git push"
echo "4. netlify deploy --prod"