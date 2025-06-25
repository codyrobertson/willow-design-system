/**
 * Pipeline for running multiple transformers in sequence or parallel
 */

import * as ts from 'typescript';
import {
  Transformer,
  TransformerPipeline,
  TransformerPipelineOptions,
  PipelineResult,
  TransformContext,
  BatchTransformResult,
  TransformError,
  TransformWarning,
} from './index';

/**
 * Default implementation of transformer pipeline
 */
export class DefaultTransformerPipeline implements TransformerPipeline {
  private transformers: Transformer[] = [];
  private options: TransformerPipelineOptions;

  constructor(options: TransformerPipelineOptions) {
    this.options = options;
    this.transformers = [...options.transformers];
  }

  /**
   * Execute the pipeline on source files
   */
  async execute(
    sourceFiles: ts.SourceFile[],
    context: TransformContext
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const transformerResults = new Map<string, BatchTransformResult>();
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];
    let currentFiles = sourceFiles;
    let success = true;

    // Apply plugins to context
    if (this.options.plugins) {
      context.plugins = [...context.plugins, ...this.options.plugins];
    }

    // Merge configuration
    if (this.options.config) {
      context.config = { ...context.config, ...this.options.config };
    }

    // Execute before hooks
    for (const plugin of context.plugins) {
      if (plugin.beforeTransform) {
        await plugin.beforeTransform(context);
      }
    }

    try {
      if (this.options.parallel && this.canRunInParallel()) {
        // Run transformers in parallel
        const results = await Promise.all(
          this.transformers.map(async (transformer) => {
            const result = await this.executeTransformer(
              transformer,
              currentFiles,
              context
            );
            return { name: transformer.name, result };
          })
        );

        for (const { name, result } of results) {
          transformerResults.set(name, result);
          if (!result.success) {
            success = false;
            if (this.options.stopOnError) {
              break;
            }
          }
        }
      } else {
        // Run transformers sequentially
        for (const transformer of this.transformers) {
          const result = await this.executeTransformer(
            transformer,
            currentFiles,
            context
          );
          transformerResults.set(transformer.name, result);

          if (!result.success) {
            success = false;
            if (this.options.stopOnError) {
              break;
            }
          }

          // Use transformed files as input for next transformer
          currentFiles = this.extractTransformedFiles(result);
        }
      }

      // Collect all errors and warnings
      for (const [, result] of transformerResults) {
        for (const [, fileResult] of result.results) {
          errors.push(...fileResult.errors);
          warnings.push(...fileResult.warnings);
        }
      }

      // Execute after hooks
      const pipelineResult: PipelineResult = {
        transformerResults,
        success,
        duration: Date.now() - startTime,
        errors,
        warnings,
      };

      for (const plugin of context.plugins) {
        if (plugin.afterTransform) {
          await plugin.afterTransform(
            { results: transformerResults, success, totalErrors: errors.length, totalWarnings: warnings.length },
            context
          );
        }
      }

      return pipelineResult;
    } catch (error) {
      // Execute error hooks
      for (const plugin of context.plugins) {
        if (plugin.onError) {
          await plugin.onError(error as Error, context);
        }
      }

      throw error;
    }
  }

  /**
   * Add a transformer to the pipeline
   */
  addTransformer(transformer: Transformer, position?: number): void {
    if (position !== undefined) {
      this.transformers.splice(position, 0, transformer);
    } else {
      this.transformers.push(transformer);
    }
  }

  /**
   * Remove a transformer from the pipeline
   */
  removeTransformer(name: string): boolean {
    const index = this.transformers.findIndex((t) => t.name === name);
    if (index >= 0) {
      this.transformers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get pipeline configuration
   */
  getConfig(): TransformerPipelineOptions {
    return {
      ...this.options,
      transformers: [...this.transformers],
    };
  }

  /**
   * Execute a single transformer
   */
  private async executeTransformer(
    transformer: Transformer,
    sourceFiles: ts.SourceFile[],
    context: TransformContext
  ): Promise<BatchTransformResult> {
    // Initialize transformer if needed
    if (!this.isTransformerInitialized(transformer)) {
      await transformer.initialize(context.config);
    }

    // Apply before file hooks
    const processedFiles = await this.applyBeforeFileHooks(
      sourceFiles,
      context
    );

    // Execute transformation
    const result = await transformer.transformBatch(processedFiles, context);

    // Apply after file hooks
    await this.applyAfterFileHooks(result, context);

    return result;
  }

  /**
   * Check if transformers can run in parallel
   */
  private canRunInParallel(): boolean {
    // For now, only allow parallel execution if transformers don't depend on each other
    // In the future, we could analyze dependencies and run independent transformers in parallel
    return this.transformers.length <= 1;
  }

  /**
   * Check if a transformer is initialized
   */
  private isTransformerInitialized(transformer: Transformer): boolean {
    // This is a simple check - in practice, transformers should expose an initialized property
    return true;
  }

  /**
   * Apply before file hooks
   */
  private async applyBeforeFileHooks(
    sourceFiles: ts.SourceFile[],
    context: TransformContext
  ): Promise<ts.SourceFile[]> {
    let files = sourceFiles;

    for (const plugin of context.plugins) {
      if (plugin.beforeTransformFile) {
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            const result = await plugin.beforeTransformFile!(file, context);
            return result || file;
          })
        );
        files = processedFiles;
      }
    }

    return files;
  }

  /**
   * Apply after file hooks
   */
  private async applyAfterFileHooks(
    result: BatchTransformResult,
    context: TransformContext
  ): Promise<void> {
    for (const plugin of context.plugins) {
      if (plugin.afterTransformFile) {
        for (const [fileName, fileResult] of result.results) {
          const sourceFile = fileResult.transformedFile;
          if (sourceFile) {
            const modifiedResult = await plugin.afterTransformFile(
              sourceFile,
              fileResult,
              context
            );
            if (modifiedResult) {
              result.results.set(fileName, modifiedResult);
            }
          }
        }
      }
    }
  }

  /**
   * Extract transformed files from batch result
   */
  private extractTransformedFiles(
    result: BatchTransformResult
  ): ts.SourceFile[] {
    const files: ts.SourceFile[] = [];

    for (const [, fileResult] of result.results) {
      if (fileResult.transformedFile) {
        files.push(fileResult.transformedFile);
      }
    }

    return files;
  }
}

/**
 * Factory function to create a transformer pipeline
 */
export function createTransformerPipeline(
  options: TransformerPipelineOptions
): TransformerPipeline {
  return new DefaultTransformerPipeline(options);
}