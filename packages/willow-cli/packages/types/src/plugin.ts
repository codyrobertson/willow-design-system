import { z } from 'zod';
import type { ASTNode, TransformContext } from './ast';
import type { WillowConfig } from './config';
import type { ValidationResult } from './validation';

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /**
   * Called when the plugin is initialized
   */
  initialize?: (config: WillowConfig) => Promise<void> | void;
  
  /**
   * Called before parsing starts
   */
  beforeParse?: (files: string[]) => Promise<void> | void;
  
  /**
   * Called after parsing completes
   */
  afterParse?: (results: Map<string, any>) => Promise<void> | void;
  
  /**
   * Called before transformation
   */
  beforeTransform?: (ast: ASTNode, context: TransformContext) => Promise<ASTNode> | ASTNode;
  
  /**
   * Called after transformation
   */
  afterTransform?: (ast: ASTNode, context: TransformContext) => Promise<ASTNode> | ASTNode;
  
  /**
   * Called before code generation
   */
  beforeGenerate?: (ast: ASTNode, context: TransformContext) => Promise<void> | void;
  
  /**
   * Called after code generation
   */
  afterGenerate?: (code: string, context: TransformContext) => Promise<string> | string;
  
  /**
   * Called before validation
   */
  beforeValidate?: (ast: ASTNode, context: TransformContext) => Promise<void> | void;
  
  /**
   * Called after validation
   */
  afterValidate?: (results: ValidationResult[], context: TransformContext) => Promise<void> | void;
  
  /**
   * Called when the plugin is being shut down
   */
  shutdown?: () => Promise<void> | void;
}

/**
 * Plugin interface
 */
export interface Plugin {
  /**
   * Plugin name
   */
  name: string;
  
  /**
   * Plugin version
   */
  version: string;
  
  /**
   * Plugin description
   */
  description?: string;
  
  /**
   * Plugin hooks
   */
  hooks: PluginHooks;
  
  /**
   * Plugin options schema
   */
  optionsSchema?: z.ZodSchema<any>;
  
  /**
   * Plugin dependencies
   */
  dependencies?: string[];
  
  /**
   * Plugin capabilities
   */
  capabilities?: PluginCapability[];
}

/**
 * Plugin capabilities
 */
export type PluginCapability = 
  | 'parse'
  | 'transform'
  | 'generate'
  | 'validate'
  | 'ui-kit'
  | 'style'
  | 'config';

/**
 * Plugin configuration
 */
export const PluginConfig = z.object({
  /**
   * Plugin name or path
   */
  name: z.string(),
  
  /**
   * Plugin options
   */
  options: z.record(z.any()).optional(),
  
  /**
   * Whether the plugin is enabled
   */
  enabled: z.boolean().default(true),
});

export type PluginConfigType = z.infer<typeof PluginConfig>;

/**
 * Plugin loader result
 */
export interface PluginLoadResult {
  plugin: Plugin;
  config: PluginConfigType;
  path: string;
}

/**
 * Plugin context passed to hooks
 */
export interface PluginContext {
  config: WillowConfig;
  logger: Logger;
  cache: Cache;
  utils: PluginUtils;
}

/**
 * Logger interface for plugins
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Cache interface for plugins
 */
export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

/**
 * Utility functions for plugins
 */
export interface PluginUtils {
  /**
   * Resolve a module path
   */
  resolvePath(path: string, from?: string): string;
  
  /**
   * Read a file
   */
  readFile(path: string): Promise<string>;
  
  /**
   * Write a file
   */
  writeFile(path: string, content: string): Promise<void>;
  
  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;
  
  /**
   * Create a directory
   */
  mkdir(path: string): Promise<void>;
}