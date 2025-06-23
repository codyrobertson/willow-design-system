#!/bin/bash

# Willow Design System - Automated Font Conversion Script
# This script handles the complete font conversion process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FONTS_DIR="$PROJECT_ROOT/public/cdn/fonts"

echo -e "${BLUE}🎨 Willow Design System - Font Converter${NC}"
echo "========================================"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies on macOS
install_mac_deps() {
    echo -e "${YELLOW}📦 Installing dependencies for macOS...${NC}"
    
    # Check if Homebrew is installed
    if ! command_exists brew; then
        echo -e "${RED}❌ Homebrew is not installed!${NC}"
        echo "Please install Homebrew first: https://brew.sh"
        exit 1
    fi
    
    # Install woff2
    if ! command_exists woff2_compress; then
        echo "Installing woff2..."
        brew install woff2
    fi
    
    # Install ttf2woff for WOFF conversion
    if ! command_exists ttf2woff; then
        echo "Installing ttf2woff..."
        brew install ttf2woff || echo "ttf2woff not available via brew, skipping WOFF conversion"
    fi
    
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
}

# Function to install dependencies on Linux
install_linux_deps() {
    echo -e "${YELLOW}📦 Installing dependencies for Linux...${NC}"
    
    # Detect package manager
    if command_exists apt-get; then
        echo "Using apt-get..."
        sudo apt-get update
        sudo apt-get install -y woff2 woff-tools
    elif command_exists yum; then
        echo "Using yum..."
        sudo yum install -y woff2-tools
    else
        echo -e "${RED}❌ No supported package manager found!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
}

# Check/Install dependencies based on OS
echo -e "${BLUE}🔍 Checking system...${NC}"
OS_TYPE="$(uname -s)"

case "$OS_TYPE" in
    Darwin*)
        echo "Detected macOS"
        if ! command_exists woff2_compress; then
            install_mac_deps
        else
            echo -e "${GREEN}✅ woff2_compress already installed${NC}"
        fi
        ;;
    Linux*)
        echo "Detected Linux"
        if ! command_exists woff2_compress; then
            install_linux_deps
        else
            echo -e "${GREEN}✅ woff2_compress already installed${NC}"
        fi
        ;;
    *)
        echo -e "${RED}❌ Unsupported OS: $OS_TYPE${NC}"
        echo "Please manually install woff2 tools"
        exit 1
        ;;
esac

# Navigate to fonts directory
echo ""
echo -e "${BLUE}📁 Navigating to fonts directory...${NC}"
if [ ! -d "$FONTS_DIR" ]; then
    echo -e "${RED}❌ Fonts directory not found: $FONTS_DIR${NC}"
    exit 1
fi

cd "$FONTS_DIR"
echo "Working in: $(pwd)"

# List existing fonts
echo ""
echo -e "${BLUE}📋 Found OTF fonts:${NC}"
ls -1 *.otf 2>/dev/null || echo "No OTF files found!"

# Convert fonts
echo ""
echo -e "${BLUE}🔄 Converting fonts...${NC}"
echo ""

CONVERTED_COUNT=0
FAILED_COUNT=0

for font in *.otf; do
    if [ -f "$font" ]; then
        echo -ne "Converting $font... "
        
        # Convert to WOFF2
        if woff2_compress "$font" 2>/dev/null; then
            echo -e "${GREEN}✅ WOFF2${NC}"
            ((CONVERTED_COUNT++))
            
            # Try to convert to WOFF if ttf2woff is available
            if command_exists ttf2woff; then
                # ttf2woff needs TTF input, so we skip for now
                # In a real scenario, you'd convert OTF to TTF first
                echo "   (WOFF conversion requires TTF format)"
            fi
        else
            echo -e "${RED}❌ Failed${NC}"
            ((FAILED_COUNT++))
        fi
    fi
done

# Summary
echo ""
echo -e "${BLUE}📊 Conversion Summary:${NC}"
echo "================================"
echo -e "✅ Successfully converted: ${GREEN}$CONVERTED_COUNT${NC}"
echo -e "❌ Failed conversions: ${RED}$FAILED_COUNT${NC}"
echo ""
echo -e "${BLUE}📁 Font files in directory:${NC}"
ls -lh *.otf *.woff2 *.woff 2>/dev/null | awk '{print $9, "(" $5 ")"}' | grep -E '\.(otf|woff2?)'

# Git commands
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo ""
echo "1. Add the converted fonts to git:"
echo -e "   ${BLUE}git add $FONTS_DIR/*.woff2${NC}"
echo ""
echo "2. Commit the changes:"
echo -e "   ${BLUE}git commit -m \"Add WOFF2 web fonts for better browser compatibility\"${NC}"
echo ""
echo "3. Push to repository:"
echo -e "   ${BLUE}git push${NC}"
echo ""
echo "4. Deploy to Netlify:"
echo -e "   ${BLUE}netlify deploy --prod${NC}"
echo ""

# Optional: Auto-commit
echo -e "${YELLOW}💡 Auto-commit changes? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT"
    git add public/cdn/fonts/*.woff2 2>/dev/null || true
    git add public/cdn/fonts/*.woff 2>/dev/null || true
    git commit -m "Add WOFF2 web fonts for better browser compatibility" || echo "Nothing to commit"
    echo -e "${GREEN}✅ Changes committed!${NC}"
    echo ""
    echo -e "${YELLOW}Push to remote? (y/n)${NC}"
    read -r push_response
    if [[ "$push_response" =~ ^[Yy]$ ]]; then
        git push
        echo -e "${GREEN}✅ Pushed to remote!${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Font conversion complete!${NC}"

# Test fonts locally
echo ""
echo -e "${YELLOW}🧪 Test fonts locally? (y/n)${NC}"
read -r test_response
if [[ "$test_response" =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT"
    echo "Starting development server..."
    echo "Check for font loading errors in the browser console"
    npm run dev
fi