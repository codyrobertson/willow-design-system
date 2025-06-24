#!/bin/bash

# Willow Component Installer Script
# This script manually downloads and installs Willow components

WILLOW_REGISTRY="https://iridescent-brigadeiros-fe4174.netlify.app/r"
COMPONENTS=(button badge card input label select textarea accordion tabs modal avatar checkbox chip fancy-button form-card form-field gradient-bg highlight info-card list logo skeleton switch tag toast tooltip)

# Check if we're in a Vite or Next.js project
if [ -f "package.json" ]; then
    if grep -q '"vite"' package.json; then
        COMPONENT_DIR="src/components/ui"
        echo "📦 Vite project detected"
    else
        COMPONENT_DIR="components/ui"
        echo "📦 Next.js/React project detected"
    fi
else
    echo "❌ No package.json found. Please run this in a project directory."
    exit 1
fi

# Create component directory
mkdir -p "$COMPONENT_DIR"

echo "🌳 Installing Willow components to $COMPONENT_DIR..."

# Function to download and extract component
install_component() {
    local component=$1
    echo -n "Installing $component... "
    
    # Download the component JSON
    local json_url="$WILLOW_REGISTRY/$component.json"
    local temp_file="/tmp/willow-$component.json"
    
    if curl -s "$json_url" -o "$temp_file"; then
        # Extract the content from JSON using a simple method
        # This is a basic extraction - in production you'd use jq
        local content=$(cat "$temp_file" | sed -n '/"content":/,/^    }/p' | sed '1d;$d' | sed 's/\\n/\n/g' | sed 's/\\"/"/g' | sed 's/\\\\/\\/g')
        
        # Save to component file
        echo "$content" > "$COMPONENT_DIR/$component.tsx"
        
        echo "✅"
        return 0
    else
        echo "❌"
        return 1
    fi
}

# Install each component
success=0
failed=0

for component in "${COMPONENTS[@]}"; do
    if install_component "$component"; then
        ((success++))
    else
        ((failed++))
    fi
done

echo ""
echo "📊 Installation complete!"
echo "✅ Successfully installed: $success components"
if [ $failed -gt 0 ]; then
    echo "❌ Failed: $failed components"
fi

echo ""
echo "💡 Import components like:"
echo "   import { Button } from '@/components/ui/button'"
echo "   import { Card } from '@/components/ui/card'"]