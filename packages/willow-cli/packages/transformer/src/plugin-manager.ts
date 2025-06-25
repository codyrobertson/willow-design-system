/**
 * Plugin manager for transformer plugins
 */

import { TransformerPlugin } from './index';

/**
 * Plugin manager for managing transformer plugins
 */
export class TransformerPluginManager {
  private plugins: Map<string, TransformerPlugin> = new Map();
  private loadOrder: string[] = [];

  /**
   * Register a plugin
   */
  register(plugin: TransformerPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    
    this.plugins.set(plugin.name, plugin);
    this.loadOrder.push(plugin.name);
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    if (this.plugins.delete(name)) {
      this.loadOrder = this.loadOrder.filter((n) => n !== name);
      return true;
    }
    return false;
  }

  /**
   * Get a plugin by name
   */
  get(name: string): TransformerPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAll(): TransformerPlugin[] {
    return this.loadOrder.map((name) => this.plugins.get(name)!);
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Set plugin load order
   */
  setLoadOrder(order: string[]): void {
    // Validate all plugins exist
    for (const name of order) {
      if (!this.plugins.has(name)) {
        throw new Error(`Plugin "${name}" not found`);
      }
    }

    // Validate all plugins are included
    if (order.length !== this.plugins.size) {
      throw new Error('Load order must include all plugins');
    }

    this.loadOrder = [...order];
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.loadOrder = [];
  }
}

/**
 * Global plugin manager instance
 */
export const globalPluginManager = new TransformerPluginManager();