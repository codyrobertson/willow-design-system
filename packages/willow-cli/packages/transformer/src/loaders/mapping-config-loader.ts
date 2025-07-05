import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { z } from 'zod';
import type { ComponentMappingConfig } from '../schemas/component-mapping.schema';
import { ComponentMappingConfigSchema } from '../schemas/component-mapping.schema';
import { MappingValidator } from '../utils/mapping-validator';

/**
 * Configuration source types
 */
export type ConfigSource = 
  | { type: 'file'; path: string }
  | { type: 'object'; config: ComponentMappingConfig }
  | { type: 'json'; content: string }
  | { type: 'url'; url: string }
  | { type: 'module'; module: string };

/**
 * Loader options
 */
export interface LoaderOptions {
  validate?: boolean;
  cache?: boolean;
  merge?: boolean;
  watch?: boolean;
  transformers?: Record<string, (config: any) => any>;
  fallbackPaths?: string[];
}

/**
 * Load result
 */
export interface LoadResult {
  success: boolean;
  config?: ComponentMappingConfig;
  source: string;
  errors: string[];
  warnings: string[];
  metadata?: {
    loadTime: number;
    fileSize?: number;
    lastModified?: Date;
  };
}

/**
 * Merge strategy for configurations
 */
export interface MergeStrategy {
  mappings?: 'replace' | 'append' | 'merge';
  globalProps?: 'replace' | 'append' | 'merge';
  options?: 'replace' | 'merge';
  version?: 'keep-first' | 'keep-last' | 'validate';
}

/**
 * Handles loading and managing component mapping configurations
 */
export class MappingConfigLoader {
  private cache = new Map<string, LoadResult>();
  private watchers = new Map<string, fs.FSWatcher>();
  private defaultPaths = [
    'component-mapping.json',
    'component-mapping.config.json',
    '.component-mapping.json',
    'config/component-mapping.json',
    'transformations/component-mapping.json',
  ];

  /**
   * Load configuration from a source
   */
  async load(source: ConfigSource, options: LoaderOptions = {}): Promise<LoadResult> {
    const startTime = Date.now();
    const result: LoadResult = {
      success: false,
      source: this.getSourceString(source),
      errors: [],
      warnings: [],
    };

    try {
      // Check cache first
      if (options.cache && this.cache.has(result.source)) {
        const cached = this.cache.get(result.source)!;
        if (this.isCacheValid(cached, source)) {
          return cached;
        }
      }

      // Load based on source type
      let config: ComponentMappingConfig | undefined;
      
      switch (source.type) {
        case 'file':
          config = await this.loadFromFile(source.path, result);
          break;
        case 'object':
          config = source.config;
          break;
        case 'json':
          config = this.parseJson(source.content, result);
          break;
        case 'url':
          config = await this.loadFromUrl(source.url, result);
          break;
        case 'module':
          config = await this.loadFromModule(source.module, result);
          break;
      }

      if (!config) {
        result.errors.push('Failed to load configuration');
        return result;
      }

      // Apply transformers if provided
      if (options.transformers) {
        config = this.applyTransformers(config, options.transformers, result);
      }

      // Validate if requested
      if (options.validate !== false) {
        const validationResult = MappingValidator.validateConfig(config);
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors
            .filter(e => e.severity === 'error')
            .map(e => e.message));
          result.warnings.push(...validationResult.errors
            .filter(e => e.severity === 'warning')
            .map(e => e.message));
          
          if (validationResult.suggestions) {
            result.warnings.push(...validationResult.suggestions.map(s => s.suggestion));
          }
          
          if (validationResult.errors.some(e => e.severity === 'error')) {
            return result;
          }
        }
      }

      // Set up file watching if requested
      if (options.watch && source.type === 'file') {
        this.setupWatcher(source.path, options);
      }

      result.success = true;
      result.config = config;
      result.metadata = {
        loadTime: Date.now() - startTime,
        ...(result as any)._fileMetadata,
      };

      // Cache the result
      if (options.cache) {
        this.cache.set(result.source, result);
      }

      return result;
    } catch (error) {
      result.errors.push(`Load error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Load from file
   */
  private async loadFromFile(filePath: string, result: LoadResult): Promise<ComponentMappingConfig | undefined> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      if (!fs.existsSync(resolvedPath)) {
        result.errors.push(`File not found: ${resolvedPath}`);
        return undefined;
      }

      const stats = fs.statSync(resolvedPath);
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      
      // Store metadata for later use
      const fileMetadata = {
        fileSize: stats.size,
        lastModified: stats.mtime,
      };
      
      // We'll set it on the main result later
      (result as any)._fileMetadata = fileMetadata;

      const ext = path.extname(resolvedPath).toLowerCase();
      
      if (ext === '.json') {
        return this.parseJson(content, result);
      } else if (ext === '.js' || ext === '.mjs') {
        return await this.loadFromModule(resolvedPath, result);
      } else if (ext === '.ts') {
        result.warnings.push('TypeScript config files require compilation');
        return this.parseJson(content, result);
      } else {
        result.errors.push(`Unsupported file type: ${ext}`);
        return undefined;
      }
    } catch (error) {
      result.errors.push(`File read error: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Parse JSON content
   */
  private parseJson(content: string, result: LoadResult): ComponentMappingConfig | undefined {
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      result.errors.push(`JSON parse error: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Load from URL
   */
  private async loadFromUrl(url: string, result: LoadResult): Promise<ComponentMappingConfig | undefined> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        result.errors.push(`HTTP error: ${response.status} ${response.statusText}`);
        return undefined;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        result.warnings.push(`Unexpected content type: ${contentType}`);
      }

      const text = await response.text();
      return this.parseJson(text, result);
    } catch (error) {
      result.errors.push(`Network error: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Load from module
   */
  private async loadFromModule(modulePath: string, result: LoadResult): Promise<ComponentMappingConfig | undefined> {
    try {
      // Use dynamic import for ES modules
      const moduleUrl = pathToFileURL(path.resolve(modulePath)).href;
      const module = await import(moduleUrl);
      const config = module.default || module;
      
      if (typeof config === 'function') {
        return await config();
      }
      
      return config;
    } catch (error) {
      result.errors.push(`Module load error: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Load configuration with fallback paths
   */
  async loadWithFallback(
    primarySource: ConfigSource,
    options: LoaderOptions = {}
  ): Promise<LoadResult> {
    // Try primary source first
    let result = await this.load(primarySource, options);
    if (result.success) {
      return result;
    }

    // Try fallback paths
    const fallbackPaths = options.fallbackPaths || this.defaultPaths;
    for (const fallbackPath of fallbackPaths) {
      result = await this.load({ type: 'file', path: fallbackPath }, options);
      if (result.success) {
        result.warnings.push(`Loaded from fallback path: ${fallbackPath}`);
        return result;
      }
    }

    return result;
  }

  /**
   * Merge multiple configurations
   */
  mergeConfigs(
    configs: ComponentMappingConfig[],
    strategy: MergeStrategy = {}
  ): ComponentMappingConfig {
    if (configs.length === 0) {
      throw new Error('No configurations to merge');
    }

    if (configs.length === 1) {
      return configs[0];
    }

    const merged: ComponentMappingConfig = {
      version: configs[0].version,
      sourceUIKit: configs[0].sourceUIKit,
      targetUIKit: configs[0].targetUIKit,
      mappings: [],
      globalPropMappings: [],
      valueTransformers: {},
      options: {},
    };

    // Merge version
    if (strategy.version === 'keep-last') {
      merged.version = configs[configs.length - 1].version;
    } else if (strategy.version === 'validate') {
      const versions = new Set(configs.map(c => c.version));
      if (versions.size > 1) {
        throw new Error(`Version mismatch: ${Array.from(versions).join(', ')}`);
      }
    }

    // Merge mappings
    const mappingStrategy = strategy.mappings || 'append';
    if (mappingStrategy === 'replace') {
      merged.mappings = configs[configs.length - 1].mappings;
    } else if (mappingStrategy === 'append') {
      merged.mappings = configs.flatMap(c => c.mappings);
    } else {
      // Merge by component name
      const mappingMap = new Map();
      for (const config of configs) {
        for (const mapping of config.mappings) {
          const existing = mappingMap.get(mapping.sourceComponent);
          if (existing) {
            // Merge props
            const propMap = new Map(existing.props.map((p: any) => [p.source, p]));
            for (const prop of mapping.props) {
              propMap.set(prop.source, prop);
            }
            existing.props = Array.from(propMap.values());
          } else {
            mappingMap.set(mapping.sourceComponent, { ...mapping });
          }
        }
      }
      merged.mappings = Array.from(mappingMap.values());
    }

    // Merge global prop mappings
    const globalStrategy = strategy.globalProps || 'append';
    if (globalStrategy === 'replace') {
      merged.globalPropMappings = configs[configs.length - 1].globalPropMappings || [];
    } else if (globalStrategy === 'append') {
      merged.globalPropMappings = configs.flatMap(c => c.globalPropMappings || []);
    } else {
      // Merge by prop name
      const propMap = new Map();
      for (const config of configs) {
        for (const prop of config.globalPropMappings || []) {
          propMap.set(prop.source, prop);
        }
      }
      merged.globalPropMappings = Array.from(propMap.values());
    }

    // Merge value transformers
    for (const config of configs) {
      Object.assign(merged.valueTransformers!, config.valueTransformers || {});
    }

    // Merge options
    const optionsStrategy = strategy.options || 'merge';
    if (optionsStrategy === 'replace') {
      merged.options = configs[configs.length - 1].options || {};
    } else {
      for (const config of configs) {
        Object.assign(merged.options!, config.options || {});
      }
    }

    return merged;
  }

  /**
   * Find configuration file
   */
  async findConfig(startDir: string = process.cwd()): Promise<string | null> {
    let currentDir = path.resolve(startDir);
    
    while (currentDir !== path.dirname(currentDir)) {
      for (const configName of this.defaultPaths) {
        const configPath = path.join(currentDir, configName);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * Apply transformers to configuration
   */
  private applyTransformers(
    config: ComponentMappingConfig,
    transformers: Record<string, (config: any) => any>,
    result: LoadResult
  ): ComponentMappingConfig {
    let transformed = config;
    
    for (const [name, transformer] of Object.entries(transformers)) {
      try {
        transformed = transformer(transformed);
      } catch (error) {
        result.warnings.push(
          `Transformer '${name}' failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return transformed;
  }

  /**
   * Set up file watcher
   */
  private setupWatcher(filePath: string, options: LoaderOptions): void {
    const resolvedPath = path.resolve(filePath);
    
    // Remove existing watcher
    if (this.watchers.has(resolvedPath)) {
      this.watchers.get(resolvedPath)!.close();
    }

    const watcher = fs.watch(resolvedPath, async (eventType) => {
      if (eventType === 'change') {
        // Clear cache
        this.cache.delete(`file:${resolvedPath}`);
        
        // Emit change event (would need event emitter implementation)
        console.log(`Configuration file changed: ${resolvedPath}`);
        
        // Reload configuration
        await this.load({ type: 'file', path: filePath }, { ...options, watch: false });
      }
    });

    this.watchers.set(resolvedPath, watcher);
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(cached: LoadResult, source: ConfigSource): boolean {
    if (!cached.metadata?.lastModified || source.type !== 'file') {
      return true;
    }

    try {
      const stats = fs.statSync(source.path);
      return stats.mtime.getTime() === cached.metadata.lastModified.getTime();
    } catch {
      return false;
    }
  }

  /**
   * Get source string for caching
   */
  private getSourceString(source: ConfigSource): string {
    switch (source.type) {
      case 'file':
        return `file:${path.resolve(source.path)}`;
      case 'url':
        return `url:${source.url}`;
      case 'module':
        return `module:${source.module}`;
      case 'json':
        return `json:${source.content.substring(0, 50)}`;
      case 'object':
        return 'object:inline';
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Stop all watchers
   */
  stopWatchers(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }

  /**
   * Export configuration to file
   */
  async export(config: ComponentMappingConfig, filePath: string): Promise<void> {
    const content = JSON.stringify(config, null, 2);
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Validate configuration without loading
   */
  validateConfig(config: unknown): z.SafeParseReturnType<unknown, ComponentMappingConfig> {
    return ComponentMappingConfigSchema.safeParse(config);
  }
}