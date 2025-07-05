#!/bin/bash

# Update CLI.test.ts to use fromLegacyCommand
sed -i '' 's/registry\.register({/registry.register(fromLegacyCommand({/g' src/core/__tests__/CLI.test.ts
sed -i '' 's/});/}));/g' src/core/__tests__/CLI.test.ts

# Fix double parentheses that might occur
sed -i '' 's/})););/}));/g' src/core/__tests__/CLI.test.ts

echo "Updated test files"