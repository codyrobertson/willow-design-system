/**
 * Tests for FileWriter class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileWriter, defaultFileWriterConfig } from './file-writer';
import {
  FileWriterConfig,
  ConflictResolution,
  FileWriteAction,
  CodeGenerationResult,
} from './types';

// Mock fs module
vi.mock('fs/promises');

const mockFs = vi.mocked(fs);

describe('FileWriter', () => {
  let fileWriter: FileWriter;
  let testConfig: FileWriterConfig;
  let mockFile: CodeGenerationResult;

  beforeEach(() => {
    fileWriter = new FileWriter();
    testConfig = {
      outputDir: '/test/output',
      conflictResolution: ConflictResolution.Overwrite,
      createBackups: false,
      createDirectories: true,
    };
    mockFile = {
      code: 'console.log("Hello, World!");',
      filePath: 'test.js',
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('writeFile', () => {
    it('should create a new file when it does not exist', async () => {
      // Mock file doesn't exist
      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await fileWriter.writeFile(mockFile, testConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Created);
      expect(result.filePath).toBe('/test/output/test.js');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/output/test.js',
        Buffer.from('console.log("Hello, World!");', 'utf-8'),
        { mode: 0o644 }
      );
    });

    it('should skip file when it exists and content is the same', async () => {
      // Mock file exists with same content
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('console.log("Hello, World!");');
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await fileWriter.writeFile(mockFile, testConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Skipped);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should overwrite file when conflict resolution is set to overwrite', async () => {
      // Mock file exists with different content
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('different content');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await fileWriter.writeFile(mockFile, testConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Overwritten);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should skip file when conflict resolution is set to skip', async () => {
      const skipConfig = { ...testConfig, conflictResolution: ConflictResolution.Skip };

      // Mock file exists with different content
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('different content');
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await fileWriter.writeFile(mockFile, skipConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Skipped);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should create backup when requested', async () => {
      const backupConfig = {
        ...testConfig,
        createBackups: true,
        conflictResolution: ConflictResolution.Overwrite,
      };

      // Mock file exists
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('existing content');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.copyFile.mockResolvedValue(undefined);

      const result = await fileWriter.writeFile(mockFile, backupConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Overwritten);
      expect(result.backupPath).toBeDefined();
      expect(mockFs.copyFile).toHaveBeenCalled();
    });

    it('should handle write errors gracefully', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const result = await fileWriter.writeFile(mockFile, testConfig);

      expect(result.success).toBe(false);
      expect(result.action).toBe(FileWriteAction.Failed);
      expect(result.error).toBeDefined();
    });

    it('should use absolute path when provided', async () => {
      const absoluteFile = {
        ...mockFile,
        filePath: '/absolute/path/test.js',
      };

      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await fileWriter.writeFile(absoluteFile, testConfig);

      expect(result.filePath).toBe('/absolute/path/test.js');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/absolute/path/test.js',
        expect.any(Buffer),
        expect.any(Object)
      );
    });
  });

  describe('writeFiles', () => {
    it('should write multiple files successfully', async () => {
      const files: CodeGenerationResult[] = [
        { code: 'file1 content', filePath: 'file1.js' },
        { code: 'file2 content', filePath: 'file2.js' },
      ];

      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const results = await fileWriter.writeFiles(files, testConfig);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure results', async () => {
      const files: CodeGenerationResult[] = [
        { code: 'file1 content', filePath: 'file1.js' },
        { code: 'file2 content', filePath: 'file2.js' },
      ];

      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Write failed'));

      const results = await fileWriter.writeFiles(files, testConfig);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].action).toBe(FileWriteAction.Failed);
    });
  });

  describe('createDirectory', () => {
    it('should create directory recursively', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);

      await fileWriter.createDirectory('/test/deep/path');

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/deep/path', {
        recursive: true,
        mode: 0o755,
      });
    });

    it('should ignore EEXIST errors', async () => {
      const eexistError = new Error('Directory exists') as NodeJS.ErrnoException;
      eexistError.code = 'EEXIST';
      mockFs.mkdir.mockRejectedValue(eexistError);

      await expect(fileWriter.createDirectory('/test/path')).resolves.toBeUndefined();
    });

    it('should throw non-EEXIST errors', async () => {
      const permissionError = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValue(permissionError);

      await expect(fileWriter.createDirectory('/test/path')).rejects.toThrow('Permission denied');
    });
  });

  describe('exists', () => {
    it('should return true when file exists', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await fileWriter.exists('/test/file.js');

      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await fileWriter.exists('/test/file.js');

      expect(result).toBe(false);
    });
  });

  describe('backupFile', () => {
    it('should create backup with timestamp', async () => {
      mockFs.copyFile.mockResolvedValue(undefined);

      // Mock Date to have predictable timestamps
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      vi.setSystemTime(mockDate);

      const backupPath = await fileWriter.backupFile('/test/file.js');

      expect(backupPath).toMatch(/file\.backup\..*\.js$/);
      expect(mockFs.copyFile).toHaveBeenCalledWith('/test/file.js', backupPath);

      vi.useRealTimers();
    });
  });

  describe('conflict resolution strategies', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('existing content');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should merge JSON content when strategy is merge', async () => {
      const mergeConfig = { ...testConfig, conflictResolution: ConflictResolution.Merge };
      const jsonFile = {
        code: '{"new": "value"}',
        filePath: 'config.json',
      };

      mockFs.readFile.mockResolvedValue('{"existing": "value"}');

      const result = await fileWriter.writeFile(jsonFile, mergeConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Merged);
    });

    it('should use custom resolver when strategy is custom', async () => {
      const customResolver = vi.fn().mockResolvedValue('custom resolved content');
      const customConfig = {
        ...testConfig,
        conflictResolution: ConflictResolution.Custom,
        customResolver,
      };

      const result = await fileWriter.writeFile(mockFile, customConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Merged);
      expect(customResolver).toHaveBeenCalledWith(
        'existing content',
        'console.log("Hello, World!");',
        '/test/output/test.js'
      );
    });

    it('should create suffixed file when strategy is suffix', async () => {
      const suffixConfig = { ...testConfig, conflictResolution: ConflictResolution.Suffix };

      // Mock that the original file exists but suffixed doesn't
      mockFs.access
        .mockResolvedValueOnce(undefined) // Original exists
        .mockRejectedValueOnce(new Error('ENOENT')); // Suffix doesn't exist

      const result = await fileWriter.writeFile(mockFile, suffixConfig);

      expect(result.success).toBe(true);
      expect(result.action).toBe(FileWriteAction.Created);
      expect(result.filePath).toMatch(/test\.1\.js$/);
    });

    it('should return error for custom strategy without resolver', async () => {
      const customConfig = {
        ...testConfig,
        conflictResolution: ConflictResolution.Custom,
        // No customResolver provided
      };

      const result = await fileWriter.writeFile(mockFile, customConfig);

      expect(result.success).toBe(false);
      expect(result.action).toBe(FileWriteAction.Failed);
      expect(result.error?.message).toBe(
        'Custom resolver not provided for custom conflict resolution'
      );
    });
  });

  describe('content merging', () => {
    it('should merge code content with proper separators', async () => {
      const mergeConfig = { ...testConfig, conflictResolution: ConflictResolution.Merge };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('existing code');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await fileWriter.writeFile(mockFile, mergeConfig);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenContent = writeCall[1].toString();

      expect(writtenContent).toContain('existing code');
      expect(writtenContent).toContain('console.log("Hello, World!");');
      expect(writtenContent).toContain('// ========== GENERATED CODE ==========');
    });

    it('should merge markdown content with proper formatting', async () => {
      const mergeConfig = { ...testConfig, conflictResolution: ConflictResolution.Merge };
      const mdFile = {
        code: '# New Section',
        filePath: 'README.md',
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('# Existing Content');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await fileWriter.writeFile(mdFile, mergeConfig);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenContent = writeCall[1].toString();

      expect(writtenContent).toContain('# Existing Content');
      expect(writtenContent).toContain('# New Section');
      expect(writtenContent).toContain('## Generated Content');
    });
  });

  describe('default configuration', () => {
    it('should provide sensible defaults', () => {
      expect(defaultFileWriterConfig.conflictResolution).toBe(ConflictResolution.Prompt);
      expect(defaultFileWriterConfig.createBackups).toBe(true);
      expect(defaultFileWriterConfig.createDirectories).toBe(true);
      expect(defaultFileWriterConfig.fileMode).toBe(0o644);
      expect(defaultFileWriterConfig.dirMode).toBe(0o755);
    });
  });
});
