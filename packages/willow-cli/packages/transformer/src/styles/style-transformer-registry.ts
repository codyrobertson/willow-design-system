import {
  StyleType,
  type StyleTransformer,
  type StyleTransformerRegistry,
} from '../types/style-transformation.types';
import { CssInJsTransformer } from './css-in-js/css-in-js-transformer';
import { TailwindTransformer } from './tailwind/tailwind-transformer';
import { CssModulesTransformer } from './css-modules/css-modules-transformer';
import { StyledComponentsTransformer } from './styled-components/styled-components-transformer';
import { EmotionTransformer } from './emotion/emotion-transformer';

/**
 * Registry for managing style transformers
 */
export class StyleTransformerRegistryImpl implements StyleTransformerRegistry {
  private transformers: Map<string, StyleTransformer> = new Map();

  /**
   * Register a style transformer
   */
  register(transformer: StyleTransformer): void {
    if (this.transformers.has(transformer.name)) {
      throw new Error(
        `Transformer with name '${transformer.name}' is already registered`
      );
    }
    this.transformers.set(transformer.name, transformer);
  }

  /**
   * Unregister a style transformer
   */
  unregister(name: string): void {
    if (!this.transformers.has(name)) {
      throw new Error(`Transformer with name '${name}' is not registered`);
    }
    this.transformers.delete(name);
  }

  /**
   * Get a transformer by name
   */
  get(name: string): StyleTransformer | undefined {
    return this.transformers.get(name);
  }

  /**
   * Get all registered transformers
   */
  getAll(): StyleTransformer[] {
    return Array.from(this.transformers.values()).sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );
  }

  /**
   * Get transformers that support a specific style type
   */
  getForStyleType(styleType: StyleType): StyleTransformer[] {
    return this.getAll().filter(transformer =>
      transformer.supports(styleType, {
        styleType,
        sourceFramework: '',
        targetFramework: '',
        filePath: '',
      })
    );
  }

  /**
   * Clear all registered transformers
   */
  clear(): void {
    this.transformers.clear();
  }

  /**
   * Get the count of registered transformers
   */
  get size(): number {
    return this.transformers.size;
  }

  /**
   * Check if a transformer is registered
   */
  has(name: string): boolean {
    return this.transformers.has(name);
  }

  /**
   * Get all transformer names
   */
  getNames(): string[] {
    return Array.from(this.transformers.keys());
  }

  /**
   * Create a new instance with pre-registered transformers
   */
  static createWithDefaults(): StyleTransformerRegistryImpl {
    const registry = new StyleTransformerRegistryImpl();
    
    // Register default transformers
    registry.register(new CssInJsTransformer());
    registry.register(new TailwindTransformer());
    registry.register(new CssModulesTransformer());
    registry.register(new StyledComponentsTransformer());
    registry.register(new EmotionTransformer());
    
    return registry;
  }
}