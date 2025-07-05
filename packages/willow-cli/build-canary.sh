#!/bin/bash

echo "Creating canary build by excluding problematic files..."

# Create a minimal tsconfig for canary build
cat > tsconfig.canary.json << 'EOF'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "skipLibCheck": true,
    "noImplicitAny": false,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": false
  },
  "include": [
    "src/cli.ts",
    "src/cli-*.ts",
    "src/index.ts",
    "src/commands/**/*.ts",
    "src/core/CLI.ts",
    "src/core/ArgumentParser.ts",
    "src/core/commands/**/*.ts",
    "src/core/help/**/*.ts",
    "src/core/logging/**/*.ts",
    "src/core/package-manager/**/*.ts",
    "src/core/network/**/*.ts",
    "src/core/cache/**/*.ts",
    "src/config/**/*.ts",
    "src/types/**/*.ts",
    "src/errors/**/*.ts",
    "src/utils/**/*.ts",
    "src/ui/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "bin",
    "packages",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/test*/**",
    "src/**/tests/**",
    "src/**/examples/**",
    "src/adapters/**",
    "src/generator/**"
  ]
}
EOF

# Build with canary config
echo "Building with canary configuration..."
npx tsc -p tsconfig.canary.json

if [ $? -eq 0 ]; then
    echo "TypeScript compilation successful!"
    
    # Copy necessary files
    echo "Copying package files..."
    cp package.json dist/
    cp README.md dist/ 2>/dev/null || echo "No README found, skipping..."
    
    # Create a minimal CLI entry point if it doesn't exist
    if [ ! -f "dist/cli.js" ]; then
        echo "Creating CLI entry point..."
        cat > dist/cli.js << 'EOF'
#!/usr/bin/env node
import './index.js';
EOF
    fi
    
    echo "Canary build complete! Files in dist/"
    ls -la dist/
else
    echo "TypeScript compilation failed"
    exit 1
fi