import {
  StyleType,
  type StyleTransformer,
  type StyleTransformerConfig,
} from '../types/style-transformation.types';
import { BaseStyleTransformer } from './base-style-transformer';

/**
 * Factory for creating style transformers
 */
export class StyleTransformerFactory {
  private static transformerConstructors = new Map<
    string,
    new (config?: Partial<StyleTransformerConfig>) => StyleTransformer
  >();

  /**
   * Register a transformer constructor
   */
  static register<T extends StyleTransformer>(
    name: string,
    constructor: new (config?: Partial<StyleTransformerConfig>) => T
  ): void {
    this.transformerConstructors.set(name, constructor);
  }

  /**
   * Create a transformer instance
   */
  static create(
    name: string,
    config?: Partial<StyleTransformerConfig>
  ): StyleTransformer {
    const Constructor = this.transformerConstructors.get(name);
    if (!Constructor) {
      throw new Error(`No transformer registered with name: ${name}`);
    }
    return new Constructor(config);
  }

  /**
   * Create multiple transformer instances
   */
  static createMany(
    names: string[],
    config?: Partial<StyleTransformerConfig>
  ): StyleTransformer[] {
    return names.map(name => this.create(name, config));
  }

  /**
   * Create all registered transformers
   */
  static createAll(
    config?: Partial<StyleTransformerConfig>
  ): StyleTransformer[] {
    return Array.from(this.transformerConstructors.keys()).map(name =>
      this.create(name, config)
    );
  }

  /**
   * Check if a transformer is registered
   */
  static has(name: string): boolean {
    return this.transformerConstructors.has(name);
  }

  /**
   * Get all registered transformer names
   */
  static getRegisteredNames(): string[] {
    return Array.from(this.transformerConstructors.keys());
  }

  /**
   * Clear all registered transformers
   */
  static clear(): void {
    this.transformerConstructors.clear();
  }

  /**
   * Create a composite transformer that combines multiple transformers
   */
  static createComposite(
    name: string,
    transformers: StyleTransformer[],
    config?: Partial<StyleTransformerConfig>
  ): StyleTransformer {
    return new CompositeStyleTransformer(name, transformers, config);
  }

  /**
   * Create a transformer for a specific style type
   */
  static createForStyleType(
    styleType: StyleType,
    config?: Partial<StyleTransformerConfig>
  ): StyleTransformer | null {
    // Map style types to transformer names
    const typeToTransformer: Record<StyleType, string> = {
      [StyleType.CSS_IN_JS]: 'css-in-js',
      [StyleType.STYLED_COMPONENTS]: 'styled-components',
      [StyleType.EMOTION]: 'emotion',
      [StyleType.CSS_MODULES]: 'css-modules',
      [StyleType.TAILWIND]: 'tailwind',
      [StyleType.INLINE_STYLES]: 'inline-styles',
      [StyleType.SASS]: 'sass',
      [StyleType.LESS]: 'less',
    };

    const transformerName = typeToTransformer[styleType];
    if (!transformerName || !this.has(transformerName)) {
      return null;
    }

    return this.create(transformerName, config);
  }
}

/**
 * Composite transformer that combines multiple transformers
 */
class CompositeStyleTransformer extends BaseStyleTransformer {
  name: string;
  supportedTypes: StyleType[] = [];

  constructor(
    name: string,
    private transformers: StyleTransformer[],
    private config?: Partial<StyleTransformerConfig>
  ) {
    super();
    this.name = name;
    
    // Collect all supported types from child transformers
    const typesSet = new Set<StyleType>();
    for (const transformer of transformers) {
      if ('supportedTypes' in transformer) {
        (transformer as any).supportedTypes.forEach((type: StyleType) =>
          typesSet.add(type)
        );
      }
    }
    this.supportedTypes = Array.from(typesSet);
  }

  async transform(
    input: any,
    context: any,
    config: StyleTransformerConfig
  ) {
    let result = input;
    const warnings: string[] = [];
    const errors: string[] = [];
    let transformationsApplied = 0;

    // Apply each transformer in sequence
    for (const transformer of this.transformers) {
      if (transformer.supports(context.styleType, context)) {
        const transformResult = await transformer.transform(
          result,
          context,
          { ...config, ...this.config }
        );

        if (transformResult.success) {
          result = transformResult.transformed;
          warnings.push(...transformResult.warnings);
          transformationsApplied++;
        } else {
          errors.push(...transformResult.errors);
        }
      }
    }

    return this.createSuccessResult(result, input, {
      transformationsApplied,
      styleType: context.styleType,
    });
  }
}

/**
 * Plugin-based transformer that loads transformers dynamically
 */
export class PluginStyleTransformer extends BaseStyleTransformer {
  name = 'plugin';
  supportedTypes: StyleType[] = Object.values(StyleType);

  constructor(
    private pluginPath: string,
    private pluginConfig?: any
  ) {
    super();
  }

  async transform(
    input: any,
    context: any,
    config: StyleTransformerConfig
  ) {
    try {
      // Dynamic import of plugin
      const plugin = await import(this.pluginPath);
      const PluginTransformer = plugin.default || plugin.StyleTransformer;

      if (!PluginTransformer) {
        throw new Error(`No transformer found in plugin: ${this.pluginPath}`);
      }

      const transformer = new PluginTransformer(this.pluginConfig);
      return await transformer.transform(input, context, config);
    } catch (error) {
      return this.createErrorResult(
        `Failed to load plugin: ${error instanceof Error ? error.message : String(error)}`,
        input
      );
    }
  }
}