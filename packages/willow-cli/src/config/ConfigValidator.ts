/**
 * Configuration Validation and Migration
 */

import { z } from 'zod';
import { CLIConfig, Framework, UIKit, Style } from '../types/cli.js';
import { CLIConfigSchema } from './ConfigManager.js';
import path from 'path';
import { promises as fs } from 'fs';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  path: string;
  message: string;
  expected?: string;
  received?: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export class ConfigValidator {
  /**
   * Validate configuration
   */
  async validate(config: unknown): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    // Schema validation
    try {
      CLIConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...this.zodErrorsToValidationErrors(error));
      }
    }
    
    // If basic schema validation fails, return early
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
        suggestions,
      };
    }
    
    // Additional validation for valid configs
    const validConfig = config as CLIConfig;
    
    // Check paths exist
    await this.validatePaths(validConfig, errors, warnings);
    
    // Check framework/UI kit compatibility
    this.validateCompatibility(validConfig, warnings);
    
    // Check registry accessibility
    await this.validateRegistry(validConfig, warnings);
    
    // Generate suggestions
    this.generateSuggestions(validConfig, suggestions);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Convert Zod errors to validation errors
   */
  private zodErrorsToValidationErrors(zodError: z.ZodError): ValidationError[] {
    return zodError.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      expected: 'expected' in err ? String(err.expected) : undefined,
      received: 'received' in err ? String(err.received) : undefined,
    }));
  }

  /**
   * Validate file system paths
   */
  private async validatePaths(
    config: CLIConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    for (const [key, pathValue] of Object.entries(config.paths)) {
      const fullPath = path.resolve(pathValue);
      
      try {
        await fs.access(fullPath);
      } catch {
        // Path doesn't exist - this is a warning, not an error
        warnings.push({
          path: `paths.${key}`,
          message: `Path does not exist: ${pathValue}`,
          suggestion: `Create directory: mkdir -p ${pathValue}`,
        });
      }
    }
  }

  /**
   * Validate framework and UI kit compatibility
   */
  private validateCompatibility(
    config: CLIConfig,
    warnings: ValidationWarning[]
  ): void {
    const compatibility: Record<Framework, UIKit[]> = {
      react: ['shadcn', 'material', 'antd', 'chakra', 'mantine'],
      vue: ['material', 'antd'],
      angular: ['material', 'bootstrap'],
      svelte: ['shadcn'],
      solid: ['shadcn'],
    };
    
    const compatibleKits = compatibility[config.framework];
    if (!compatibleKits.includes(config.uiKit)) {
      warnings.push({
        path: 'uiKit',
        message: `UI kit "${config.uiKit}" may have limited support for ${config.framework}`,
        suggestion: `Consider using one of: ${compatibleKits.join(', ')}`,
      });
    }
    
    // Style compatibility
    const styleCompatibility: Record<UIKit, Style[]> = {
      shadcn: ['tailwind'],
      material: ['css-modules', 'emotion', 'styled-components'],
      bootstrap: ['scss', 'css-modules'],
      antd: ['css-modules', 'tailwind'],
      chakra: ['emotion'],
      mantine: ['css-modules', 'emotion'],
    };
    
    const compatibleStyles = styleCompatibility[config.uiKit];
    if (compatibleStyles && !compatibleStyles.includes(config.style)) {
      warnings.push({
        path: 'style',
        message: `Style "${config.style}" may not be optimal for ${config.uiKit}`,
        suggestion: `Consider using one of: ${compatibleStyles.join(', ')}`,
      });
    }
  }

  /**
   * Validate registry configuration
   */
  private async validateRegistry(
    config: CLIConfig,
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      const response = await fetch(config.registry.url, { method: 'HEAD' });
      if (!response.ok) {
        warnings.push({
          path: 'registry.url',
          message: `Registry URL returned status ${response.status}`,
          suggestion: 'Check if the registry URL is correct',
        });
      }
    } catch {
      warnings.push({
        path: 'registry.url',
        message: 'Unable to reach registry URL',
        suggestion: 'Check your internet connection or registry URL',
      });
    }
    
    // Check custom registries
    for (let i = 0; i < config.registry.custom.length; i++) {
      const customRegistry = config.registry.custom[i];
      try {
        const response = await fetch(customRegistry.url, { method: 'HEAD' });
        if (!response.ok) {
          warnings.push({
            path: `registry.custom[${i}].url`,
            message: `Custom registry "${customRegistry.name}" returned status ${response.status}`,
          });
        }
      } catch {
        warnings.push({
          path: `registry.custom[${i}].url`,
          message: `Unable to reach custom registry "${customRegistry.name}"`,
        });
      }
    }
  }

  /**
   * Generate helpful suggestions
   */
  private generateSuggestions(
    config: CLIConfig,
    suggestions: string[]
  ): void {
    // TypeScript suggestions
    if (!config.typescript) {
      suggestions.push(
        'Consider enabling TypeScript for better type safety and IDE support'
      );
    }
    
    // Path suggestions
    if (!config.paths.tests) {
      suggestions.push(
        'Consider adding a "tests" path for test file organization'
      );
    }
    
    if (!config.paths.hooks && config.framework === 'react') {
      suggestions.push(
        'Consider adding a "hooks" path for React hooks'
      );
    }
    
    // Theme suggestions
    if (Object.keys(config.theme.colors).length === 0) {
      suggestions.push(
        'Customize your theme colors for a unique design system'
      );
    }
    
    // Validation suggestions
    if (!config.validation.strict) {
      suggestions.push(
        'Enable strict validation for better code quality enforcement'
      );
    }
  }

  /**
   * Auto-fix common configuration issues
   */
  async autoFix(config: CLIConfig): Promise<CLIConfig> {
    const fixed = { ...config };
    
    // Create missing directories
    for (const [key, pathValue] of Object.entries(fixed.paths)) {
      const fullPath = path.resolve(pathValue);
      try {
        await fs.mkdir(fullPath, { recursive: true });
      } catch {
        // Ignore errors
      }
    }
    
    // Fix common typos in framework names
    const frameworkMap: Record<string, Framework> = {
      'reactjs': 'react',
      'vuejs': 'vue',
      'angular.js': 'angular',
      'sveltejs': 'svelte',
      'solidjs': 'solid',
    };
    
    const lowerFramework = (fixed.framework as string).toLowerCase();
    if (frameworkMap[lowerFramework]) {
      fixed.framework = frameworkMap[lowerFramework];
    }
    
    // Ensure required paths exist
    if (!fixed.paths.components) {
      fixed.paths.components = 'src/components';
    }
    if (!fixed.paths.utils) {
      fixed.paths.utils = 'src/lib/utils';
    }
    
    return fixed;
  }

  /**
   * Migrate configuration from old format
   */
  migrateConfig(oldConfig: any): CLIConfig {
    // Handle v1 -> v2 migration
    if ('componentPath' in oldConfig) {
      return {
        ...DEFAULT_CONFIG,
        paths: {
          components: oldConfig.componentPath,
          utils: oldConfig.utilsPath || 'src/lib/utils',
          styles: oldConfig.stylesPath || 'src/styles',
        },
        framework: oldConfig.framework || 'react',
        typescript: oldConfig.typescript !== false,
      };
    }
    
    // Handle other migrations...
    
    return oldConfig as CLIConfig;
  }
}

// Export singleton instance
export const configValidator = new ConfigValidator();

// Re-export default config for migrations
import { DEFAULT_CONFIG } from './ConfigManager.js';
export { DEFAULT_CONFIG };