/**
 * Comprehensive Property Name Transformer
 * Transforms property names in JSX attributes and object literals with full AST support
 */

import * as ts from 'typescript';
import { BaseTransformer } from '../../base-transformer';
import {
  TransformContext,
  TransformError,
  TransformWarning,
  TransformChange,
} from '../../index';

export interface PropNameTransformerConfig {
  /** Property name mappings: old -> new */
  propertyMappings?: Record<string, string>;
  
  /** Case conversion mode */
  caseMode?: 'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase';
  
  /** Whether to transform JSX attributes */
  transformJSXAttributes?: boolean;
  
  /** Whether to transform object literal properties */
  transformObjectProperties?: boolean;
  
  /** Component names to target (empty = all components) */
  targetComponents?: string[];
  
  /** Whether to handle spread attributes transformations */
  transformSpreadAttributes?: boolean;
  
  /** Whether to process conditional and dynamic attribute names */
  processConditionalAttributes?: boolean;
  
  /** Custom attribute transformation rules */
  attributeRules?: AttributeTransformRule[];
  
  /** Whether to preserve original attributes as fallbacks */
  preserveOriginal?: boolean;
  
  /** Context-aware transformations based on component type */
  contextualTransforms?: Record<string, Record<string, string>>;
}

export interface AttributeTransformRule {
  /** Pattern to match attribute names (string or regex) */
  pattern: string | RegExp;
  
  /** Transformation function or static replacement */
  transform: string | ((name: string, context: AttributeContext) => string);
  
  /** Component types this rule applies to */
  componentTypes?: string[];
  
  /** Conditions for applying this rule */
  conditions?: {
    hasValue?: boolean;
    valueType?: 'string' | 'expression' | 'boolean';
    parentComponent?: string | RegExp;
  };
}

export interface AttributeContext {
  /** The JSX element this attribute belongs to */
  element: ts.JsxOpeningElement | ts.JsxSelfClosingElement;
  
  /** Component name */
  componentName: string;
  
  /** Attribute value type */
  valueType: 'string' | 'expression' | 'boolean' | 'spread';
  
  /** Whether attribute has a value */
  hasValue: boolean;
  
  /** All attributes on this element */
  allAttributes: ts.JsxAttribute[];
  
  /** File context */
  sourceFile: ts.SourceFile;
}

export interface PropNameTransformerResult {
  propertiesTransformed: number;
  jsxAttributesTransformed: number;
  objectPropertiesTransformed: number;
  spreadAttributesTransformed: number;
  conditionalAttributesProcessed: number;
  transformations: Array<{
    from: string;
    to: string;
    location: 'jsx' | 'object' | 'spread' | 'conditional';
    line: number;
    componentName?: string;
    rule?: string;
  }>;
  elementsProcessed: number;
  dynamicTransforms: number;
}

export class PropNameTransformer extends BaseTransformer<
  PropNameTransformerConfig,
  PropNameTransformerResult
> {
  readonly name = 'prop-name-transformer';
  readonly description = 'Comprehensive JSX attribute and object property transformation with AST support';
  readonly version = '2.0.0';

  /** Cache for component names to avoid repeated lookups */
  private componentNameCache = new Map<ts.Node, string>();
  
  /** Track processed elements to avoid duplicate transformations */
  private processedElements = new Set<ts.Node>();

  protected async performTransform(
    sourceFile: ts.SourceFile,
    context: TransformContext,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    }
  ): Promise<{
    transformedFile: ts.SourceFile;
    data?: PropNameTransformerResult;
    nodesProcessed?: number;
  }> {
    const result: PropNameTransformerResult = {
      propertiesTransformed: 0,
      jsxAttributesTransformed: 0,
      objectPropertiesTransformed: 0,
      spreadAttributesTransformed: 0,
      conditionalAttributesProcessed: 0,
      transformations: [],
      elementsProcessed: 0,
      dynamicTransforms: 0,
    };

    let nodesProcessed = 0;
    this.componentNameCache.clear();
    this.processedElements.clear();

    const transformer: ts.TransformerFactory<ts.Node> = (context) => {
      return (rootNode) => {
        const visit = (node: ts.Node): ts.Node => {
          nodesProcessed++;

          // Task 3.1: Parse JSX opening elements and identify attributes
          if (this.config?.transformJSXAttributes) {
            if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
              return this.transformJsxElement(node, sourceFile, collectors, result);
            }
          }

          // Task 3.5: Update object literal properties in props
          if (this.config?.transformObjectProperties && ts.isPropertyAssignment(node)) {
            return this.transformObjectProperty(node, sourceFile, collectors, result);
          }

          // Task 3.3: Handle spread attributes {...props} transformations
          if (this.config?.transformSpreadAttributes && ts.isJsxSpreadAttribute(node)) {
            return this.transformSpreadAttribute(node, sourceFile, collectors, result);
          }

          return ts.visitEachChild(node, visit, context);
        };

        return ts.visitNode(rootNode, visit);
      };
    };

    const transformationResult = ts.transform(sourceFile, [transformer]);
    const transformedFile = transformationResult.transformed[0] as ts.SourceFile;
    transformationResult.dispose();

    return {
      transformedFile,
      data: result,
      nodesProcessed,
    };
  }

  /**
   * Task 3.1 & 3.2: Parse JSX opening elements and transform attributes
   */
  private transformJsxElement(
    node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: PropNameTransformerResult
  ): ts.JsxOpeningElement | ts.JsxSelfClosingElement {
    if (this.processedElements.has(node)) {
      return node;
    }
    this.processedElements.add(node);
    result.elementsProcessed++;

    const componentName = this.getComponentName(node);
    
    // Check if this component should be transformed
    if (!this.shouldTransformComponent(componentName)) {
      return node;
    }

    const transformedAttributes = this.transformJsxAttributes(
      node.attributes.properties,
      componentName,
      node,
      sourceFile,
      collectors,
      result
    );

    // Update the element with transformed attributes
    const newAttributes = ts.factory.createJsxAttributes(transformedAttributes);
    
    if (ts.isJsxOpeningElement(node)) {
      return ts.factory.updateJsxOpeningElement(
        node,
        node.tagName,
        node.typeArguments,
        newAttributes
      );
    } else {
      return ts.factory.updateJsxSelfClosingElement(
        node,
        node.tagName,
        node.typeArguments,
        newAttributes
      );
    }
  }

  /**
   * Transform all attributes for a JSX element
   */
  private transformJsxAttributes(
    attributes: readonly ts.JsxAttributeLike[],
    componentName: string,
    element: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: PropNameTransformerResult
  ): ts.JsxAttributeLike[] {
    const transformedAttributes: ts.JsxAttributeLike[] = [];
    const regularAttributes = attributes.filter(ts.isJsxAttribute);
    
    for (const attr of attributes) {
      if (ts.isJsxAttribute(attr)) {
        // Task 3.2: Transform attribute names based on mapping rules
        const transformedAttr = this.transformSingleJsxAttribute(
          attr,
          componentName,
          element,
          regularAttributes,
          sourceFile,
          collectors,
          result
        );
        transformedAttributes.push(transformedAttr);
      } else if (ts.isJsxSpreadAttribute(attr)) {
        // Task 3.3: Handle spread attributes
        const transformedSpread = this.transformSpreadAttribute(
          attr,
          sourceFile,
          collectors,
          result
        );
        transformedAttributes.push(transformedSpread);
      } else {
        transformedAttributes.push(attr);
      }
    }

    return transformedAttributes;
  }

  /**
   * Task 3.2: Transform attribute names based on mapping rules
   */
  private transformSingleJsxAttribute(
    node: ts.JsxAttribute,
    componentName: string,
    element: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
    allAttributes: ts.JsxAttribute[],
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: PropNameTransformerResult
  ): ts.JsxAttribute {
    const oldName = node.name.text;
    
    // Task 3.4: Process conditional and dynamic attribute names
    if (this.config?.processConditionalAttributes && this.isConditionalAttribute(node, allAttributes)) {
      result.conditionalAttributesProcessed++;
    }
    
    // Build attribute context
    const context: AttributeContext = {
      element,
      componentName,
      valueType: this.getAttributeValueType(node),
      hasValue: node.initializer !== undefined,
      allAttributes,
      sourceFile,
    };

    // Transform the attribute name
    const newName = this.transformAttributeName(oldName, context);

    if (oldName !== newName) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      
      result.jsxAttributesTransformed++;
      result.propertiesTransformed++;
      result.transformations.push({
        from: oldName,
        to: newName,
        location: 'jsx',
        line,
        componentName,
        rule: this.getAppliedRule(oldName, context),
      });

      collectors.changes.push(
        this.createChange(
          'modify',
          `Changed JSX attribute from "${oldName}" to "${newName}" on <${componentName}>`,
          sourceFile.fileName,
          node,
          oldName,
          newName
        )
      );

      return ts.factory.updateJsxAttribute(
        node,
        ts.factory.createIdentifier(newName),
        node.initializer
      );
    }

    return node;
  }

  /**
   * Task 3.3: Handle spread attributes {...props} transformations
   */
  private transformSpreadAttribute(
    node: ts.JsxSpreadAttribute,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: PropNameTransformerResult
  ): ts.JsxSpreadAttribute {
    // Check if the spread expression is an object that can be transformed
    if (ts.isObjectLiteralExpression(node.expression)) {
      const transformedObject = this.transformObjectLiteralForSpread(
        node.expression,
        sourceFile,
        collectors,
        result
      );
      
      if (transformedObject !== node.expression) {
        result.spreadAttributesTransformed++;
        
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        result.transformations.push({
          from: 'spread object',
          to: 'transformed spread object',
          location: 'spread',
          line,
        });

        return ts.factory.updateJsxSpreadAttribute(node, transformedObject);
      }
    }
    
    // Handle identifier-based spreads (e.g., {...someProps})
    if (ts.isIdentifier(node.expression)) {
      // We could potentially track and transform the source of these props
      // For now, we'll log them for awareness
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      collectors.warnings.push({
        code: 'SPREAD_IDENTIFIER_DETECTED',
        message: `Spread attribute {...${node.expression.text}} detected - source transformation may be needed`,
        file: sourceFile.fileName,
        location: {
          line,
          column: sourceFile.getLineAndCharacterOfPosition(node.getStart()).character + 1,
        },
        severity: 'info',
      });
    }

    return node;
  }

  /**
   * Task 3.5: Update object literal properties in props
   */
  private transformObjectProperty(
    node: ts.PropertyAssignment,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: PropNameTransformerResult
  ): ts.PropertyAssignment {
    if (!ts.isIdentifier(node.name) && !ts.isStringLiteral(node.name) && !ts.isComputedPropertyName(node.name)) {
      return node;
    }

    const oldName = this.getPropertyName(node);
    if (!oldName) {
      return node;
    }

    const newName = this.transformPropertyName(oldName);

    if (oldName !== newName) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      
      result.objectPropertiesTransformed++;
      result.propertiesTransformed++;
      result.transformations.push({
        from: oldName,
        to: newName,
        location: 'object',
        line,
      });

      collectors.changes.push(
        this.createChange(
          'modify',
          `Changed object property from "${oldName}" to "${newName}"`,
          sourceFile.fileName,
          node,
          oldName,
          newName
        )
      );

      const newNameNode = this.createPropertyName(newName, node.name);
      return ts.factory.updatePropertyAssignment(
        node,
        newNameNode,
        node.initializer
      );
    }

    return node;
  }

  /**
   * Transform object literal for spread attributes
   */
  private transformObjectLiteralForSpread(
    node: ts.ObjectLiteralExpression,
    sourceFile: ts.SourceFile,
    collectors: {
      errors: TransformError[];
      warnings: TransformWarning[];
      changes: TransformChange[];
    },
    result: PropNameTransformerResult
  ): ts.ObjectLiteralExpression {
    const transformedProperties: ts.ObjectLiteralElementLike[] = [];
    let hasChanges = false;

    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const transformedProp = this.transformObjectProperty(
          prop,
          sourceFile,
          collectors,
          result
        );
        transformedProperties.push(transformedProp);
        if (transformedProp !== prop) {
          hasChanges = true;
        }
      } else {
        transformedProperties.push(prop);
      }
    }

    if (hasChanges) {
      return ts.factory.updateObjectLiteralExpression(node, transformedProperties);
    }

    return node;
  }

  /**
   * Transform attribute name with full context awareness
   */
  private transformAttributeName(name: string, context: AttributeContext): string {
    // Check contextual transforms first (component-specific mappings)
    const contextualMapping = this.config?.contextualTransforms?.[context.componentName]?.[name];
    if (contextualMapping) {
      return contextualMapping;
    }

    // Check custom attribute rules
    if (this.config?.attributeRules) {
      for (const rule of this.config.attributeRules) {
        if (this.ruleMatches(rule, name, context)) {
          const transformed = this.applyRule(rule, name, context);
          if (transformed !== name) {
            return transformed;
          }
        }
      }
    }

    // Fall back to general property transformation
    return this.transformPropertyName(name);
  }

  /**
   * Transform property name (legacy method for backward compatibility)
   */
  private transformPropertyName(name: string): string {
    // Check explicit mappings first
    if (this.config?.propertyMappings?.[name]) {
      return this.config.propertyMappings[name];
    }

    // Apply case conversion if specified
    if (this.config?.caseMode) {
      return this.convertCase(name, this.config.caseMode);
    }

    return name;
  }

  /**
   * Check if a transformation rule matches
   */
  private ruleMatches(rule: AttributeTransformRule, name: string, context: AttributeContext): boolean {
    // Check pattern match
    const patternMatches = typeof rule.pattern === 'string'
      ? rule.pattern === name
      : rule.pattern.test(name);
    
    if (!patternMatches) {
      return false;
    }

    // Check component type restrictions
    if (rule.componentTypes && !rule.componentTypes.includes(context.componentName)) {
      return false;
    }

    // Check conditions
    if (rule.conditions) {
      if (rule.conditions.hasValue !== undefined && rule.conditions.hasValue !== context.hasValue) {
        return false;
      }
      
      if (rule.conditions.valueType && rule.conditions.valueType !== context.valueType) {
        return false;
      }
      
      if (rule.conditions.parentComponent) {
        const parentMatches = typeof rule.conditions.parentComponent === 'string'
          ? rule.conditions.parentComponent === context.componentName
          : rule.conditions.parentComponent.test(context.componentName);
        
        if (!parentMatches) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Apply a transformation rule
   */
  private applyRule(rule: AttributeTransformRule, name: string, context: AttributeContext): string {
    if (typeof rule.transform === 'string') {
      return rule.transform;
    } else {
      return rule.transform(name, context);
    }
  }

  /**
   * Get the name of the rule that was applied (for tracking)
   */
  private getAppliedRule(name: string, context: AttributeContext): string {
    if (this.config?.contextualTransforms?.[context.componentName]?.[name]) {
      return `contextual:${context.componentName}`;
    }
    
    if (this.config?.attributeRules) {
      for (const rule of this.config.attributeRules) {
        if (this.ruleMatches(rule, name, context)) {
          return `rule:${rule.pattern.toString()}`;
        }
      }
    }
    
    if (this.config?.propertyMappings?.[name]) {
      return 'mapping';
    }
    
    if (this.config?.caseMode) {
      return `case:${this.config.caseMode}`;
    }
    
    return 'default';
  }

  private convertCase(str: string, mode: NonNullable<PropNameTransformerConfig['caseMode']>): string {
    switch (mode) {
      case 'camelCase':
        return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      case 'kebab-case':
        return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
      case 'snake_case':
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      case 'PascalCase':
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      default:
        return str;
    }
  }

  /**
   * Get component name from JSX element
   */
  private getComponentName(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string {
    if (this.componentNameCache.has(node)) {
      return this.componentNameCache.get(node)!;
    }

    let name = '';
    if (ts.isIdentifier(node.tagName)) {
      name = node.tagName.text;
    } else if (ts.isPropertyAccessExpression(node.tagName)) {
      name = node.tagName.getText();
    } else {
      name = node.tagName.getText();
    }

    this.componentNameCache.set(node, name);
    return name;
  }

  /**
   * Check if component should be transformed
   */
  private shouldTransformComponent(componentName: string): boolean {
    if (!this.config?.targetComponents || this.config.targetComponents.length === 0) {
      return true; // Transform all components if no restrictions
    }
    
    return this.config.targetComponents.includes(componentName);
  }

  /**
   * Get attribute value type
   */
  private getAttributeValueType(node: ts.JsxAttribute): 'string' | 'expression' | 'boolean' {
    if (!node.initializer) {
      return 'boolean';
    }
    
    if (ts.isStringLiteral(node.initializer)) {
      return 'string';
    }
    
    return 'expression';
  }

  /**
   * Task 3.4: Check if attribute is conditional/dynamic
   */
  private isConditionalAttribute(node: ts.JsxAttribute, allAttributes: ts.JsxAttribute[]): boolean {
    // Check if attribute value contains conditional expressions
    if (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
      const expr = node.initializer.expression;
      
      // Look for conditional operators
      if (ts.isConditionalExpression(expr) || 
          ts.isBinaryExpression(expr) ||
          ts.isCallExpression(expr)) {
        return true;
      }
    }
    
    // Check if there are multiple similar attributes (potential conditional rendering)
    const baseName = node.name.text.replace(/\d+$/, ''); // Remove trailing numbers
    const similarAttributes = allAttributes.filter(attr => 
      attr.name.text.startsWith(baseName) && attr !== node
    );
    
    return similarAttributes.length > 0;
  }

  /**
   * Get property name from various node types
   */
  private getPropertyName(node: ts.PropertyAssignment): string | null {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    } else if (ts.isStringLiteral(node.name)) {
      return node.name.text;
    } else if (ts.isComputedPropertyName(node.name)) {
      // Handle computed property names like [key]
      if (ts.isStringLiteral(node.name.expression)) {
        return node.name.expression.text;
      }
      // For dynamic computed names, return null to skip transformation
      return null;
    }
    
    return null;
  }

  /**
   * Create property name node of appropriate type
   */
  private createPropertyName(name: string, originalNode: ts.PropertyName): ts.PropertyName {
    if (ts.isIdentifier(originalNode)) {
      return ts.factory.createIdentifier(name);
    } else if (ts.isStringLiteral(originalNode)) {
      return ts.factory.createStringLiteral(name);
    } else if (ts.isComputedPropertyName(originalNode)) {
      return ts.factory.createComputedPropertyName(ts.factory.createStringLiteral(name));
    }
    
    // Fallback to identifier
    return ts.factory.createIdentifier(name);
  }

  canTransform(sourceFile: ts.SourceFile): boolean {
    // Can transform files with JSX elements or object literals
    let hasTargets = false;

    const visit = (node: ts.Node) => {
      if (this.config?.transformJSXAttributes && 
          (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))) {
        hasTargets = true;
      } else if (this.config?.transformObjectProperties && ts.isPropertyAssignment(node)) {
        hasTargets = true;
      } else if (this.config?.transformSpreadAttributes && ts.isJsxSpreadAttribute(node)) {
        hasTargets = true;
      }
      
      if (!hasTargets) {
        ts.forEachChild(node, visit);
      }
    };

    visit(sourceFile);
    return hasTargets;
  }
}