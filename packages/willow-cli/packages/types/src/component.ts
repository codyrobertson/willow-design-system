/**
 * Component mapping types
 */

export interface ComponentMapping {
  /**
   * Source component name (Willow)
   */
  from: string;
  
  /**
   * Target component name (UI Kit)
   */
  to: string;
  
  /**
   * Prop mappings
   */
  props?: PropMapping[];
  
  /**
   * Event mappings
   */
  events?: EventMapping[];
  
  /**
   * Slot/children mappings
   */
  slots?: SlotMapping[];
  
  /**
   * Import configuration
   */
  importConfig?: ImportConfig;
  
  /**
   * Additional transform options
   */
  transformOptions?: Record<string, any>;
}

export interface PropMapping {
  from: string;
  to: string;
  transform?: (value: any) => any;
  defaultValue?: any;
  required?: boolean;
}

export interface EventMapping {
  from: string;
  to: string;
  transform?: (handler: Function) => Function;
}

export interface SlotMapping {
  from: string;
  to: string;
  wrapper?: string;
  props?: Record<string, any>;
}

export interface ImportConfig {
  module: string;
  named?: boolean;
  namespace?: string;
  alias?: string;
}

export type ComponentMap = Record<string, ComponentMapping>;

/**
 * Style mapping types
 */
export interface StyleMapping {
  from: string;
  to: string;
  transform?: (value: any) => any;
  breakpoints?: Record<string, string>;
}

export type StyleMap = Record<string, StyleMapping>;

/**
 * Token mapping types
 */
export interface TokenMapping {
  from: string;
  to: string;
  transform?: (value: any) => any;
  category?: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'other';
}

export type TokenMap = Record<string, TokenMapping>;