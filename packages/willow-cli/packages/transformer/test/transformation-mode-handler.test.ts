/**
 * Tests for transformation mode handler
 * Task 5.7: Build in-place vs copy transformation modes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';
import {
  TransformationModeHandler,
  TransformationModeOptions,
  createTransformationModeHandler,
} from '../src/transformation-mode-handler';
import { ConsoleLogger, LogLevel, createRollbackHandler } from '../src/index';

describe('TransformationModeHandler', () => {
  const testDir = path.join(process.cwd(), '.test-transform-modes');
  const sourceDir = path.join(testDir, 'src');
  const outputDir = path.join(testDir, 'dist');
  let handler: TransformationModeHandler;
  let mockLogger: ConsoleLogger;

  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Create mock logger
    mockLogger = new ConsoleLogger(LogLevel.ERROR);
    vi.spyOn(mockLogger, 'info').mockImplementation(() => {});
    vi.spyOn(mockLogger, 'warn').mockImplementation(() => {});
    vi.spyOn(mockLogger, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    vi.restoreAllMocks();
  });

  describe('Configuration validation', () => {
    it('should throw error if neither inPlace nor outputDir is specified', async () => {
      const options: TransformationModeOptions = {
        config: {
          inPlace: false,
          // outputDir not specified
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      
      await expect(handler.prepare([])).rejects.toThrow(
        'Either inPlace must be true or outputDir must be specified'
      );
    });

    it('should warn if both inPlace and outputDir are specified', async () => {
      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
          outputDir: outputDir,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare([]);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Both inPlace and outputDir specified. Using outputDir mode.'
      );
    });
  });

  describe('In-place transformation', () => {
    it('should transform files in place', async () => {
      const testFile = path.join(sourceDir, 'test.ts');
      const originalContent = 'const x = 1;';
      const transformedContent = 'const x = 2;';

      await fs.writeFile(testFile, originalContent);

      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare([testFile]);

      const sourceFile = ts.createSourceFile(
        testFile,
        originalContent,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await handler.transformFile(sourceFile, transformedContent);

      expect(result.sourcePath).toBe(testFile);
      expect(result.outputPath).toBe(testFile);
      expect(result.written).toBe(true);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(transformedContent);
    });

    it('should not write if content unchanged', async () => {
      const testFile = path.join(sourceDir, 'unchanged.ts');
      const content = 'const unchanged = true;';

      await fs.writeFile(testFile, content);
      const originalStats = await fs.stat(testFile);

      // Wait a bit to ensure mtime would change if file was written
      await new Promise(resolve => setTimeout(resolve, 10));

      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      
      const sourceFile = ts.createSourceFile(
        testFile,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      await handler.transformFile(sourceFile, content);

      const newStats = await fs.stat(testFile);
      expect(newStats.mtime.getTime()).toBe(originalStats.mtime.getTime());
    });

    it('should create backup before in-place transformation', async () => {
      const testFile = path.join(sourceDir, 'backup-test.ts');
      const originalContent = 'const original = 1;';
      const transformedContent = 'const transformed = 2;';

      await fs.writeFile(testFile, originalContent);

      const rollbackHandler = createRollbackHandler(path.join(testDir, '.backups'));
      
      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
          createBackups: true,
        },
        logger: mockLogger,
        rollbackHandler,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare([testFile]);

      const sourceFile = ts.createSourceFile(
        testFile,
        originalContent,
        ts.ScriptTarget.Latest,
        true
      );

      await handler.transformFile(sourceFile, transformedContent);

      // Verify transformation
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(transformedContent);

      // Verify backup was created
      const backups = await rollbackHandler.listBackups();
      expect(backups).toHaveLength(1);
      expect(backups[0].files).toContain(testFile);
    });
  });

  describe('Copy transformation', () => {
    it('should copy transformed files to output directory', async () => {
      const testFile = path.join(sourceDir, 'copy-test.ts');
      const originalContent = 'export const a = 1;';
      const transformedContent = 'export const a = 2;';

      await fs.writeFile(testFile, originalContent);

      const options: TransformationModeOptions = {
        config: {
          outputDir: outputDir,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare([testFile]);

      const sourceFile = ts.createSourceFile(
        testFile,
        originalContent,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await handler.transformFile(sourceFile, transformedContent);

      const expectedOutput = path.join(outputDir, 'copy-test.ts');
      expect(result.outputPath).toBe(expectedOutput);
      expect(result.written).toBe(true);

      // Original should be unchanged
      const originalFileContent = await fs.readFile(testFile, 'utf-8');
      expect(originalFileContent).toBe(originalContent);

      // Output should have transformed content
      const outputContent = await fs.readFile(expectedOutput, 'utf-8');
      expect(outputContent).toBe(transformedContent);
    });

    it('should preserve directory structure when requested', async () => {
      const nestedFile = path.join(sourceDir, 'nested/deep/file.ts');
      const content = 'export default {}';

      await fs.mkdir(path.dirname(nestedFile), { recursive: true });
      await fs.writeFile(nestedFile, content);

      const options: TransformationModeOptions = {
        config: {
          outputDir: outputDir,
        },
        logger: mockLogger,
        preserveStructure: true,
        baseDir: sourceDir,
      };

      handler = createTransformationModeHandler(options);
      
      const outputPath = handler.getOutputPath(nestedFile);
      const expectedPath = path.join(outputDir, 'nested/deep/file.ts');
      
      expect(outputPath).toBe(expectedPath);
    });

    it('should flatten structure by default', async () => {
      const nestedFile = path.join(sourceDir, 'nested/file.ts');
      
      const options: TransformationModeOptions = {
        config: {
          outputDir: outputDir,
        },
        logger: mockLogger,
        preserveStructure: false,
      };

      handler = createTransformationModeHandler(options);
      
      const outputPath = handler.getOutputPath(nestedFile);
      const expectedPath = path.join(outputDir, 'file.ts');
      
      expect(outputPath).toBe(expectedPath);
    });

    it('should copy file metadata', async () => {
      const testFile = path.join(sourceDir, 'metadata.ts');
      await fs.writeFile(testFile, 'const x = 1;');
      
      // Set specific permissions
      await fs.chmod(testFile, 0o644);
      const originalStats = await fs.stat(testFile);

      const options: TransformationModeOptions = {
        config: {
          outputDir: outputDir,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      
      const sourceFile = ts.createSourceFile(
        testFile,
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      await handler.transformFile(sourceFile, 'const x = 2;');

      const outputFile = path.join(outputDir, 'metadata.ts');
      const outputStats = await fs.stat(outputFile);

      expect(outputStats.mode).toBe(originalStats.mode);
    });
  });

  describe('Dry run mode', () => {
    it('should not write files in dry run mode', async () => {
      const testFile = path.join(sourceDir, 'dry-run.ts');
      const originalContent = 'const dry = true;';
      const transformedContent = 'const dry = false;';

      await fs.writeFile(testFile, originalContent);

      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
          dryRun: true,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare([testFile]);

      const sourceFile = ts.createSourceFile(
        testFile,
        originalContent,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await handler.transformFile(sourceFile, transformedContent);

      expect(result.written).toBe(false);
      expect(result.preview).toBeDefined();

      // File should be unchanged
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(originalContent);
    });

    it('should generate preview of changes', async () => {
      const testFile = path.join(sourceDir, 'preview.ts');
      const originalContent = 'const a = 1;\nconst b = 2;';
      const transformedContent = 'const a = 10;\nconst b = 20;';

      await fs.writeFile(testFile, originalContent);

      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
          dryRun: true,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      
      const sourceFile = ts.createSourceFile(
        testFile,
        originalContent,
        ts.ScriptTarget.Latest,
        true
      );

      const result = await handler.transformFile(sourceFile, transformedContent);

      expect(result.preview).toContain('- const a = 1;');
      expect(result.preview).toContain('+ const a = 10;');
      expect(result.preview).toContain('- const b = 2;');
      expect(result.preview).toContain('+ const b = 20;');
    });

    it('should not create output directory in dry run', async () => {
      const nonExistentOutput = path.join(testDir, 'non-existent-output');
      
      const options: TransformationModeOptions = {
        config: {
          outputDir: nonExistentOutput,
          dryRun: true,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare([]);

      // Directory should not exist
      await expect(fs.access(nonExistentOutput)).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle file write errors', async () => {
      const testFile = path.join(sourceDir, 'error.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      // Make directory read-only to cause write error
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir, { mode: 0o444 });

      const options: TransformationModeOptions = {
        config: {
          outputDir: readOnlyDir,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      
      const sourceFile = ts.createSourceFile(
        testFile,
        'const x = 1;',
        ts.ScriptTarget.Latest,
        true
      );

      const result = await handler.transformFile(sourceFile, 'const x = 2;');

      expect(result.written).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should rollback on failure', async () => {
      const testFile = path.join(sourceDir, 'rollback.ts');
      const originalContent = 'const original = true;';
      await fs.writeFile(testFile, originalContent);

      const rollbackHandler = createRollbackHandler(path.join(testDir, '.backups'));
      
      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
          createBackups: true,
        },
        logger: mockLogger,
        rollbackHandler,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare([testFile]);

      // Complete with failure
      await handler.complete(false);

      // File should still have original content
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(originalContent);
    });
  });

  describe('File tracking', () => {
    it('should track processed files', async () => {
      const files = [
        path.join(sourceDir, 'file1.ts'),
        path.join(sourceDir, 'file2.ts'),
      ];

      for (const file of files) {
        await fs.writeFile(file, 'export {}');
      }

      const options: TransformationModeOptions = {
        config: {
          inPlace: true,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare(files);

      for (const file of files) {
        const sourceFile = ts.createSourceFile(
          file,
          'export {}',
          ts.ScriptTarget.Latest,
          true
        );
        await handler.transformFile(sourceFile, 'export {}');
      }

      const processed = handler.getProcessedFiles();
      expect(processed).toHaveLength(2);
      expect(processed).toContain(files[0]);
      expect(processed).toContain(files[1]);

      expect(handler.isProcessed(files[0])).toBe(true);
      expect(handler.isProcessed('non-existent.ts')).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle mixed file transformations', async () => {
      const files = [
        { path: path.join(sourceDir, 'success1.ts'), content: 'const a = 1;' },
        { path: path.join(sourceDir, 'success2.ts'), content: 'const b = 2;' },
        { path: path.join(sourceDir, 'skip.ts'), content: 'const c = 3;' },
      ];

      for (const file of files) {
        await fs.writeFile(file.path, file.content);
      }

      const options: TransformationModeOptions = {
        config: {
          outputDir: outputDir,
        },
        logger: mockLogger,
      };

      handler = createTransformationModeHandler(options);
      await handler.prepare(files.map(f => f.path));

      // Transform only first two files
      for (let i = 0; i < 2; i++) {
        const sourceFile = ts.createSourceFile(
          files[i].path,
          files[i].content,
          ts.ScriptTarget.Latest,
          true
        );
        await handler.transformFile(sourceFile, files[i].content.replace('=', '='));
      }

      await handler.complete(true);

      // Check processed files
      const processed = handler.getProcessedFiles();
      expect(processed).toHaveLength(2);
      expect(handler.isProcessed(files[2].path)).toBe(false);
    });

    it('should support complex directory structures', async () => {
      const complexFiles = [
        'index.ts',
        'utils/helper.ts',
        'components/Button.tsx',
        'components/forms/Input.tsx',
        'tests/unit/helper.test.ts',
      ];

      for (const relPath of complexFiles) {
        const fullPath = path.join(sourceDir, relPath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, `// ${relPath}`);
      }

      const options: TransformationModeOptions = {
        config: {
          outputDir: outputDir,
        },
        logger: mockLogger,
        preserveStructure: true,
        baseDir: sourceDir,
      };

      handler = createTransformationModeHandler(options);

      for (const relPath of complexFiles) {
        const fullPath = path.join(sourceDir, relPath);
        const outputPath = handler.getOutputPath(fullPath);
        const expectedPath = path.join(outputDir, relPath);
        
        expect(outputPath).toBe(expectedPath);
      }
    });
  });
});