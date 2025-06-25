/**
 * Registry for managing transformers
 */

import { Transformer, TransformerRegistry } from './index';

/**
 * Default implementation of transformer registry
 */
export class DefaultTransformerRegistry implements TransformerRegistry {
  private transformers = new Map<string, Transformer>();

  /**
   * Register a transformer
   */
  register(transformer: Transformer): void {
    if (this.transformers.has(transformer.name)) {
      throw new Error(
        `Transformer with name "${transformer.name}" is already registered`
      );
    }
    this.transformers.set(transformer.name, transformer);
  }

  /**
   * Get a transformer by name
   */
  get(name: string): Transformer | undefined {
    return this.transformers.get(name);
  }

  /**
   * Get all registered transformers
   */
  getAll(): Transformer[] {
    return Array.from(this.transformers.values());
  }

  /**
   * Unregister a transformer
   */
  unregister(name: string): boolean {
    return this.transformers.delete(name);
  }

  /**
   * Check if a transformer is registered
   */
  has(name: string): boolean {
    return this.transformers.has(name);
  }

  /**
   * Clear all registered transformers
   */
  clear(): void {
    this.transformers.clear();
  }

  /**
   * Get the number of registered transformers
   */
  get size(): number {
    return this.transformers.size;
  }
}

/**
 * Global transformer registry instance
 */
export const globalTransformerRegistry = new DefaultTransformerRegistry();