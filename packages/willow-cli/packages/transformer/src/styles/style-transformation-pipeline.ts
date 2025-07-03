import type {
  StyleTransformer,
  StyleTransformationContext,
  StyleTransformationResult,
  StyleTransformerConfig,
  StyleTransformationPipeline,
} from '../types/style-transformation.types';

/**
 * Pipeline for executing style transformations
 */
export class StyleTransformationPipelineImpl implements StyleTransformationPipeline {
  private transformers: StyleTransformer[] = [];

  /**
   * Add a transformer to the pipeline
   */
  add(transformer: StyleTransformer): void {
    // Check if transformer with same name already exists
    const existingIndex = this.transformers.findIndex(
      t => t.name === transformer.name
    );

    if (existingIndex !== -1) {
      // Replace existing transformer
      this.transformers[existingIndex] = transformer;
    } else {
      // Add new transformer
      this.transformers.push(transformer);
    }

    // Sort by priority (higher priority first)
    this.transformers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Remove a transformer from the pipeline
   */
  remove(name: string): void {
    const index = this.transformers.findIndex(t => t.name === name);
    if (index !== -1) {
      this.transformers.splice(index, 1);
    }
  }

  /**
   * Execute the transformation pipeline
   */
  async transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult> {
    // Find the first transformer that supports this style type
    const transformer = this.transformers.find(t =>
      t.supports(context.styleType, context)
    );

    if (!transformer) {
      return {
        success: false,
        transformed: input,
        original: input,
        warnings: [],
        errors: [
          `No transformer found for style type '${context.styleType}'`,
        ],
      };
    }

    try {
      // Execute the transformation
      const startTime = performance.now();
      const result = await transformer.transform(input, context, config);
      const endTime = performance.now();

      // Add processing time to metadata
      if (result.metadata) {
        result.metadata.processingTime = endTime - startTime;
      }

      // Apply custom transformers if any
      if (config.customTransformers && config.customTransformers.length > 0) {
        return this.applyCustomTransformers(
          result,
          context,
          config.customTransformers,
          config
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        transformed: input,
        original: input,
        warnings: [],
        errors: [
          `Transformation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }

  /**
   * Apply custom transformers to the result
   */
  private async applyCustomTransformers(
    result: StyleTransformationResult,
    context: StyleTransformationContext,
    customTransformers: StyleTransformer[],
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult> {
    let currentResult = result;

    for (const transformer of customTransformers) {
      if (transformer.supports(context.styleType, context)) {
        try {
          const customResult = await transformer.transform(
            currentResult.transformed,
            context,
            config
          );

          // Merge results
          currentResult = {
            ...customResult,
            warnings: [...currentResult.warnings, ...customResult.warnings],
            errors: [...currentResult.errors, ...customResult.errors],
            metadata: {
              ...currentResult.metadata,
              ...customResult.metadata,
              transformationsApplied:
                (currentResult.metadata?.transformationsApplied || 0) +
                (customResult.metadata?.transformationsApplied || 0),
            },
          };
        } catch (error) {
          currentResult.errors.push(
            `Custom transformer '${transformer.name}' failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }

    return currentResult;
  }

  /**
   * Get all transformers in the pipeline
   */
  getTransformers(): StyleTransformer[] {
    return [...this.transformers];
  }

  /**
   * Clear all transformers from the pipeline
   */
  clear(): void {
    this.transformers = [];
  }

  /**
   * Get the count of transformers in the pipeline
   */
  get size(): number {
    return this.transformers.length;
  }

  /**
   * Check if a transformer is in the pipeline
   */
  has(name: string): boolean {
    return this.transformers.some(t => t.name === name);
  }

  /**
   * Create a new pipeline with default transformers
   */
  static createWithDefaults(): StyleTransformationPipelineImpl {
    const pipeline = new StyleTransformationPipelineImpl();
    // Default transformers will be added here
    return pipeline;
  }
}