/**
 * Base Transformer Implementation
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
} from './index';

/**
 * Abstract base class that provides common transformer functionality
 */
export abstract class BaseTransformer<TConfig = any, TResult = any> implements Transformer<TConfig, TResult> {
  /**
   * Transformer configuration
   */
  protected config?: TConfig;

  /**
   * Unique identifier for the transformer
   */
  abstract readonly name: string;

  /**
   * Human-readable description of what this transformer does
   */
  abstract readonly description: string;

  /**
   * Version of the transformer
   */
  abstract readonly version: string;

  /**
   * Initialize the transformer with configuration
   */
  async initialize(config: TConfig): Promise<void> {
    this.config = config;
  }

  /**
   * Transform a single source file
   */
  async transform(sourceFile: ts.SourceFile, context: TransformContext): Promise<TransformResult<TResult>> {
    const startTime = performance.now();
    
    const collectors = {
      errors: [] as TransformError[],
      warnings: [] as TransformWarning[],
      changes: [] as TransformChange[],
    };

    try {
      const result = await this.performTransform(sourceFile, context, collectors);
      const endTime = performance.now();

      const metrics: TransformMetrics = {
        duration: endTime - startTime,
        nodesProcessed: result.nodesProcessed || 0,
      };

      return {
        success: true,
        transformedFile: result.transformedFile,
        data: result.data,
        errors: collectors.errors,
        warnings: collectors.warnings,
        changes: collectors.changes,
        metrics,
      };
    } catch (error) {
      const endTime = performance.now();
      
      const transformError: TransformError = {
        code: 'TRANSFORM_ERROR',
        message: error instanceof Error ? error.message : 'Unknown transformation error',
        file: sourceFile.fileName,
        stack: error instanceof Error ? error.stack : undefined,
      };

      return {
        success: false,
        errors: [transformError, ...collectors.errors],
        warnings: collectors.warnings,
        changes: collectors.changes,
        metrics: {
          duration: endTime - startTime,
        },
      };
    }
  }

  /**
   * Transform multiple files in batch
   */
  async transformBatch(sourceFiles: ts.SourceFile[], context: TransformContext): Promise<BatchTransformResult<TResult>> {
    const results = new Map<string, TransformResult<TResult>>();
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalDuration = 0;

    for (const sourceFile of sourceFiles) {
      const result = await this.transform(sourceFile, context);
      results.set(sourceFile.fileName, result);
      
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      totalDuration += result.metrics?.duration || 0;
    }

    const success = totalErrors === 0;

    return {
      results,
      success,
      totalErrors,
      totalWarnings,
      metrics: {
        duration: totalDuration,
      },
    };
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    // Default implementation - can be overridden
  }

  /**
   * Validate if a file can be transformed
   */
  abstract canTransform(sourceFile: ts.SourceFile): boolean;

  /**
   * Perform the actual transformation - must be implemented by subclasses
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
   * Helper method to create a change record
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
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      
      change.location = {
        line: start.line + 1,
        column: start.character + 1,
        endLine: end.line + 1,
        endColumn: end.character + 1,
      };
    }

    return change;
  }

  /**
   * Helper method to create an error
   */
  protected createError(
    code: string,
    message: string,
    file?: string,
    node?: ts.Node,
    suggestions?: string[]
  ): TransformError {
    const error: TransformError = {
      code,
      message,
      file,
      suggestions,
    };

    if (node) {
      const sourceFile = node.getSourceFile();
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      
      error.location = {
        line: start.line + 1,
        column: start.character + 1,
      };
    }

    return error;
  }

  /**
   * Helper method to create a warning
   */
  protected createWarning(
    code: string,
    message: string,
    severity: 'info' | 'warning' = 'warning',
    file?: string,
    node?: ts.Node
  ): TransformWarning {
    const warning: TransformWarning = {
      code,
      message,
      severity,
      file,
    };

    if (node) {
      const sourceFile = node.getSourceFile();
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      
      warning.location = {
        line: start.line + 1,
        column: start.character + 1,
      };
    }

    return warning;
  }
}