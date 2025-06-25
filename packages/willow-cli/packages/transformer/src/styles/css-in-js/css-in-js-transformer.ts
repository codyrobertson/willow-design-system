import { BaseStyleTransformer } from '../base-style-transformer';
import { CSSInJSParser } from './css-in-js-parser';
import {
  StyleType,
  type StyleTransformationContext,
  type StyleTransformationResult,
  type StyleTransformerConfig,
  type CSSInJSObject,
} from '../../types/style-transformation.types';

/**
 * Transformer for CSS-in-JS style objects
 */
export class CSSInJSTransformer extends BaseStyleTransformer {
  name = 'css-in-js';
  supportedTypes: StyleType[] = [StyleType.CSS_IN_JS, StyleType.INLINE_STYLES];
  priority = 20;

  private parser: CSSInJSParser;

  constructor(config?: Partial<StyleTransformerConfig>) {
    super();
    this.parser = new CSSInJSParser();
  }

  /**
   * Transform CSS-in-JS styles
   */
  async transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult> {
    const { result: transformResult, time } = await this.measureTime(async () => {
      try {
        // Parse input - only parse if it's a node, otherwise use directly
        const parsed = (typeof input === 'object' && input !== null && !('kind' in input))
          ? input  // Already a plain object
          : this.parser.parse(input, context);
        
        // Transform the parsed object and collect warnings
        const warnings: string[] = [];
        const transformed = await this.transformStyleObject(parsed, context, config, warnings);
        
        // Serialize back if input was a string
        const output = typeof input === 'string' 
          ? this.parser.serialize(transformed, context)
          : transformed;
        
        const result = this.createSuccessResult(output, input, {
          transformationsApplied: this.countTransformations(parsed, transformed),
          processingTime: 0, // Will be set by measureTime
          styleType: context.styleType,
        });
        
        // Add collected warnings
        result.warnings.push(...warnings);
        
        return result;
      } catch (error) {
        return this.createErrorResult(
          error instanceof Error ? error.message : String(error),
          input
        );
      }
    });

    // Update processing time
    if (transformResult.metadata) {
      transformResult.metadata.processingTime = time;
    }

    return transformResult;
  }

  /**
   * Transform a style object recursively
   */
  private async transformStyleObject(
    obj: CSSInJSObject,
    context: StyleTransformationContext,
    config: StyleTransformerConfig,
    parentWarnings?: string[]
  ): Promise<CSSInJSObject> {
    const result: CSSInJSObject = {};
    const warnings = parentWarnings || [];

    for (const [key, value] of Object.entries(obj)) {
      // Check if key is a CSS property or a nested selector
      if (this.isCSSProperty(key)) {
        // Apply property mappings
        const { mapped, warnings: propWarnings } = this.applyPropertyMappings(
          { [key]: value },
          config,
          context
        );
        warnings.push(...propWarnings);
        
        // Apply value transformations
        for (const [mappedKey, mappedValue] of Object.entries(mapped)) {
          result[mappedKey] = await this.transformValue(mappedValue, config, context);
        }
      } else if (this.isNestedSelector(key)) {
        // Recursively transform nested selectors
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = await this.transformStyleObject(value as CSSInJSObject, context, config, warnings);
        } else {
          result[key] = value;
        }
      } else {
        // Unknown property - but still apply value transformations for tokens
        if (config.preserveUnknownProperties !== false) {
          result[key] = await this.transformValue(value, config, context);
          if (config.warnOnUnmappedProperties) {
            warnings.push(`Unknown property or selector: ${key}`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Transform a style value
   */
  private async transformValue(
    value: any,
    config: StyleTransformerConfig,
    context: StyleTransformationContext
  ): Promise<any> {
    // Handle string values that might contain tokens
    if (typeof value === 'string') {
      // Apply token mappings even without context.theme
      return this.applyTokenMappings(value, config, { ...context, theme: context.theme || {} });
    }

    // Handle numeric values with units
    if (typeof value === 'number') {
      return this.transformNumericValue(value, config);
    }

    // Handle array values (e.g., multiple values for fallback)
    if (Array.isArray(value)) {
      return Promise.all(
        value.map(v => this.transformValue(v, config, context))
      );
    }

    // Handle object values (e.g., complex gradients)
    if (typeof value === 'object' && value !== null) {
      const result: any = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = await this.transformValue(v, config, context);
      }
      return result;
    }

    return value;
  }

  /**
   * Transform numeric values based on configuration
   */
  private transformNumericValue(
    value: number,
    config: StyleTransformerConfig
  ): string | number {
    // Example: Convert pixels to rem for certain properties
    // This would be configured through propertyMappings
    return value;
  }

  /**
   * Check if a key is a CSS property
   */
  private isCSSProperty(key: string): boolean {
    // Common CSS properties (non-exhaustive list)
    const cssProperties = new Set([
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'color', 'backgroundColor', 'background', 'backgroundImage',
      'border', 'borderRadius', 'borderColor', 'borderWidth', 'borderStyle',
      'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'textAlign',
      'opacity', 'zIndex', 'flex', 'flexDirection', 'justifyContent', 'alignItems',
      'gridTemplate', 'gridTemplateColumns', 'gridTemplateRows', 'gap',
      'transform', 'transition', 'animation', 'cursor', 'overflow',
      'boxShadow', 'textShadow', 'filter', 'backdropFilter',
      'fontStyle', 'textDecoration', 'textTransform', 'letterSpacing',
      'wordSpacing', 'whiteSpace', 'verticalAlign', 'visibility',
    ]);

    // Check if it's a known CSS property or vendor-prefixed
    return cssProperties.has(key) || 
           key.startsWith('webkit') || 
           key.startsWith('moz') || 
           key.startsWith('ms');
  }

  /**
   * Check if a key is a nested selector
   */
  private isNestedSelector(key: string): boolean {
    // Check for pseudo-classes, pseudo-elements, media queries, etc.
    return key.startsWith(':') ||      // :hover, :focus
           key.startsWith('&') ||      // &:hover, &.active
           key.startsWith('@') ||      // @media, @supports
           key.startsWith('.') ||      // .className
           key.startsWith('#') ||      // #id
           key.includes(' ') ||        // descendant selector
           key.includes('>') ||        // child selector
           key.includes('+') ||        // adjacent sibling
           key.includes('~');          // general sibling
  }

  /**
   * Count the number of transformations applied
   */
  private countTransformations(
    original: CSSInJSObject,
    transformed: CSSInJSObject
  ): number {
    let count = 0;

    const countDifferences = (obj1: any, obj2: any) => {
      if (obj1 === obj2) return;
      
      if (typeof obj1 !== typeof obj2) {
        count++;
        return;
      }

      if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        // Count property name changes (transformations)
        for (const key of keys1) {
          if (!keys2.includes(key)) {
            // Key was transformed (removed from original)
            count++;
          }
        }
        
        // Recursively check nested objects
        for (const key of keys2) {
          if (key in obj1) {
            countDifferences(obj1[key], obj2[key]);
          }
        }
      } else if (obj1 !== obj2) {
        count++;
      }
    };

    countDifferences(original, transformed);
    return count;
  }
}