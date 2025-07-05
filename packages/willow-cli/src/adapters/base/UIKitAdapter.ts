import { ComponentConfig, StyleConfig, TokenConfig } from '../types/AdapterTypes.js';

/**
 * Base abstract class for UI Kit adapters
 * Provides the foundation for integrating different UI component libraries
 */
export abstract class UIKitAdapter {
  protected name: string;
  protected version: string;
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.name = config.name;
    this.version = config.version;
    this.config = config;
  }

  /**
   * Initialize the adapter with any necessary setup
   */
  abstract initialize(): Promise<void>;

  /**
   * Map a Willow component to the target UI kit component
   */
  abstract mapComponent(
    componentName: string,
    props: Record<string, any>
  ): ComponentMapping;

  /**
   * Translate Willow styles to target UI kit styles
   */
  abstract translateStyles(
    styles: StyleConfig
  ): Record<string, any>;

  /**
   * Convert Willow design tokens to target UI kit tokens
   */
  abstract convertTokens(
    tokens: TokenConfig
  ): Record<string, any>;

  /**
   * Validate adapter configuration
   */
  abstract validateConfig(): ValidationResult;

  /**
   * Get adapter metadata
   */
  getMetadata(): AdapterMetadata {
    return {
      name: this.name,
      version: this.version,
      capabilities: this.getCapabilities(),
      supportedComponents: this.getSupportedComponents(),
    };
  }

  /**
   * Get adapter capabilities
   */
  protected abstract getCapabilities(): AdapterCapabilities;

  /**
   * Get list of supported components
   */
  protected abstract getSupportedComponents(): string[];
}

/**
 * Configuration for UI Kit adapters
 */
export interface AdapterConfig {
  name: string;
  version: string;
  options?: Record<string, any>;
  customMappings?: Record<string, ComponentMapping>;
  styleOverrides?: Record<string, any>;
  tokenMappings?: Record<string, string>;
}

/**
 * Result of component mapping
 */
export interface ComponentMapping {
  component: string | React.ComponentType;
  props: Record<string, any>;
  children?: any;
  wrapper?: React.ComponentType;
}

/**
 * Adapter metadata
 */
export interface AdapterMetadata {
  name: string;
  version: string;
  capabilities: AdapterCapabilities;
  supportedComponents: string[];
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  supportsTheming: boolean;
  supportsRTL: boolean;
  supportsAccessibility: boolean;
  supportsDarkMode: boolean;
  supportsResponsive: boolean;
  customCapabilities?: Record<string, boolean>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}