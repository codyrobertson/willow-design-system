import { BaseStyleTransformer } from '../base-style-transformer';
import { CSSModulesParser } from './css-modules-parser';
import {
  StyleType,
  type StyleTransformationContext,
  type StyleTransformationResult,
  type StyleTransformerConfig,
} from '../../types/style-transformation.types';
import type {
  CSSModule,
  CSSModuleClass,
  CSSRule,
  CSSModulesTransformOptions,
} from '../../types/css-modules.types';

/**
 * Transformer for CSS Modules
 */
export class CSSModulesTransformer extends BaseStyleTransformer {
  name = 'css-modules';
  supportedTypes: StyleType[] = [StyleType.CSS_MODULES];
  priority = 20;

  private parser: CSSModulesParser;
  private options: CSSModulesTransformOptions;

  constructor(options: CSSModulesTransformOptions = {}) {
    super();
    this.options = options;
    this.parser = new CSSModulesParser(options);
  }

  /**
   * Transform CSS Modules
   */
  async transform(
    input: any,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Promise<StyleTransformationResult> {
    const { result: transformResult, time } = await this.measureTime(async () => {
      try {
        // Parse input
        const module = this.parser.parse(input, context);
        
        // Transform the module
        const transformedModule = this.transformModule(module, context, config);
        
        // Serialize back to string
        const output = this.parser.serialize(transformedModule, context);
        
        // Generate TypeScript definitions if requested
        const typeDefs = this.options.generateTypeDefinitions
          ? this.generateTypeDefinitions(transformedModule, context)
          : undefined;
        
        const result = this.createSuccessResult(output, input, {
          transformationsApplied: this.countTransformations(module, transformedModule),
          processingTime: 0,
          styleType: context.styleType,
          typeDefinitions: typeDefs,
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
   * Transform a CSS Module
   */
  private transformModule(
    module: CSSModule,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): CSSModule {
    const transformedModule: CSSModule = {
      ...module,
      classes: new Map(),
      variables: new Map(module.variables),
    };

    // Transform classes
    for (const [className, classData] of module.classes) {
      const transformedClass = this.transformClass(
        className,
        classData,
        context,
        config
      );
      
      if (transformedClass) {
        transformedModule.classes.set(transformedClass.name, transformedClass.data);
      }
    }

    // Transform variables if needed
    if (this.options.transformVariables && module.variables) {
      transformedModule.variables = this.transformVariables(
        module.variables,
        context,
        config
      );
    }

    return transformedModule;
  }

  /**
   * Transform a single class
   */
  private transformClass(
    className: string,
    classData: CSSModuleClass,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): { name: string; data: CSSModuleClass } | null {
    // Apply class name mapping
    const mappedName = this.applyClassNameMapping(className, config);
    
    // Transform the class data
    const transformedData: CSSModuleClass = {
      ...classData,
      originalName: mappedName || className,
      localName: this.generateLocalName(mappedName || className, context),
    };

    // Transform rules if present
    if (classData.rules) {
      transformedData.rules = this.transformRules(classData.rules, context, config);
    }

    // Transform composition references
    if (classData.composesFrom) {
      transformedData.composesFrom = classData.composesFrom.map(
        composed => this.applyClassNameMapping(composed, config) || composed
      );
    }

    // Check if class should be preserved
    // For CSS modules, we should preserve classes by default unless explicitly set to false
    if (!mappedName && config.preserveUnknownProperties === false) {
      return null;
    }

    return {
      name: mappedName || className,
      data: transformedData,
    };
  }

  /**
   * Transform CSS rules
   */
  private transformRules(
    rules: CSSRule[],
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): CSSRule[] {
    return rules.map(rule => {
      // Apply property mapping
      const mappedProperty = this.applyPropertyMapping(rule.property, config);
      
      // Apply value transformation
      let transformedValue = rule.value;
      
      // Apply token mappings
      if (config.tokenMappings) {
        transformedValue = this.applyTokenMappings(transformedValue, config, context);
      }

      return {
        property: mappedProperty || rule.property,
        value: transformedValue,
        important: rule.important,
      };
    });
  }

  /**
   * Apply property mapping
   */
  private applyPropertyMapping(
    property: string,
    config: StyleTransformerConfig
  ): string | null {
    if (!config.propertyMappings) {
      return null;
    }

    const mapping = config.propertyMappings.find(m => m.source === property);
    return mapping ? mapping.target : null;
  }

  /**
   * Apply class name mapping
   */
  private applyClassNameMapping(
    className: string,
    config: StyleTransformerConfig
  ): string | null {
    if (!config.classMappings) {
      return null;
    }

    for (const mapping of config.classMappings) {
      if (typeof mapping.sourceClass === 'string' && mapping.sourceClass === className) {
        return typeof mapping.targetClass === 'function'
          ? mapping.targetClass(className)
          : mapping.targetClass;
      } else if (mapping.sourceClass instanceof RegExp && mapping.sourceClass.test(className)) {
        return typeof mapping.targetClass === 'function'
          ? mapping.targetClass(className)
          : mapping.targetClass;
      }
    }

    return null;
  }

  /**
   * Transform CSS variables
   */
  private transformVariables(
    variables: Map<string, string>,
    context: StyleTransformationContext,
    config: StyleTransformerConfig
  ): Map<string, string> {
    const transformed = new Map<string, string>();

    for (const [varName, varValue] of variables) {
      let transformedName = varName;
      let transformedValue = varValue;

      // Apply custom variable transformer
      if (this.options.variableTransformer) {
        const result = this.options.variableTransformer(varName, varValue);
        transformedName = result.name;
        transformedValue = result.value;
      }

      // Apply token mappings
      if (config.tokenMappings) {
        transformedValue = this.applyTokenMappings(transformedValue, config, context);
      }

      transformed.set(transformedName, transformedValue);
    }

    return transformed;
  }

  /**
   * Generate local scoped name
   */
  private generateLocalName(
    className: string,
    context: StyleTransformationContext
  ): string {
    if (this.options.generateScopedName) {
      return this.options.generateScopedName(
        className,
        context.filePath || '',
        ''
      );
    }

    // Default format based on naming convention
    const convention = this.options.namingConvention || 'kebab-case';
    const hash = this.simpleHash(context.filePath + className).substring(0, 6);
    
    switch (convention) {
      case 'camelCase':
        return `${this.toCamelCase(className)}__${hash}`;
      case 'PascalCase':
        return `${this.toPascalCase(className)}__${hash}`;
      case 'snake_case':
        return `${this.toSnakeCase(className)}_${hash}`;
      default:
        return `${className}__${hash}`;
    }
  }

  /**
   * Generate TypeScript definitions
   */
  private generateTypeDefinitions(
    module: CSSModule,
    context: StyleTransformationContext
  ): string {
    const exportType = this.options.exportType || 'named';
    const lines: string[] = [];

    // Add header
    lines.push('// This file is automatically generated.');
    lines.push('// Please do not change this file!');
    lines.push('');

    switch (exportType) {
      case 'named':
        // Export each class as a named export
        for (const [className, classData] of module.classes) {
          const exportName = this.toValidIdentifier(className);
          lines.push(`export const ${exportName}: string;`);
        }
        break;

      case 'default':
        // Export as default object
        lines.push('interface Styles {');
        for (const [className] of module.classes) {
          const propName = this.toValidIdentifier(className);
          lines.push(`  ${propName}: string;`);
        }
        lines.push('}');
        lines.push('');
        lines.push('declare const styles: Styles;');
        lines.push('export default styles;');
        break;

      case 'namespace':
        // Export as namespace
        lines.push('declare namespace styles {');
        for (const [className] of module.classes) {
          const propName = this.toValidIdentifier(className);
          lines.push(`  export const ${propName}: string;`);
        }
        lines.push('}');
        lines.push('');
        lines.push('export = styles;');
        break;
    }

    return lines.join('\n');
  }

  /**
   * Convert string to valid JavaScript identifier
   */
  private toValidIdentifier(str: string): string {
    // Replace invalid characters with underscores
    return str.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^(\d)/, '_$1');
  }

  /**
   * Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  /**
   * Convert to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/-/g, '_');
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Count transformations
   */
  private countTransformations(
    original: CSSModule,
    transformed: CSSModule
  ): number {
    let count = 0;

    // Count class transformations
    for (const [className] of original.classes) {
      if (!transformed.classes.has(className)) {
        count++; // Class removed or renamed
      }
    }

    // Count new classes
    for (const [className] of transformed.classes) {
      if (!original.classes.has(className)) {
        count++; // Class added
      }
    }

    // Count variable transformations
    const originalVarCount = original.variables?.size || 0;
    const transformedVarCount = transformed.variables?.size || 0;
    
    if (originalVarCount !== transformedVarCount) {
      count += Math.abs(originalVarCount - transformedVarCount);
    }

    return count;
  }
}