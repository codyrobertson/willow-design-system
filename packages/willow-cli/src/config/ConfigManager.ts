/**
 * Configuration Management System for Willow CLI
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { CLIConfig, Framework, UIKit, Style } from '../types/cli.js';

// Configuration schema with validation
export const CLIConfigSchema = z.object({
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'solid']),
  uiKit: z.enum(['shadcn', 'material', 'bootstrap', 'antd', 'chakra', 'mantine']),
  style: z.enum(['tailwind', 'css-modules', 'styled-components', 'emotion', 'scss']),
  typescript: z.boolean(),
  paths: z.object({
    components: z.string(),
    utils: z.string(),
    styles: z.string(),
  }).catchall(z.string()),
  registry: z.object({
    url: z.string().url(),
    custom: z.array(z.object({
      name: z.string(),
      url: z.string().url(),
    })),
  }),
  theme: z.object({
    colors: z.record(z.string()),
    fonts: z.record(z.string()),
    spacing: z.record(z.string()),
  }),
  validation: z.object({
    strict: z.boolean(),
    rules: z.array(z.string()),
  }),
});

// Default configuration
export const DEFAULT_CONFIG: CLIConfig = {
  framework: 'react',
  uiKit: 'shadcn',
  style: 'tailwind',
  typescript: true,
  paths: {
    components: 'src/components',
    utils: 'src/lib/utils',
    styles: 'src/styles',
  },
  registry: {
    url: 'https://registry.willow-ui.com',
    custom: [],
  },
  theme: {
    colors: {},
    fonts: {},
    spacing: {},
  },
  validation: {
    strict: false,
    rules: [],
  },
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: CLIConfig | null = null;
  private configPath: string | null = null;
  
  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get configuration file paths in order of precedence
   */
  private getConfigPaths(customPath?: string): string[] {
    const paths: string[] = [];
    
    // Custom path has highest precedence
    if (customPath) {
      paths.push(customPath);
    }
    
    // Local project config
    paths.push(
      path.join(process.cwd(), '.willow', 'config.json'),
      path.join(process.cwd(), 'willow.config.json'),
      path.join(process.cwd(), '.willowrc.json'),
      path.join(process.cwd(), '.willowrc'),
    );
    
    // Global config
    const homeDir = os.homedir();
    paths.push(
      path.join(homeDir, '.willow', 'config.json'),
      path.join(homeDir, '.config', 'willow', 'config.json'),
    );
    
    return paths;
  }

  /**
   * Load configuration from file system
   */
  async load(customPath?: string): Promise<CLIConfig> {
    const paths = this.getConfigPaths(customPath);
    
    for (const configPath of paths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const rawConfig = JSON.parse(content);
        
        // Validate configuration
        const validatedConfig = CLIConfigSchema.parse(rawConfig);
        
        this.config = validatedConfig;
        this.configPath = configPath;
        
        return validatedConfig;
      } catch (error) {
        // Continue to next path if file doesn't exist or is invalid
        continue;
      }
    }
    
    // No config found, use defaults
    this.config = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }

  /**
   * Save configuration to file
   */
  async save(config?: CLIConfig, customPath?: string): Promise<void> {
    const configToSave = config || this.config || DEFAULT_CONFIG;
    const savePath = customPath || this.configPath || path.join(process.cwd(), '.willow', 'config.json');
    
    // Validate before saving
    const validatedConfig = CLIConfigSchema.parse(configToSave);
    
    // Ensure directory exists
    const dir = path.dirname(savePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save with pretty formatting
    await fs.writeFile(
      savePath,
      JSON.stringify(validatedConfig, null, 2),
      'utf-8'
    );
    
    this.config = validatedConfig;
    this.configPath = savePath;
  }

  /**
   * Get current configuration
   */
  get(): CLIConfig {
    return this.config || DEFAULT_CONFIG;
  }

  /**
   * Get a specific configuration value
   */
  getValue<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
    const config = this.get();
    return config[key];
  }

  /**
   * Set a configuration value
   */
  async setValue<K extends keyof CLIConfig>(key: K, value: CLIConfig[K]): Promise<void> {
    const config = this.get();
    config[key] = value;
    await this.save(config);
  }

  /**
   * Get nested configuration value using dot notation
   */
  getNestedValue(path: string): unknown {
    const config = this.get();
    const keys = path.split('.');
    let current: any = config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Set nested configuration value using dot notation
   */
  async setNestedValue(path: string, value: unknown): Promise<void> {
    const config = this.get();
    const keys = path.split('.');
    let current: any = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Try to parse string values as JSON, numbers, or booleans
    let parsedValue = value;
    if (typeof value === 'string') {
      // Try JSON parsing
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // Keep as string if JSON parsing fails
          parsedValue = value;
        }
      }
      // Try boolean parsing
      else if (value === 'true') {
        parsedValue = true;
      } else if (value === 'false') {
        parsedValue = false;
      }
      // Try number parsing
      else if (!isNaN(Number(value)) && value.trim() !== '') {
        parsedValue = Number(value);
      }
    }
    
    current[keys[keys.length - 1]] = parsedValue;
    await this.save(config);
  }

  /**
   * Merge configuration with existing
   */
  async merge(partialConfig: Partial<CLIConfig>): Promise<void> {
    const currentConfig = this.get();
    const mergedConfig = this.deepMerge(currentConfig, partialConfig);
    await this.save(mergedConfig);
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<void> {
    await this.save(DEFAULT_CONFIG);
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Check if configuration exists
   */
  async exists(customPath?: string): Promise<boolean> {
    const paths = this.getConfigPaths(customPath);
    
    for (const configPath of paths) {
      try {
        await fs.access(configPath);
        return true;
      } catch {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Create default configuration file
   */
  async createDefault(customPath?: string): Promise<void> {
    const savePath = customPath || path.join(process.cwd(), '.willow', 'config.json');
    await this.save(DEFAULT_CONFIG, savePath);
  }

  /**
   * Validate configuration
   */
  validate(config: unknown): config is CLIConfig {
    try {
      CLIConfigSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation errors
   */
  getValidationErrors(config: unknown): z.ZodError | null {
    try {
      CLIConfigSchema.parse(config);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error;
      }
      return null;
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is a plain object
   */
  private isObject(item: unknown): item is Record<string, unknown> {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();