/**
 * Example: Safe transformation with rollback support
 * Shows how to use the rollback handler with transformers
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TransformContext,
  TransformResult,
  TransformerPipeline,
  createRollbackHandler,
  createTransformerPipeline,
  ImportTransformer,
  NamespaceAliasTransformer,
  ConsoleLogger,
  LogLevel,
} from '../index';

/**
 * Example: Safe transformation with automatic rollback on failure
 */
export async function safeTransformWithRollback(
  files: string[],
  outputDir?: string
): Promise<void> {
  // Create rollback handler
  const rollbackHandler = createRollbackHandler('.transformer-backups');
  
  // Create context
  const context: TransformContext = {
    program: {} as ts.Program,
    typeChecker: {} as ts.TypeChecker,
    compilerOptions: {},
    workingDirectory: process.cwd(),
    logger: new ConsoleLogger(LogLevel.INFO),
    sharedState: new Map(),
    config: {
      inPlace: !outputDir,
      outputDir,
      createBackups: true,
    },
    plugins: [],
  };

  // Create and configure transformers
  const importTransformer = new ImportTransformer();
  await importTransformer.initialize({
    pathMappings: {
      '@old/ui': '@new/ui',
      'old-lib': 'new-lib',
    },
    sortImports: true,
  });

  const namespaceTransformer = new NamespaceAliasTransformer();
  await namespaceTransformer.initialize({
    namespaceMapping: {
      'OldNamespace': 'NewNamespace',
    },
    convertStarImports: true,
    starImportConversions: {
      'lodash': ['debounce', 'throttle'],
    },
  });

  // Create pipeline
  const pipeline = createTransformerPipeline({
    transformers: [importTransformer, namespaceTransformer],
    stopOnError: true,
    config: context.config,
  });

  let backupId: string | null = null;

  try {
    // Step 1: Create backup before transformation
    context.logger.info('Creating backup before transformation...');
    backupId = await rollbackHandler.createBackup(files, 'Pre-transformation backup');
    context.logger.info(`Backup created: ${backupId}`);

    // Step 2: Read and parse source files
    const sourceFiles: ts.SourceFile[] = [];
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      sourceFiles.push(sourceFile);
    }

    // Step 3: Execute transformation pipeline
    context.logger.info('Starting transformation pipeline...');
    const result = await pipeline.execute(sourceFiles, context);

    if (!result.success) {
      throw new Error('Transformation pipeline failed');
    }

    // Step 4: Write transformed files
    context.logger.info('Writing transformed files...');
    for (const [fileName, fileResult] of result.transformerResults.entries()) {
      for (const [filePath, transformResult] of fileResult.results.entries()) {
        if (transformResult.success && transformResult.transformedFile) {
          const printer = ts.createPrinter();
          const transformedContent = printer.printFile(transformResult.transformedFile);
          
          const outputPath = outputDir
            ? path.join(outputDir, path.basename(filePath))
            : filePath;
          
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(outputPath, transformedContent);
          
          context.logger.info(`Transformed: ${filePath}`);
        }
      }
    }

    // Step 5: Verify transformation results (optional)
    context.logger.info('Verifying transformation results...');
    // Add your verification logic here

    context.logger.info('Transformation completed successfully!');
    
    // Optional: Clean up backup if transformation was successful
    // await rollbackHandler.deleteBackup(backupId);
    
  } catch (error) {
    context.logger.error('Transformation failed:', error);
    
    // Rollback changes
    if (backupId && !outputDir) {
      context.logger.info('Rolling back changes...');
      await rollbackHandler.restore(backupId);
      context.logger.info('Changes rolled back successfully');
    }
    
    throw error;
  } finally {
    // Clean up transformers
    await importTransformer.dispose();
    await namespaceTransformer.dispose();
  }
}

/**
 * Example: Incremental transformation with checkpoint backups
 */
export async function incrementalTransformWithCheckpoints(
  files: string[]
): Promise<void> {
  const rollbackHandler = createRollbackHandler('.transformer-checkpoints');
  const checkpoints: Array<{ file: string; backupId: string }> = [];
  
  const context: TransformContext = {
    program: {} as ts.Program,
    typeChecker: {} as ts.TypeChecker,
    compilerOptions: {},
    workingDirectory: process.cwd(),
    logger: new ConsoleLogger(LogLevel.INFO),
    sharedState: new Map(),
    config: { inPlace: true },
    plugins: [],
  };

  const transformer = new ImportTransformer();
  await transformer.initialize({
    pathMappings: { '@old/': '@new/' },
  });

  try {
    for (const filePath of files) {
      // Create checkpoint before transforming each file
      const backupId = await rollbackHandler.createBackup(
        [filePath],
        `Checkpoint: ${path.basename(filePath)}`
      );
      checkpoints.push({ file: filePath, backupId });

      // Transform file
      const content = await fs.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await transformer.transform(sourceFile, context);

      if (!result.success) {
        throw new Error(`Failed to transform ${filePath}`);
      }

      // Write transformed file
      if (result.transformedFile) {
        const printer = ts.createPrinter();
        const transformedContent = printer.printFile(result.transformedFile);
        await fs.writeFile(filePath, transformedContent);
      }

      context.logger.info(`✓ Transformed: ${filePath}`);
    }

    context.logger.info('All files transformed successfully!');

    // Optional: Clean up checkpoints after successful completion
    for (const checkpoint of checkpoints) {
      await rollbackHandler.deleteBackup(checkpoint.backupId);
    }

  } catch (error) {
    context.logger.error('Transformation failed:', error);

    // Rollback all transformed files
    context.logger.info('Rolling back all changes...');
    for (const checkpoint of checkpoints.reverse()) {
      try {
        await rollbackHandler.restore(checkpoint.backupId);
        context.logger.info(`✓ Rolled back: ${checkpoint.file}`);
      } catch (restoreError) {
        context.logger.error(`Failed to rollback ${checkpoint.file}:`, restoreError);
      }
    }

    throw error;
  } finally {
    await transformer.dispose();
  }
}

/**
 * Example: Transformation with backup retention policy
 */
export async function transformWithBackupRetention(
  files: string[],
  retentionDays: number = 7
): Promise<void> {
  const rollbackHandler = createRollbackHandler('.transformer-history');
  
  // Clean up old backups first
  await rollbackHandler.cleanupOldBackups(retentionDays * 24 * 60 * 60 * 1000);
  
  // Create timestamped backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = await rollbackHandler.createBackup(
    files,
    `Transformation backup ${timestamp}`
  );
  
  // ... perform transformation ...
  
  // List recent backups
  const backups = await rollbackHandler.listBackups();
  console.log(`Total backups: ${backups.length}`);
  console.log('Recent backups:');
  backups.slice(0, 5).forEach(backup => {
    console.log(`- ${backup.description} (${backup.id})`);
  });
}