import { BaseStyleTransformer } from '../base-style-transformer';
import { TailwindParser } from './tailwind-parser';
import {
  StyleType,
  type StyleTransformationContext,
  type StyleTransformationResult,
  type StyleTransformerConfig,
  type TailwindClass,
  type CSSClassMapping,
} from '../../types/style-transformation.types';

/**
 * Transformer for Tailwind CSS classes
 */
export class TailwindTransformer extends BaseStyleTransformer {
  name = 'tailwind';
  supportedTypes: StyleType[] = [StyleType.TAILWIND];
  priority = 15;

  private parser: TailwindParser;

  constructor(config?: Partial<StyleTransformerConfig>) {
    super();
    this.parser = new TailwindParser();
  }

  /**
   * Transform Tailwind classes
   */
  async transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult> {
    const { result: transformResult, time } = await this.measureTime(async () => {
      try {
        // Parse input classes
        const parsed = this.parser.parse(input, context);
        
        // Transform the parsed classes
        const transformed = this.transformClasses(parsed, context, config);
        
        // Serialize back to string
        const output = this.parser.serialize(transformed, context);
        
        const result = this.createSuccessResult(output, input, {
          transformationsApplied: this.countTransformations(parsed, transformed),
          processingTime: 0,
          styleType: context.styleType,
        });
        
        return result;
      } catch (error) {
        return this.createErrorResult(
          error instanceof Error ? error.message : String(error),
          input
        );
      }
    });

    if (transformResult.metadata) {
      transformResult.metadata.processingTime = time;
    }

    return transformResult;
  }

  /**
   * Transform an array of Tailwind classes
   */
  private transformClasses(
    classes: TailwindClass[],
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): TailwindClass[] {
    const transformed: TailwindClass[] = [];
    const processedUtilities = new Set<string>();

    for (const cls of classes) {
      // Apply class mappings if available
      const mappedClass = this.applyClassMapping(cls, config);
      
      if (mappedClass) {
        // Class was mapped
        transformed.push(...(Array.isArray(mappedClass) ? mappedClass : [mappedClass]));
      } else if (config.preserveUnknownProperties !== false) {
        // Preserve unmapped classes
        transformed.push(cls);
      }

      // Track for duplicate detection
      const key = this.getClassKey(cls);
      processedUtilities.add(key);
    }

    // Remove duplicates while preserving order
    return this.deduplicateClasses(transformed);
  }

  /**
   * Apply class mapping to a Tailwind class
   */
  private applyClassMapping(
    cls: TailwindClass,
    config: StyleTransformerConfig
  ): TailwindClass | TailwindClass[] | null {
    if (!config.classMappings) {
      return null;
    }

    const fullClass = this.parser.serialize([cls], {} as any);

    for (const mapping of config.classMappings) {
      if (this.matchesMapping(fullClass, mapping)) {
        // Apply the mapping
        if (typeof mapping.targetClass === 'function') {
          const result = mapping.targetClass(fullClass);
          return this.parser.parse(result, {} as any);
        } else {
          return this.parser.parse(mapping.targetClass, {} as any);
        }
      }
    }

    // Check for utility-level mappings
    for (const mapping of config.classMappings) {
      if (this.matchesUtilityMapping(cls.utility, mapping)) {
        const newClass = { ...cls };
        
        if (typeof mapping.targetClass === 'function') {
          newClass.utility = mapping.targetClass(cls.utility);
        } else {
          // Extract just the utility part from target
          const parsed = this.parser.parse(mapping.targetClass, {} as any);
          if (parsed.length > 0) {
            newClass.utility = parsed[0].utility;
            if (parsed[0].arbitrary) {
              newClass.arbitrary = parsed[0].arbitrary;
            }
          }
        }
        
        return newClass;
      }
    }

    return null;
  }

  /**
   * Check if a class matches a mapping
   */
  private matchesMapping(
    fullClass: string,
    mapping: CSSClassMapping
  ): boolean {
    if (typeof mapping.sourceClass === 'string') {
      return fullClass === mapping.sourceClass;
    } else if (mapping.sourceClass instanceof RegExp) {
      return mapping.sourceClass.test(fullClass);
    }
    return false;
  }

  /**
   * Check if a utility matches a mapping
   */
  private matchesUtilityMapping(
    utility: string,
    mapping: CSSClassMapping
  ): boolean {
    if (typeof mapping.sourceClass === 'string') {
      // Check if it's just a utility mapping (no variants)
      return utility === mapping.sourceClass || 
             mapping.sourceClass.startsWith(utility + '-');
    } else if (mapping.sourceClass instanceof RegExp) {
      return mapping.sourceClass.test(utility);
    }
    return false;
  }

  /**
   * Get a unique key for a class (for deduplication)
   */
  private getClassKey(cls: TailwindClass): string {
    const category = this.parser.getUtilityCategory(cls.utility);
    const variants = cls.variant?.join(':') || '';
    return `${variants}:${category}:${cls.utility}`;
  }

  /**
   * Remove duplicate classes while preserving order
   */
  private deduplicateClasses(classes: TailwindClass[]): TailwindClass[] {
    const seen = new Map<string, TailwindClass>();
    const utilityPrefixMap = new Map<string, TailwindClass>();

    // Process classes in reverse order (later classes override earlier ones)
    for (let i = classes.length - 1; i >= 0; i--) {
      const cls = classes[i];
      const variantKey = cls.variant?.join(':') || '';
      
      // Get utility prefix (e.g., 'p' from 'p-4', 'text' from 'text-red-500')
      const utilityPrefix = this.getUtilityPrefix(cls.utility);
      const prefixKey = `${variantKey}:${utilityPrefix}`;

      // For spacing utilities (p-*, m-*, etc.), only keep the last one
      if (this.isConflictingUtility(utilityPrefix)) {
        if (!utilityPrefixMap.has(prefixKey)) {
          utilityPrefixMap.set(prefixKey, cls);
          seen.set(this.getClassKey(cls), cls);
        }
      } else {
        // For other utilities, use the existing logic
        seen.set(this.getClassKey(cls), cls);
      }
    }

    // Return classes in original order
    return classes.filter(cls => {
      const key = this.getClassKey(cls);
      return seen.get(key) === cls;
    });
  }

  /**
   * Get utility prefix (e.g., 'p' from 'p-4')
   */
  private getUtilityPrefix(utility: string): string {
    const match = utility.match(/^(-?[a-z]+)/);
    return match ? match[1] : utility;
  }

  /**
   * Check if this utility type conflicts with others of the same prefix
   */
  private isConflictingUtility(prefix: string): boolean {
    // Utilities that conflict when they have the same prefix
    const conflictingPrefixes = [
      'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py',
      'm', 'mt', 'mr', 'mb', 'ml', 'mx', 'my',
      'w', 'h', 'text', 'bg', 'border', 'rounded',
      'shadow', 'opacity', 'z', 'gap', 'space',
    ];
    return conflictingPrefixes.includes(prefix);
  }

  /**
   * Count transformations
   */
  private countTransformations(
    original: TailwindClass[],
    transformed: TailwindClass[]
  ): number {
    let count = 0;

    // Count removed classes
    const transformedKeys = new Set(
      transformed.map(cls => this.getClassKey(cls))
    );
    
    for (const cls of original) {
      if (!transformedKeys.has(this.getClassKey(cls))) {
        count++;
      }
    }

    // Count added/modified classes
    const originalKeys = new Set(
      original.map(cls => this.getClassKey(cls))
    );
    
    for (const cls of transformed) {
      if (!originalKeys.has(this.getClassKey(cls))) {
        count++;
      }
    }

    return count;
  }
}