# Transformer API Migration Guide

This guide helps migrate from the old transformer system to the new Transformer API.

## Overview

The new Transformer API provides a more robust, composable, and feature-rich system for code transformations. Key improvements include:

- **Unified Interface**: All transformers implement the same base interface
- **Lifecycle Management**: Proper initialization and disposal
- **Error Handling**: Comprehensive error and warning collection
- **Composition**: Chain multiple transformers together
- **Rollback Support**: Built-in backup and restore capabilities
- **Transformation Modes**: In-place vs copy transformations
- **Plugin System**: Extend transformers with plugins

## Migration Strategy

### Phase 1: Assessment
1. Identify all existing transformers in `/src/transformers`
2. Document their functionality and dependencies
3. Determine migration priority based on usage

### Phase 2: Adapter Creation
1. Create adapters for critical transformers using `OldImportTransformerAdapter` as a template
2. Test adapters to ensure backward compatibility
3. Gradually replace old transformer usage with adapters

### Phase 3: Full Migration
1. Rewrite transformers using the new API
2. Take advantage of new features (composition, rollback, etc.)
3. Remove old transformer code and adapters

## Old vs New Comparison

### Old Transformer Structure
```typescript
// Old abstract base
export abstract class ImportTransformer {
  constructor(
    protected context: TransformContext,
    protected config: ImportMappingConfig
  ) {}
  
  transform(sourceFile: ts.SourceFile): ts.SourceFile {
    // Implementation
  }
  
  protected abstract transformImport(node: ts.ImportDeclaration): ts.ImportDeclaration | undefined;
}
```

### New Transformer Structure
```typescript
// New base
export class MyTransformer extends BaseTransformer<ConfigType, ResultType> {
  readonly name = 'my-transformer';
  readonly description = 'Description';
  readonly version = '1.0.0';

  protected async performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    data?: ResultType;
    nodesProcessed?: number;
  }> {
    // Implementation
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    // Check if this transformer applies
  }
}
```

## Migration Examples

### Example 1: Simple Import Transformer

**Old Implementation:**
```typescript
class PathMappingTransformer extends ImportTransformer {
  protected transformImport(node: ts.ImportDeclaration): ts.ImportDeclaration | undefined {
    const path = this.getModuleSpecifier(node);
    const newPath = this.mapPath(path);
    
    if (newPath !== path) {
      return ts.factory.updateImportDeclaration(
        node,
        node.modifiers,
        node.importClause,
        ts.factory.createStringLiteral(newPath),
        node.assertClause
      );
    }
    
    return node;
  }
}
```

**New Implementation:**
```typescript
export class PathMappingTransformer extends BaseTransformer<PathMappingConfig, PathMappingResult> {
  readonly name = 'path-mapping-transformer';
  readonly description = 'Maps import paths based on configuration';
  readonly version = '1.0.0';

  protected async performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    data?: PathMappingResult;
    nodesProcessed?: number;
  }> {
    let transformCount = 0;
    
    const transformer = context => {
      const visit = node => {
        if (ts.isImportDeclaration(node)) {
          const path = this.getModuleSpecifier(node);
          const newPath = this.mapPath(path);
          
          if (newPath !== path) {
            transformCount++;
            collectors.changes.push(
              this.createChange(
                'modify',
                `Map import path: ${path} → ${newPath}`,
                sourceFile.fileName,
                node
              )
            );
            
            return ts.factory.updateImportDeclaration(
              node,
              node.modifiers,
              node.importClause,
              ts.factory.createStringLiteral(newPath),
              node.assertClause
            );
          }
        }
        return ts.visitEachChild(node, visit, context);
      };
      return sourceFile => ts.visitNode(sourceFile, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    const transformedFile = result.transformed[0];
    result.dispose();

    return {
      transformedFile,
      data: { pathsMapped: transformCount },
      nodesProcessed: this.countNodes(sourceFile),
    };
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    // Check if file has any imports
    return this.hasImports(sourceFile);
  }
}
```

### Example 2: Using Adapters

```typescript
// Using the old transformer through an adapter
const adapter = new OldImportTransformerAdapter();
await adapter.initialize({
  importMappings: {
    exactMatches: {
      'old-lib': 'new-lib',
    },
    prefixMatches: {
      '@old/': '@new/',
    },
  },
});

// Use it in a pipeline
const pipeline = createComposableTransformer('migration-pipeline', [
  adapter,
  new NamespaceAliasTransformer(),
]);
```

## Feature Mapping

| Old Feature | New API Equivalent |
|------------|-------------------|
| `TransformContext` | `TransformContext` (enhanced) |
| `reportTransformation()` | `collectors.changes.push()` |
| `reportError()` | `collectors.errors.push()` |
| `reportWarning()` | `collectors.warnings.push()` |
| Manual file handling | `TransformationModeHandler` |
| No rollback support | `RollbackHandler` |
| Single transformer | `ComposableTransformer` |
| No lifecycle | `initialize()` / `dispose()` |

## Migration Checklist

- [ ] Inventory existing transformers
- [ ] Create adapters for immediate compatibility
- [ ] Write tests for adapters
- [ ] Plan full migration for each transformer
- [ ] Implement new transformers with enhanced features
- [ ] Update documentation
- [ ] Remove old code after verification

## Benefits of Migration

1. **Better Error Handling**: Structured error and warning collection
2. **Composition**: Chain transformers for complex workflows
3. **Rollback Safety**: Automatic backup and restore
4. **Performance Metrics**: Built-in performance tracking
5. **Plugin Support**: Extend functionality with plugins
6. **Batch Processing**: Efficient multi-file transformation
7. **Type Safety**: Better TypeScript types throughout

## Next Steps

1. Start with adapters for critical transformers
2. Gradually migrate to native new API implementations
3. Take advantage of new features in migrated code
4. Remove old transformer infrastructure once migration is complete