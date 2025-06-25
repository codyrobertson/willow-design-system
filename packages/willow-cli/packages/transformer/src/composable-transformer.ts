/**
 * Composable transformer that chains multiple transformers
 */

import * as ts from 'typescript';
import {
  ComposableTransformer,
  Transformer,
  TransformContext,
  TransformResult,
  BatchTransformResult,
} from './index';
import { BaseTransformer } from './base-transformer';

/**
 * Default implementation of composable transformer
 */
export class DefaultComposableTransformer
  extends BaseTransformer
  implements ComposableTransformer
{
  readonly name: string;
  readonly description: string;
  readonly version: string;

  private transformers: Transformer[] = [];
  private transformerOrder: string[] = [];

  constructor(
    name: string,
    description: string = 'Composable transformer',
    version: string = '1.0.0'
  ) {
    super();
    this.name = name;
    this.description = description;
    this.version = version;
  }

  /**
   * Add a transformer to the chain
   */
  addTransformer(transformer: Transformer): void {
    if (this.transformers.some((t) => t.name === transformer.name)) {
      throw new Error(
        `Transformer "${transformer.name}" is already in the chain`
      );
    }
    this.transformers.push(transformer);
    this.transformerOrder.push(transformer.name);
  }

  /**
   * Remove a transformer from the chain
   */
  removeTransformer(name: string): boolean {
    const index = this.transformers.findIndex((t) => t.name === name);
    if (index >= 0) {
      this.transformers.splice(index, 1);
      this.transformerOrder = this.transformerOrder.filter((n) => n !== name);
      return true;
    }
    return false;
  }

  /**
   * Get all transformers in the chain
   */
  getTransformers(): Transformer[] {
    return this.getOrderedTransformers();
  }

  /**
   * Set the execution order of transformers
   */
  setOrder(order: string[]): void {
    // Validate that all transformers in order exist
    const transformerNames = new Set(this.transformers.map((t) => t.name));
    for (const name of order) {
      if (!transformerNames.has(name)) {
        throw new Error(`Transformer "${name}" not found in chain`);
      }
    }

    // Validate that all transformers are included in order
    if (order.length !== this.transformers.length) {
      throw new Error('Order must include all transformers');
    }

    this.transformerOrder = [...order];
  }

  /**
   * Initialize all transformers in the chain
   */
  protected async onInitialize(config: any): Promise<void> {
    for (const transformer of this.transformers) {
      await transformer.initialize(config);
    }
  }

  /**
   * Dispose all transformers in the chain
   */
  protected async onDispose(): Promise<void> {
    for (const transformer of this.transformers) {
      await transformer.dispose();
    }
  }

  /**
   * Check if any transformer can transform the file
   */
  canTransform(sourceFile: ts.SourceFile): boolean {
    return this.transformers.some((t) => t.canTransform(sourceFile));
  }

  /**
   * Perform transformation by chaining transformers
   */
  protected async performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: any[];
      warnings: any[];
      changes: any[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    data?: any;
    nodesProcessed?: number;
  }> {
    let currentFile = sourceFile;
    let totalNodesProcessed = 0;
    const orderedTransformers = this.getOrderedTransformers();

    for (const transformer of orderedTransformers) {
      if (!transformer.canTransform(currentFile)) {
        this.debug(`Skipping transformer ${transformer.name} for file ${currentFile.fileName}`);
        continue;
      }

      this.debug(`Applying transformer ${transformer.name} to file ${currentFile.fileName}`);
      
      const result = await transformer.transform(currentFile, context);

      // Collect errors, warnings, and changes
      collectors.errors.push(...result.errors);
      collectors.warnings.push(...result.warnings);
      collectors.changes.push(...result.changes);

      // Update nodes processed count
      if (result.metrics?.nodesProcessed) {
        totalNodesProcessed += result.metrics.nodesProcessed;
      }

      // If transformation failed, stop the chain
      if (!result.success) {
        this.error(`Transformer ${transformer.name} failed, stopping chain`);
        break;
      }

      // Use the transformed file for the next transformer
      if (result.transformedFile) {
        currentFile = result.transformedFile;
      }
    }

    return {
      transformedFile: currentFile,
      nodesProcessed: totalNodesProcessed,
    };
  }

  /**
   * Transform batch by chaining transformers
   */
  async transformBatch(
    sourceFiles: ts.SourceFile[],
    context: TransformContext
  ): Promise<BatchTransformResult> {
    let currentFiles = sourceFiles;
    const orderedTransformers = this.getOrderedTransformers();
    const finalResults = new Map<string, TransformResult>();
    let totalErrors = 0;
    let totalWarnings = 0;
    const startTime = Date.now();

    for (const transformer of orderedTransformers) {
      this.info(`Running batch transformation with ${transformer.name}`);
      
      const batchResult = await transformer.transformBatch(currentFiles, context);

      // Accumulate errors and warnings
      totalErrors += batchResult.totalErrors;
      totalWarnings += batchResult.totalWarnings;

      // Extract successfully transformed files for next transformer
      const nextFiles: ts.SourceFile[] = [];
      
      for (const [fileName, result] of batchResult.results) {
        // Update or merge results
        const existingResult = finalResults.get(fileName);
        if (existingResult) {
          // Merge results
          finalResults.set(fileName, {
            ...result,
            errors: [...existingResult.errors, ...result.errors],
            warnings: [...existingResult.warnings, ...result.warnings],
            changes: [...existingResult.changes, ...result.changes],
          });
        } else {
          finalResults.set(fileName, result);
        }

        // Collect transformed files for next iteration
        if (result.success && result.transformedFile) {
          nextFiles.push(result.transformedFile);
        }
      }

      // If no files were successfully transformed, stop
      if (nextFiles.length === 0) {
        this.warn('No files were successfully transformed, stopping chain');
        break;
      }

      currentFiles = nextFiles;
    }

    return {
      results: finalResults,
      success: totalErrors === 0,
      totalErrors,
      totalWarnings,
      metrics: {
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Get transformers in execution order
   */
  private getOrderedTransformers(): Transformer[] {
    if (this.transformerOrder.length === 0) {
      return this.transformers;
    }

    const transformerMap = new Map(
      this.transformers.map((t) => [t.name, t])
    );

    return this.transformerOrder
      .map((name) => transformerMap.get(name))
      .filter((t): t is Transformer => t !== undefined);
  }
}

/**
 * Factory function to create a composable transformer
 */
export function createComposableTransformer(
  name: string,
  transformers?: Transformer[],
  description?: string,
  version?: string
): ComposableTransformer {
  const composable = new DefaultComposableTransformer(
    name,
    description,
    version
  );

  if (transformers) {
    for (const transformer of transformers) {
      composable.addTransformer(transformer);
    }
  }

  return composable;
}