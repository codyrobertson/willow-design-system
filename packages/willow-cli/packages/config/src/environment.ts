import type { WillowConfig } from '@willow-cli/types';

export interface EnvironmentOptions {
  /**
   * Environment variable prefix
   */
  prefix?: string;
  
  /**
   * Delimiter for nested properties
   */
  delimiter?: string;
  
  /**
   * Custom parsers for specific paths
   */
  parsers?: Record<string, (value: string) => any>;
  
  /**
   * Whether to convert case (e.g., SNAKE_CASE to camelCase)
   */
  convertCase?: boolean;
}

export class EnvironmentLoader {
  private prefix: string;
  private delimiter: string;
  private parsers: Map<string, (value: string) => any>;
  
  constructor(private options: EnvironmentOptions = {}) {
    this.prefix = options.prefix || 'WILLOW_';
    this.delimiter = options.delimiter || '__';
    this.parsers = new Map([
      ['default', this.parseValue.bind(this)],
    ]);
    
    // Add custom parsers
    if (options.parsers) {
      Object.entries(options.parsers).forEach(([path, parser]) => {
        this.parsers.set(path, parser);
      });
    }
  }
  
  /**
   * Load configuration from environment variables
   */
  load(env: NodeJS.ProcessEnv = process.env): Partial<WillowConfig> {
    const config: any = {};
    
    // Find all environment variables with our prefix
    Object.entries(env).forEach(([key, value]) => {
      if (key.startsWith(this.prefix) && value !== undefined) {
        const path = this.parseKey(key);
        if (path) {
          this.setNestedValue(config, path, value);
        }
      }
    });
    
    return config;
  }
  
  /**
   * Parse environment variable key to object path
   */
  private parseKey(key: string): string[] | null {
    // Remove prefix
    const withoutPrefix = key.slice(this.prefix.length);
    if (!withoutPrefix) return null;
    
    // Split by delimiter and convert case
    const parts = withoutPrefix.split(this.delimiter);
    
    if (this.options.convertCase) {
      return parts.map(part => this.toCamelCase(part));
    }
    
    return parts.map(part => part.toLowerCase());
  }
  
  /**
   * Convert SNAKE_CASE to camelCase
   */
  private toCamelCase(str: string): string {
    return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  
  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string[], value: string): void {
    const lastKey = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    
    // Create nested structure
    let current = obj;
    for (const key of parentPath) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Get parser for this path
    const fullPath = path.join('.');
    const parser = this.parsers.get(fullPath) || this.parsers.get('default')!;
    
    // Set the value
    current[lastKey] = parser(value);
  }
  
  /**
   * Parse environment variable value
   */
  private parseValue(value: string): any {
    // Handle booleans
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Handle null
    if (value.toLowerCase() === 'null') return null;
    
    // Handle numbers
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Handle JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        // If JSON parsing fails, return as string
      }
    }
    
    // Return as string
    return value;
  }
  
  /**
   * Get all environment variables with prefix
   */
  getAll(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
    const result: Record<string, string> = {};
    
    Object.entries(env).forEach(([key, value]) => {
      if (key.startsWith(this.prefix) && value !== undefined) {
        result[key] = value;
      }
    });
    
    return result;
  }
  
  /**
   * Create environment variable name from config path
   */
  createEnvName(path: string[]): string {
    const parts = path.map(part => 
      this.options.convertCase ? this.toSnakeCase(part) : part.toUpperCase()
    );
    return this.prefix + parts.join(this.delimiter);
  }
  
  /**
   * Convert camelCase to SNAKE_CASE
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase().replace(/^_/, '');
  }
  
  /**
   * Generate environment variable documentation
   */
  generateDocs(): string {
    const lines = [
      `# ${this.prefix} Environment Variables`,
      '',
      'The following environment variables can be used to configure Willow CLI:',
      '',
    ];
    
    const examples = [
      { path: ['ui', 'kit'], desc: 'UI kit to use', example: 'radix' },
      { path: ['features', 'dry', 'run'], desc: 'Enable dry run mode', example: 'true' },
      { path: ['features', 'verbose'], desc: 'Enable verbose logging', example: 'true' },
      { path: ['paths', 'src'], desc: 'Source directory', example: './src' },
      { path: ['paths', 'output'], desc: 'Output directory', example: './build' },
    ];
    
    examples.forEach(({ path, desc, example }) => {
      const envName = this.createEnvName(path);
      lines.push(`# ${desc}`);
      lines.push(`${envName}=${example}`);
      lines.push('');
    });
    
    return lines.join('\n');
  }
}