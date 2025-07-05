# Unified Transformer Migration Plan

## 🚨 Current State: CHAOS
- **3,500+ lines of duplicate code** between `src/` and `src/transformer-api/`
- **Two identical APIs** doing the same thing
- **Type definitions scattered** across 3+ files
- **15,000+ lines of test code** testing the same functionality twice

## 🎯 Target State: UNIFIED SINGLE API

```
src/
├── index.ts                 # Single unified export
├── types.ts                 # All transformer types
├── base-transformer.ts      # Single base class
├── transformers/            # ALL transformers here
│   ├── core/               # Core transformation
│   ├── style/              # Style system (existing)
│   ├── import/             # Import transformations
│   └── component/          # Component transformations
├── pipeline/               # Pipeline & registry
├── plugins/                # Plugin system
└── utils/                  # Utilities
```

## 📋 STEP-BY-STEP MIGRATION

### Step 1: Audit Current Usage
```bash
# Find all imports of transformer-api
grep -r "transformer-api" test/ src/
# Find all imports of duplicate APIs
grep -r "from.*index" test/ src/
```

### Step 2: Choose Single Source of Truth
**DECISION: Keep `src/transformer-api/` as the base** (it's complete and tested)

### Step 3: Migration Execution

#### 3A. Move transformer-api to root
```bash
# Move all files from transformer-api to src root
mv src/transformer-api/* src/
rm -rf src/transformer-api/
```

#### 3B. Remove duplicate files
```bash
# These files are 100% identical - remove root versions
rm src/base-transformer.ts          # Keep transformer-api version
rm src/composable-transformer.ts    # Keep transformer-api version  
rm src/plugin-manager.ts            # Keep transformer-api version
rm src/logger.ts                    # Keep transformer-api version
rm src/rollback-handler.ts          # Keep transformer-api version
rm src/transformation-validator.ts  # Keep transformer-api version
rm src/transformer-registry.ts      # Keep transformer-api version
rm src/transformer-pipeline.ts      # Keep transformer-api version
rm -rf src/plugins/                 # Keep transformer-api version
```

#### 3C. Merge transformers
```bash
# Move any transformers from old location to new
mv src/transformer-api/transformers/* src/transformers/
```

#### 3D. Consolidate types
- Merge `src/types.ts` (684 lines) with `src/index.ts` (714 lines)
- Remove duplicate interface definitions
- Create single types export

#### 3E. Update all imports
```bash
# Update test imports
find test/ -name "*.ts" -exec sed -i 's|transformer-api/||g' {} \;
# Update src imports  
find src/ -name "*.ts" -exec sed -i 's|transformer-api/||g' {} \;
```

### Step 4: Organize Transformers by Category

#### 4A. Create transformer categories
```bash
mkdir -p src/transformers/{core,style,import,component}
```

#### 4B. Move existing transformers
```bash
# Core transformers
mv src/transformers/import-transformer.ts src/transformers/core/
mv src/transformers/namespace-alias-transformer.ts src/transformers/core/
mv src/transformers/prop-name-transformer.ts src/transformers/component/

# Style transformers already in src/styles/ - reference them
# Import transformers  
mv src/transformers/import-* src/transformers/import/
```

#### 4C. Create category index files
```typescript
// src/transformers/core/index.ts
export * from './import-transformer';
export * from './namespace-alias-transformer';

// src/transformers/component/index.ts  
export * from './prop-name-transformer';

// src/transformers/style/index.ts
export * from '../styles'; // Reference existing style system

// src/transformers/import/index.ts
export * from './import-parser-transformer';
export * from './import-path-resolver-transformer';
export * from './import-transformation-engine-transformer';

// src/transformers/index.ts
export * from './core';
export * from './component';
export * from './style';
export * from './import';
```

### Step 5: Simplify Main Exports

#### 5A. Clean up src/index.ts
```typescript
/**
 * Unified Transformer API
 * Single entry point for all transformer functionality
 */

// Core API
export * from './types';
export * from './base-transformer';

// Transformers
export * from './transformers';

// Infrastructure  
export * from './transformer-registry';
export * from './transformer-pipeline';
export * from './composable-transformer';

// Utilities
export * from './rollback-handler';
export * from './plugin-manager';
export * from './logger';
```

#### 5B. Consolidate types.ts
```typescript
/**
 * All transformer types in one place
 * Merged from index.ts (714 lines) + types.ts (684 lines)
 * Simplified to ~8 core interfaces
 */

// Remove duplicates, keep essentials:
export interface Transformer<TConfig = any, TResult = any> { ... }
export interface TransformContext { ... }
export interface TransformResult<T = any> { ... }
// ... other core interfaces
```

### Step 6: Update Tests
```bash
# Update all test imports to use unified API
find test/ -name "*.ts" -exec sed -i 's|../src/transformer-api/|../src/|g' {} \;

# Consolidate duplicate tests
# Remove tests that test identical functionality twice
```

## 🎯 EXECUTION COMMANDS

Execute this plan with these exact commands:

```bash
# Step 1: Backup current state
git add -A && git commit -m "Backup before transformer unification"

# Step 2: Move transformer-api to root
cd src/
cp -r transformer-api/* .
rm -rf transformer-api/

# Step 3: Remove duplicates (these are identical)
rm base-transformer.ts composable-transformer.ts plugin-manager.ts
rm logger.ts rollback-handler.ts transformation-validator.ts  
rm transformer-registry.ts transformer-pipeline.ts
rm -rf plugins/

# Step 4: Create transformer structure
mkdir -p transformers/{core,style,import,component}

# Step 5: Move transformers to categories
mv transformers/import-transformer.ts transformers/core/
mv transformers/namespace-alias-transformer.ts transformers/core/  
mv transformers/prop-name-transformer.ts transformers/component/
mv transformers/import-*-transformer.ts transformers/import/

# Step 6: Update imports in tests
find ../test/ -name "*.ts" -exec sed -i '' 's|transformer-api/||g' {} \;

# Step 7: Consolidate types
# (Manual step - merge types.ts into main types)

# Step 8: Test everything works
npm test
```

## ✅ SUCCESS CRITERIA

1. **Single API**: Only one transformer API exists
2. **No Duplication**: Zero duplicate files
3. **Clear Structure**: Transformers organized by purpose
4. **All Tests Pass**: No broken functionality
5. **Simplified Imports**: Single import path for everything

## 🚀 Benefits After Migration

- **-4,000 lines** of duplicate code removed
- **Single source of truth** for transformer API
- **Clear organization** by transformer type
- **Easier maintenance** - change once, works everywhere
- **Better developer experience** - obvious where things go

## ⚠️ Risks & Mitigation

**Risk**: Breaking existing imports
**Mitigation**: Systematic find/replace of import paths

**Risk**: Lost functionality during merge  
**Mitigation**: Keep git history, test thoroughly

**Risk**: Test failures during transition
**Mitigation**: Update tests incrementally, verify each step

This plan will transform the current chaos into a clean, unified transformer system.