/**
 * Composable Transformer Implementation
 */

import * as ts from 'typescript';
import {
  ComposableTransformer,
  Transformer,
  TransformContext,
  TransformResult,
  BatchTransformResult,
} from './index';

/**
 * Default implementation of composable transformer
 */
export class DefaultComposableTransformer implements ComposableTransformer {
  private transformers: Transformer[] = [];

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly version: string = '1.0.0'
  ) {}

  /**
   * Initialize all transformers
   */
  async initialize(config: any): Promise<void> {
    for (const transformer of this.transformers) {
      await transformer.initialize(config);
    }
  }

  /**
   * Transform by running all transformers in sequence
   */
  async transform(sourceFile: ts.SourceFile, context: TransformContext): Promise<TransformResult> {
    let currentFile = sourceFile;
    const allErrors = [];
    const allWarnings = [];
    const allChanges = [];
    let totalDuration = 0;

    for (const transformer of this.transformers) {
      const result = await transformer.transform(currentFile, context);
      
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      allChanges.push(...result.changes);
      totalDuration += result.metrics?.duration || 0;

      if (result.success && result.transformedFile) {
        currentFile = result.transformedFile;
      } else if (!result.success) {
        // Stop on first error
        return {
          success: false,
          errors: allErrors,
          warnings: allWarnings,
          changes: allChanges,
          metrics: { duration: totalDuration },
        };
      }
    }

    return {
      success: true,
      transformedFile: currentFile,
      errors: allErrors,
      warnings: allWarnings,
      changes: allChanges,
      metrics: { duration: totalDuration },
    };
  }

  /**
   * Transform multiple files
   */
  async transformBatch(sourceFiles: ts.SourceFile[], context: TransformContext): Promise<BatchTransformResult> {
    const results = new Map();
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

    return {
      results,
      success: totalErrors === 0,
      totalErrors,
      totalWarnings,
      metrics: { duration: totalDuration },
    };
  }

  /**
   * Check if any transformer can handle the file
   */
  canTransform(sourceFile: ts.SourceFile): boolean {
    return this.transformers.some(transformer => transformer.canTransform(sourceFile));
  }

  /**
   * Clean up all transformers
   */
  async dispose(): Promise<void> {
    for (const transformer of this.transformers) {
      await transformer.dispose();
    }
  }

  /**
   * Add a transformer to the chain
   */
  addTransformer(transformer: Transformer): void {
    if (this.transformers.some(t => t.name === transformer.name)) {
      throw new Error(`Transformer "${transformer.name}" is already in the chain`);
    }
    this.transformers.push(transformer);
  }

  /**
   * Remove a transformer from the chain
   */
  removeTransformer(name: string): boolean {
    const index = this.transformers.findIndex(t => t.name === name);
    if (index >= 0) {
      this.transformers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all transformers in the chain
   */
  getTransformers(): Transformer[] {
    return [...this.transformers];
  }

  /**
   * Set the execution order of transformers
   */
  setOrder(order: string[]): void {
    const orderedTransformers: Transformer[] = [];
    
    for (const name of order) {
      const transformer = this.transformers.find(t => t.name === name);
      if (transformer) {
        orderedTransformers.push(transformer);
      }
    }

    // Add any remaining transformers not in the order list
    for (const transformer of this.transformers) {
      if (!orderedTransformers.includes(transformer)) {
        orderedTransformers.push(transformer);
      }
    }

    this.transformers = orderedTransformers;
  }
}

/**
 * Factory function to create a composable transformer
 */
export function createComposableTransformer(
  name: string,
  transformers: Transformer[] = [],
  description?: string
): DefaultComposableTransformer {
  const composable = new DefaultComposableTransformer(
    name,
    description || `Composable transformer: ${name}`,
    '1.0.0'
  );

  for (const transformer of transformers) {
    composable.addTransformer(transformer);
  }

  return composable;
}