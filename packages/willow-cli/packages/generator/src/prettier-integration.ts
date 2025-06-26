/**
 * Prettier Integration
 * Formats generated code using Prettier
 */

import { format, Options } from 'prettier';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PrettierConfig, OutputFormat } from './types';

export class PrettierIntegration {
  private static defaultConfig: Options = {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
  };

  /**
   * Format code with Prettier
   */
  static async formatCode(
    code: string,
    filePath: string,
    customConfig?: PrettierConfig
  ): Promise<string> {
    try {
      // Load Prettier config from project if available
      const projectConfig = await this.loadProjectConfig(filePath);
      
      // Merge configurations (project > custom > default)
      const config = {
        ...this.defaultConfig,
        ...projectConfig,
        ...customConfig,
      };
      
      // Determine parser based on file extension
      const parser = this.getParser(filePath);
      
      // Format the code
      const formatted = await format(code, {
        ...config,
        parser,
        filepath: filePath,
      });
      
      return formatted;
    } catch (error) {
      console.warn('Prettier formatting failed:', error);
      // Return original code if formatting fails
      return code;
    }
  }

  /**
   * Format code synchronously
   */
  static formatCodeSync(
    code: string,
    filePath: string,
    customConfig?: PrettierConfig
  ): string {
    try {
      const parser = this.getParser(filePath);
      
      const formatted = format(code, {
        ...this.defaultConfig,
        ...customConfig,
        parser,
        filepath: filePath,
      });
      
      return formatted;
    } catch (error) {
      console.warn('Prettier formatting failed:', error);
      return code;
    }
  }

  /**
   * Load Prettier config from project
   */
  private static async loadProjectConfig(filePath: string): Promise<Options> {
    try {
      // Look for Prettier config files in parent directories
      const configFiles = [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.yaml',
        '.prettierrc.yml',
        '.prettierrc.js',
        '.prettierrc.cjs',
        'prettier.config.js',
        'prettier.config.cjs',
      ];
      
      let currentDir = path.dirname(filePath);
      const rootDir = path.parse(currentDir).root;
      
      while (currentDir !== rootDir) {
        for (const configFile of configFiles) {
          const configPath = path.join(currentDir, configFile);
          
          try {
            await fs.access(configPath);
            
            // Load config based on file type
            if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
              // Dynamic import for JS configs
              const module = await import(configPath);
              return module.default || module;
            } else if (configFile.endsWith('.json') || configFile === '.prettierrc') {
              const content = await fs.readFile(configPath, 'utf-8');
              return JSON.parse(content);
            } else if (configFile.endsWith('.yaml') || configFile.endsWith('.yml')) {
              // For YAML, we'd need a YAML parser
              // For now, skip YAML configs
              continue;
            }
          } catch {
            // Config file doesn't exist, continue searching
          }
        }
        
        currentDir = path.dirname(currentDir);
      }
      
      // Also check package.json
      try {
        const packagePath = path.join(currentDir, 'package.json');
        const packageContent = await fs.readFile(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);
        
        if (packageJson.prettier) {
          return packageJson.prettier;
        }
      } catch {
        // No package.json or no prettier config
      }
    } catch (error) {
      console.debug('Failed to load project Prettier config:', error);
    }
    
    return {};
  }

  /**
   * Get parser based on file extension
   */
  private static getParser(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      
      case '.js':
      case '.jsx':
      case '.mjs':
      case '.cjs':
        return 'babel';
      
      case '.json':
        return 'json';
      
      case '.md':
        return 'markdown';
      
      case '.html':
        return 'html';
      
      case '.css':
        return 'css';
      
      case '.scss':
        return 'scss';
      
      case '.less':
        return 'less';
      
      case '.yaml':
      case '.yml':
        return 'yaml';
      
      default:
        // Default to babel for JavaScript-like files
        return 'babel';
    }
  }

  /**
   * Check if code is already formatted
   */
  static async isFormatted(
    code: string,
    filePath: string,
    customConfig?: PrettierConfig
  ): Promise<boolean> {
    try {
      const formatted = await this.formatCode(code, filePath, customConfig);
      return formatted === code;
    } catch {
      return true; // Assume it's formatted if we can't check
    }
  }

  /**
   * Get Prettier config for a specific output format
   */
  static getConfigForFormat(format: OutputFormat): Partial<Options> {
    const baseConfig: Partial<Options> = {};
    
    switch (format) {
      case OutputFormat.TypeScript:
      case OutputFormat.TSX:
        baseConfig.parser = 'typescript';
        break;
      
      case OutputFormat.JavaScript:
      case OutputFormat.JSX:
      case OutputFormat.ESModule:
      case OutputFormat.CommonJS:
        baseConfig.parser = 'babel';
        break;
    }
    
    return baseConfig;
  }

  /**
   * Create a Prettier ignore file content
   */
  static generateIgnoreFile(): string {
    return `# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build outputs
dist/
build/
out/
.next/

# Generated files
*.min.js
*.min.css
coverage/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
.cache/
`;
  }

  /**
   * Validate Prettier config
   */
  static validateConfig(config: PrettierConfig): string[] {
    const errors: string[] = [];
    
    if (config.printWidth !== undefined && config.printWidth < 0) {
      errors.push('printWidth must be a positive number');
    }
    
    if (config.tabWidth !== undefined && config.tabWidth < 0) {
      errors.push('tabWidth must be a positive number');
    }
    
    if (config.trailingComma !== undefined) {
      const validValues = ['none', 'es5', 'all'];
      if (!validValues.includes(config.trailingComma)) {
        errors.push(`trailingComma must be one of: ${validValues.join(', ')}`);
      }
    }
    
    if (config.arrowParens !== undefined) {
      const validValues = ['avoid', 'always'];
      if (!validValues.includes(config.arrowParens)) {
        errors.push(`arrowParens must be one of: ${validValues.join(', ')}`);
      }
    }
    
    if (config.endOfLine !== undefined) {
      const validValues = ['auto', 'lf', 'crlf', 'cr'];
      if (!validValues.includes(config.endOfLine)) {
        errors.push(`endOfLine must be one of: ${validValues.join(', ')}`);
      }
    }
    
    return errors;
  }
}