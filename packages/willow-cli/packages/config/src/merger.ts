import type { WillowConfig, ConfigSource } from '@willow-cli/types';

export interface MergeOptions {
  /**
   * Custom merge strategies for specific paths
   */
  strategies?: Record<string, MergeStrategy>;
  
  /**
   * Whether to deep clone objects
   */
  clone?: boolean;
  
  /**
   * Array merge strategy
   */
  arrayStrategy?: 'replace' | 'concat' | 'unique';
}

export type MergeStrategy = (target: any, source: any, key: string) => any;

export interface ConfigWithSource {
  config: Partial<WillowConfig>;
  source: ConfigSource;
}

export class ConfigMerger {
  private strategies: Map<string, MergeStrategy>;
  
  constructor(private options: MergeOptions = {}) {
    this.strategies = new Map();
    
    // Add custom strategies
    if (options.strategies) {
      Object.entries(options.strategies).forEach(([path, strategy]) => {
        this.strategies.set(path, strategy);
      });
    }
  }
  
  /**
   * Merge multiple configurations with precedence
   * Higher priority sources override lower priority ones
   */
  merge(...configs: ConfigWithSource[]): WillowConfig {
    // Sort by priority (lower number = lower priority)
    const sorted = configs.sort((a, b) => a.source.priority - b.source.priority);
    
    // Start with empty config
    let result: any = {};
    
    // Merge each config in order
    for (const { config } of sorted) {
      result = this.deepMerge(result, config);
    }
    
    return result as WillowConfig;
  }
  
  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any, path: string = ''): any {
    // Check for custom strategy
    const strategy = this.strategies.get(path);
    if (strategy) {
      return strategy(target, source, path);
    }
    
    // Handle null/undefined
    if (source === null || source === undefined) {
      return source;
    }
    
    // Handle primitives and functions
    if (typeof source !== 'object' || source instanceof Date || source instanceof RegExp) {
      return source;
    }
    
    // Handle arrays
    if (Array.isArray(source)) {
      return this.mergeArrays(target, source);
    }
    
    // Clone target if needed, ensure it's an object
    const result = this.options.clone ? { ...(target || {}) } : (target || {});
    
    // Merge object properties
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const targetValue = result[key];
        const sourceValue = source[key];
        const newPath = path ? `${path}.${key}` : key;
        
        if (this.isObject(targetValue) && this.isObject(sourceValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue, newPath);
        } else {
          result[key] = this.deepMerge(targetValue, sourceValue, newPath);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Merge arrays based on strategy
   */
  private mergeArrays(target: any, source: any[]): any[] {
    if (!Array.isArray(target)) {
      return this.options.clone ? [...source] : source;
    }
    
    switch (this.options.arrayStrategy || 'replace') {
      case 'replace':
        return this.options.clone ? [...source] : source;
        
      case 'concat':
        return [...target, ...source];
        
      case 'unique':
        return Array.from(new Set([...target, ...source]));
        
      default:
        return source;
    }
  }
  
  /**
   * Check if value is a plain object
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value) &&
           !(value instanceof Date) && !(value instanceof RegExp);
  }
  
  /**
   * Create default configuration
   */
  static createDefaults(): Partial<WillowConfig> {
    return {
      version: '1.0',
      uiKit: 'willow',
      designSystem: {
        name: 'Willow Design System',
      },
      features: {
        astTransform: true,
        validation: true,
        dryRun: false,
        verbose: false,
      },
      paths: {
        src: './src',
        output: './src/components',
        components: './src/components',
        styles: './src/styles',
        config: './config',
        cache: './.willow-cache',
      },
      transforms: {},
      validation: {},
      plugins: [],
    };
  }
  
  /**
   * Create configuration sources with proper priorities
   */
  static createSources(configs: {
    defaults?: Partial<WillowConfig>;
    global?: Partial<WillowConfig>;
    project?: Partial<WillowConfig>;
    env?: Partial<WillowConfig>;
    cli?: Partial<WillowConfig>;
  }): ConfigWithSource[] {
    const sources: ConfigWithSource[] = [];
    
    if (configs.defaults) {
      sources.push({
        config: configs.defaults,
        source: { type: 'default', priority: 0 },
      });
    }
    
    if (configs.global) {
      sources.push({
        config: configs.global,
        source: { type: 'file', path: 'global', priority: 1 },
      });
    }
    
    if (configs.project) {
      sources.push({
        config: configs.project,
        source: { type: 'file', path: 'project', priority: 2 },
      });
    }
    
    if (configs.env) {
      sources.push({
        config: configs.env,
        source: { type: 'env', priority: 3 },
      });
    }
    
    if (configs.cli) {
      sources.push({
        config: configs.cli,
        source: { type: 'cli', priority: 4 },
      });
    }
    
    return sources;
  }
}