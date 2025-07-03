import { z } from 'zod';
import type { ComponentMap, StyleMap, TokenMap } from './component';
import type { ASTNode } from './ast';
import type { ValidationResult } from './validation';

/**
 * UI Kit Adapter Interface
 * Defines the contract for integrating different UI component libraries
 */
export interface UIKitAdapter {
  /**
   * Unique identifier for the UI kit
   */
  name: string;
  
  /**
   * Version of the UI kit adapter
   */
  version: string;
  
  /**
   * Human-readable display name
   */
  displayName: string;
  
  /**
   * Component mappings from Willow to target UI kit
   */
  components: ComponentMap;
  
  /**
   * Style system mappings
   */
  styles: StyleMap;
  
  /**
   * Design token mappings
   */
  tokens: TokenMap;
  
  /**
   * Transform a component AST to match the target UI kit
   */
  transformComponent(ast: ASTNode, componentName: string): Promise<ASTNode>;
  
  /**
   * Transform styles to match the target UI kit's styling system
   */
  transformStyles(styles: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Transform design tokens to match the target UI kit
   */
  transformTokens(tokens: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Validate that a component is compatible with the UI kit
   */
  validate(componentName: string, ast: ASTNode): Promise<ValidationResult>;
  
  /**
   * Get required dependencies for this UI kit
   */
  getDependencies(): UIKitDependency[];
  
  /**
   * Get configuration options for this adapter
   */
  getConfig(): UIKitAdapterConfig;
}

/**
 * UI Kit dependency information
 */
export interface UIKitDependency {
  name: string;
  version: string;
  optional?: boolean;
  peerDependency?: boolean;
}

/**
 * UI Kit adapter configuration options
 */
export interface UIKitAdapterConfig {
  /**
   * Whether to use CSS modules
   */
  cssModules?: boolean;
  
  /**
   * Whether to use CSS-in-JS
   */
  cssInJs?: boolean;
  
  /**
   * Custom import paths
   */
  importPaths?: Record<string, string>;
  
  /**
   * Component naming convention
   */
  componentNaming?: 'PascalCase' | 'kebab-case' | 'camelCase';
  
  /**
   * Style naming convention
   */
  styleNaming?: 'camelCase' | 'kebab-case' | 'snake_case';
  
  /**
   * Whether to generate TypeScript
   */
  typescript?: boolean;
  
  /**
   * Custom configuration options
   */
  custom?: Record<string, any>;
}

/**
 * UI Kit metadata for discovery
 */
export interface UIKitMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  compatibility?: {
    react?: string;
    node?: string;
    typescript?: string;
  };
}

/**
 * Schema for UI kit adapter configuration
 */
export const UIKitAdapterConfigSchema = z.object({
  cssModules: z.boolean().optional(),
  cssInJs: z.boolean().optional(),
  importPaths: z.record(z.string()).optional(),
  componentNaming: z.enum(['PascalCase', 'kebab-case', 'camelCase']).optional(),
  styleNaming: z.enum(['camelCase', 'kebab-case', 'snake_case']).optional(),
  typescript: z.boolean().optional(),
  custom: z.record(z.any()).optional(),
});

export type UIKitAdapterConfigInput = z.infer<typeof UIKitAdapterConfigSchema>;