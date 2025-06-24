#!/bin/bash

# Willow Design System Component Installer
# Usage: ./install.sh <component-name>

set -e

COMPONENT=$1
REGISTRY_URL="https://willow-prod.vercel.app/api"
COMPONENTS_DIR="components/ui"

if [ -z "$COMPONENT" ]; then
    echo "❌ Error: Component name is required"
    echo "Usage: $0 <component-name>"
    echo "Example: $0 button"
    exit 1
fi

echo "🔄 Installing component: $COMPONENT"

# Create components directory if it doesn't exist
mkdir -p "$COMPONENTS_DIR"

# Fetch component data
echo "📡 Fetching component from registry..."
COMPONENT_DATA=$(curl -s "$REGISTRY_URL/registry/ui/$COMPONENT")

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to fetch component data"
    exit 1
fi

# Check if component exists
if echo "$COMPONENT_DATA" | grep -q "error"; then
    echo "❌ Error: Component '$COMPONENT' not found in registry"
    exit 1
fi

# Extract component code using jq
echo "📝 Extracting component code..."
COMPONENT_CODE=$(echo "$COMPONENT_DATA" | jq -r '.files[0].content')

if [ "$COMPONENT_CODE" = "null" ]; then
    echo "❌ Error: Failed to extract component code"
    exit 1
fi

# Save component to file
COMPONENT_FILE="$COMPONENTS_DIR/$COMPONENT.tsx"
echo "$COMPONENT_CODE" > "$COMPONENT_FILE"

echo "✅ Component saved to: $COMPONENT_FILE"

# Extract and display dependencies
echo "📦 Dependencies required:"
DEPENDENCIES=$(echo "$COMPONENT_DATA" | jq -r '.dependencies[]' | tr '\n' ' ')
echo "$DEPENDENCIES"

echo ""
echo "🚀 Installation complete!"
echo "💡 To install dependencies, run:"
echo "   npm install $DEPENDENCIES"
echo ""
echo "📖 To use the component, import it:"
echo "   import { $(echo $COMPONENT | sed 's/.*/\u&/') } from '@/components/ui/$COMPONENT'"