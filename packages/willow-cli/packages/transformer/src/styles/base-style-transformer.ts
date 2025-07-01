import {
  StyleType,
  type StyleTransformer,
  type StyleTransformationContext,
  type StyleTransformationResult,
  type StyleTransformerConfig,
} from '../types/style-transformation.types';

/**
 * Abstract base class for style transformers
 */
export abstract class BaseStyleTransformer implements StyleTransformer {
  abstract name: string;
  abstract supportedTypes: StyleType[];
  priority: number = 0;

  /**
   * Check if this transformer supports the given style type
   */
  supports(styleType: StyleType, context: StyleTransformationContext): boolean {
    return this.supportedTypes.includes(styleType);
  }

  /**
   * Transform styles - must be implemented by subclasses
   */
  abstract transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult> | StyleTransformationResult;

  /**
   * Create a successful transformation result
   */
  protected createSuccessResult(
    transformed: any,
    original: any,
    metadata?: Partial<StyleTransformationResult['metadata']>
  ): StyleTransformationResult {
    return {
      success: true,
      transformed,
      original,
      warnings: [],
      errors: [],
      metadata: {
        transformationsApplied: 0,
        processingTime: 0,
        styleType: StyleType.CSS_IN_JS,
        ...metadata,
      },
    };
  }

  /**
   * Create a failed transformation result
   */
  protected createErrorResult(
    error: string,
    original: any,
    warnings: string[] = []
  ): StyleTransformationResult {
    return {
      success: false,
      transformed: original,
      original,
      warnings,
      errors: [error],
      metadata: {
        transformationsApplied: 0,
        processingTime: 0,
        styleType: StyleType.CSS_IN_JS,
      },
    };
  }

  /**
   * Apply property mappings to a style object
   */
  protected applyPropertyMappings(
    styles: Record<string, any>,
    config: StyleTransformerConfig,
    context: StyleTransformationContext
  ): { mapped: Record<string, any>; warnings: string[] } {
    const mapped: Record<string, any> = {};
    const warnings: string[] = [];
    const propertyMap = new Map(
      config.propertyMappings?.map(m => [m.source, m]) || []
    );

    for (const [property, value] of Object.entries(styles)) {
      const mapping = propertyMap.get(property);

      if (mapping) {
        if (mapping.deprecated) {
          warnings.push(
            mapping.deprecationMessage ||
              `Property '${property}' is deprecated`
          );
        }

        const targetProperty = mapping.target;
        const transformedValue = mapping.transform
          ? mapping.transform(value, context)
          : value;

        mapped[targetProperty] = transformedValue;
      } else if (config.preserveUnknownProperties) {
        mapped[property] = value;
        if (config.warnOnUnmappedProperties) {
          warnings.push(`Unmapped property: ${property}`);
        }
      }
    }

    return { mapped, warnings };
  }

  /**
   * Apply theme token mappings
   */
  protected applyTokenMappings(
    value: string,
    config: StyleTransformerConfig,
    context: StyleTransformationContext
  ): string {
    if (!config.tokenMappings) {
      return value;
    }

    let transformed = value;

    for (const mapping of config.tokenMappings) {
      // Escape dots in the source token for regex
      const escapedToken = mapping.sourceToken.replace(/\./g, '\\.');
      
      // Create patterns for different token formats
      const patterns = [
        new RegExp(`\\$\\{${escapedToken}\\}`, 'g'),
        new RegExp(`var\\(--${mapping.sourceToken.replace(/\./g, '-')}\\)`, 'g'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(transformed)) {
          const targetValue = mapping.targetToken;
          const finalValue = mapping.transform
            ? mapping.transform(targetValue)
            : targetValue;

          transformed = transformed.replace(pattern, finalValue);
        }
      }
    }

    return transformed;
  }

  /**
   * Measure processing time
   */
  protected async measureTime<T>(
    operation: () => Promise<T> | T
  ): Promise<{ result: T; time: number }> {
    const start = performance.now();
    const result = await operation();
    const time = performance.now() - start;
    return { result, time };
  }

  /**
   * Validate configuration
   */
  protected validateConfig(config: StyleTransformerConfig): string[] {
    const errors: string[] = [];

    if (config.propertyMappings) {
      for (const mapping of config.propertyMappings) {
        if (!mapping.source || !mapping.target) {
          errors.push('Property mapping must have source and target');
        }
      }
    }

    if (config.tokenMappings) {
      for (const mapping of config.tokenMappings) {
        if (!mapping.sourceToken || !mapping.targetToken) {
          errors.push('Token mapping must have sourceToken and targetToken');
        }
      }
    }

    return errors;
  }
}