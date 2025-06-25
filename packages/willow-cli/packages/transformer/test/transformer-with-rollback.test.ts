/**
 * Integration test for transformer with rollback mechanism
 * Task 5.6: Develop rollback mechanism
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ImportTransformer,
  ImportTransformerConfig,
  TransformContext,
  ConsoleLogger,
  LogLevel,
  TransformResult,
  createRollbackHandler,
} from '../src';

describe('Transformer with Rollback Integration', () => {
  const testDir = path.join(process.cwd(), '.test-transform-rollback');
  let context: TransformContext;
  let rollbackHandler: ReturnType<typeof createRollbackHandler>;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    // Create rollback handler
    rollbackHandler = createRollbackHandler(path.join(testDir, '.backups'));

    // Create transform context
    context = {
      program: {} as ts.Program,
      typeChecker: {} as ts.TypeChecker,
      compilerOptions: {},
      workingDirectory: testDir,
      logger: new ConsoleLogger(LogLevel.ERROR),
      sharedState: new Map(),
      config: {},
      plugins: [],
    };
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should rollback transformation on error', async () => {
    // Create test files
    const file1Path = path.join(testDir, 'file1.ts');
    const file2Path = path.join(testDir, 'file2.ts');

    const originalContent1 = `import { Button } from '@old/ui';\nexport default Button;`;
    const originalContent2 = `import utils from 'old-lib';\nexport { utils };`;

    await fs.writeFile(file1Path, originalContent1);
    await fs.writeFile(file2Path, originalContent2);

    // Create backup before transformation
    const backupId = await rollbackHandler.createBackup(
      [file1Path, file2Path],
      'Pre-transformation backup'
    );

    // Configure transformer
    const transformer = new ImportTransformer();
    const config: ImportTransformerConfig = {
      pathMappings: {
        '@old/ui': '@new/ui',
        'old-lib': 'new-lib',
      },
    };

    await transformer.initialize(config);

    // Transform files
    const results: TransformResult[] = [];
    let transformError: Error | null = null;

    try {
      for (const filePath of [file1Path, file2Path]) {
        const content = await fs.readFile(filePath, 'utf-8');
        const sourceFile = ts.createSourceFile(
          filePath,
          content,
          ts.ScriptTarget.Latest,
          true
        );

        const result = await transformer.transform(sourceFile, context);
        results.push(result);

        if (result.success && result.transformedFile) {
          // Write transformed content
          const printer = ts.createPrinter();
          const transformedContent = printer.printFile(result.transformedFile);
          await fs.writeFile(filePath, transformedContent);
        }

        // Simulate an error after first file
        if (filePath === file1Path) {
          throw new Error('Transformation failed!');
        }
      }
    } catch (error) {
      transformError = error as Error;
    }

    // Verify error occurred
    expect(transformError).toBeDefined();
    expect(transformError?.message).toBe('Transformation failed!');

    // Check that first file was transformed
    const transformedContent1 = await fs.readFile(file1Path, 'utf-8');
    expect(transformedContent1).toContain('@new/ui');

    // Check that second file was not transformed
    const content2 = await fs.readFile(file2Path, 'utf-8');
    expect(content2).toBe(originalContent2);

    // Rollback changes
    await rollbackHandler.restore(backupId);

    // Verify files were restored to original state
    const restoredContent1 = await fs.readFile(file1Path, 'utf-8');
    const restoredContent2 = await fs.readFile(file2Path, 'utf-8');

    expect(restoredContent1).toBe(originalContent1);
    expect(restoredContent2).toBe(originalContent2);
  });

  it('should support incremental backups during transformation', async () => {
    // Create test files
    const files = Array.from({ length: 5 }, (_, i) => ({
      path: path.join(testDir, `file${i + 1}.ts`),
      content: `import mod${i + 1} from 'old-mod${i + 1}';`,
    }));

    for (const file of files) {
      await fs.writeFile(file.path, file.content);
    }

    const transformer = new ImportTransformer();
    const config: ImportTransformerConfig = {
      pathMappings: Object.fromEntries(
        files.map((_, i) => [`old-mod${i + 1}`, `new-mod${i + 1}`])
      ),
    };

    await transformer.initialize(config);

    const backupIds: string[] = [];
    const transformedFiles: string[] = [];

    try {
      for (const [index, file] of files.entries()) {
        // Create incremental backup before each transformation
        const backupId = await rollbackHandler.createBackup(
          [file.path],
          `Backup before transforming file${index + 1}`
        );
        backupIds.push(backupId);

        // Transform file
        const content = await fs.readFile(file.path, 'utf-8');
        const sourceFile = ts.createSourceFile(
          file.path,
          content,
          ts.ScriptTarget.Latest,
          true
        );

        const result = await transformer.transform(sourceFile, context);

        if (result.success && result.transformedFile) {
          const printer = ts.createPrinter();
          const transformedContent = printer.printFile(result.transformedFile);
          await fs.writeFile(file.path, transformedContent);
          transformedFiles.push(file.path);
        }

        // Simulate error on third file
        if (index === 2) {
          throw new Error('Transformation interrupted!');
        }
      }
    } catch (error) {
      // Expected error
      expect((error as Error).message).toBe('Transformation interrupted!');
    }

    // Verify first 3 files were transformed
    expect(transformedFiles).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      const content = await fs.readFile(files[i].path, 'utf-8');
      expect(content).toContain(`new-mod${i + 1}`);
    }

    // Verify last 2 files were not transformed
    for (let i = 3; i < 5; i++) {
      const content = await fs.readFile(files[i].path, 'utf-8');
      expect(content).toContain(`old-mod${i + 1}`);
    }

    // Rollback transformed files one by one
    for (let i = 2; i >= 0; i--) {
      await rollbackHandler.restore(backupIds[i]);
      const content = await fs.readFile(files[i].path, 'utf-8');
      expect(content).toBe(files[i].content);
    }
  });

  it('should list and manage multiple backup versions', async () => {
    const testFile = path.join(testDir, 'versioned.ts');
    
    // Version 1
    await fs.writeFile(testFile, 'const version = 1;');
    const backup1 = await rollbackHandler.createBackup([testFile], 'Version 1');
    await new Promise(resolve => setTimeout(resolve, 10));

    // Version 2
    await fs.writeFile(testFile, 'const version = 2;');
    const backup2 = await rollbackHandler.createBackup([testFile], 'Version 2');
    await new Promise(resolve => setTimeout(resolve, 10));

    // Version 3
    await fs.writeFile(testFile, 'const version = 3;');
    const backup3 = await rollbackHandler.createBackup([testFile], 'Version 3');

    // List all backups
    const backups = await rollbackHandler.listBackups();
    expect(backups).toHaveLength(3);
    expect(backups[0].description).toBe('Version 3');
    expect(backups[1].description).toBe('Version 2');
    expect(backups[2].description).toBe('Version 1');

    // Restore to version 1
    await rollbackHandler.restore(backup1);
    let content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBe('const version = 1;');

    // Restore to version 3
    await rollbackHandler.restore(backup3);
    content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBe('const version = 3;');

    // Delete middle backup
    await rollbackHandler.deleteBackup(backup2);
    const remainingBackups = await rollbackHandler.listBackups();
    expect(remainingBackups).toHaveLength(2);
    expect(remainingBackups.find(b => b.description === 'Version 2')).toBeUndefined();
  });

  it('should handle transformation with automatic cleanup', async () => {
    const testFile = path.join(testDir, 'auto-cleanup.ts');
    await fs.writeFile(testFile, 'import x from "old";');

    const transformer = new ImportTransformer();
    await transformer.initialize({
      pathMappings: { 'old': 'new' },
    });

    // Create backup
    const backupId = await rollbackHandler.createBackup([testFile], 'Auto-cleanup test');

    // Transform
    const content = await fs.readFile(testFile, 'utf-8');
    const sourceFile = ts.createSourceFile(testFile, content, ts.ScriptTarget.Latest, true);
    const result = await transformer.transform(sourceFile, context);

    if (result.success && result.transformedFile) {
      const printer = ts.createPrinter();
      const transformedContent = printer.printFile(result.transformedFile);
      await fs.writeFile(testFile, transformedContent);

      // Verify transformation
      const newContent = await fs.readFile(testFile, 'utf-8');
      expect(newContent).toContain('import x from "new"');

      // If transformation is successful, we might want to delete the backup
      // to save space (optional based on strategy)
      await rollbackHandler.deleteBackup(backupId);

      // Verify backup was deleted
      const backups = await rollbackHandler.listBackups();
      expect(backups.find(b => b.id === backupId)).toBeUndefined();
    }
  });
});