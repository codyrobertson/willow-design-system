# Transformer API

The Transformer API provides a comprehensive framework for building AST-based code transformations. It includes interfaces, base classes, and utilities for creating powerful, composable transformers.

## Core Concepts

### Transformer Interface

All transformers implement the `Transformer` interface:

```typescript
interface Transformer<TConfig = any, TResult = any> {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  
  initialize(config: TConfig): Promise<void>;
  transform(sourceFile: ts.SourceFile, context: TransformContext): Promise<TransformResult<TResult>>;
  transformBatch(sourceFiles: ts.SourceFile[], context: TransformContext): Promise<BatchTransformResult<TResult>>;
  canTransform(sourceFile: ts.SourceFile): boolean;
  dispose(): Promise<void>;
}
```

### BaseTransformer

Extend `BaseTransformer` to create your own transformers:

```typescript
import { BaseTransformer } from '@willow-cli/transformer';

class MyTransformer extends BaseTransformer<MyConfig, MyResult> {
  readonly name = 'my-transformer';
  readonly description = 'My custom transformer';
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
    data?: MyResult;
    nodesProcessed?: number;
  }> {
    // Your transformation logic here
  }
}
```

## Key Components

### 1. Transformer Registry

Manage and discover transformers:

```typescript
import { DefaultTransformerRegistry } from '@willow-cli/transformer';

const registry = new DefaultTransformerRegistry();
registry.register(new MyTransformer());

const transformer = registry.get('my-transformer');
const allTransformers = registry.getAll();
```

### 2. Transformer Pipeline

Chain multiple transformers:

```typescript
import { createTransformerPipeline } from '@willow-cli/transformer';

const pipeline = createTransformerPipeline({
  transformers: [
    new ImportTransformer(),
    new ComponentTransformer(),
    new StyleTransformer()
  ],
  stopOnError: true,
  config: {
    dryRun: false,
    createBackups: true
  }
});

const result = await pipeline.execute(sourceFiles, context);
```

### 3. Composable Transformer

Create transformers that chain other transformers:

```typescript
import { createComposableTransformer } from '@willow-cli/transformer';

const composable = createComposableTransformer(
  'ui-kit-migration',
  [
    new ImportPathTransformer(),
    new ComponentPropTransformer(),
    new StyleTransformer()
  ]
);

// Add transformers dynamically
composable.addTransformer(new CustomTransformer());
composable.setOrder(['import-path', 'style', 'component-prop', 'custom']);
```

### 4. Rollback Handler

Safely backup and restore files:

```typescript
import { createRollbackHandler } from '@willow-cli/transformer';

const rollback = createRollbackHandler('.willow-backups');

// Create backup before transformation
const backupId = await rollback.createBackup(
  ['src/file1.ts', 'src/file2.ts'],
  'Before UI kit migration'
);

// If something goes wrong, restore
await rollback.restore(backupId);

// List and manage backups
const backups = await rollback.listBackups();
await rollback.deleteBackup(backupId);
```

### 5. Transformation Validator

Validate transformation results:

```typescript
import { ImportTransformationValidator } from '@willow-cli/transformer';

const validator = new ImportTransformationValidator();
const result = validator.validate(beforeFile, afterFile, context);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

## Plugin System

Extend transformers with plugins:

```typescript
import { TransformerPlugin } from '@willow-cli/transformer';

class MetricsPlugin implements TransformerPlugin {
  name = 'metrics-plugin';
  version = '1.0.0';

  async beforeTransform(context: TransformContext): Promise<void> {
    console.log('Starting transformation');
  }

  async afterTransformFile(
    sourceFile: ts.SourceFile,
    result: TransformResult,
    context: TransformContext
  ): Promise<void> {
    console.log(`Transformed ${sourceFile.fileName}: ${result.changes.length} changes`);
  }
}

// Use with pipeline
const pipeline = createTransformerPipeline({
  transformers: [...],
  plugins: [new MetricsPlugin()]
});
```

## Built-in Plugins

### StatsPlugin

Collect transformation statistics:

```typescript
import { StatsPlugin } from '@willow-cli/transformer';

const statsPlugin = new StatsPlugin();
const pipeline = createTransformerPipeline({
  transformers: [...],
  plugins: [statsPlugin]
});

await pipeline.execute(files, context);
console.log(statsPlugin.generateReport());
```

### DryRunPlugin

Preview changes without applying them:

```typescript
import { DryRunPlugin } from '@willow-cli/transformer';

const dryRunPlugin = new DryRunPlugin();
const pipeline = createTransformerPipeline({
  transformers: [...],
  plugins: [dryRunPlugin]
});

// No files will be modified
await pipeline.execute(files, context);
```

## Configuration

Configure transformers with `TransformerConfig`:

```typescript
interface TransformerConfig {
  dryRun?: boolean;           // Preview without applying
  createBackups?: boolean;    // Backup before transforming
  inPlace?: boolean;          // Transform in place vs copy
  outputDir?: string;         // Output directory for copies
  include?: string[];         // File patterns to include
  exclude?: string[];         // File patterns to exclude
  maxConcurrency?: number;    // Parallel processing limit
  [key: string]: any;         // Custom options
}
```

## Error Handling

The API provides comprehensive error handling:

```typescript
const result = await transformer.transform(file, context);

if (!result.success) {
  for (const error of result.errors) {
    console.error(`[${error.code}] ${error.message}`);
    if (error.location) {
      console.error(`  at ${error.location.line}:${error.location.column}`);
    }
    if (error.suggestions) {
      console.error('  Suggestions:', error.suggestions);
    }
  }
}

// Warnings don't fail transformation
for (const warning of result.warnings) {
  console.warn(`[${warning.code}] ${warning.message}`);
}
```

## Performance Metrics

Track transformation performance:

```typescript
const result = await transformer.transform(file, context);

if (result.metrics) {
  console.log(`Duration: ${result.metrics.duration}ms`);
  console.log(`Nodes processed: ${result.metrics.nodesProcessed}`);
  console.log(`Memory used: ${result.metrics.memoryUsed} bytes`);
}
```

## Best Practices

1. **Always validate input**: Use `canTransform()` to check if a file should be transformed
2. **Collect detailed changes**: Track all modifications for audit trails
3. **Provide helpful errors**: Include suggestions and context in error messages
4. **Use plugins for cross-cutting concerns**: Logging, metrics, dry-run, etc.
5. **Create backups**: Always create backups before destructive operations
6. **Validate results**: Use validators to ensure transformations are correct
7. **Handle edge cases**: Account for malformed code, missing imports, etc.
8. **Test thoroughly**: Unit test transformers with various input scenarios

## Example: Import Path Transformer

```typescript
import { BaseTransformer, TransformContext } from '@willow-cli/transformer';
import * as ts from 'typescript';

export class ImportPathTransformer extends BaseTransformer<ImportPathConfig> {
  readonly name = 'import-path-transformer';
  readonly description = 'Transforms import paths';
  readonly version = '1.0.0';

  protected async performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: any[];
      warnings: any[];
      changes: any[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    nodesProcessed: number;
  }> {
    let nodesProcessed = 0;
    const transformer = context.transformerFactory.create({
      ImportDeclaration: (node: ts.ImportDeclaration) => {
        nodesProcessed++;
        
        if (ts.isStringLiteral(node.moduleSpecifier)) {
          const oldPath = node.moduleSpecifier.text;
          const newPath = this.transformPath(oldPath);
          
          if (oldPath !== newPath) {
            collectors.changes.push(
              this.createChange(
                'modify',
                `Changed import from "${oldPath}" to "${newPath}"`,
                sourceFile.fileName,
                node,
                oldPath,
                newPath
              )
            );
            
            return ts.factory.updateImportDeclaration(
              node,
              node.modifiers,
              node.importClause,
              ts.factory.createStringLiteral(newPath)
            );
          }
        }
        
        return node;
      }
    });

    const transformedFile = ts.transform(sourceFile, [transformer]).transformed[0];
    
    return {
      transformedFile,
      nodesProcessed
    };
  }

  private transformPath(path: string): string {
    const mappings = this.config?.pathMappings || {};
    
    for (const [pattern, replacement] of Object.entries(mappings)) {
      if (path.startsWith(pattern)) {
        return path.replace(pattern, replacement);
      }
    }
    
    return path;
  }
}

interface ImportPathConfig {
  pathMappings: Record<string, string>;
}
```

## Integration with TypeScript Compiler API

The Transformer API is built on top of the TypeScript Compiler API, providing access to:

- `ts.Program`: The TypeScript program instance
- `ts.TypeChecker`: For semantic analysis
- `ts.SourceFile`: AST representation of files
- `ts.TransformerFactory`: For creating AST transformers

This tight integration enables powerful, type-aware transformations while maintaining compatibility with the TypeScript ecosystem.