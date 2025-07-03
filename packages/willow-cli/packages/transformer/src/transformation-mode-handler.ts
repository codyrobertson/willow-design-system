/**
 * Transformation mode handler for in-place vs copy transformations
 * Task 5.7: Build in-place vs copy transformation modes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';
import { TransformerConfig, Logger, RollbackHandler } from './index';

/**
 * Options for transformation mode
 */
export interface TransformationModeOptions {
  /**
   * Transformer configuration
   */
  config: TransformerConfig;

  /**
   * Logger instance
   */
  logger: Logger;

  /**
   * Optional rollback handler
   */
  rollbackHandler?: RollbackHandler;

  /**
   * Whether to preserve directory structure in output
   */
  preserveStructure?: boolean;

  /**
   * Base directory for relative path calculation
   */
  baseDir?: string;
}

/**
 * Result of a file transformation
 */
export interface FileTransformResult {
  /**
   * Original file path
   */
  sourcePath: string;

  /**
   * Output file path (may be same as source for in-place)
   */
  outputPath: string;

  /**
   * Whether the file was actually written
   */
  written: boolean;

  /**
   * Error if transformation failed
   */
  error?: Error;

  /**
   * Preview of changes (for dry run)
   */
  preview?: string;
}

/**
 * Handler for different transformation modes
 */
export class TransformationModeHandler {
  private options: TransformationModeOptions;
  private processedFiles = new Set<string>();
  private backupId?: string;

  constructor(options: TransformationModeOptions) {
    this.options = options;
  }

  /**
   * Prepare for transformation
   */
  async prepare(files: string[]): Promise<void> {
    const { config, logger, rollbackHandler } = this.options;

    // Validate configuration
    if (!config.inPlace && !config.outputDir) {
      throw new Error('Either inPlace must be true or outputDir must be specified');
    }

    if (config.inPlace && config.outputDir) {
      logger.warn('Both inPlace and outputDir specified. Using outputDir mode.');
    }

    // Create output directory if needed
    if (config.outputDir && !config.dryRun) {
      await fs.mkdir(config.outputDir, { recursive: true });
      logger.info(`Created output directory: ${config.outputDir}`);
    }

    // Create backup if requested and in-place mode
    if (config.createBackups && config.inPlace && !config.dryRun && rollbackHandler) {
      logger.info('Creating backup before in-place transformation...');
      this.backupId = await rollbackHandler.createBackup(
        files,
        'Pre-transformation backup'
      );
      logger.info(`Backup created: ${this.backupId}`);
    }

    // Clear processed files
    this.processedFiles.clear();
  }

  /**
   * Transform a single file
   */
  async transformFile(
    sourceFile: ts.SourceFile,
    transformedContent: string
  ): Promise<FileTransformResult> {
    const { config, logger } = this.options;
    const sourcePath = sourceFile.fileName;

    try {
      // Determine output path
      const outputPath = this.getOutputPath(sourcePath);

      // Handle dry run
      if (config.dryRun) {
        const preview = await this.generatePreview(sourcePath, transformedContent);
        logger.info(`[DRY RUN] Would transform: ${sourcePath} -> ${outputPath}`);
        
        return {
          sourcePath,
          outputPath,
          written: false,
          preview,
        };
      }

      // Handle copy mode
      if (!config.inPlace || config.outputDir) {
        await this.copyModeTransform(sourcePath, outputPath, transformedContent);
      } else {
        // Handle in-place mode
        await this.inPlaceTransform(sourcePath, transformedContent);
      }

      this.processedFiles.add(sourcePath);
      logger.info(`Transformed: ${sourcePath} -> ${outputPath}`);

      return {
        sourcePath,
        outputPath,
        written: true,
      };

    } catch (error) {
      logger.error(`Failed to transform ${sourcePath}:`, error);
      
      return {
        sourcePath,
        outputPath: sourcePath,
        written: false,
        error: error as Error,
      };
    }
  }

  /**
   * Get output path for a source file
   */
  getOutputPath(sourcePath: string): string {
    const { config } = this.options;

    // Copy mode with output directory takes precedence
    if (config.outputDir) {
      if (this.options.preserveStructure && this.options.baseDir) {
        // Preserve directory structure
        const relativePath = path.relative(this.options.baseDir, sourcePath);
        return path.join(config.outputDir, relativePath);
      } else {
        // Flatten structure
        return path.join(config.outputDir, path.basename(sourcePath));
      }
    }

    // In-place mode (default)
    return sourcePath;
  }

  /**
   * Perform in-place transformation
   */
  private async inPlaceTransform(
    filePath: string,
    content: string
  ): Promise<void> {
    // Read current content for comparison
    const currentContent = await fs.readFile(filePath, 'utf-8');
    
    // Only write if content changed
    if (currentContent !== content) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  }

  /**
   * Perform copy mode transformation
   */
  private async copyModeTransform(
    sourcePath: string,
    outputPath: string,
    content: string
  ): Promise<void> {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write transformed content
    await fs.writeFile(outputPath, content, 'utf-8');

    // Copy file metadata (permissions, timestamps)
    try {
      const stats = await fs.stat(sourcePath);
      await fs.chmod(outputPath, stats.mode);
      await fs.utimes(outputPath, stats.atime, stats.mtime);
    } catch (error) {
      // Non-critical error, log and continue
      this.options.logger.warn(`Failed to copy metadata for ${outputPath}:`, error);
    }
  }

  /**
   * Generate preview of changes
   */
  private async generatePreview(
    sourcePath: string,
    transformedContent: string
  ): Promise<string> {
    try {
      const originalContent = await fs.readFile(sourcePath, 'utf-8');
      
      // Simple diff preview (could use a proper diff library)
      const originalLines = originalContent.split('\n');
      const transformedLines = transformedContent.split('\n');
      
      let preview = `File: ${sourcePath}\n`;
      preview += '─'.repeat(50) + '\n';
      
      // Show first few changed lines
      let changesShown = 0;
      const maxChanges = 10;
      
      for (let i = 0; i < Math.max(originalLines.length, transformedLines.length); i++) {
        if (originalLines[i] !== transformedLines[i] && changesShown < maxChanges) {
          if (originalLines[i] !== undefined) {
            preview += `- ${originalLines[i]}\n`;
          }
          if (transformedLines[i] !== undefined) {
            preview += `+ ${transformedLines[i]}\n`;
          }
          preview += '\n';
          changesShown++;
        }
      }
      
      if (changesShown === maxChanges) {
        preview += `... and more changes\n`;
      }
      
      return preview;
    } catch (error) {
      return `Preview unavailable: ${error}`;
    }
  }

  /**
   * Complete transformation and clean up
   */
  async complete(success: boolean): Promise<void> {
    const { config, logger, rollbackHandler } = this.options;

    if (!success && this.backupId && rollbackHandler) {
      logger.info('Transformation failed. Rolling back changes...');
      await rollbackHandler.restore(this.backupId);
      logger.info('Changes rolled back successfully');
    } else if (success && this.backupId && rollbackHandler && !config.createBackups) {
      // Clean up backup if not keeping backups
      await rollbackHandler.deleteBackup(this.backupId);
    }

    // Log summary
    logger.info(`Transformation complete. Processed ${this.processedFiles.size} files.`);
  }

  /**
   * Get list of processed files
   */
  getProcessedFiles(): string[] {
    return Array.from(this.processedFiles);
  }

  /**
   * Check if a file has been processed
   */
  isProcessed(filePath: string): boolean {
    return this.processedFiles.has(filePath);
  }
}

/**
 * Create a transformation mode handler
 */
export function createTransformationModeHandler(
  options: TransformationModeOptions
): TransformationModeHandler {
  return new TransformationModeHandler(options);
}