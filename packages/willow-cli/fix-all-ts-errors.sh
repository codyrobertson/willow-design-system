#!/bin/bash

echo "Fixing all TypeScript errors..."

# Fix missing .js extensions in specific files
echo "Fixing missing .js extensions..."

# Fix adapter imports
sed -i '' 's|from '\''./test-fixtures'\''|from '\''./test-fixtures/index.js'\''|g' src/adapters/adapter.improved.test.ts
sed -i '' 's|from '\''./types'\''|from '\''./types/index.js'\''|g' src/adapters/adapter.improved.test.ts src/adapters/adapter.test.ts
sed -i '' 's|from '\''./errors'\''|from '\''./errors/index.js'\''|g' src/adapters/adapter.improved.test.ts src/adapters/adapter.test.ts

# Fix missing files - create if they don't exist
if [ ! -f "src/adapters/test-fixtures/index.ts" ]; then
    mkdir -p src/adapters/test-fixtures
    echo "export * from './adapter.fixtures.js';
export * from './plugin.fixtures.js';" > src/adapters/test-fixtures/index.ts
fi

if [ ! -f "src/adapters/types/index.ts" ]; then
    echo "export * from './AdapterTypes.js';
export * from './token-helpers.js';" > src/adapters/types/index.ts
fi

if [ ! -f "src/adapters/errors/index.ts" ]; then
    echo "export * from './AdapterError.js';
export * from './ErrorHandler.js';
export * from './ErrorRecovery.js';
export * from './ErrorReporting.js';" > src/adapters/errors/index.ts
fi

# Fix UIKitAdapter export issue
sed -i '' 's|UIKitAdapter,||g' src/adapters/AdapterFactory.ts

# Fix material-ui to material
sed -i '' 's|"material-ui"|"material"|g' src/adapters/AdapterFactory.ts

# Fix ant-design to antd  
sed -i '' 's|"ant-design"|"antd"|g' src/adapters/AdapterFactory.ts

echo "TypeScript error fixes complete!"