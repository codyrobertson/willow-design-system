/**
 * Configuration Loader with support for multiple file formats
 */

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import yaml from 'js-yaml';
import { CLIConfig } from '../types/cli.js';
import { CLIConfigSchema } from './ConfigManager.js';

export interface ConfigLoaderOptions {
  cwd?: string;
  configName?: string;
  searchPlaces?: string[];
  stopAt?: string;
}

export class ConfigLoader {
  private options: Required<ConfigLoaderOptions>;
  
  constructor(options: ConfigLoaderOptions = {}) {
    this.options = {
      cwd: options.cwd || process.cwd(),
      configName: options.configName || 'willow',
      searchPlaces: options.searchPlaces || [
        'package.json',
        '.willowrc',
        '.willowrc.json',
        '.willowrc.yaml',
        '.willowrc.yml',
        '.willowrc.js',
        '.willowrc.mjs',
        '.willowrc.cjs',
        'willow.config.js',
        'willow.config.mjs',
        'willow.config.cjs',
        '.willow/config.json',
        '.willow/config.yaml',
        '.willow/config.yml',
      ],
      stopAt: options.stopAt || path.parse(options.cwd || process.cwd()).root,
    };
  }

  /**
   * Search for configuration file
   */
  async search(): Promise<{ config: CLIConfig; filepath: string } | null> {
    let currentDir = this.options.cwd;
    
    while (currentDir !== this.options.stopAt) {
      for (const searchPlace of this.options.searchPlaces) {
        const filepath = path.join(currentDir, searchPlace);
        
        try {
          const config = await this.loadFromPath(filepath);
          if (config) {
            return { config, filepath };
          }
        } catch {
          // Continue to next search place
          continue;
        }
      }
      
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }
    
    return null;
  }

  /**
   * Load configuration from a specific path
   */
  async loadFromPath(filepath: string): Promise<CLIConfig | null> {
    const ext = path.extname(filepath).toLowerCase();
    
    try {
      let rawConfig: unknown;
      
      switch (ext) {
        case '.json':
        case '':  // Files without extension (like .willowrc)
          rawConfig = await this.loadJSON(filepath);
          break;
          
        case '.yaml':
        case '.yml':
          rawConfig = await this.loadYAML(filepath);
          break;
          
        case '.js':
        case '.mjs':
        case '.cjs':
          rawConfig = await this.loadJS(filepath);
          break;
          
        default:
          // Special case for package.json
          if (path.basename(filepath) === 'package.json') {
            rawConfig = await this.loadFromPackageJSON(filepath);
          } else {
            return null;
          }
      }
      
      if (!rawConfig) return null;
      
      // Validate configuration
      const validatedConfig = CLIConfigSchema.parse(rawConfig);
      return validatedConfig;
      
    } catch (error) {
      // If file doesn't exist or is invalid, return null
      return null;
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
    return yaml.load(content);
  }

  /**
   * Load JavaScript configuration
   */
  private async loadJS(filepath: string): Promise<unknown> {
    const fileUrl = pathToFileURL(filepath).href;
    const module = await import(fileUrl);
    
    // Handle both default export and module.exports
    return module.default || module;
  }

  /**
   * Load configuration from package.json
   */
  private async loadFromPackageJSON(filepath: string): Promise<unknown> {
    const content = await fs.readFile(filepath, 'utf-8');
    const packageJson = JSON.parse(content);
    
    // Look for "willow" field in package.json
    return packageJson.willow || null;
  }

  /**
   * Get all possible config file paths in current directory
   */
  getSearchPaths(): string[] {
    return this.options.searchPlaces.map(place => 
      path.join(this.options.cwd, place)
    );
  }

  /**
   * Check if a config file exists at the given path
   */
  async exists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}

// Preset configurations
export const CONFIG_PRESETS: Record<string, Partial<CLIConfig>> = {
  'nextjs-tailwind': {
    framework: 'react',
    uiKit: 'shadcn',
    style: 'tailwind',
    typescript: true,
    paths: {
      components: 'components',
      utils: 'lib/utils',
      styles: 'styles',
    },
  },
  'vite-react': {
    framework: 'react',
    uiKit: 'shadcn',
    style: 'tailwind',
    typescript: true,
    paths: {
      components: 'src/components',
      utils: 'src/lib/utils',
      styles: 'src/styles',
    },
  },
  'vue-material': {
    framework: 'vue',
    uiKit: 'material',
    style: 'scss',
    typescript: true,
    paths: {
      components: 'src/components',
      utils: 'src/utils',
      styles: 'src/styles',
    },
  },
  'angular-bootstrap': {
    framework: 'angular',
    uiKit: 'bootstrap',
    style: 'scss',
    typescript: true,
    paths: {
      components: 'src/app/components',
      utils: 'src/app/utils',
      styles: 'src/styles',
    },
  },
  'svelte-tailwind': {
    framework: 'svelte',
    uiKit: 'shadcn',
    style: 'tailwind',
    typescript: true,
    paths: {
      components: 'src/lib/components',
      utils: 'src/lib/utils',
      styles: 'src/styles',
    },
  },
};