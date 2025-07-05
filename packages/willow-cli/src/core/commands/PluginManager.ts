/**
 * Plugin Manager for loading and managing command plugins
 */

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { IPluginCommand, ICommand } from './CommandInterface.js';
import { CommandRegistry } from './CommandRegistry.js';
import { Logger } from '../../ui/Logger.js';
import { CLIError, CLIErrorCode } from '../../types/cli.js';

/**
 * Plugin configuration
 */
export interface PluginConfig {
  name: string;
  enabled: boolean;
  path?: string;
  options?: Record<string, any>;
}

/**
 * Plugin manifest
 */
export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  commands: string[];
  dependencies?: Record<string, string>;
  engines?: {
    node?: string;
    willow?: string;
  };
}

/**
 * Plugin load result
 */
export interface PluginLoadResult {
  success: boolean;
  plugin?: IPluginCommand;
  error?: Error;
}

/**
 * Plugin manager for handling command plugins
 */
export class PluginManager {
  private plugins = new Map<string, IPluginCommand>();
  private pluginConfigs = new Map<string, PluginConfig>();
  private logger: Logger;
  private registry: CommandRegistry;
  private pluginPaths: string[] = [];

  constructor(registry: CommandRegistry, logger: Logger) {
    this.registry = registry;
    this.logger = logger;
    this.setupDefaultPaths();
  }

  /**
   * Setup default plugin paths
   */
  private setupDefaultPaths(): void {
    // Global plugins directory
    const globalPluginsDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.willow',
      'plugins'
    );

    // Local plugins directory
    const localPluginsDir = path.join(process.cwd(), '.willow', 'plugins');

    // Node modules plugins
    const nodeModulesPlugins = path.join(process.cwd(), 'node_modules', '@willow', 'plugins');

    this.pluginPaths = [
      localPluginsDir,
      globalPluginsDir,
      nodeModulesPlugins
    ];
  }

  /**
   * Add a plugin path
   */
  addPluginPath(pluginPath: string): void {
    if (!this.pluginPaths.includes(pluginPath)) {
      this.pluginPaths.unshift(pluginPath);
    }
  }

  /**
   * Load plugins from configured paths
   */
  async loadPlugins(configs?: PluginConfig[]): Promise<Map<string, PluginLoadResult>> {
    const results = new Map<string, PluginLoadResult>();

    // Load from configs if provided
    if (configs) {
      for (const config of configs) {
        if (!config.enabled) {
          continue;
        }

        const result = await this.loadPlugin(config);
        results.set(config.name, result);
      }
    }

    // Auto-discover plugins from plugin paths
    for (const pluginPath of this.pluginPaths) {
      try {
        const stat = await fs.stat(pluginPath);
        if (stat.isDirectory()) {
          const discovered = await this.discoverPlugins(pluginPath);
          for (const [name, result] of discovered) {
            if (!results.has(name)) {
              results.set(name, result);
            }
          }
        }
      } catch {
        // Path doesn't exist, skip
        continue;
      }
    }

    return results;
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(config: PluginConfig): Promise<PluginLoadResult> {
    try {
      let pluginPath = config.path;

      // If no path specified, search in plugin paths
      if (!pluginPath) {
        pluginPath = await this.findPlugin(config.name);
        if (!pluginPath) {
          throw new Error(`Plugin '${config.name}' not found in any plugin path`);
        }
      }

      // Load plugin manifest
      const manifest = await this.loadManifest(pluginPath);
      if (!manifest) {
        throw new Error(`No manifest found for plugin '${config.name}'`);
      }

      // Validate plugin compatibility
      await this.validatePlugin(manifest);

      // Load plugin module
      const pluginModule = await this.loadPluginModule(pluginPath);
      if (!pluginModule || !pluginModule.default) {
        throw new Error(`Invalid plugin module: ${config.name}`);
      }

      // Create plugin instance
      const PluginClass = pluginModule.default;
      const plugin = new PluginClass(config.options);

      // Validate plugin implements required interface
      if (!this.isValidPlugin(plugin)) {
        throw new Error(`Plugin '${config.name}' does not implement IPluginCommand interface`);
      }

      // Store plugin
      this.plugins.set(config.name, plugin);
      this.pluginConfigs.set(config.name, config);

      // Register plugin commands
      this.registry.register(plugin, { category: 'plugins' });

      this.logger.debug(`Loaded plugin: ${config.name}`);

      return {
        success: true,
        plugin
      };

    } catch (error) {
      this.logger.error(`Failed to load plugin '${config.name}':`, error);
      return {
        success: false,
        error: error as Error
      };
    }
  }

  /**
   * Discover plugins in a directory
   */
  private async discoverPlugins(directory: string): Promise<Map<string, PluginLoadResult>> {
    const results = new Map<string, PluginLoadResult>();

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(directory, entry.name);
          const manifestPath = path.join(pluginPath, 'plugin.json');

          try {
            await fs.access(manifestPath);
            const manifest = await this.loadManifest(pluginPath);
            if (manifest) {
              const config: PluginConfig = {
                name: manifest.name,
                enabled: true,
                path: pluginPath
              };
              const result = await this.loadPlugin(config);
              results.set(manifest.name, result);
            }
          } catch {
            // No manifest, skip
            continue;
          }
        }
      }
    } catch (error) {
      this.logger.debug(`Failed to discover plugins in ${directory}:`, error);
    }

    return results;
  }

  /**
   * Find plugin in configured paths
   */
  private async findPlugin(name: string): Promise<string | null> {
    for (const basePath of this.pluginPaths) {
      const pluginPath = path.join(basePath, name);
      try {
        const stat = await fs.stat(pluginPath);
        if (stat.isDirectory()) {
          return pluginPath;
        }
      } catch {
        // Not found, continue
      }
    }

    // Also check for scoped packages
    for (const basePath of this.pluginPaths) {
      const scopedPath = path.join(basePath, '@willow', name);
      try {
        const stat = await fs.stat(scopedPath);
        if (stat.isDirectory()) {
          return scopedPath;
        }
      } catch {
        // Not found, continue
      }
    }

    return null;
  }

  /**
   * Load plugin manifest
   */
  private async loadManifest(pluginPath: string): Promise<PluginManifest | null> {
    const manifestPath = path.join(pluginPath, 'plugin.json');
    
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content) as PluginManifest;
    } catch {
      return null;
    }
  }

  /**
   * Validate plugin compatibility
   */
  private async validatePlugin(manifest: PluginManifest): Promise<void> {
    // Check Node.js version
    if (manifest.engines?.node) {
      const currentVersion = process.version;
      // TODO: Implement version checking
    }

    // Check Willow CLI version
    if (manifest.engines?.willow) {
      // TODO: Implement version checking
    }
  }

  /**
   * Load plugin module
   */
  private async loadPluginModule(pluginPath: string): Promise<any> {
    const indexPath = path.join(pluginPath, 'index.js');
    const moduleUrl = pathToFileURL(indexPath).href;
    
    try {
      return await import(moduleUrl);
    } catch (error) {
      throw new Error(`Failed to load plugin module: ${error}`);
    }
  }

  /**
   * Check if object is a valid plugin
   */
  private isValidPlugin(obj: any): obj is IPluginCommand {
    return (
      obj &&
      typeof obj.configureOptions === 'function' &&
      typeof obj.execute === 'function' &&
      typeof obj.getMetadata === 'function' &&
      obj.pluginMetadata
    );
  }

  /**
   * Get loaded plugins
   */
  getPlugins(): Map<string, IPluginCommand> {
    return new Map(this.plugins);
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): IPluginCommand | undefined {
    return this.plugins.get(name);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return false;
    }

    // Cleanup if needed
    if (plugin.cleanup) {
      try {
        await plugin.cleanup();
      } catch (error) {
        this.logger.warn(`Error during plugin cleanup for '${name}':`, error);
      }
    }

    // Remove from registry
    const metadata = plugin.getMetadata();
    this.registry.remove(metadata.name);

    // Remove from internal maps
    this.plugins.delete(name);
    this.pluginConfigs.delete(name);

    this.logger.debug(`Unloaded plugin: ${name}`);
    return true;
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(name: string): Promise<PluginLoadResult> {
    const config = this.pluginConfigs.get(name);
    if (!config) {
      return {
        success: false,
        error: new Error(`Plugin '${name}' is not loaded`)
      };
    }

    // Unload first
    await this.unloadPlugin(name);

    // Load again
    return await this.loadPlugin(config);
  }

  /**
   * Get plugin statistics
   */
  getStats(): {
    loadedPlugins: number;
    pluginPaths: string[];
    plugins: Array<{
      name: string;
      version: string;
      commands: number;
    }>;
  } {
    const plugins = Array.from(this.plugins.entries()).map(([name, plugin]) => {
      const metadata = plugin.pluginMetadata;
      return {
        name,
        version: metadata.version,
        commands: 1 // Each plugin is one command for now
      };
    });

    return {
      loadedPlugins: this.plugins.size,
      pluginPaths: this.pluginPaths,
      plugins
    };
  }
}