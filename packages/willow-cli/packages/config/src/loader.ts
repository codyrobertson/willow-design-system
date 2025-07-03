import { promises as fs } from 'fs';
import { resolve, extname } from 'path';
import yaml from 'yaml';
import { pathToFileURL } from 'url';
import type { ConfigFormat, WillowConfig } from '@willow-cli/types';

export interface LoaderOptions {
  /**
   * Current working directory
   */
  cwd?: string;
  
  /**
   * Whether to use cache
   */
  cache?: boolean;
  
  /**
   * Custom loaders for specific formats
   */
  loaders?: Record<string, ConfigLoader>;
}

export type ConfigLoader = (filepath: string) => Promise<unknown>;

export class ConfigFileLoader {
  private loaders: Map<string, ConfigLoader>;
  private cache: Map<string, { content: unknown; mtime: number }>;
  
  constructor(private options: LoaderOptions = {}) {
    this.cache = new Map();
    this.loaders = new Map([
      ['json', this.loadJSON.bind(this)],
      ['yaml', this.loadYAML.bind(this)],
      ['yml', this.loadYAML.bind(this)],
      ['js', this.loadJS.bind(this)],
      ['mjs', this.loadJS.bind(this)],
      ['cjs', this.loadCommonJS.bind(this)],
      ['ts', this.loadTypeScript.bind(this)],
    ]);
    
    // Add custom loaders
    if (options.loaders) {
      Object.entries(options.loaders).forEach(([ext, loader]) => {
        this.loaders.set(ext, loader);
      });
    }
  }
  
  /**
   * Load configuration from file
   */
  async load(filepath: string): Promise<unknown> {
    const resolvedPath = resolve(this.options.cwd || process.cwd(), filepath);
    
    // Check cache
    if (this.options.cache) {
      const cached = await this.checkCache(resolvedPath);
      if (cached) return cached;
    }
    
    const ext = extname(resolvedPath).slice(1).toLowerCase();
    const loader = this.loaders.get(ext);
    
    if (!loader) {
      throw new Error(`Unsupported configuration format: .${ext}`);
    }
    
    try {
      const content = await loader(resolvedPath);
      
      // Update cache
      if (this.options.cache) {
        await this.updateCache(resolvedPath, content);
      }
      
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load configuration from ${filepath}: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Load JSON configuration
   */
  private async loadJSON(filepath: string): Promise<unknown> {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }
  
  /**
   * Load YAML configuration
   */
  private async loadYAML(filepath: string): Promise<unknown> {
    const content = await fs.readFile(filepath, 'utf-8');
    return yaml.parse(content);
  }
  
  /**
   * Load JavaScript ES module configuration
   */
  private async loadJS(filepath: string): Promise<unknown> {
    const fileUrl = pathToFileURL(filepath).href;
    const module = await import(fileUrl);
    return module.default || module;
  }
  
  /**
   * Load CommonJS configuration
   */
  private async loadCommonJS(filepath: string): Promise<unknown> {
    // Use require for CommonJS
    delete require.cache[filepath];
    return require(filepath);
  }
  
  /**
   * Load TypeScript configuration
   */
  private async loadTypeScript(filepath: string): Promise<unknown> {
    // In production, TS files should be compiled to JS
    // For development, we can use tsx or ts-node
    try {
      // Try to load as JS first (compiled)
      const jsPath = filepath.replace(/\.ts$/, '.js');
      return await this.loadJS(jsPath);
    } catch {
      // Fallback to requiring TS directly (development)
      return this.loadCommonJS(filepath);
    }
  }
  
  /**
   * Check cache for file
   */
  private async checkCache(filepath: string): Promise<unknown | null> {
    const cached = this.cache.get(filepath);
    if (!cached) return null;
    
    try {
      const stats = await fs.stat(filepath);
      if (stats.mtimeMs <= cached.mtime) {
        return cached.content;
      }
    } catch {
      // File doesn't exist or can't be accessed
    }
    
    this.cache.delete(filepath);
    return null;
  }
  
  /**
   * Update cache with file content
   */
  private async updateCache(filepath: string, content: unknown): Promise<void> {
    try {
      const stats = await fs.stat(filepath);
      this.cache.set(filepath, {
        content,
        mtime: stats.mtimeMs,
      });
    } catch {
      // Don't cache if we can't get file stats
    }
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return Array.from(this.loaders.keys());
  }
}