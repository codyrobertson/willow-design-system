import { cosmiconfig, Options as CosmiconfigOptions } from 'cosmiconfig';
import type { WillowConfig, ConfigLoadOptions, ConfigSource } from '@willow-cli/types';
import { ConfigFileLoader } from './loader';
import { ConfigMerger } from './merger';
import { EnvironmentLoader } from './environment';
import { ConfigValidator } from './validator';
import { ConfigCache } from './cache';
import { resolve } from 'path';
import { homedir } from 'os';

export interface ConfigManagerOptions extends ConfigLoadOptions {
  /**
   * Module name for cosmiconfig
   */
  moduleName?: string;
  
  /**
   * Custom cosmiconfig options
   */
  cosmiconfigOptions?: Partial<CosmiconfigOptions>;
  
  /**
   * Cache options
   */
  cache?: boolean | { dir: string; ttl?: number };
}

export class ConfigManager {
  private moduleName: string;
  private fileLoader: ConfigFileLoader;
  private merger: ConfigMerger;
  private envLoader: EnvironmentLoader;
  private validator: ConfigValidator;
  private cache?: ConfigCache;
  private explorer: ReturnType<typeof cosmiconfig>;
  
  constructor(private options: ConfigManagerOptions = {}) {
    this.moduleName = options.moduleName || 'willow';
    
    // Initialize components
    this.fileLoader = new ConfigFileLoader({
      cwd: options.configPath,
      cache: !!options.cache,
    });
    
    this.merger = new ConfigMerger({
      clone: true,
      arrayStrategy: 'replace',
    });
    
    this.envLoader = new EnvironmentLoader({
      prefix: options.envPrefix || 'WILLOW_',
      convertCase: true,
    });
    
    this.validator = new ConfigValidator({
      strict: false,
      coerce: true,
    });
    
    // Initialize cache if enabled
    if (options.cache) {
      const cacheOpts = typeof options.cache === 'object' ? options.cache : {};
      this.cache = new ConfigCache({
        cacheDir: cacheOpts.dir || resolve(homedir(), `.${this.moduleName}-cache`),
        ttl: cacheOpts.ttl || 3600000, // 1 hour default
      });
    }
    
    // Initialize cosmiconfig
    this.explorer = cosmiconfig(this.moduleName, {
      searchPlaces: [
        'package.json',
        `.${this.moduleName}rc.json`,
        `.${this.moduleName}rc.yaml`,
        `.${this.moduleName}rc.yml`,
        `.${this.moduleName}rc.js`,
        `.${this.moduleName}rc.cjs`,
        `.${this.moduleName}rc.mjs`,
        `.${this.moduleName}.config.js`,
        `.${this.moduleName}.config.cjs`,
        `.${this.moduleName}.config.mjs`,
        `${this.moduleName}.config.js`,
        `${this.moduleName}.config.cjs`,
        `${this.moduleName}.config.mjs`,
      ],
      loaders: {
        '.json': (filepath: string) => this.fileLoader.load(filepath),
        '.yaml': (filepath: string) => this.fileLoader.load(filepath),
        '.yml': (filepath: string) => this.fileLoader.load(filepath),
        '.js': (filepath: string) => this.fileLoader.load(filepath),
        '.cjs': (filepath: string) => this.fileLoader.load(filepath),
        '.mjs': (filepath: string) => this.fileLoader.load(filepath),
      },
      ...options.cosmiconfigOptions,
    });
  }
  
  /**
   * Load configuration from all sources
   */
  async load(cliConfig?: Partial<WillowConfig>): Promise<WillowConfig> {
    // Check cache first
    const cacheKey = this.getCacheKey(cliConfig);
    if (this.cache) {
      const cached = await this.cache.get<WillowConfig>(cacheKey);
      if (cached) return cached;
    }
    
    // Load from all sources
    const sources: ConfigMerger['createSources'] = {
      defaults: ConfigMerger.createDefaults(),
    };
    
    // Load global config
    if (this.options.search !== false) {
      const globalConfig = await this.loadGlobalConfig();
      if (globalConfig) {
        sources.global = globalConfig.config;
      }
    }
    
    // Load project config
    const projectConfig = await this.loadProjectConfig();
    if (projectConfig) {
      sources.project = projectConfig.config;
    }
    
    // Load environment config
    sources.env = this.envLoader.load();
    
    // Add CLI config
    if (cliConfig) {
      sources.cli = cliConfig;
    }
    
    // Merge all sources
    const configSources = ConfigMerger.createSources(sources);
    const merged = this.merger.merge(...configSources);
    
    // Validate
    const validation = this.options.validate !== false
      ? this.validator.validate(merged)
      : { valid: true, data: merged };
      
    if (!validation.valid) {
      throw new ConfigValidationError('Configuration validation failed', validation.errors || []);
    }
    
    const finalConfig = validation.data!;
    
    // Cache the result
    if (this.cache) {
      await this.cache.set(cacheKey, finalConfig);
    }
    
    return finalConfig;
  }
  
  /**
   * Load configuration from specific file
   */
  async loadFile(filepath: string): Promise<WillowConfig> {
    const config = await this.fileLoader.load(filepath);
    
    const validation = this.validator.validate(config, {
      type: 'file',
      path: filepath,
      priority: 2,
    });
    
    if (!validation.valid) {
      throw new ConfigValidationError(
        `Configuration validation failed for ${filepath}`,
        validation.errors || []
      );
    }
    
    return validation.data!;
  }
  
  /**
   * Validate configuration
   */
  validate(config: unknown): ReturnType<ConfigValidator['validate']> {
    return this.validator.validate(config);
  }
  
  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear();
    }
  }
  
  /**
   * Get configuration schema info
   */
  getSchemaInfo(): ReturnType<ConfigValidator['getSchemaInfo']> {
    return this.validator.getSchemaInfo();
  }
  
  /**
   * Load global configuration
   */
  private async loadGlobalConfig(): Promise<{ config: Partial<WillowConfig>; filepath: string } | null> {
    const globalConfigPath = resolve(homedir(), `.${this.moduleName}`);
    
    try {
      const result = await this.explorer.search(globalConfigPath);
      if (result && !result.isEmpty) {
        return {
          config: result.config,
          filepath: result.filepath,
        };
      }
    } catch {
      // Ignore errors for global config
    }
    
    return null;
  }
  
  /**
   * Load project configuration
   */
  private async loadProjectConfig(): Promise<{ config: Partial<WillowConfig>; filepath: string } | null> {
    const searchFrom = this.options.configPath || process.cwd();
    
    try {
      const result = await this.explorer.search(searchFrom);
      if (result && !result.isEmpty) {
        return {
          config: result.config,
          filepath: result.filepath,
        };
      }
    } catch (error) {
      if (this.options.configPath) {
        // If specific path was provided, throw error
        throw error;
      }
      // Otherwise ignore
    }
    
    return null;
  }
  
  /**
   * Get cache key for configuration
   */
  private getCacheKey(cliConfig?: Partial<WillowConfig>): string {
    const parts = [
      'config',
      process.cwd(),
      JSON.stringify(cliConfig || {}),
    ];
    
    return parts.join(':');
  }
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
  
  toString(): string {
    const errorList = this.errors
      .map(e => `  - ${e.path}: ${e.message}`)
      .join('\n');
      
    return `${this.message}\n${errorList}`;
  }
}