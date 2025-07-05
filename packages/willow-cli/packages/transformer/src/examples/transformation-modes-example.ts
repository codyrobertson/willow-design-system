/**
 * Example: Using transformation modes with transformers
 * Shows in-place vs copy transformations
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TransformContext,
  ImportTransformer,
  NamespaceAliasTransformer,
  createTransformationModeHandler,
  createRollbackHandler,
  ConsoleLogger,
  LogLevel,
} from '../index';

/**
 * Example 1: In-place transformation with automatic backup
 */
export async function inPlaceTransformation(
  sourceFiles: string[]
): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);
  const rollbackHandler = createRollbackHandler('.transformer-backups');

  // Create transformation mode handler
  const modeHandler = createTransformationModeHandler({
    config: {
      inPlace: true,
      createBackups: true,
    },
    logger,
    rollbackHandler,
  });

  // Create transformer
  const transformer = new ImportTransformer();
  await transformer.initialize({
    pathMappings: {
      '@old/': '@new/',
      '../../../utils': '@utils',
    },
    sortImports: true,
  });

  // Create context
  const context: TransformContext = {
    program: {} as ts.Program,
    typeChecker: {} as ts.TypeChecker,
    compilerOptions: {},
    workingDirectory: process.cwd(),
    logger,
    sharedState: new Map(),
    config: { inPlace: true },
    plugins: [],
  };

  try {
    // Prepare for transformation
    await modeHandler.prepare(sourceFiles);

    // Transform each file
    for (const filePath of sourceFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      if (result.success && result.transformedFile) {
        const printer = ts.createPrinter();
        const transformedContent = printer.printFile(result.transformedFile);
        
        await modeHandler.transformFile(sourceFile, transformedContent);
      }
    }

    // Complete successfully
    await modeHandler.complete(true);
    logger.info('In-place transformation completed successfully');

  } catch (error) {
    // Rollback on error
    await modeHandler.complete(false);
    logger.error('Transformation failed and was rolled back', error);
    throw error;
  } finally {
    await transformer.dispose();
  }
}

/**
 * Example 2: Copy transformation with directory structure preservation
 */
export async function copyTransformation(
  sourceDir: string,
  outputDir: string,
  files: string[]
): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);

  // Create transformation mode handler
  const modeHandler = createTransformationModeHandler({
    config: {
      outputDir,
    },
    logger,
    preserveStructure: true,
    baseDir: sourceDir,
  });

  // Create transformer
  const transformer = new NamespaceAliasTransformer();
  await transformer.initialize({
    namespaceMapping: {
      'OldNamespace': 'NewNamespace',
    },
    convertStarImports: true,
    starImportConversions: {
      'lodash': ['debounce', 'throttle', 'merge'],
    },
  });

  const context: TransformContext = {
    program: {} as ts.Program,
    typeChecker: {} as ts.TypeChecker,
    compilerOptions: {},
    workingDirectory: sourceDir,
    logger,
    sharedState: new Map(),
    config: { outputDir },
    plugins: [],
  };

  try {
    await modeHandler.prepare(files);

    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      if (result.success && result.transformedFile) {
        const printer = ts.createPrinter();
        const transformedContent = printer.printFile(result.transformedFile);
        
        await modeHandler.transformFile(sourceFile, transformedContent);
      }
    }

    await modeHandler.complete(true);
    
    const processed = modeHandler.getProcessedFiles();
    logger.info(`Copied and transformed ${processed.length} files to ${outputDir}`);

  } finally {
    await transformer.dispose();
  }
}

/**
 * Example 3: Dry run transformation
 */
export async function dryRunTransformation(
  files: string[]
): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);

  // Create transformation mode handler
  const modeHandler = createTransformationModeHandler({
    config: {
      inPlace: true,
      dryRun: true,
    },
    logger,
  });

  const transformer = new ImportTransformer();
  await transformer.initialize({
    pathMappings: {
      'react': 'preact',
      'react-dom': 'preact/compat',
    },
  });

  const context: TransformContext = {
    program: {} as ts.Program,
    typeChecker: {} as ts.TypeChecker,
    compilerOptions: {},
    workingDirectory: process.cwd(),
    logger,
    sharedState: new Map(),
    config: { dryRun: true },
    plugins: [],
  };

  await modeHandler.prepare(files);

  logger.info('=== DRY RUN MODE ===');
  logger.info('The following changes would be made:\n');

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const result = await transformer.transform(sourceFile, context);

    if (result.success && result.transformedFile) {
      const printer = ts.createPrinter();
      const transformedContent = printer.printFile(result.transformedFile);
      
      const fileResult = await modeHandler.transformFile(sourceFile, transformedContent);
      
      if (fileResult.preview) {
        console.log(fileResult.preview);
      }
    }
  }

  await modeHandler.complete(true);
  await transformer.dispose();
}

/**
 * Example 4: Selective transformation with filtering
 */
export async function selectiveTransformation(
  sourceDir: string,
  outputDir: string
): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);

  // Find all TypeScript files
  const allFiles = await findFiles(sourceDir, /\.tsx?$/);
  
  // Filter files to transform
  const filesToTransform = allFiles.filter(file => {
    // Skip test files
    if (file.includes('.test.') || file.includes('.spec.')) {
      return false;
    }
    // Skip node_modules
    if (file.includes('node_modules')) {
      return false;
    }
    return true;
  });

  logger.info(`Found ${allFiles.length} files, transforming ${filesToTransform.length}`);

  const modeHandler = createTransformationModeHandler({
    config: {
      outputDir,
    },
    logger,
    preserveStructure: true,
    baseDir: sourceDir,
  });

  // ... perform transformation ...
}

/**
 * Example 5: Progressive transformation with checkpoints
 */
export async function progressiveTransformation(
  files: string[],
  batchSize: number = 10
): Promise<void> {
  const logger = new ConsoleLogger(LogLevel.INFO);
  const rollbackHandler = createRollbackHandler('.transformer-checkpoints');

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    logger.info(`Processing batch ${batchNum} of ${Math.ceil(files.length / batchSize)}`);

    // Create a checkpoint for this batch
    const checkpointId = await rollbackHandler.createBackup(
      batch,
      `Batch ${batchNum} checkpoint`
    );

    const modeHandler = createTransformationModeHandler({
      config: {
        inPlace: true,
      },
      logger,
      rollbackHandler,
    });

    try {
      await modeHandler.prepare(batch);
      
      // Transform batch...
      
      await modeHandler.complete(true);
      
      // Delete checkpoint after successful batch
      await rollbackHandler.deleteBackup(checkpointId);
      
    } catch (error) {
      logger.error(`Batch ${batchNum} failed, restoring from checkpoint`);
      await rollbackHandler.restore(checkpointId);
      throw error;
    }
  }
}

/**
 * Helper: Find files recursively
 */
async function findFiles(
  dir: string,
  pattern: RegExp
): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Example usage
 */
async function main() {
  // Example 1: In-place transformation
  await inPlaceTransformation([
    './src/components/Button.tsx',
    './src/components/Input.tsx',
  ]);

  // Example 2: Copy transformation
  await copyTransformation(
    './src',
    './dist',
    ['./src/index.ts', './src/utils.ts']
  );

  // Example 3: Dry run
  await dryRunTransformation(['./src/app.tsx']);

  // Example 4: Progressive transformation
  const allFiles = await findFiles('./src', /\.tsx?$/);
  await progressiveTransformation(allFiles, 20);
}

// Export for use in other modules
export {
  findFiles,
};