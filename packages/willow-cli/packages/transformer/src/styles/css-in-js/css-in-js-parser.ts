import * as ts from 'typescript';
import type { 
  CSSInJSObject, 
  StyleParser,
  StyleTransformationContext 
} from '../../types/style-transformation.types';

/**
 * Parser for CSS-in-JS style objects
 */
export class CSSInJSParser implements StyleParser<CSSInJSObject> {
  /**
   * Parse a TypeScript node or string into a CSS-in-JS object
   */
  parse(
    input: string | ts.Node, 
    context: StyleTransformationContext
  ): CSSInJSObject {
    if (typeof input === 'string') {
      // Parse string representation
      try {
        return JSON.parse(input);
      } catch {
        throw new Error('Invalid CSS-in-JS string format');
      }
    }

    // Parse TypeScript AST node
    if (ts.isObjectLiteralExpression(input)) {
      return this.parseObjectLiteral(input, context);
    }

    if (ts.isCallExpression(input)) {
      // Handle styled-components or emotion css`` calls
      return this.parseCallExpression(input, context);
    }

    if (ts.isParenthesizedExpression(input)) {
      // Unwrap parenthesized expression
      return this.parse(input.expression, context);
    }

    throw new Error(`Unsupported node type for CSS-in-JS parsing: ${ts.SyntaxKind[input.kind]}`);
  }

  /**
   * Serialize a CSS-in-JS object back to string
   */
  serialize(
    parsed: CSSInJSObject, 
    context: StyleTransformationContext
  ): string {
    return this.stringifyStyleObject(parsed, 0);
  }

  /**
   * Parse an object literal expression
   */
  private parseObjectLiteral(
    node: ts.ObjectLiteralExpression,
    context: StyleTransformationContext
  ): CSSInJSObject {
    const result: CSSInJSObject = {};

    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
        const key = this.getPropertyKey(prop);
        const value = this.parsePropertyValue(prop, context);
        
        if (key) {
          result[key] = value;
        }
      } else if (ts.isSpreadAssignment(prop)) {
        // Handle spread properties
        const spreadObj = this.evaluateExpression(prop.expression, context);
        if (typeof spreadObj === 'object' && spreadObj !== null) {
          Object.assign(result, spreadObj);
        }
      }
    }

    return result;
  }

  /**
   * Parse a call expression (e.g., css`...`)
   */
  private parseCallExpression(
    node: ts.CallExpression,
    context: StyleTransformationContext
  ): CSSInJSObject {
    // Handle template literal calls like css``
    if (node.arguments.length === 1) {
      const arg = node.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        return this.parseObjectLiteral(arg, context);
      }
    }

    // For now, return empty object for unsupported call expressions
    return {};
  }

  /**
   * Get property key from a property assignment
   */
  private getPropertyKey(
    prop: ts.PropertyAssignment | ts.ShorthandPropertyAssignment
  ): string | null {
    if (ts.isPropertyAssignment(prop)) {
      if (ts.isIdentifier(prop.name)) {
        return prop.name.text;
      } else if (ts.isStringLiteral(prop.name)) {
        return prop.name.text;
      } else if (ts.isComputedPropertyName(prop.name)) {
        // Handle computed property names
        return this.evaluateComputedPropertyName(prop.name);
      }
    } else if (ts.isShorthandPropertyAssignment(prop)) {
      return prop.name.text;
    }
    return null;
  }

  /**
   * Parse property value
   */
  private parsePropertyValue(
    prop: ts.PropertyAssignment | ts.ShorthandPropertyAssignment,
    context: StyleTransformationContext
  ): any {
    if (ts.isShorthandPropertyAssignment(prop)) {
      // For shorthand, we'd need to resolve the identifier
      return prop.name.text; // Placeholder
    }

    const valueNode = (prop as ts.PropertyAssignment).initializer;
    return this.evaluateExpression(valueNode, context);
  }

  /**
   * Evaluate an expression to a value
   */
  private evaluateExpression(
    node: ts.Node,
    context: StyleTransformationContext
  ): any {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
        return (node as ts.StringLiteral).text;
      
      case ts.SyntaxKind.NumericLiteral:
        return Number((node as ts.NumericLiteral).text);
      
      case ts.SyntaxKind.TrueKeyword:
        return true;
      
      case ts.SyntaxKind.FalseKeyword:
        return false;
      
      case ts.SyntaxKind.NullKeyword:
        return null;
      
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.parseObjectLiteral(node as ts.ObjectLiteralExpression, context);
      
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.parseArrayLiteral(node as ts.ArrayLiteralExpression, context);
      
      case ts.SyntaxKind.TemplateExpression:
        return this.parseTemplateExpression(node as ts.TemplateExpression, context);
      
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        return (node as ts.NoSubstitutionTemplateLiteral).text;
      
      case ts.SyntaxKind.Identifier:
        // For identifiers, we'd need to resolve them from context
        // For now, return as string
        return `$\{${(node as ts.Identifier).text}}`;
      
      case ts.SyntaxKind.BinaryExpression:
        return this.evaluateBinaryExpression(node as ts.BinaryExpression, context);
      
      case ts.SyntaxKind.ConditionalExpression:
        return this.evaluateConditionalExpression(node as ts.ConditionalExpression, context);
      
      default:
        // For unsupported expressions, return a placeholder
        return `[${ts.SyntaxKind[node.kind]}]`;
    }
  }

  /**
   * Parse array literal
   */
  private parseArrayLiteral(
    node: ts.ArrayLiteralExpression,
    context: StyleTransformationContext
  ): any[] {
    return node.elements.map(element => 
      this.evaluateExpression(element, context)
    );
  }

  /**
   * Parse template expression
   */
  private parseTemplateExpression(
    node: ts.TemplateExpression,
    context: StyleTransformationContext
  ): string {
    let result = node.head.text;
    
    for (const span of node.templateSpans) {
      const value = this.evaluateExpression(span.expression, context);
      result += String(value) + span.literal.text;
    }
    
    return result;
  }

  /**
   * Evaluate binary expression (e.g., a + b)
   */
  private evaluateBinaryExpression(
    node: ts.BinaryExpression,
    context: StyleTransformationContext
  ): any {
    const left = this.evaluateExpression(node.left, context);
    const right = this.evaluateExpression(node.right, context);
    
    switch (node.operatorToken.kind) {
      case ts.SyntaxKind.PlusToken:
        return typeof left === 'number' && typeof right === 'number' 
          ? left + right 
          : String(left) + String(right);
      
      case ts.SyntaxKind.MinusToken:
        return Number(left) - Number(right);
      
      default:
        return `${left} ${ts.tokenToString(node.operatorToken.kind)} ${right}`;
    }
  }

  /**
   * Evaluate conditional expression (ternary)
   */
  private evaluateConditionalExpression(
    node: ts.ConditionalExpression,
    context: StyleTransformationContext
  ): any {
    // We can't actually evaluate the condition without runtime context
    // So we'll return a placeholder
    const condition = this.evaluateExpression(node.condition, context);
    const whenTrue = this.evaluateExpression(node.whenTrue, context);
    const whenFalse = this.evaluateExpression(node.whenFalse, context);
    
    return `\${${condition} ? ${whenTrue} : ${whenFalse}}`;
  }

  /**
   * Evaluate computed property name
   */
  private evaluateComputedPropertyName(node: ts.ComputedPropertyName): string {
    // For now, return a placeholder
    return `[computed]`;
  }

  /**
   * Stringify a style object with proper formatting
   */
  private stringifyStyleObject(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent);
    
    if (typeof obj !== 'object' || obj === null) {
      return JSON.stringify(obj);
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.map(item => 
        this.stringifyStyleObject(item, indent + 1)
      );
      return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
    }
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    
    const lines = entries.map(([key, value]) => {
      const quotedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
      const formattedValue = this.stringifyStyleObject(value, indent + 1);
      return `${spaces}  ${quotedKey}: ${formattedValue}`;
    });
    
    return `{\n${lines.join(',\n')}\n${spaces}}`;
  }
}