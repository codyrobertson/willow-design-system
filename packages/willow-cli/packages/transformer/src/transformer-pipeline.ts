/**
 * Transformer Pipeline Implementation
 */

import * as ts from 'typescript';
import {
  TransformerPipeline,
  TransformerPipelineOptions,
  PipelineResult,
  TransformContext,
  Transformer,
  BatchTransformResult,
  TransformError,
  TransformWarning,
} from './index';

/**
 * Default implementation of transformer pipeline
 */
export class DefaultTransformerPipeline implements TransformerPipeline {
  constructor(private options: TransformerPipelineOptions) {}

  /**
   * Execute the pipeline on source files
   */
  async execute(sourceFiles: ts.SourceFile[], context: TransformContext): Promise<PipelineResult> {
    const startTime = performance.now();
    const transformerResults = new Map<string, BatchTransformResult>();
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];

    let currentFiles = sourceFiles;

    for (const transformer of this.options.transformers) {
      try {
        const result = await transformer.transformBatch(currentFiles, context);
        transformerResults.set(transformer.name, result);

        errors.push(...this.aggregateErrors(result));
        warnings.push(...this.aggregateWarnings(result));

        if (!result.success && this.options.stopOnError) {
          break;
        }

        // Update files for next transformer if transformation was successful
        if (result.success) {
          currentFiles = this.extractTransformedFiles(result);
        }
      } catch (error) {
        const transformError: TransformError = {
          code: 'PIPELINE_ERROR',
          message: `Error in transformer ${transformer.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
        errors.push(transformError);

        if (this.options.stopOnError) {
          break;
        }
      }
    }

    const endTime = performance.now();
    const success = errors.length === 0;

    return {
      transformerResults,
      success,
      duration: endTime - startTime,
      errors,
      warnings,
    };
  }

  /**
   * Add a transformer to the pipeline
   */
  addTransformer(transformer: Transformer, position?: number): void {
    if (position !== undefined) {
      this.options.transformers.splice(position, 0, transformer);
    } else {
      this.options.transformers.push(transformer);
    }
  }

  /**
   * Remove a transformer from the pipeline
   */
  removeTransformer(name: string): boolean {
    const index = this.options.transformers.findIndex(t => t.name === name);
    if (index >= 0) {
      this.options.transformers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get pipeline configuration
   */
  getConfig(): TransformerPipelineOptions {
    return { ...this.options };
  }

  private aggregateErrors(result: BatchTransformResult): TransformError[] {
    const errors: TransformError[] = [];
    for (const transformResult of result.results.values()) {
      errors.push(...transformResult.errors);
    }
    return errors;
  }

  private aggregateWarnings(result: BatchTransformResult): TransformWarning[] {
    const warnings: TransformWarning[] = [];
    for (const transformResult of result.results.values()) {
      warnings.push(...transformResult.warnings);
    }
    return warnings;
  }

  private extractTransformedFiles(result: BatchTransformResult): ts.SourceFile[] {
    const files: ts.SourceFile[] = [];
    for (const transformResult of result.results.values()) {
      if (transformResult.transformedFile) {
        files.push(transformResult.transformedFile);
      }
    }
    return files;
  }
}

/**
 * Factory function to create a transformer pipeline
 */
export function createTransformerPipeline(options: TransformerPipelineOptions): DefaultTransformerPipeline {
  return new DefaultTransformerPipeline(options);
}