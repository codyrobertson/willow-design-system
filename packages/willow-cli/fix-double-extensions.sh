#!/bin/bash

# Fix double .js.js extensions
echo "Fixing double .js.js extensions..."

# Find all .ts files and fix double extensions
find src -name "*.ts" ! -name "*.d.ts" -type f | while read file; do
    echo "Processing: $file"
    
    # Fix .js.js back to .js
    sed -i '' 's/\.js\.js/\.js/g' "$file"
done

echo "Double extension fixes complete!"