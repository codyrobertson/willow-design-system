import * as ts from 'typescript';
import { StyleTransformationContext } from '../../types/style-transformation.types';

/**
 * Property renaming configuration
 */
export interface PropertyRenamingConfig {
  /** Source property naming convention */
  sourceConvention: NamingConvention;
  
  /** Target property naming convention */
  targetConvention: NamingConvention;
  
  /** Custom property mappings */
  customMappings?: Record<string, string>;
  
  /** Properties to exclude from renaming */
  excludeProperties?: string[];
  
  /** Preserve vendor prefixes */
  preserveVendorPrefixes?: boolean;
  
  /** Handle shorthand properties */
  expandShorthands?: boolean;
  
  /** Framework-specific rules */
  frameworkRules?: FrameworkPropertyRules;
}

/**
 * Naming conventions for CSS properties
 */
export enum NamingConvention {
  KEBAB_CASE = 'kebab-case',      // background-color
  CAMEL_CASE = 'camelCase',        // backgroundColor
  PASCAL_CASE = 'PascalCase',      // BackgroundColor
  SNAKE_CASE = 'snake_case',       // background_color
  CONSTANT_CASE = 'CONSTANT_CASE', // BACKGROUND_COLOR
}

/**
 * Framework-specific property rules
 */
export interface FrameworkPropertyRules {
  /** Framework name */
  framework: string;
  
  /** Property aliases */
  aliases?: Record<string, string>;
  
  /** Deprecated properties */
  deprecated?: Record<string, string>;
  
  /** Required transformations */
  required?: PropertyTransformation[];
  
  /** Conditional transformations */
  conditional?: ConditionalTransformation[];
}

/**
 * Property transformation rule
 */
export interface PropertyTransformation {
  from: string | RegExp;
  to: string | ((match: string) => string);
  description?: string;
}

/**
 * Conditional transformation based on context
 */
export interface ConditionalTransformation extends PropertyTransformation {
  condition: (context: PropertyContext) => boolean;
}

/**
 * Property context for conditional transformations
 */
export interface PropertyContext {
  property: string;
  value: string;
  selector?: string;
  media?: string;
  parent?: string;
  isNested?: boolean;
  isShorthand?: boolean;
}

/**
 * Property renaming result
 */
export interface PropertyRenamingResult {
  original: string;
  renamed: string;
  changes: PropertyChange[];
  warnings: string[];
}

/**
 * Individual property change
 */
export interface PropertyChange {
  property: string;
  from: string;
  to: string;
  reason: string;
  location?: {
    line: number;
    column: number;
    file?: string;
  };
}

/**
 * CSS property renamer interface
 */
export interface PropertyRenamer {
  /**
   * Rename a single property
   */
  renameProperty(
    property: string,
    context?: PropertyContext
  ): string;

  /**
   * Rename properties in a style object
   */
  renameProperties(
    styles: Record<string, any>,
    context?: StyleTransformationContext
  ): PropertyRenamingResult;

  /**
   * Rename properties in CSS text
   */
  renameCssProperties(
    css: string,
    context?: StyleTransformationContext
  ): PropertyRenamingResult;

  /**
   * Get property mapping
   */
  getPropertyMapping(): Record<string, string>;

  /**
   * Validate property name
   */
  isValidProperty(property: string): boolean;
}

/**
 * Base implementation of property renamer
 */
export class BasePropertyRenamer implements PropertyRenamer {
  private config: PropertyRenamingConfig;
  private propertyMap: Map<string, string> = new Map();
  private shorthandMap: Map<string, string[]> = new Map();
  private vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];

  constructor(config: PropertyRenamingConfig) {
    this.config = {
      preserveVendorPrefixes: true,
      expandShorthands: false,
      ...config,
    };
    this.initializePropertyMappings();
    this.initializeShorthandMappings();
  }

  renameProperty(property: string, context?: PropertyContext): string {
    // Skip if excluded
    if (this.config.excludeProperties?.includes(property)) {
      return property;
    }

    // Check custom mappings first
    if (this.config.customMappings?.[property]) {
      return this.config.customMappings[property];
    }

    // Check framework-specific aliases
    if (this.config.frameworkRules?.aliases?.[property]) {
      return this.config.frameworkRules.aliases[property];
    }

    // Apply conditional transformations
    if (context && this.config.frameworkRules?.conditional) {
      for (const transformation of this.config.frameworkRules.conditional) {
        if (transformation.condition(context)) {
          if (typeof transformation.from === 'string' && transformation.from === property) {
            return typeof transformation.to === 'string' 
              ? transformation.to 
              : transformation.to(property);
          } else if (transformation.from instanceof RegExp && transformation.from.test(property)) {
            return typeof transformation.to === 'string'
              ? property.replace(transformation.from, transformation.to)
              : transformation.to(property);
          }
        }
      }
    }

    // Apply required transformations
    if (this.config.frameworkRules?.required) {
      for (const transformation of this.config.frameworkRules.required) {
        if (typeof transformation.from === 'string' && transformation.from === property) {
          return typeof transformation.to === 'string' 
            ? transformation.to 
            : transformation.to(property);
        } else if (transformation.from instanceof RegExp && transformation.from.test(property)) {
          return typeof transformation.to === 'string'
            ? property.replace(transformation.from, transformation.to)
            : transformation.to(property);
        }
      }
    }

    // Handle vendor prefixes
    const { prefix, unprefixed } = this.extractVendorPrefix(property);
    const baseName = unprefixed;

    // Convert naming convention
    const converted = this.convertNamingConvention(
      baseName,
      this.config.sourceConvention,
      this.config.targetConvention
    );

    // Reapply vendor prefix if needed
    if (prefix && this.config.preserveVendorPrefixes) {
      return prefix + converted;
    }

    return converted;
  }

  renameProperties(
    styles: Record<string, any>,
    context?: StyleTransformationContext
  ): PropertyRenamingResult {
    const changes: PropertyChange[] = [];
    const warnings: string[] = [];
    const renamedStyles: Record<string, any> = {};

    for (const [property, value] of Object.entries(styles)) {
      const propertyContext: PropertyContext = {
        property,
        value: String(value),
        isNested: this.isNestedProperty(property),
        isShorthand: this.isShorthandProperty(property),
      };

      // Handle nested objects (like in styled-components)
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nestedResult = this.renameProperties(value, context);
        renamedStyles[property] = nestedResult;
        changes.push(...nestedResult.changes);
        warnings.push(...nestedResult.warnings);
        continue;
      }

      // Expand shorthand if configured
      if (this.config.expandShorthands && this.isShorthandProperty(property)) {
        const expanded = this.expandShorthand(property, value);
        for (const [expandedProp, expandedValue] of Object.entries(expanded)) {
          const renamed = this.renameProperty(expandedProp, propertyContext);
          renamedStyles[renamed] = expandedValue;
          
          if (renamed !== expandedProp) {
            changes.push({
              property: expandedProp,
              from: property,
              to: renamed,
              reason: 'Expanded from shorthand and renamed',
            });
          }
        }
        continue;
      }

      // Rename property
      const renamed = this.renameProperty(property, propertyContext);
      renamedStyles[renamed] = value;

      if (renamed !== property) {
        changes.push({
          property,
          from: property,
          to: renamed,
          reason: this.getRenamingReason(property, renamed),
        });
      }

      // Check for deprecated properties
      if (this.config.frameworkRules?.deprecated?.[property]) {
        warnings.push(
          `Property '${property}' is deprecated. ${this.config.frameworkRules.deprecated[property]}`
        );
      }
    }

    return {
      original: JSON.stringify(styles, null, 2),
      renamed: JSON.stringify(renamedStyles, null, 2),
      changes,
      warnings,
    };
  }

  renameCssProperties(
    css: string,
    context?: StyleTransformationContext
  ): PropertyRenamingResult {
    const changes: PropertyChange[] = [];
    const warnings: string[] = [];
    let renamedCss = css;

    // Parse CSS to find properties
    const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
    const matches = [...css.matchAll(propertyRegex)];

    for (const match of matches) {
      const [fullMatch, property, value] = match;
      const startIndex = match.index!;
      
      const propertyContext: PropertyContext = {
        property,
        value: value.trim(),
        isShorthand: this.isShorthandProperty(property),
      };

      const renamed = this.renameProperty(property, propertyContext);

      if (renamed !== property) {
        // Calculate line and column
        const lines = css.substring(0, startIndex).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        changes.push({
          property,
          from: property,
          to: renamed,
          reason: this.getRenamingReason(property, renamed),
          location: { line, column },
        });

        // Replace in CSS
        const newMatch = fullMatch.replace(property, renamed);
        renamedCss = renamedCss.replace(fullMatch, newMatch);
      }
    }

    return {
      original: css,
      renamed: renamedCss,
      changes,
      warnings,
    };
  }

  getPropertyMapping(): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    // Add custom mappings
    if (this.config.customMappings) {
      Object.assign(mapping, this.config.customMappings);
    }

    // Add framework aliases
    if (this.config.frameworkRules?.aliases) {
      Object.assign(mapping, this.config.frameworkRules.aliases);
    }

    // Add common property conversions
    for (const [original, renamed] of this.propertyMap) {
      mapping[original] = renamed;
    }

    return mapping;
  }

  isValidProperty(property: string): boolean {
    // Check if it's a known CSS property
    const { unprefixed } = this.extractVendorPrefix(property);
    
    // Check against known properties
    return this.isKnownCssProperty(unprefixed) || 
           this.isCustomProperty(unprefixed) ||
           this.isFrameworkProperty(unprefixed);
  }

  private initializePropertyMappings(): void {
    // Common property mappings between conventions
    const commonProperties = [
      'background-color',
      'border-radius',
      'box-shadow',
      'font-family',
      'font-size',
      'line-height',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'text-align',
      'text-decoration',
      'z-index',
    ];

    for (const property of commonProperties) {
      const converted = this.convertNamingConvention(
        property,
        NamingConvention.KEBAB_CASE,
        this.config.targetConvention
      );
      this.propertyMap.set(property, converted);
    }
  }

  private initializeShorthandMappings(): void {
    // CSS shorthand property expansions
    this.shorthandMap.set('margin', ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']);
    this.shorthandMap.set('padding', ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);
    this.shorthandMap.set('border', ['border-width', 'border-style', 'border-color']);
    this.shorthandMap.set('border-radius', [
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-right-radius',
      'border-bottom-left-radius',
    ]);
    this.shorthandMap.set('background', [
      'background-color',
      'background-image',
      'background-repeat',
      'background-position',
      'background-size',
      'background-origin',
      'background-clip',
      'background-attachment',
    ]);
    this.shorthandMap.set('font', [
      'font-style',
      'font-variant',
      'font-weight',
      'font-size',
      'line-height',
      'font-family',
    ]);
  }

  private convertNamingConvention(
    property: string,
    from: NamingConvention,
    to: NamingConvention
  ): string {
    if (from === to) return property;

    // First normalize to kebab-case
    let normalized = property;
    
    switch (from) {
      case NamingConvention.CAMEL_CASE:
        normalized = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        break;
      case NamingConvention.PASCAL_CASE:
        normalized = property.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
        break;
      case NamingConvention.SNAKE_CASE:
        normalized = property.replace(/_/g, '-');
        break;
      case NamingConvention.CONSTANT_CASE:
        normalized = property.toLowerCase().replace(/_/g, '-');
        break;
    }

    // Then convert to target convention
    switch (to) {
      case NamingConvention.KEBAB_CASE:
        return normalized;
      
      case NamingConvention.CAMEL_CASE:
        return normalized.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      
      case NamingConvention.PASCAL_CASE:
        const camel = normalized.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return camel.charAt(0).toUpperCase() + camel.slice(1);
      
      case NamingConvention.SNAKE_CASE:
        return normalized.replace(/-/g, '_');
      
      case NamingConvention.CONSTANT_CASE:
        return normalized.toUpperCase().replace(/-/g, '_');
      
      default:
        return property;
    }
  }

  private extractVendorPrefix(property: string): { prefix: string; unprefixed: string } {
    for (const prefix of this.vendorPrefixes) {
      if (property.startsWith(prefix)) {
        return {
          prefix,
          unprefixed: property.slice(prefix.length),
        };
      }
    }
    return { prefix: '', unprefixed: property };
  }

  private isShorthandProperty(property: string): boolean {
    return this.shorthandMap.has(property);
  }

  private expandShorthand(property: string, value: string): Record<string, string> {
    const expanded: Record<string, string> = {};
    const longhandProperties = this.shorthandMap.get(property);

    if (!longhandProperties) {
      return { [property]: value };
    }

    // Simple expansion logic - in practice, this would be more sophisticated
    const values = value.split(/\s+/);

    switch (property) {
      case 'margin':
      case 'padding':
        if (values.length === 1) {
          // All sides same value
          longhandProperties.forEach(prop => {
            expanded[prop] = values[0];
          });
        } else if (values.length === 2) {
          // Vertical, horizontal
          expanded[longhandProperties[0]] = values[0]; // top
          expanded[longhandProperties[1]] = values[1]; // right
          expanded[longhandProperties[2]] = values[0]; // bottom
          expanded[longhandProperties[3]] = values[1]; // left
        } else if (values.length === 3) {
          // Top, horizontal, bottom
          expanded[longhandProperties[0]] = values[0]; // top
          expanded[longhandProperties[1]] = values[1]; // right
          expanded[longhandProperties[2]] = values[2]; // bottom
          expanded[longhandProperties[3]] = values[1]; // left
        } else if (values.length === 4) {
          // Top, right, bottom, left
          longhandProperties.forEach((prop, i) => {
            expanded[prop] = values[i];
          });
        }
        break;

      default:
        // For complex shorthands, just return the original
        expanded[property] = value;
    }

    return expanded;
  }

  private isNestedProperty(property: string): boolean {
    return property.includes('&') || property.includes(':') || property.includes('.');
  }

  private getRenamingReason(from: string, to: string): string {
    if (this.config.customMappings?.[from]) {
      return 'Custom mapping';
    }
    if (this.config.frameworkRules?.aliases?.[from]) {
      return 'Framework alias';
    }
    if (from.includes('-') && !to.includes('-')) {
      return 'Naming convention change';
    }
    return 'Property transformation';
  }

  private isKnownCssProperty(property: string): boolean {
    // Simplified check - in practice, would use a comprehensive list
    const knownProperties = [
      'display', 'position', 'color', 'background', 'border',
      'margin', 'padding', 'width', 'height', 'font-size',
      'flex', 'grid', 'transform', 'transition', 'animation',
    ];
    
    return knownProperties.some(known => 
      property === known || property.startsWith(known + '-')
    );
  }

  private isCustomProperty(property: string): boolean {
    return property.startsWith('--');
  }

  private isFrameworkProperty(property: string): boolean {
    // Check framework-specific properties
    if (this.config.frameworkRules?.aliases) {
      return Object.keys(this.config.frameworkRules.aliases).includes(property);
    }
    return false;
  }
}

/**
 * Property renamer factory
 */
export class PropertyRenamerFactory {
  static createRenamer(
    sourceConvention: NamingConvention,
    targetConvention: NamingConvention,
    options?: Partial<PropertyRenamingConfig>
  ): PropertyRenamer {
    const config: PropertyRenamingConfig = {
      sourceConvention,
      targetConvention,
      ...options,
    };

    return new BasePropertyRenamer(config);
  }

  static createForFramework(
    framework: string,
    options?: Partial<PropertyRenamingConfig>
  ): PropertyRenamer {
    const frameworkConfigs: Record<string, Partial<PropertyRenamingConfig>> = {
      react: {
        sourceConvention: NamingConvention.KEBAB_CASE,
        targetConvention: NamingConvention.CAMEL_CASE,
        frameworkRules: {
          framework: 'react',
          aliases: {
            'class': 'className',
            'for': 'htmlFor',
          },
        },
      },
      vue: {
        sourceConvention: NamingConvention.KEBAB_CASE,
        targetConvention: NamingConvention.KEBAB_CASE,
        frameworkRules: {
          framework: 'vue',
          aliases: {
            'v-bind:class': ':class',
            'v-bind:style': ':style',
          },
        },
      },
      'styled-components': {
        sourceConvention: NamingConvention.KEBAB_CASE,
        targetConvention: NamingConvention.CAMEL_CASE,
        expandShorthands: true,
        frameworkRules: {
          framework: 'styled-components',
        },
      },
      emotion: {
        sourceConvention: NamingConvention.KEBAB_CASE,
        targetConvention: NamingConvention.CAMEL_CASE,
        frameworkRules: {
          framework: 'emotion',
        },
      },
    };

    const frameworkConfig = frameworkConfigs[framework] || {};
    
    return new BasePropertyRenamer({
      sourceConvention: NamingConvention.KEBAB_CASE,
      targetConvention: NamingConvention.CAMEL_CASE,
      ...frameworkConfig,
      ...options,
    });
  }
}

/**
 * Property renamer registry
 */
export class PropertyRenamerRegistry {
  private renamers = new Map<string, PropertyRenamer>();

  constructor() {
    // Register default renamers
    this.register('kebab-to-camel', PropertyRenamerFactory.createRenamer(
      NamingConvention.KEBAB_CASE,
      NamingConvention.CAMEL_CASE
    ));

    this.register('camel-to-kebab', PropertyRenamerFactory.createRenamer(
      NamingConvention.CAMEL_CASE,
      NamingConvention.KEBAB_CASE
    ));

    // Register framework renamers
    this.register('react', PropertyRenamerFactory.createForFramework('react'));
    this.register('vue', PropertyRenamerFactory.createForFramework('vue'));
    this.register('styled-components', PropertyRenamerFactory.createForFramework('styled-components'));
    this.register('emotion', PropertyRenamerFactory.createForFramework('emotion'));
  }

  register(name: string, renamer: PropertyRenamer): void {
    this.renamers.set(name, renamer);
  }

  getRenamer(name: string): PropertyRenamer {
    const renamer = this.renamers.get(name);
    if (!renamer) {
      throw new Error(`No property renamer registered for: ${name}`);
    }
    return renamer;
  }

  getAvailableRenamers(): string[] {
    return Array.from(this.renamers.keys());
  }

  renameProperty(
    property: string,
    renamerName: string = 'kebab-to-camel',
    context?: PropertyContext
  ): string {
    const renamer = this.getRenamer(renamerName);
    return renamer.renameProperty(property, context);
  }

  renameProperties(
    styles: Record<string, any>,
    renamerName: string = 'kebab-to-camel',
    context?: StyleTransformationContext
  ): PropertyRenamingResult {
    const renamer = this.getRenamer(renamerName);
    return renamer.renameProperties(styles, context);
  }
}