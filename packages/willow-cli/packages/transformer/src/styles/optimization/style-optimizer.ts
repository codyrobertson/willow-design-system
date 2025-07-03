import {
  StyleOptimizer,
  StyleOptimizationResult,
  StyleOptimizationContext,
  OptimizationLevel,
} from '../../types/style-transformation.types';

/**
 * Style optimization strategies
 */
export interface OptimizationStrategy {
  name: string;
  description: string;
  level: OptimizationLevel;
  optimize(styles: any, context: StyleOptimizationContext): any;
}

/**
 * Base style optimizer implementation
 */
export class BaseStyleOptimizer implements StyleOptimizer {
  private strategies: OptimizationStrategy[] = [];

  constructor(private config?: {
    level?: OptimizationLevel;
    preserveComments?: boolean;
    mergeMediaQueries?: boolean;
    removeUnused?: boolean;
  }) {
    this.initializeStrategies();
  }

  getName(): string {
    return 'base-style-optimizer';
  }

  /**
   * Optimize styles
   */
  optimize(
    styles: any,
    context: StyleOptimizationContext
  ): StyleOptimizationResult {
    const startTime = Date.now();
    const originalSize = this.calculateSize(styles);
    let optimized = styles;

    // Apply optimization strategies based on level
    const level = context.level || this.config?.level || OptimizationLevel.STANDARD;
    
    for (const strategy of this.strategies) {
      if (this.shouldApplyStrategy(strategy, level)) {
        optimized = strategy.optimize(optimized, context);
      }
    }

    const optimizedSize = this.calculateSize(optimized);
    const processingTime = Date.now() - startTime;

    return {
      optimized,
      savings: {
        originalSize,
        optimizedSize,
        reduction: originalSize - optimizedSize,
        percentage: ((originalSize - optimizedSize) / originalSize) * 100,
      },
      metrics: {
        rulesRemoved: this.countRulesRemoved(styles, optimized),
        propertiesMerged: this.countPropertiesMerged(styles, optimized),
        selectorsOptimized: this.countSelectorsOptimized(styles, optimized),
      },
      processingTime,
    };
  }

  /**
   * Add optimization strategy
   */
  addStrategy(strategy: OptimizationStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Initialize default strategies
   */
  private initializeStrategies(): void {
    // Basic optimizations
    this.addStrategy(new RemoveDuplicatesStrategy());
    this.addStrategy(new MergeRulesStrategy());
    this.addStrategy(new SortPropertiesStrategy());
    
    // Standard optimizations
    this.addStrategy(new ShorthandOptimizationStrategy());
    this.addStrategy(new ColorOptimizationStrategy());
    this.addStrategy(new UnitOptimizationStrategy());
    
    // Aggressive optimizations
    this.addStrategy(new RemoveDefaultsStrategy());
    this.addStrategy(new MinifyValuesStrategy());
    this.addStrategy(new MergeMediaQueriesStrategy());
  }

  /**
   * Check if strategy should be applied
   */
  private shouldApplyStrategy(
    strategy: OptimizationStrategy,
    level: OptimizationLevel
  ): boolean {
    switch (level) {
      case OptimizationLevel.NONE:
        return false;
      case OptimizationLevel.BASIC:
        return strategy.level === OptimizationLevel.BASIC;
      case OptimizationLevel.STANDARD:
        return strategy.level <= OptimizationLevel.STANDARD;
      case OptimizationLevel.AGGRESSIVE:
        return true;
      default:
        return false;
    }
  }

  /**
   * Calculate size of styles
   */
  private calculateSize(styles: any): number {
    return JSON.stringify(styles).length;
  }

  /**
   * Count rules removed
   */
  private countRulesRemoved(original: any, optimized: any): number {
    // Simplified implementation
    return 0;
  }

  /**
   * Count properties merged
   */
  private countPropertiesMerged(original: any, optimized: any): number {
    // Simplified implementation
    return 0;
  }

  /**
   * Count selectors optimized
   */
  private countSelectorsOptimized(original: any, optimized: any): number {
    // Simplified implementation
    return 0;
  }
}

/**
 * Remove duplicate properties strategy
 */
class RemoveDuplicatesStrategy implements OptimizationStrategy {
  name = 'remove-duplicates';
  description = 'Removes duplicate CSS properties';
  level = OptimizationLevel.BASIC;

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const seen = new Set<string>();
    const optimized: any = {};

    // Keep last occurrence of each property
    for (const [key, value] of Object.entries(styles)) {
      // Handle nested objects recursively
      if (typeof value === 'object' && !Array.isArray(value)) {
        optimized[key] = this.optimize(value, context);
      } else {
        optimized[key] = value;
      }
    }

    return optimized;
  }
}

/**
 * Merge similar rules strategy
 */
class MergeRulesStrategy implements OptimizationStrategy {
  name = 'merge-rules';
  description = 'Merges CSS rules with identical properties';
  level = OptimizationLevel.BASIC;

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    // Group selectors by their properties
    const ruleGroups = new Map<string, string[]>();
    
    for (const [selector, properties] of Object.entries(styles)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        const propString = JSON.stringify(properties);
        const selectors = ruleGroups.get(propString) || [];
        selectors.push(selector);
        ruleGroups.set(propString, selectors);
      }
    }

    // Rebuild with merged selectors
    const optimized: any = {};
    for (const [propString, selectors] of ruleGroups) {
      if (selectors.length > 1) {
        // Merge selectors
        const mergedSelector = selectors.join(', ');
        optimized[mergedSelector] = JSON.parse(propString);
      } else {
        optimized[selectors[0]] = JSON.parse(propString);
      }
    }

    return optimized;
  }
}

/**
 * Sort properties strategy
 */
class SortPropertiesStrategy implements OptimizationStrategy {
  name = 'sort-properties';
  description = 'Sorts CSS properties for better gzip compression';
  level = OptimizationLevel.BASIC;

  private propertyOrder = [
    // Positioning
    'position', 'top', 'right', 'bottom', 'left', 'z-index',
    // Display & Box Model
    'display', 'float', 'width', 'height', 'margin', 'padding',
    // Typography
    'font', 'font-family', 'font-size', 'line-height', 'text-align',
    // Visual
    'color', 'background', 'border', 'border-radius',
    // Other
    'opacity', 'cursor', 'overflow',
  ];

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const optimized: any = {};

    // Sort each rule's properties
    for (const [selector, properties] of Object.entries(styles)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        const sorted: any = {};
        const entries = Object.entries(properties);
        
        // Sort by predefined order, then alphabetically
        entries.sort(([a], [b]) => {
          const aIndex = this.propertyOrder.indexOf(a);
          const bIndex = this.propertyOrder.indexOf(b);
          
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.localeCompare(b);
        });

        for (const [prop, value] of entries) {
          sorted[prop] = value;
        }
        optimized[selector] = sorted;
      } else {
        optimized[selector] = properties;
      }
    }

    return optimized;
  }
}

/**
 * Shorthand optimization strategy
 */
class ShorthandOptimizationStrategy implements OptimizationStrategy {
  name = 'shorthand-optimization';
  description = 'Converts longhand properties to shorthand';
  level = OptimizationLevel.STANDARD;

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const optimized: any = {};

    for (const [selector, properties] of Object.entries(styles)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        optimized[selector] = this.optimizeProperties(properties);
      } else {
        optimized[selector] = properties;
      }
    }

    return optimized;
  }

  private optimizeProperties(properties: any): any {
    const optimized = { ...properties };

    // Margin shorthand
    if (this.canUseShorthand(properties, ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])) {
      const values = [
        properties['margin-top'],
        properties['margin-right'],
        properties['margin-bottom'],
        properties['margin-left'],
      ];
      
      optimized.margin = this.combineValues(values);
      delete optimized['margin-top'];
      delete optimized['margin-right'];
      delete optimized['margin-bottom'];
      delete optimized['margin-left'];
    }

    // Padding shorthand
    if (this.canUseShorthand(properties, ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'])) {
      const values = [
        properties['padding-top'],
        properties['padding-right'],
        properties['padding-bottom'],
        properties['padding-left'],
      ];
      
      optimized.padding = this.combineValues(values);
      delete optimized['padding-top'];
      delete optimized['padding-right'];
      delete optimized['padding-bottom'];
      delete optimized['padding-left'];
    }

    // Border shorthand
    if (this.canUseBorderShorthand(properties)) {
      optimized.border = `${properties['border-width']} ${properties['border-style']} ${properties['border-color']}`;
      delete optimized['border-width'];
      delete optimized['border-style'];
      delete optimized['border-color'];
    }

    return optimized;
  }

  private canUseShorthand(properties: any, props: string[]): boolean {
    return props.every(prop => prop in properties);
  }

  private canUseBorderShorthand(properties: any): boolean {
    return (
      'border-width' in properties &&
      'border-style' in properties &&
      'border-color' in properties &&
      !('border-top-width' in properties) &&
      !('border-right-width' in properties)
    );
  }

  private combineValues(values: string[]): string {
    // Check if all values are the same
    if (values.every(v => v === values[0])) {
      return values[0];
    }
    
    // Check if top/bottom and left/right are the same
    if (values[0] === values[2] && values[1] === values[3]) {
      return `${values[0]} ${values[1]}`;
    }
    
    // Check if left/right are the same
    if (values[1] === values[3]) {
      return `${values[0]} ${values[1]} ${values[2]}`;
    }
    
    // All different
    return values.join(' ');
  }
}

/**
 * Color optimization strategy
 */
class ColorOptimizationStrategy implements OptimizationStrategy {
  name = 'color-optimization';
  description = 'Optimizes color values';
  level = OptimizationLevel.STANDARD;

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const optimized: any = {};

    for (const [selector, properties] of Object.entries(styles)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        const optimizedProps: any = {};
        
        for (const [prop, value] of Object.entries(properties)) {
          if (typeof value === 'string' && this.isColorProperty(prop)) {
            optimizedProps[prop] = this.optimizeColor(value);
          } else {
            optimizedProps[prop] = value;
          }
        }
        
        optimized[selector] = optimizedProps;
      } else {
        optimized[selector] = properties;
      }
    }

    return optimized;
  }

  private isColorProperty(prop: string): boolean {
    return prop.includes('color') || prop.includes('background');
  }

  private optimizeColor(color: string): string {
    // Convert 6-digit hex to 3-digit when possible
    const hexMatch = color.match(/^#([0-9a-fA-F]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
        const short = `#${hex[0]}${hex[2]}${hex[4]}`;
        // Always return 3-digit hex when possible (e.g., #000, #fff)
        return short;
      }
    }

    // Convert rgb to hex when smaller
    const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      const hex = `#${r}${g}${b}`;
      
      // Use shorter format
      if (hex.length < color.length) {
        return this.optimizeColor(hex); // Recursively optimize
      }
    }

    return color;
  }
}

/**
 * Unit optimization strategy
 */
class UnitOptimizationStrategy implements OptimizationStrategy {
  name = 'unit-optimization';
  description = 'Optimizes CSS units';
  level = OptimizationLevel.STANDARD;

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const optimized: any = {};

    for (const [selector, properties] of Object.entries(styles)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        const optimizedProps: any = {};
        
        for (const [prop, value] of Object.entries(properties)) {
          if (typeof value === 'string') {
            optimizedProps[prop] = this.optimizeUnit(value);
          } else {
            optimizedProps[prop] = value;
          }
        }
        
        optimized[selector] = optimizedProps;
      } else {
        optimized[selector] = properties;
      }
    }

    return optimized;
  }

  private optimizeUnit(value: string): string {
    // Don't optimize color values
    if (value.startsWith('#') || value.includes('rgb') || value.includes('hsl')) {
      return value;
    }

    // Remove unit from 0 values
    if (value === '0px' || value === '0em' || value === '0rem' || value === '0%') {
      return '0';
    }

    // Remove trailing zeros after decimal
    value = value.replace(/(\.\d*?)0+(\D|$)/g, '$1$2');
    
    // Remove decimal point if no decimal digits
    value = value.replace(/\.(?=\D|$)/g, '');

    // Remove leading zeros but not before decimal
    value = value.replace(/\b0+(\d)/g, '$1');
    
    return value;
  }
}

/**
 * Remove defaults strategy
 */
class RemoveDefaultsStrategy implements OptimizationStrategy {
  name = 'remove-defaults';
  description = 'Removes CSS properties with default values';
  level = OptimizationLevel.AGGRESSIVE;

  private defaults: Record<string, string> = {
    'background-attachment': 'scroll',
    'background-color': 'transparent',
    'background-position': '0% 0%',
    'background-repeat': 'repeat',
    'border-collapse': 'separate',
    'bottom': 'auto',
    'clear': 'none',
    'cursor': 'auto',
    'display': 'inline',
    'float': 'none',
    'font-style': 'normal',
    'font-weight': 'normal',
    'left': 'auto',
    'letter-spacing': 'normal',
    'line-height': 'normal',
    'list-style-image': 'none',
    'list-style-position': 'outside',
    'list-style-type': 'disc',
    'opacity': '1',
    'overflow': 'visible',
    'position': 'static',
    'right': 'auto',
    'text-align': 'left',
    'text-decoration': 'none',
    'text-transform': 'none',
    'top': 'auto',
    'visibility': 'visible',
    'white-space': 'normal',
    'z-index': 'auto',
  };

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const optimized: any = {};

    for (const [selector, properties] of Object.entries(styles)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        const optimizedProps: any = {};
        
        for (const [prop, value] of Object.entries(properties)) {
          // Keep property if it's not a default value
          if (this.defaults[prop] !== value) {
            optimizedProps[prop] = value;
          }
        }
        
        // Only add selector if it has properties
        if (Object.keys(optimizedProps).length > 0) {
          optimized[selector] = optimizedProps;
        }
      } else {
        optimized[selector] = properties;
      }
    }

    return optimized;
  }
}

/**
 * Minify values strategy
 */
class MinifyValuesStrategy implements OptimizationStrategy {
  name = 'minify-values';
  description = 'Minifies CSS values';
  level = OptimizationLevel.AGGRESSIVE;

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const optimized: any = {};

    for (const [selector, properties] of Object.entries(styles)) {
      if (typeof properties === 'object' && !Array.isArray(properties)) {
        const optimizedProps: any = {};
        
        for (const [prop, value] of Object.entries(properties)) {
          if (typeof value === 'string') {
            optimizedProps[prop] = this.minifyValue(value);
          } else {
            optimizedProps[prop] = value;
          }
        }
        
        optimized[selector] = optimizedProps;
      } else {
        optimized[selector] = properties;
      }
    }

    return optimized;
  }

  private minifyValue(value: string): string {
    // Remove extra whitespace
    let minified = value.trim().replace(/\s+/g, ' ');
    
    // Remove space after commas
    minified = minified.replace(/,\s+/g, ',');
    
    // Remove quotes from font names when possible
    minified = minified.replace(/"([^"]+)"/g, (match, fontName) => {
      if (!fontName.includes(' ')) {
        return fontName;
      }
      return match;
    });

    return minified;
  }
}

/**
 * Merge media queries strategy
 */
class MergeMediaQueriesStrategy implements OptimizationStrategy {
  name = 'merge-media-queries';
  description = 'Merges identical media queries';
  level = OptimizationLevel.AGGRESSIVE;

  optimize(styles: any, context: StyleOptimizationContext): any {
    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return styles;
    }

    const mediaQueries = new Map<string, any>();
    const nonMediaStyles: any = {};

    // Extract media queries
    for (const [selector, properties] of Object.entries(styles)) {
      if (selector.startsWith('@media')) {
        const existing = mediaQueries.get(selector) || {};
        mediaQueries.set(selector, { ...existing, ...properties as any });
      } else {
        nonMediaStyles[selector] = properties;
      }
    }

    // Combine with merged media queries
    const optimized = { ...nonMediaStyles };
    for (const [query, styles] of mediaQueries) {
      optimized[query] = styles;
    }

    return optimized;
  }
}

/**
 * Create a style optimizer with custom configuration
 */
export function createStyleOptimizer(config?: {
  level?: OptimizationLevel;
  strategies?: OptimizationStrategy[];
  excludeStrategies?: string[];
}): StyleOptimizer {
  const optimizer = new BaseStyleOptimizer(config);

  // Add custom strategies
  if (config?.strategies) {
    for (const strategy of config.strategies) {
      optimizer.addStrategy(strategy);
    }
  }

  return optimizer;
}