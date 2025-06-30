/**
 * File Writer
 * Handles file system operations for code generation with conflict resolution
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  IFileWriter,
  FileWriterConfig,
  FileWriteResult,
  FileWriteAction,
  ConflictResolution,
  CodeGenerationResult,
} from './types';

export class FileWriter implements IFileWriter {
  /**
   * Write multiple files to the file system
   */
  async writeFiles(
    files: CodeGenerationResult[],
    config: FileWriterConfig
  ): Promise<FileWriteResult[]> {
    const results: FileWriteResult[] = [];

    // Create output directory if it doesn't exist
    if (config.createDirectories !== false) {
      await this.createDirectory(config.outputDir);
    }

    // Process files in parallel for better performance
    const writePromises = files.map((file) => this.writeFile(file, config));
    const writeResults = await Promise.allSettled(writePromises);

    for (let i = 0; i < writeResults.length; i++) {
      const result = writeResults[i];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Handle failed writes
        results.push({
          filePath: files[i].filePath,
          success: false,
          action: FileWriteAction.Failed,
          error: result.reason,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Write a single file to the file system
   */
  async writeFile(file: CodeGenerationResult, config: FileWriterConfig): Promise<FileWriteResult> {
    const timestamp = new Date();
    const fullPath = path.isAbsolute(file.filePath)
      ? file.filePath
      : path.join(config.outputDir, file.filePath);

    try {
      // Ensure directory exists
      if (config.createDirectories !== false) {
        await this.createDirectory(path.dirname(fullPath));
      }

      // Check if file exists
      const fileExists = await this.exists(fullPath);

      if (fileExists) {
        return await this.handleExistingFile(file, fullPath, config, timestamp);
      } else {
        return await this.createNewFile(file, fullPath, config, timestamp);
      }
    } catch (error) {
      return {
        filePath: fullPath,
        success: false,
        action: FileWriteAction.Failed,
        error: error as Error,
        timestamp,
      };
    }
  }

  /**
   * Handle writing to an existing file based on conflict resolution strategy
   */
  private async handleExistingFile(
    file: CodeGenerationResult,
    fullPath: string,
    config: FileWriterConfig,
    timestamp: Date
  ): Promise<FileWriteResult> {
    const existingContent = await fs.readFile(fullPath, 'utf-8');

    // Check if content is the same (no need to write)
    if (existingContent === file.code) {
      return {
        filePath: fullPath,
        success: true,
        action: FileWriteAction.Skipped,
        timestamp,
        size: Buffer.byteLength(file.code, 'utf-8'),
      };
    }

    switch (config.conflictResolution) {
      case ConflictResolution.Overwrite:
        return await this.overwriteFile(file, fullPath, config, timestamp);

      case ConflictResolution.Skip:
        return {
          filePath: fullPath,
          success: true,
          action: FileWriteAction.Skipped,
          timestamp,
        };

      case ConflictResolution.Merge:
        return await this.mergeFile(file, fullPath, existingContent, config, timestamp);

      case ConflictResolution.Custom:
        if (!config.customResolver) {
          throw new Error('Custom resolver not provided for custom conflict resolution');
        }
        return await this.customResolveFile(file, fullPath, existingContent, config, timestamp);

      case ConflictResolution.Suffix:
        return await this.writeSuffixFile(file, fullPath, config, timestamp);

      case ConflictResolution.Prompt:
        // For now, default to overwrite (in a real CLI, this would prompt the user)
        console.warn(`Conflict detected for ${fullPath}, defaulting to overwrite`);
        return await this.overwriteFile(file, fullPath, config, timestamp);

      default:
        throw new Error(`Unknown conflict resolution strategy: ${config.conflictResolution}`);
    }
  }

  /**
   * Create a new file
   */
  private async createNewFile(
    file: CodeGenerationResult,
    fullPath: string,
    config: FileWriterConfig,
    timestamp: Date
  ): Promise<FileWriteResult> {
    const buffer = Buffer.from(file.code, 'utf-8');

    await fs.writeFile(fullPath, buffer, {
      mode: config.fileMode || 0o644,
    });

    return {
      filePath: fullPath,
      success: true,
      action: FileWriteAction.Created,
      timestamp,
      size: buffer.length,
    };
  }

  /**
   * Overwrite existing file with backup if requested
   */
  private async overwriteFile(
    file: CodeGenerationResult,
    fullPath: string,
    config: FileWriterConfig,
    timestamp: Date
  ): Promise<FileWriteResult> {
    let backupPath: string | undefined;

    // Create backup if requested
    if (config.createBackups) {
      backupPath = await this.backupFile(fullPath);
    }

    const buffer = Buffer.from(file.code, 'utf-8');

    await fs.writeFile(fullPath, buffer, {
      mode: config.fileMode || 0o644,
    });

    return {
      filePath: fullPath,
      success: true,
      action: FileWriteAction.Overwritten,
      timestamp,
      size: buffer.length,
      backupPath,
    };
  }

  /**
   * Merge file content (basic implementation)
   */
  private async mergeFile(
    file: CodeGenerationResult,
    fullPath: string,
    existingContent: string,
    config: FileWriterConfig,
    timestamp: Date
  ): Promise<FileWriteResult> {
    // Simple merge strategy: append new content after existing content
    // In a real implementation, you might want more sophisticated merging
    const mergedContent = this.mergeContent(existingContent, file.code, fullPath);

    let backupPath: string | undefined;
    if (config.createBackups) {
      backupPath = await this.backupFile(fullPath);
    }

    const buffer = Buffer.from(mergedContent, 'utf-8');

    await fs.writeFile(fullPath, buffer, {
      mode: config.fileMode || 0o644,
    });

    return {
      filePath: fullPath,
      success: true,
      action: FileWriteAction.Merged,
      timestamp,
      size: buffer.length,
      backupPath,
    };
  }

  /**
   * Use custom resolver for conflict resolution
   */
  private async customResolveFile(
    file: CodeGenerationResult,
    fullPath: string,
    existingContent: string,
    config: FileWriterConfig,
    timestamp: Date
  ): Promise<FileWriteResult> {
    if (!config.customResolver) {
      throw new Error('Custom resolver not provided');
    }

    const resolvedContent = await config.customResolver(existingContent, file.code, fullPath);

    let backupPath: string | undefined;
    if (config.createBackups) {
      backupPath = await this.backupFile(fullPath);
    }

    const buffer = Buffer.from(resolvedContent, 'utf-8');

    await fs.writeFile(fullPath, buffer, {
      mode: config.fileMode || 0o644,
    });

    return {
      filePath: fullPath,
      success: true,
      action: FileWriteAction.Merged,
      timestamp,
      size: buffer.length,
      backupPath,
    };
  }

  /**
   * Write file with suffix to avoid conflicts
   */
  private async writeSuffixFile(
    file: CodeGenerationResult,
    fullPath: string,
    config: FileWriterConfig,
    timestamp: Date
  ): Promise<FileWriteResult> {
    const suffixedPath = await this.generateSuffixedPath(fullPath);

    const buffer = Buffer.from(file.code, 'utf-8');

    await fs.writeFile(suffixedPath, buffer, {
      mode: config.fileMode || 0o644,
    });

    return {
      filePath: suffixedPath,
      success: true,
      action: FileWriteAction.Created,
      timestamp,
      size: buffer.length,
    };
  }

  /**
   * Create directory recursively
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, {
        recursive: true,
        mode: 0o755,
      });
    } catch (error) {
      // Ignore EEXIST errors
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Backup existing file
   */
  async backupFile(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    const backupPath = path.join(dir, `${base}.backup.${timestamp}${ext}`);

    await fs.copyFile(filePath, backupPath);

    return backupPath;
  }

  /**
   * Generate a unique suffixed path
   */
  private async generateSuffixedPath(filePath: string): Promise<string> {
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    let counter = 1;
    let suffixedPath: string;

    do {
      suffixedPath = path.join(dir, `${base}.${counter}${ext}`);
      counter++;
    } while (await this.exists(suffixedPath));

    return suffixedPath;
  }

  /**
   * Basic content merging strategy
   */
  private mergeContent(existing: string, newContent: string, filePath: string): string {
    // Check file extension to determine merge strategy
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
        return this.mergeJsonContent(existing, newContent);
      case '.ts':
      case '.js':
      case '.tsx':
      case '.jsx':
        return this.mergeCodeContent(existing, newContent);
      case '.md':
        return this.mergeMarkdownContent(existing, newContent);
      default:
        // Default: simple append with separator
        return `${existing}\n\n/* ========== GENERATED CONTENT ========== */\n\n${newContent}`;
    }
  }

  /**
   * Merge JSON content
   */
  private mergeJsonContent(existing: string, newContent: string): string {
    try {
      const existingObj = JSON.parse(existing);
      const newObj = JSON.parse(newContent);

      // Deep merge objects
      const merged = this.deepMerge(existingObj, newObj);

      return JSON.stringify(merged, null, 2);
    } catch {
      // If parsing fails, fall back to simple append
      return `${existing}\n\n/* ========== GENERATED CONTENT ========== */\n\n${newContent}`;
    }
  }

  /**
   * Merge code content (TypeScript/JavaScript)
   */
  private mergeCodeContent(existing: string, newContent: string): string {
    // Simple strategy: append with clear separator and comment
    return `${existing}\n\n// ========== GENERATED CODE ==========\n\n${newContent}`;
  }

  /**
   * Merge Markdown content
   */
  private mergeMarkdownContent(existing: string, newContent: string): string {
    return `${existing}\n\n---\n\n## Generated Content\n\n${newContent}`;
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    if (source === null || typeof source !== 'object') {
      return source;
    }

    if (target === null || typeof target !== 'object') {
      return source;
    }

    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }
}

/**
 * Default file writer configuration
 */
export const defaultFileWriterConfig: Partial<FileWriterConfig> = {
  conflictResolution: ConflictResolution.Prompt,
  createBackups: true,
  createDirectories: true,
  fileMode: 0o644,
  dirMode: 0o755,
  overwriteReadonly: false,
};

/**
 * Create a file writer with default configuration
 */
export function createFileWriter(config?: Partial<FileWriterConfig>): FileWriter {
  return new FileWriter();
}
