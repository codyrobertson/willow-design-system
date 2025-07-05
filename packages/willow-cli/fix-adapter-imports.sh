#!/bin/bash

echo "Fixing adapter import paths..."

# Fix ../errors.js to ../errors/index.js
find src/adapters -name "*.ts" -type f | while read file; do
    if grep -q "from '../errors\.js'" "$file"; then
        echo "Fixing errors import in: $file"
        sed -i '' "s|from '../errors\.js'|from '../errors/index.js'|g" "$file"
    fi
done

# Fix ../types.js to ../types/index.js  
find src/adapters -name "*.ts" -type f | while read file; do
    if grep -q "from '../types\.js'" "$file"; then
        echo "Fixing types import in: $file"
        sed -i '' "s|from '../types\.js'|from '../types/index.js'|g" "$file"
    fi
done

# Fix ../test-fixtures.js to ../test-fixtures/index.js
find src/adapters -name "*.ts" -type f | while read file; do
    if grep -q "from '../test-fixtures\.js'" "$file"; then
        echo "Fixing test-fixtures import in: $file"
        sed -i '' "s|from '../test-fixtures\.js'|from '../test-fixtures/index.js'|g" "$file"
    fi
done

# Fix the storybook config test - change .css.js back to .css
find src/utils -name "*.ts" -type f | while read file; do
    if grep -q "index\.css\.js" "$file"; then
        echo "Fixing CSS import in: $file"
        sed -i '' "s|index\.css\.js|index.css|g" "$file"
    fi
done

echo "Import fixes complete!"