/**
 * Example: Transformer composition patterns
 * Shows various ways to compose transformers
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createComposableTransformer,
  ImportTransformer,
  NamespaceAliasTransformer,
  createTransformationModeHandler,
  createRollbackHandler,
  TransformContext,
  ConsoleLogger,
  LogLevel,
  Transformer,
  BaseTransformer,
} from '../index';

/**
 * Example 1: Sequential transformation pipeline
 */
export async function sequentialPipeline(files: string[]): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);

  // Create individual transformers
  const importTransformer = new ImportTransformer();
  await importTransformer.initialize({
    pathMappings: {
      '@old/': '@new/',
      'legacy-': 'modern-',
    },
    sortImports: true,
  });

  const namespaceTransformer = new NamespaceAliasTransformer();
  await namespaceTransformer.initialize({
    namespaceMapping: {
      'LegacyAPI': 'ModernAPI',
    },
    convertStarImports: true,
    starImportConversions: {
      'lodash': ['debounce', 'throttle', 'merge', 'cloneDeep'],
    },
  });

  // Compose transformers
  const pipeline = createComposableTransformer(
    'modernization-pipeline',
    [importTransformer, namespaceTransformer],
    'Modernizes imports and namespaces',
    '1.0.0'
  );

  const context: TransformContext = {
    program: {} as ts.Program,
    typeChecker: {} as ts.TypeChecker,
    compilerOptions: {},
    workingDirectory: process.cwd(),
    logger,
    sharedState: new Map(),
    config: {},
    plugins: [],
  };

  // Transform files
  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const result = await pipeline.transform(sourceFile, context);

    if (result.success) {
      logger.info(`✓ Transformed ${filePath}`);
      logger.info(`  - Errors: ${result.errors.length}`);
      logger.info(`  - Warnings: ${result.warnings.length}`);
      logger.info(`  - Changes: ${result.changes.length}`);
    } else {
      logger.error(`✗ Failed to transform ${filePath}`);
      result.errors.forEach(err => logger.error(`  - ${err.message}`));
    }
  }

  await pipeline.dispose();
}

/**
 * Example 2: Conditional transformation pipeline
 */
export async function conditionalPipeline(
  sourceDir: string,
  outputDir: string
): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);

  // Create conditional transformers
  const jsTransformer = new ConditionalTransformer(
    'js-transformer',
    (file) => file.fileName.endsWith('.js'),
    async (file) => {
      // Transform CommonJS to ES modules
      logger.info(`Transforming JS file: ${file.fileName}`);
      return file;
    }
  );

  const tsTransformer = new ConditionalTransformer(
    'ts-transformer',
    (file) => file.fileName.endsWith('.ts') || file.fileName.endsWith('.tsx'),
    async (file) => {
      // Transform TypeScript-specific code
      logger.info(`Transforming TS file: ${file.fileName}`);
      return file;
    }
  );

  const cssInJsTransformer = new ConditionalTransformer(
    'css-in-js-transformer',
    (file) => {
      // Check if file contains CSS-in-JS
      const content = file.getFullText();
      return content.includes('styled-components') || content.includes('@emotion');
    },
    async (file) => {
      // Transform CSS-in-JS
      logger.info(`Transforming CSS-in-JS in: ${file.fileName}`);
      return file;
    }
  );

  // Compose with custom order
  const pipeline = createComposableTransformer('conditional-pipeline');
  pipeline.addTransformer(jsTransformer);
  pipeline.addTransformer(tsTransformer);
  pipeline.addTransformer(cssInJsTransformer);
  
  // Set custom execution order
  pipeline.setOrder(['js-transformer', 'ts-transformer', 'css-in-js-transformer']);

  await pipeline.initialize({});

  // Use with transformation mode handler
  const modeHandler = createTransformationModeHandler({
    config: { outputDir },
    logger,
    preserveStructure: true,
    baseDir: sourceDir,
  });

  // ... perform transformation ...

  await pipeline.dispose();
}

/**
 * Example 3: Dynamic pipeline composition
 */
export async function dynamicPipeline(
  transformerNames: string[]
): Promise<Transformer> {
  const availableTransformers = new Map<string, () => Promise<Transformer>>();

  // Register available transformers
  availableTransformers.set('imports', async () => {
    const t = new ImportTransformer();
    await t.initialize({ pathMappings: { '@old/': '@new/' } });
    return t;
  });

  availableTransformers.set('namespaces', async () => {
    const t = new NamespaceAliasTransformer();
    await t.initialize({ namespaceMapping: { 'Old': 'New' } });
    return t;
  });

  // Add more transformers as needed...

  // Build pipeline dynamically
  const pipeline = createComposableTransformer('dynamic-pipeline');

  for (const name of transformerNames) {
    const factory = availableTransformers.get(name);
    if (factory) {
      const transformer = await factory();
      pipeline.addTransformer(transformer);
    } else {
      console.warn(`Transformer "${name}" not found`);
    }
  }

  await pipeline.initialize({});
  return pipeline;
}

/**
 * Example 4: Error handling and recovery pipeline
 */
export async function robustPipeline(files: string[]): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);
  const rollbackHandler = createRollbackHandler('.transformer-backups');

  // Create pipeline with error recovery
  const pipeline = createComposableTransformer('robust-pipeline');
  
  // Add transformers with error handling
  const safeImportTransformer = new ErrorHandlingTransformer(
    new ImportTransformer(),
    {
      onError: async (error, file) => {
        logger.error(`Import transformation failed for ${file}: ${error.message}`);
        // Could implement retry logic here
        return false; // Don't continue with this file
      },
    }
  );

  pipeline.addTransformer(safeImportTransformer);

  // Create backup before transformation
  const backupId = await rollbackHandler.createBackup(files, 'Pre-pipeline backup');

  try {
    await pipeline.initialize({});

    const sourceFiles = await Promise.all(
      files.map(async (filePath) => {
        const content = await fs.readFile(filePath, 'utf-8');
        return ts.createSourceFile(
          filePath,
          content,
          ts.ScriptTarget.Latest,
          true
        );
      })
    );

    const context: TransformContext = {
      program: {} as ts.Program,
      typeChecker: {} as ts.TypeChecker,
      compilerOptions: {},
      workingDirectory: process.cwd(),
      logger,
      sharedState: new Map(),
      config: {},
      plugins: [],
    };

    const result = await pipeline.transformBatch(sourceFiles, context);

    if (!result.success) {
      logger.error('Pipeline failed, rolling back changes...');
      await rollbackHandler.restore(backupId);
    } else {
      logger.info('Pipeline completed successfully');
      // Optionally delete backup
      await rollbackHandler.deleteBackup(backupId);
    }
  } finally {
    await pipeline.dispose();
  }
}

/**
 * Example 5: Parallel transformation branches
 */
export async function parallelBranches(files: string[]): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);

  // Create separate pipelines for different file types
  const jsPipeline = createComposableTransformer('js-pipeline');
  const tsPipeline = createComposableTransformer('ts-pipeline');
  const stylePipeline = createComposableTransformer('style-pipeline');

  // Configure pipelines...
  
  // Process files in parallel by type
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  const styleFiles = files.filter(f => f.endsWith('.css') || f.includes('styled'));

  const results = await Promise.all([
    jsFiles.length > 0 ? processPipeline(jsPipeline, jsFiles, logger) : null,
    tsFiles.length > 0 ? processPipeline(tsPipeline, tsFiles, logger) : null,
    styleFiles.length > 0 ? processPipeline(stylePipeline, styleFiles, logger) : null,
  ]);

  // Merge results and report
  logger.info('Parallel processing complete');
}

/**
 * Helper: Conditional transformer
 */
class ConditionalTransformer extends BaseTransformer {
  constructor(
    public name: string,
    private condition: (file: ts.SourceFile) => boolean,
    private transformFn: (file: ts.SourceFile) => Promise<ts.SourceFile>
  ) {
    super();
    this.description = `Conditional transformer: ${name}`;
    this.version = '1.0.0';
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    return this.condition(sourceFile);
  }

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
    data?: any;
  }> {
    const transformedFile = await this.transformFn(sourceFile);
    
    collectors.changes.push({
      type: 'modify',
      description: `Applied ${this.name}`,
      file: sourceFile.fileName,
    });

    return { transformedFile };
  }
}

/**
 * Helper: Error handling wrapper
 */
class ErrorHandlingTransformer extends BaseTransformer {
  name: string;
  description: string;
  version: string;

  constructor(
    private innerTransformer: Transformer,
    private options: {
      onError?: (error: Error, file: string) => Promise<boolean>;
      maxRetries?: number;
    }
  ) {
    super();
    this.name = `safe-${innerTransformer.name}`;
    this.description = innerTransformer.description;
    this.version = innerTransformer.version;
  }

  async initialize(config: any): Promise<void> {
    await super.initialize(config);
    await this.innerTransformer.initialize(config);
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    return this.innerTransformer.canTransform(sourceFile);
  }

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
    data?: any;
  }> {
    let retries = 0;
    const maxRetries = this.options.maxRetries || 0;

    while (retries <= maxRetries) {
      try {
        const result = await this.innerTransformer.transform(sourceFile, context);
        
        if (result.success && result.transformedFile) {
          collectors.errors.push(...result.errors);
          collectors.warnings.push(...result.warnings);
          collectors.changes.push(...result.changes);
          
          return {
            transformedFile: result.transformedFile,
            data: result.data,
          };
        } else {
          throw new Error('Transformation failed');
        }
      } catch (error) {
        retries++;
        
        if (retries > maxRetries) {
          if (this.options.onError) {
            const shouldContinue = await this.options.onError(
              error as Error,
              sourceFile.fileName
            );
            if (!shouldContinue) {
              throw error;
            }
          } else {
            throw error;
          }
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    return { transformedFile: sourceFile };
  }

  async dispose(): Promise<void> {
    await this.innerTransformer.dispose();
    await super.dispose();
  }
}

/**
 * Helper: Process pipeline
 */
async function processPipeline(
  pipeline: Transformer,
  files: string[],
  logger: ConsoleLogger
): Promise<void> {
  await pipeline.initialize({});

  const context: TransformContext = {
    program: {} as ts.Program,
    typeChecker: {} as ts.TypeChecker,
    compilerOptions: {},
    workingDirectory: process.cwd(),
    logger,
    sharedState: new Map(),
    config: {},
    plugins: [],
  };

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    await pipeline.transform(sourceFile, context);
  }

  await pipeline.dispose();
}