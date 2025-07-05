import { z } from 'zod';
import type { UIKitAdapter } from './ui-kit';
import type { PluginConfig } from './plugin';

/**
 * Main configuration schema for Willow CLI
 */
export const WillowConfigSchema = z.object({
  /**
   * Configuration version
   */
  version: z.string().default('1.0'),
  
  /**
   * UI Kit to use (name or adapter instance)
   */
  uiKit: z.union([z.string(), z.custom<UIKitAdapter>()]).default('willow'),
  
  /**
   * Design system configuration
   */
  designSystem: z.object({
    /**
     * Name of the design system
     */
    name: z.string().default('Willow Design System'),
    
    /**
     * Design tokens configuration
     */
    tokens: z.object({
      colors: z.record(z.string()).optional(),
      spacing: z.record(z.string()).optional(),
      typography: z.record(z.string()).optional(),
      shadows: z.record(z.string()).optional(),
      borderRadius: z.record(z.string()).optional(),
      custom: z.record(z.any()).optional(),
    }).optional(),
    
    /**
     * Theme configuration
     */
    themes: z.record(z.any()).optional(),
  }).default({}),
  
  /**
   * Feature flags
   */
  features: z.object({
    /**
     * Enable AST-based transformations
     */
    astTransform: z.boolean().default(true),
    
    /**
     * Enable validation
     */
    validation: z.boolean().default(true),
    
    /**
     * Enable dry-run mode by default
     */
    dryRun: z.boolean().default(false),
    
    /**
     * Enable verbose logging
     */
    verbose: z.boolean().default(false),
    
    /**
     * Enable experimental features
     */
    experimental: z.object({
      /**
       * Enable AI-powered component translation
       */
      aiTranslation: z.boolean().default(false),
      
      /**
       * Enable visual component mapping
       */
      visualMapping: z.boolean().default(false),
    }).optional(),
  }).default({}),
  
  /**
   * Path configuration
   */
  paths: z.object({
    /**
     * Source directory for components
     */
    src: z.string().default('./src'),
    
    /**
     * Output directory for generated files
     */
    output: z.string().default('./src/components'),
    
    /**
     * Components directory
     */
    components: z.string().default('./src/components'),
    
    /**
     * Styles directory
     */
    styles: z.string().default('./src/styles'),
    
    /**
     * Config directory
     */
    config: z.string().default('./config'),
    
    /**
     * Cache directory
     */
    cache: z.string().default('./.willow-cache'),
  }).default({}),
  
  /**
   * Transform configuration
   */
  transforms: z.object({
    /**
     * Import alias mappings
     */
    importAliases: z.record(z.string()).optional(),
    
    /**
     * Component name mappings
     */
    componentMappings: z.record(z.string()).optional(),
    
    /**
     * Style transformations
     */
    styleTransforms: z.array(z.string()).optional(),
    
    /**
     * Custom transformers
     */
    custom: z.array(z.string()).optional(),
  }).default({}),
  
  /**
   * Validation configuration
   */
  validation: z.object({
    /**
     * Validation rules to enable
     */
    rules: z.array(z.string()).optional(),
    
    /**
     * Custom validation rules
     */
    customRules: z.array(z.string()).optional(),
    
    /**
     * Severity levels
     */
    severity: z.object({
      error: z.array(z.string()).optional(),
      warning: z.array(z.string()).optional(),
      info: z.array(z.string()).optional(),
    }).optional(),
    
    /**
     * Ignore patterns
     */
    ignore: z.array(z.string()).optional(),
  }).default({}),
  
  /**
   * Plugin configuration
   */
  plugins: z.array(PluginConfig).default([]),
});

export type WillowConfig = z.infer<typeof WillowConfigSchema>;

/**
 * Configuration file formats supported
 */
export type ConfigFormat = 'json' | 'yaml' | 'yml' | 'js' | 'ts' | 'mjs' | 'cjs';

/**
 * Configuration loading options
 */
export interface ConfigLoadOptions {
  /**
   * Config file path
   */
  configPath?: string;
  
  /**
   * Search for config file
   */
  search?: boolean;
  
  /**
   * Merge with defaults
   */
  defaults?: boolean;
  
  /**
   * Validate configuration
   */
  validate?: boolean;
  
  /**
   * Environment variable prefix
   */
  envPrefix?: string;
}

/**
 * Configuration source information
 */
export interface ConfigSource {
  type: 'file' | 'env' | 'cli' | 'default';
  path?: string;
  priority: number;
}