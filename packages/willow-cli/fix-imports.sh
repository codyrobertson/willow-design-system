#!/bin/bash

# Fix TypeScript import extensions
echo "Fixing TypeScript import extensions..."

# Find all .ts files (excluding .d.ts files) and fix relative imports
find src -name "*.ts" ! -name "*.d.ts" -type f | while read file; do
    echo "Processing: $file"
    
    # Fix relative imports to add .js extension
    sed -i '' -E "s/from ['\"](\.[^'\"]*)['\"];/from '\1.js';/g" "$file"
    sed -i '' -E "s/import ['\"](\.[^'\"]*)['\"];/import '\1.js';/g" "$file"
    
    # Fix dynamic imports
    sed -i '' -E "s/import\(['\"](\.[^'\"]*)['\"])/import('\1.js')/g" "$file"
done

echo "Import fixes complete!"