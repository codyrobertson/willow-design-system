import * as ts from 'typescript';
import type { PropertyMapping } from '../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../types/component-mapping.types';

/**
 * Options for prop spreading behavior
 */
export interface PropSpreadingOptions {
  preserveOriginalSpread?: boolean;
  mergeWithExisting?: boolean;
  spreadPosition?: 'before' | 'after';
  filterProps?: string[];
  transformSpreadProps?: boolean;
}

/**
 * Result of prop spreading operation
 */
export interface PropSpreadingResult {
  success: boolean;
  spreadExpression: string;
  extractedProps: Record<string, any>;
  remainingProps: Record<string, any>;
  warnings: string[];
  transformations: Array<{
    from: string;
    to: string;
    value: any;
  }>;
}

/**
 * Handles prop spreading and extraction for component transformations
 */
export class PropSpreadingHandler {
  private spreadCache = new Map<string, PropSpreadingResult>();

  /**
   * Handle spread props in JSX elements
   */
  handleSpreadProps(
    spreadAttribute: ts.JsxSpreadAttribute,
    propMappings: PropertyMapping[],
    context: ComponentMappingContext,
    options: PropSpreadingOptions = {}
  ): PropSpreadingResult {
    const result: PropSpreadingResult = {
      success: true,
      spreadExpression: spreadAttribute.expression.getText(),
      extractedProps: {},
      remainingProps: {},
      warnings: [],
      transformations: [],
    };

    // Check cache
    const cacheKey = `${result.spreadExpression}:${context.componentName}`;
    if (this.spreadCache.has(cacheKey)) {
      return this.spreadCache.get(cacheKey)!;
    }

    try {
      // Analyze the spread expression
      const spreadInfo = this.analyzeSpreadExpression(spreadAttribute.expression);
      
      if (spreadInfo.type === 'identifier') {
        // Handle spread from variable (e.g., {...props})
        this.handleIdentifierSpread(spreadInfo, propMappings, result, options);
      } else if (spreadInfo.type === 'object') {
        // Handle inline object spread (e.g., {...{ color: 'red' }})
        this.handleObjectSpread(spreadInfo, propMappings, result, options);
      } else if (spreadInfo.type === 'call') {
        // Handle function call spread (e.g., {...getProps()})
        this.handleCallExpressionSpread(spreadInfo, propMappings, result, options);
      } else {
        result.warnings.push(`Unsupported spread expression type: ${spreadInfo.type}`);
      }

      // Cache the result
      this.spreadCache.set(cacheKey, result);
    } catch (error) {
      result.success = false;
      result.warnings.push(`Error processing spread props: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Extract specific props from a spread operation
   */
  extractPropsFromSpread(
    props: Record<string, any>,
    propMappings: PropertyMapping[],
    options: PropSpreadingOptions = {}
  ): {
    extracted: Record<string, any>;
    remaining: Record<string, any>;
    transformations: Array<{ from: string; to: string; value: any }>;
  } {
    const extracted: Record<string, any> = {};
    const remaining: Record<string, any> = {};
    const transformations: Array<{ from: string; to: string; value: any }> = [];

    // Create a map of source prop names to their mappings
    const mappingMap = new Map<string, PropertyMapping>();
    for (const mapping of propMappings) {
      mappingMap.set(mapping.source, mapping);
    }

    // Process each prop
    for (const [key, value] of Object.entries(props)) {
      const mapping = mappingMap.get(key);
      
      if (mapping) {
        if (mapping.omit) {
          // This prop is omitted, skip it entirely
          continue;
        } else if (mapping.spread) {
          // This prop should remain in the spread
          remaining[key] = value;
        } else {
          // Extract this prop
          extracted[mapping.target] = value;
          transformations.push({
            from: key,
            to: mapping.target,
            value,
          });
        }
      } else if (options.filterProps && options.filterProps.includes(key)) {
        // Filter out this prop
        continue;
      } else {
        // No mapping, keep in spread
        remaining[key] = value;
      }
    }

    return { extracted, remaining, transformations };
  }

  /**
   * Create a new spread expression from remaining props
   */
  createSpreadExpression(
    remainingProps: Record<string, any>,
    originalExpression: string,
    options: PropSpreadingOptions = {}
  ): string {
    if (Object.keys(remainingProps).length === 0) {
      return '';
    }

    if (options.preserveOriginalSpread) {
      // Keep the original spread expression
      return `...${originalExpression}`;
    }

    // Create a filtered spread expression
    const propEntries = Object.entries(remainingProps)
      .map(([key, value]) => {
        const valueStr = typeof value === 'string' ? `'${value}'` : String(value);
        return `${key}: ${valueStr}`;
      })
      .join(', ');

    return `...{ ${propEntries} }`;
  }

  /**
   * Merge spread props with existing props
   */
  mergeSpreadWithExisting(
    spreadProps: Record<string, any>,
    existingProps: Record<string, any>,
    options: PropSpreadingOptions = {}
  ): Record<string, any> {
    if (options.spreadPosition === 'before') {
      // Spread props come first, can be overridden by explicit props
      return { ...spreadProps, ...existingProps };
    } else {
      // Spread props come last, override explicit props
      return { ...existingProps, ...spreadProps };
    }
  }

  /**
   * Analyze the type of spread expression
   */
  private analyzeSpreadExpression(expression: ts.Expression): {
    type: 'identifier' | 'object' | 'call' | 'other';
    expression: ts.Expression;
    name?: string;
  } {
    if (ts.isIdentifier(expression)) {
      return { type: 'identifier', expression, name: expression.text };
    } else if (ts.isObjectLiteralExpression(expression)) {
      return { type: 'object', expression };
    } else if (ts.isCallExpression(expression)) {
      return { type: 'call', expression };
    } else {
      return { type: 'other', expression };
    }
  }

  /**
   * Handle spread from identifier
   */
  private handleIdentifierSpread(
    info: any,
    propMappings: PropertyMapping[],
    result: PropSpreadingResult,
    options: PropSpreadingOptions
  ): void {
    // For identifier spreads, we can't statically analyze the props
    // Add a warning and keep the spread as-is
    result.warnings.push(
      `Cannot statically analyze spread from variable '${info.name}'. ` +
      `Consider using TypeScript type information for better analysis.`
    );
    result.remainingProps = { [`...${info.name}`]: true };
  }

  /**
   * Handle spread from object literal
   */
  private handleObjectSpread(
    info: any,
    propMappings: PropertyMapping[],
    result: PropSpreadingResult,
    options: PropSpreadingOptions
  ): void {
    const objectLiteral = info.expression as ts.ObjectLiteralExpression;
    const props: Record<string, any> = {};

    // Extract props from object literal
    for (const prop of objectLiteral.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        const key = prop.name.text;
        const value = this.evaluateExpression(prop.initializer);
        props[key] = value;
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        const key = prop.name.text;
        props[key] = key; // Shorthand property
      }
    }

    // Extract and transform props
    const { extracted, remaining, transformations } = this.extractPropsFromSpread(
      props,
      propMappings,
      options
    );

    result.extractedProps = extracted;
    result.remainingProps = remaining;
    result.transformations = transformations;
  }

  /**
   * Handle spread from call expression
   */
  private handleCallExpressionSpread(
    info: any,
    propMappings: PropertyMapping[],
    result: PropSpreadingResult,
    options: PropSpreadingOptions
  ): void {
    const callExpr = info.expression as ts.CallExpression;
    const funcName = callExpr.expression.getText();
    
    result.warnings.push(
      `Cannot statically analyze spread from function call '${funcName}()'. ` +
      `Consider refactoring to use explicit props or static object spreads.`
    );
    result.remainingProps = { [`...${funcName}()`]: true };
  }

  /**
   * Evaluate a simple expression to extract its value
   */
  private evaluateExpression(expr: ts.Expression): any {
    if (ts.isStringLiteral(expr)) {
      return expr.text;
    } else if (ts.isNumericLiteral(expr)) {
      return Number(expr.text);
    } else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    } else if (expr.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    } else if (expr.kind === ts.SyntaxKind.NullKeyword) {
      return null;
    } else if (ts.isIdentifier(expr) && expr.text === 'undefined') {
      return undefined;
    } else if (ts.isObjectLiteralExpression(expr)) {
      const obj: Record<string, any> = {};
      for (const prop of expr.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          obj[prop.name.text] = this.evaluateExpression(prop.initializer);
        }
      }
      return obj;
    } else if (ts.isArrayLiteralExpression(expr)) {
      return expr.elements.map(el => this.evaluateExpression(el));
    } else {
      // Return the text representation for complex expressions
      return expr.getText();
    }
  }

  /**
   * Clear the spread cache
   */
  clearCache(): void {
    this.spreadCache.clear();
  }

  /**
   * Check if a prop should be spread based on configuration
   */
  shouldSpreadProp(propName: string, mapping?: PropertyMapping): boolean {
    if (!mapping) {
      return true; // No mapping, keep in spread
    }
    return mapping.spread === true;
  }

  /**
   * Generate TypeScript code for transformed spread
   */
  generateTransformedSpreadCode(
    extractedProps: Record<string, any>,
    remainingSpread: string,
    options: PropSpreadingOptions = {}
  ): string {
    const parts: string[] = [];

    // Add spread expression if there are remaining props
    if (remainingSpread && options.spreadPosition === 'before') {
      parts.push(remainingSpread);
    }

    // Add extracted props
    for (const [key, value] of Object.entries(extractedProps)) {
      const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
      parts.push(`${key}={${valueStr}}`);
    }

    // Add spread expression if position is after
    if (remainingSpread && options.spreadPosition === 'after') {
      parts.push(remainingSpread);
    }

    return parts.join(' ');
  }
}