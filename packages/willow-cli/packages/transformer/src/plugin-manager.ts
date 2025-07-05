/**
 * Plugin Manager Implementation
 */

import {
  TransformerPlugin,
  TransformContext,
  TransformResult,
  BatchTransformResult,
} from './index';
import * as ts from 'typescript';

/**
 * Manager for transformer plugins
 */
export class PluginManager {
  private plugins: TransformerPlugin[] = [];

  /**
   * Register a plugin
   */
  register(plugin: TransformerPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    const index = this.plugins.findIndex(p => p.name === name);
    if (index >= 0) {
      this.plugins.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): TransformerPlugin[] {
    return [...this.plugins];
  }

  /**
   * Call beforeTransform hook on all plugins
   */
  async beforeTransform(context: TransformContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.beforeTransform) {
        await plugin.beforeTransform(context);
      }
    }
  }

  /**
   * Call beforeTransformFile hook on all plugins
   */
  async beforeTransformFile(
    sourceFile: ts.SourceFile,
    context: TransformContext
  ): Promise<ts.SourceFile> {
    let currentFile = sourceFile;

    for (const plugin of this.plugins) {
      if (plugin.beforeTransformFile) {
        const result = await plugin.beforeTransformFile(currentFile, context);
        if (result) {
          currentFile = result;
        }
      }
    }

    return currentFile;
  }

  /**
   * Call afterTransformFile hook on all plugins
   */
  async afterTransformFile(
    sourceFile: ts.SourceFile,
    result: TransformResult,
    context: TransformContext
  ): Promise<TransformResult> {
    let currentResult = result;

    for (const plugin of this.plugins) {
      if (plugin.afterTransformFile) {
        const pluginResult = await plugin.afterTransformFile(sourceFile, currentResult, context);
        if (pluginResult) {
          currentResult = pluginResult;
        }
      }
    }

    return currentResult;
  }

  /**
   * Call afterTransform hook on all plugins
   */
  async afterTransform(
    results: BatchTransformResult,
    context: TransformContext
  ): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.afterTransform) {
        await plugin.afterTransform(results, context);
      }
    }
  }

  /**
   * Call onError hook on all plugins
   */
  async onError(error: Error, context: TransformContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onError) {
        try {
          await plugin.onError(error, context);
        } catch (pluginError) {
          console.error(`Plugin ${plugin.name} error handler failed:`, pluginError);
        }
      }
    }
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins = [];
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): TransformerPlugin | undefined {
    return this.plugins.find(p => p.name === name);
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.some(p => p.name === name);
  }
}