import * as ts from 'typescript';
import type { ComponentMappingContext } from '../types/component-mapping.types';

/**
 * Type conversion configuration
 */
export interface TypeConversionConfig {
  from: string;
  to: string;
  transformer?: (type: ts.Type, checker: ts.TypeChecker) => string;
  preserveGenerics?: boolean;
  preserveUnion?: boolean;
  preserveIntersection?: boolean;
}

/**
 * Type conversion result
 */
export interface TypeConversionResult {
  success: boolean;
  sourceType: string;
  targetType: string;
  requiresImport?: {
    module: string;
    types: string[];
  };
  warnings: string[];
}

/**
 * Type mapping rule
 */
export interface TypeMappingRule {
  pattern: string | RegExp;
  replacement: string | ((match: string) => string);
  preserveGenerics?: boolean;
}

/**
 * Handles TypeScript type conversions between UI frameworks
 */
export class PropTypeConverter {
  private typeConversions = new Map<string, TypeConversionConfig>();
  private typeMappingRules: TypeMappingRule[] = [];
  private typeChecker: ts.TypeChecker | null = null;

  constructor() {
    this.registerBuiltInConversions();
  }

  /**
   * Set TypeScript type checker for advanced type analysis
   */
  setTypeChecker(checker: ts.TypeChecker): void {
    this.typeChecker = checker;
  }

  /**
   * Register built-in type conversions
   */
  private registerBuiltInConversions(): void {
    // React to Vue conversions
    this.registerConversion({
      from: 'React.ReactNode',
      to: 'VNode | string | number',
      requiresImport: { module: 'vue', types: ['VNode'] },
    });

    this.registerConversion({
      from: 'React.CSSProperties',
      to: 'CSSProperties',
      requiresImport: { module: 'vue', types: ['CSSProperties'] },
    });

    this.registerConversion({
      from: 'React.MouseEvent',
      to: 'MouseEvent',
    });

    this.registerConversion({
      from: 'React.KeyboardEvent',
      to: 'KeyboardEvent',
    });

    this.registerConversion({
      from: 'React.ChangeEvent',
      to: 'Event',
    });

    // MUI to custom conversions
    this.registerConversion({
      from: 'ButtonProps',
      to: 'WillowButtonProps',
      requiresImport: { module: '@willow/ui', types: ['WillowButtonProps'] },
    });

    this.registerConversion({
      from: 'TextFieldProps',
      to: 'WillowInputProps',
      requiresImport: { module: '@willow/ui', types: ['WillowInputProps'] },
    });

    // Common type mappings
    this.addTypeMappingRule({
      pattern: /^Mui(\w+)Props$/,
      replacement: (match) => `Willow${match.slice(3)}`,
      preserveGenerics: true,
    });

    this.addTypeMappingRule({
      pattern: 'React.FC',
      replacement: 'FunctionalComponent',
      preserveGenerics: true,
    });

    this.addTypeMappingRule({
      pattern: 'React.ComponentProps',
      replacement: 'ComponentProps',
      preserveGenerics: true,
    });
  }

  /**
   * Register a type conversion
   */
  registerConversion(config: {
    from: string;
    to: string;
    transformer?: TypeConversionConfig['transformer'];
    requiresImport?: TypeConversionResult['requiresImport'];
  }): void {
    this.typeConversions.set(config.from, {
      from: config.from,
      to: config.to,
      transformer: config.transformer,
    });
  }

  /**
   * Add a type mapping rule
   */
  addTypeMappingRule(rule: TypeMappingRule): void {
    this.typeMappingRules.push(rule);
  }

  /**
   * Convert a type string
   */
  convertTypeString(typeString: string, context?: ComponentMappingContext): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: typeString,
      targetType: typeString,
      warnings: [],
    };

    // Check direct conversions first
    const directConversion = this.typeConversions.get(typeString);
    if (directConversion) {
      result.targetType = directConversion.to;
      return result;
    }

    // Apply mapping rules
    let converted = typeString;
    for (const rule of this.typeMappingRules) {
      if (typeof rule.pattern === 'string') {
        if (converted.includes(rule.pattern)) {
          converted = converted.replace(
            rule.pattern,
            typeof rule.replacement === 'string' ? rule.replacement : rule.replacement(rule.pattern)
          );
        }
      } else {
        const match = converted.match(rule.pattern);
        if (match) {
          converted = converted.replace(
            rule.pattern,
            typeof rule.replacement === 'string' ? rule.replacement : rule.replacement(match[0])
          );
        }
      }
    }

    result.targetType = converted;

    // Handle complex types
    if (this.isGenericType(typeString)) {
      const genericResult = this.convertGenericType(typeString, context);
      result.targetType = genericResult.targetType;
      result.warnings.push(...genericResult.warnings);
    } else if (this.isUnionType(typeString)) {
      const unionResult = this.convertUnionType(typeString, context);
      result.targetType = unionResult.targetType;
      result.warnings.push(...unionResult.warnings);
    } else if (this.isIntersectionType(typeString)) {
      const intersectionResult = this.convertIntersectionType(typeString, context);
      result.targetType = intersectionResult.targetType;
      result.warnings.push(...intersectionResult.warnings);
    }

    return result;
  }

  /**
   * Convert a TypeScript type node
   */
  convertTypeNode(
    typeNode: ts.TypeNode,
    context?: ComponentMappingContext
  ): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: typeNode.getText(),
      targetType: typeNode.getText(),
      warnings: [],
    };

    if (!this.typeChecker) {
      result.warnings.push('Type checker not available, using string-based conversion');
      const stringResult = this.convertTypeString(result.sourceType, context);
      result.targetType = stringResult.targetType;
      result.requiresImport = stringResult.requiresImport;
      result.warnings.push(...stringResult.warnings);
      return result;
    }

    try {
      const type = this.typeChecker.getTypeFromTypeNode(typeNode);
      const typeString = this.typeChecker.typeToString(type);
      
      // Convert the type string
      const conversionResult = this.convertTypeString(typeString, context);
      result.targetType = conversionResult.targetType;
      result.warnings.push(...conversionResult.warnings);
      result.requiresImport = conversionResult.requiresImport;

      // Special handling for specific type nodes
      if (ts.isTypeReferenceNode(typeNode)) {
        const symbolResult = this.handleTypeReference(typeNode, context);
        if (symbolResult.targetType !== result.targetType) {
          result.targetType = symbolResult.targetType;
          result.requiresImport = symbolResult.requiresImport;
        }
      } else if (ts.isUnionTypeNode(typeNode)) {
        const unionResult = this.handleUnionTypeNode(typeNode, context);
        result.targetType = unionResult.targetType;
        result.warnings.push(...unionResult.warnings);
      } else if (ts.isIntersectionTypeNode(typeNode)) {
        const intersectionResult = this.handleIntersectionTypeNode(typeNode, context);
        result.targetType = intersectionResult.targetType;
        result.warnings.push(...intersectionResult.warnings);
      }
    } catch (error) {
      result.success = false;
      result.warnings.push(`Type conversion error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Check if a type string represents a generic type
   */
  private isGenericType(typeString: string): boolean {
    return typeString.includes('<') && typeString.includes('>');
  }

  /**
   * Check if a type string represents a union type
   */
  private isUnionType(typeString: string): boolean {
    // Simple check - doesn't handle nested unions perfectly
    const depth = this.getParenDepth(typeString);
    return typeString.split('|').length > 1 && depth === 0;
  }

  /**
   * Check if a type string represents an intersection type
   */
  private isIntersectionType(typeString: string): boolean {
    // Simple check - doesn't handle nested intersections perfectly
    const depth = this.getParenDepth(typeString);
    return typeString.split('&').length > 1 && depth === 0;
  }

  /**
   * Get parenthesis depth at a position
   */
  private getParenDepth(str: string): number {
    let depth = 0;
    let maxDepth = 0;
    for (const char of str) {
      if (char === '<' || char === '(') depth++;
      if (char === '>' || char === ')') depth--;
      maxDepth = Math.max(maxDepth, depth);
    }
    return maxDepth;
  }

  /**
   * Convert a generic type
   */
  private convertGenericType(
    typeString: string,
    context?: ComponentMappingContext
  ): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: typeString,
      targetType: typeString,
      warnings: [],
    };

    // Extract base type and generic arguments
    const match = typeString.match(/^([^<]+)<(.+)>$/);
    if (!match) {
      result.warnings.push('Failed to parse generic type');
      return result;
    }

    const [, baseType, genericArgs] = match;
    
    // Convert base type
    const baseResult = this.convertTypeString(baseType, context);
    
    // Convert generic arguments
    const args = this.splitGenericArgs(genericArgs);
    const convertedArgs = args.map(arg => this.convertTypeString(arg.trim(), context));
    
    // Reconstruct generic type
    result.targetType = `${baseResult.targetType}<${convertedArgs.map(r => r.targetType).join(', ')}>`;
    
    // Collect warnings
    convertedArgs.forEach(r => result.warnings.push(...r.warnings));

    return result;
  }

  /**
   * Convert a union type
   */
  private convertUnionType(
    typeString: string,
    context?: ComponentMappingContext
  ): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: typeString,
      targetType: typeString,
      warnings: [],
    };

    const parts = this.splitUnionParts(typeString);
    const convertedParts = parts.map(part => this.convertTypeString(part.trim(), context));
    
    result.targetType = convertedParts.map(r => r.targetType).join(' | ');
    convertedParts.forEach(r => result.warnings.push(...r.warnings));

    return result;
  }

  /**
   * Convert an intersection type
   */
  private convertIntersectionType(
    typeString: string,
    context?: ComponentMappingContext
  ): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: typeString,
      targetType: typeString,
      warnings: [],
    };

    const parts = this.splitIntersectionParts(typeString);
    const convertedParts = parts.map(part => this.convertTypeString(part.trim(), context));
    
    result.targetType = convertedParts.map(r => r.targetType).join(' & ');
    convertedParts.forEach(r => result.warnings.push(...r.warnings));

    return result;
  }

  /**
   * Handle type reference node
   */
  private handleTypeReference(
    node: ts.TypeReferenceNode,
    context?: ComponentMappingContext
  ): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: node.getText(),
      targetType: node.getText(),
      warnings: [],
    };

    if (ts.isIdentifier(node.typeName)) {
      const typeName = node.typeName.text;
      const conversion = this.typeConversions.get(typeName);
      
      if (conversion) {
        result.targetType = conversion.to;
        
        // Handle type arguments
        if (node.typeArguments) {
          const convertedArgs = node.typeArguments.map(arg => 
            this.convertTypeNode(arg, context)
          );
          
          const argString = convertedArgs.map(r => r.targetType).join(', ');
          result.targetType = `${conversion.to}<${argString}>`;
          
          convertedArgs.forEach(r => result.warnings.push(...r.warnings));
        }
      }
    }

    return result;
  }

  /**
   * Handle union type node
   */
  private handleUnionTypeNode(
    node: ts.UnionTypeNode,
    context?: ComponentMappingContext
  ): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: node.getText(),
      targetType: '',
      warnings: [],
    };

    const convertedTypes = node.types.map(type => this.convertTypeNode(type, context));
    result.targetType = convertedTypes.map(r => r.targetType).join(' | ');
    convertedTypes.forEach(r => result.warnings.push(...r.warnings));

    return result;
  }

  /**
   * Handle intersection type node
   */
  private handleIntersectionTypeNode(
    node: ts.IntersectionTypeNode,
    context?: ComponentMappingContext
  ): TypeConversionResult {
    const result: TypeConversionResult = {
      success: true,
      sourceType: node.getText(),
      targetType: '',
      warnings: [],
    };

    const convertedTypes = node.types.map(type => this.convertTypeNode(type, context));
    result.targetType = convertedTypes.map(r => r.targetType).join(' & ');
    convertedTypes.forEach(r => result.warnings.push(...r.warnings));

    return result;
  }

  /**
   * Split generic arguments respecting nesting
   */
  private splitGenericArgs(args: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of args) {
      if (char === '<') depth++;
      else if (char === '>') depth--;
      else if (char === ',' && depth === 0) {
        result.push(current);
        current = '';
        continue;
      }
      current += char;
    }

    if (current) result.push(current);
    return result;
  }

  /**
   * Split union parts respecting nesting
   */
  private splitUnionParts(typeString: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of typeString) {
      if (char === '<' || char === '(') depth++;
      else if (char === '>' || char === ')') depth--;
      else if (char === '|' && depth === 0) {
        result.push(current);
        current = '';
        continue;
      }
      current += char;
    }

    if (current) result.push(current);
    return result;
  }

  /**
   * Split intersection parts respecting nesting
   */
  private splitIntersectionParts(typeString: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of typeString) {
      if (char === '<' || char === '(') depth++;
      else if (char === '>' || char === ')') depth--;
      else if (char === '&' && depth === 0) {
        result.push(current);
        current = '';
        continue;
      }
      current += char;
    }

    if (current) result.push(current);
    return result;
  }

  /**
   * Convert prop interface types
   */
  convertPropTypes(
    props: Record<string, ts.TypeNode>,
    context?: ComponentMappingContext
  ): Record<string, TypeConversionResult> {
    const results: Record<string, TypeConversionResult> = {};

    for (const [propName, typeNode] of Object.entries(props)) {
      results[propName] = this.convertTypeNode(typeNode, context);
    }

    return results;
  }

  /**
   * Generate type imports
   */
  generateTypeImports(conversions: TypeConversionResult[]): string[] {
    const imports = new Map<string, Set<string>>();

    for (const conversion of conversions) {
      if (conversion.requiresImport) {
        const { module, types } = conversion.requiresImport;
        if (!imports.has(module)) {
          imports.set(module, new Set());
        }
        types.forEach(type => imports.get(module)!.add(type));
      }
    }

    const importStatements: string[] = [];
    for (const [module, types] of imports) {
      const typeList = Array.from(types).join(', ');
      importStatements.push(`import type { ${typeList} } from '${module}';`);
    }

    return importStatements;
  }

  /**
   * Clear all custom conversions and rules
   */
  clearCustomConversions(): void {
    this.typeConversions.clear();
    this.typeMappingRules = [];
    this.registerBuiltInConversions();
  }
}