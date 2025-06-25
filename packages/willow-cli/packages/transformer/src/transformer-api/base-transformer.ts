/**
 * Base transformer implementation
 * Provides common functionality for all transformers
 */

import * as ts from 'typescript';
import {
  Transformer,
  TransformContext,
  TransformResult,
  BatchTransformResult,
  TransformError,
  TransformWarning,
  TransformChange,
  TransformMetrics,
  Logger,
} from './index';

/**
 * Abstract base class for transformers
 */
export abstract class BaseTransformer<TConfig = any, TResult = any>
  implements Transformer<TConfig, TResult>
{
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;

  protected config: TConfig | null = null;
  protected logger: Logger | null = null;
  protected initialized = false;

  /**
   * Initialize the transformer
   */
  async initialize(config: TConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
    await this.onInitialize(config);
  }

  /**
   * Hook for subclasses to perform custom initialization
   */
  protected async onInitialize(config: TConfig): Promise<void> {
    // Override in subclasses
  }

  /**
   * Transform a single source file
   */
  async transform(
    sourceFile: ts.SourceFile,
    context: TransformContext
  ): Promise<TransformResult<TResult>> {
    if (!this.initialized) {
      throw new Error(`Transformer ${this.name} not initialized`);
    }

    this.logger = context.logger;
    const startTime = Date.now();
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];
    const changes: TransformChange[] = [];

    try {
      // Check if we can transform this file
      if (!this.canTransform(sourceFile)) {
        return {
          success: true,
          transformedFile: sourceFile,
          errors: [],
          warnings: [],
          changes: [],
        };
      }

      // Perform the transformation
      const result = await this.performTransform(sourceFile, context, {
        errors,
        warnings,
        changes,
      });

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        transformedFile: result.transformedFile,
        data: result.data,
        errors,
        warnings,
        changes,
        metrics: {
          duration,
          nodesProcessed: result.nodesProcessed,
        },
      };
    } catch (error) {
      errors.push({
        code: 'TRANSFORM_ERROR',
        message: error instanceof Error ? error.message : String(error),
        file: sourceFile.fileName,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        errors,
        warnings,
        changes,
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Transform multiple files in batch
   */
  async transformBatch(
    sourceFiles: ts.SourceFile[],
    context: TransformContext
  ): Promise<BatchTransformResult<TResult>> {
    const results = new Map<string, TransformResult<TResult>>();
    const startTime = Date.now();
    let totalErrors = 0;
    let totalWarnings = 0;

    // Process files based on configuration
    const maxConcurrency = context.config.maxConcurrency || 4;
    const chunks = this.chunkArray(sourceFiles, maxConcurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (sourceFile) => {
          const result = await this.transform(sourceFile, context);
          return { fileName: sourceFile.fileName, result };
        })
      );

      for (const { fileName, result } of chunkResults) {
        results.set(fileName, result);
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
      }
    }

    return {
      results,
      success: totalErrors === 0,
      totalErrors,
      totalWarnings,
      metrics: {
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Default implementation - override in subclasses
   */
  canTransform(sourceFile: ts.SourceFile): boolean {
    return true;
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.config = null;
    this.logger = null;
    this.initialized = false;
    await this.onDispose();
  }

  /**
   * Hook for subclasses to perform custom cleanup
   */
  protected async onDispose(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Abstract method that subclasses must implement
   */
  protected abstract performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    data?: TResult;
    nodesProcessed?: number;
  }>;

  /**
   * Helper to create a transform error
   */
  protected createError(
    code: string,
    message: string,
    node?: ts.Node
  ): TransformError {
    const error: TransformError = {
      code,
      message,
    };

    if (node) {
      const sourceFile = node.getSourceFile();
      if (sourceFile) {
        error.file = sourceFile.fileName;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart()
        );
        error.location = {
          line: line + 1,
          column: character + 1,
        };
      }
    }

    return error;
  }

  /**
   * Helper to create a transform warning
   */
  protected createWarning(
    code: string,
    message: string,
    node?: ts.Node,
    severity: 'info' | 'warning' = 'warning'
  ): TransformWarning {
    const warning: TransformWarning = {
      code,
      message,
      severity,
    };

    if (node) {
      const sourceFile = node.getSourceFile();
      if (sourceFile) {
        warning.file = sourceFile.fileName;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart()
        );
        warning.location = {
          line: line + 1,
          column: character + 1,
        };
      }
    }

    return warning;
  }

  /**
   * Helper to create a transform change
   */
  protected createChange(
    type: TransformChange['type'],
    description: string,
    file: string,
    node?: ts.Node,
    before?: string,
    after?: string
  ): TransformChange {
    const change: TransformChange = {
      type,
      description,
      file,
      before,
      after,
    };

    if (node) {
      const sourceFile = node.getSourceFile();
      if (sourceFile) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart()
        );
        change.location = {
          line: line + 1,
          column: character + 1,
        };
      }
    }

    return change;
  }

  /**
   * Helper to chunk an array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Log a debug message
   */
  protected debug(message: string, ...args: any[]): void {
    this.logger?.debug(`[${this.name}] ${message}`, ...args);
  }

  /**
   * Log an info message
   */
  protected info(message: string, ...args: any[]): void {
    this.logger?.info(`[${this.name}] ${message}`, ...args);
  }

  /**
   * Log a warning message
   */
  protected warn(message: string, ...args: any[]): void {
    this.logger?.warn(`[${this.name}] ${message}`, ...args);
  }

  /**
   * Log an error message
   */
  protected error(message: string, ...args: any[]): void {
    this.logger?.error(`[${this.name}] ${message}`, ...args);
  }
}