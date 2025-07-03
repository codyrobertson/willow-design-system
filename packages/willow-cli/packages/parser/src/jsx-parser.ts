import * as ts from 'typescript';
import type { JSXElementInfo, JSXAttribute } from '@willow-cli/types';
import type { ParserContext } from './types';

export class JSXParser {
  /**
   * Parse JSX elements from a node
   */
  parse(node: ts.Node, context: ParserContext): JSXElementInfo[] {
    const elements: JSXElementInfo[] = [];
    
    const visit = (n: ts.Node) => {
      if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
        const element = this.parseJSXElement(n, context);
        if (element) {
          elements.push(element);
        }
      } else if (ts.isJsxFragment(n)) {
        const fragment = this.parseJSXFragment(n, context);
        if (fragment) {
          elements.push(fragment);
        }
      }
      
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    return elements;
  }
  
  /**
   * Parse single JSX element
   */
  private parseJSXElement(
    node: ts.JsxElement | ts.JsxSelfClosingElement, 
    context: ParserContext
  ): JSXElementInfo | null {
    try {
      const tagName = this.getTagName(node);
      const attributes = this.parseAttributes(node, context);
      const children = this.parseChildren(node, context);
      const location = this.getLocation(node, context.sourceFile);
      
      // Determine if it's a component or HTML element
      const isComponent = /^[A-Z]/.test(tagName);
      
      return {
        tagName,
        attributes,
        children,
        isComponent,
        isSelfClosing: ts.isJsxSelfClosingElement(node),
        location,
        raw: node.getText(),
      };
    } catch (error) {
      context.errors.push({
        message: `Failed to parse JSX element: ${error}`,
        severity: 'warning',
        location: this.getLocation(node, context.sourceFile),
      });
      return null;
    }
  }
  
  /**
   * Parse JSX fragment
   */
  private parseJSXFragment(node: ts.JsxFragment, context: ParserContext): JSXElementInfo | null {
    try {
      const children = this.parseChildren(node, context);
      const location = this.getLocation(node, context.sourceFile);
      
      return {
        tagName: 'Fragment',
        attributes: [],
        children,
        isComponent: true,
        isSelfClosing: false,
        location,
        raw: node.getText(),
      };
    } catch (error) {
      context.errors.push({
        message: `Failed to parse JSX fragment: ${error}`,
        severity: 'warning',
        location: this.getLocation(node, context.sourceFile),
      });
      return null;
    }
  }
  
  /**
   * Get tag name from JSX element
   */
  private getTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
    if (ts.isJsxElement(node)) {
      return this.getTagNameFromExpression(node.openingElement.tagName);
    } else {
      return this.getTagNameFromExpression(node.tagName);
    }
  }
  
  /**
   * Get tag name from JSX tag name expression
   */
  private getTagNameFromExpression(tagName: ts.JsxTagNameExpression): string {
    if (ts.isIdentifier(tagName)) {
      return tagName.text;
    } else if (ts.isPropertyAccessExpression(tagName)) {
      // Handle namespaced components like React.Fragment
      return `${this.getTagNameFromExpression(tagName.expression as ts.JsxTagNameExpression)}.${tagName.name.text}`;
    } else if (ts.isThisExpression(tagName)) {
      return 'this';
    }
    
    return tagName.getText();
  }
  
  /**
   * Parse JSX attributes
   */
  private parseAttributes(
    node: ts.JsxElement | ts.JsxSelfClosingElement, 
    context: ParserContext
  ): JSXAttribute[] {
    const attributes: JSXAttribute[] = [];
    const jsxAttributes = ts.isJsxElement(node) 
      ? node.openingElement.attributes 
      : node.attributes;
    
    jsxAttributes.properties.forEach(prop => {
      if (ts.isJsxAttribute(prop)) {
        const attr = this.parseJsxAttribute(prop, context);
        if (attr) {
          attributes.push(attr);
        }
      } else if (ts.isJsxSpreadAttribute(prop)) {
        const spreadAttr = this.parseSpreadAttribute(prop, context);
        if (spreadAttr) {
          attributes.push(spreadAttr);
        }
      }
    });
    
    return attributes;
  }
  
  /**
   * Parse single JSX attribute
   */
  private parseJsxAttribute(node: ts.JsxAttribute, context: ParserContext): JSXAttribute | null {
    const name = node.name.text;
    
    if (!node.initializer) {
      // Boolean attribute
      return {
        name,
        value: true,
        type: 'boolean',
      };
    }
    
    if (ts.isStringLiteral(node.initializer)) {
      return {
        name,
        value: node.initializer.text,
        type: 'string',
      };
    }
    
    if (ts.isJsxExpression(node.initializer)) {
      const expression = node.initializer.expression;
      if (!expression) {
        return {
          name,
          value: undefined,
          type: 'expression',
          raw: '{}',
        };
      }
      
      const { value, type } = this.evaluateExpression(expression, context);
      return {
        name,
        value,
        type: type as JSXAttribute['type'],
        raw: expression.getText(),
      };
    }
    
    return null;
  }
  
  /**
   * Parse spread attribute
   */
  private parseSpreadAttribute(node: ts.JsxSpreadAttribute, context: ParserContext): JSXAttribute | null {
    return {
      name: '...spread',
      value: node.expression.getText(),
      type: 'spread',
      raw: node.getText(),
    };
  }
  
  /**
   * Evaluate expression value
   */
  private evaluateExpression(
    node: ts.Expression, 
    context: ParserContext
  ): { value: any; type: string } {
    // String literal
    if (ts.isStringLiteral(node)) {
      return { value: node.text, type: 'string' };
    }
    
    // Number literal
    if (ts.isNumericLiteral(node)) {
      return { value: Number(node.text), type: 'number' };
    }
    
    // Boolean literal
    if (node.kind === ts.SyntaxKind.TrueKeyword) {
      return { value: true, type: 'boolean' };
    }
    if (node.kind === ts.SyntaxKind.FalseKeyword) {
      return { value: false, type: 'boolean' };
    }
    
    // Null/undefined
    if (node.kind === ts.SyntaxKind.NullKeyword) {
      return { value: null, type: 'null' };
    }
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
      return { value: undefined, type: 'undefined' };
    }
    
    // Array literal
    if (ts.isArrayLiteralExpression(node)) {
      return { value: node.getText(), type: 'array' };
    }
    
    // Object literal
    if (ts.isObjectLiteralExpression(node)) {
      return { value: node.getText(), type: 'object' };
    }
    
    // Function/Arrow function
    if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      return { value: node.getText(), type: 'function' };
    }
    
    // Identifier
    if (ts.isIdentifier(node)) {
      return { value: node.text, type: 'identifier' };
    }
    
    // Template literal
    if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return { value: node.getText(), type: 'template' };
    }
    
    // Default to expression
    return { value: node.getText(), type: 'expression' };
  }
  
  /**
   * Parse JSX children
   */
  private parseChildren(
    node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment, 
    context: ParserContext
  ): JSXElementInfo['children'] {
    const children: JSXElementInfo['children'] = [];
    
    if (ts.isJsxSelfClosingElement(node)) {
      return children;
    }
    
    const childNodes = ts.isJsxElement(node) 
      ? node.children 
      : (node as ts.JsxFragment).children;
    
    childNodes.forEach(child => {
      if (ts.isJsxText(child)) {
        const text = child.text.trim();
        if (text) {
          children.push({
            type: 'text',
            value: text,
          });
        }
      } else if (ts.isJsxExpression(child)) {
        if (child.expression) {
          children.push({
            type: 'expression',
            value: child.expression.getText(),
            raw: child.getText(),
          });
        }
      } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
        const element = this.parseJSXElement(child, context);
        if (element) {
          children.push({
            type: 'element',
            value: element,
          });
        }
      } else if (ts.isJsxFragment(child)) {
        const fragment = this.parseJSXFragment(child, context);
        if (fragment) {
          children.push({
            type: 'fragment',
            value: fragment,
          });
        }
      }
    });
    
    return children;
  }
  
  /**
   * Get source location
   */
  private getLocation(node: ts.Node, sourceFile: ts.SourceFile): import('@willow-cli/types').SourceLocation {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      start: { line: start.line + 1, column: start.character + 1 },
      end: { line: end.line + 1, column: end.character + 1 },
    };
  }
  
  /**
   * Find JSX elements by tag name
   */
  findByTagName(elements: JSXElementInfo[], tagName: string | RegExp): JSXElementInfo[] {
    const results: JSXElementInfo[] = [];
    
    const search = (el: JSXElementInfo) => {
      const matches = typeof tagName === 'string' 
        ? el.tagName === tagName 
        : tagName.test(el.tagName);
        
      if (matches) {
        results.push(el);
      }
      
      // Search in children
      el.children.forEach(child => {
        if (child.type === 'element' && child.value) {
          search(child.value);
        } else if (child.type === 'fragment' && child.value) {
          search(child.value);
        }
      });
    };
    
    elements.forEach(search);
    return results;
  }
  
  /**
   * Find JSX elements with specific attribute
   */
  findByAttribute(elements: JSXElementInfo[], attrName: string, attrValue?: any): JSXElementInfo[] {
    const results: JSXElementInfo[] = [];
    
    const search = (el: JSXElementInfo) => {
      const hasAttr = el.attributes.some(attr => {
        if (attr.name !== attrName) return false;
        if (attrValue === undefined) return true;
        return attr.value === attrValue;
      });
      
      if (hasAttr) {
        results.push(el);
      }
      
      // Search in children
      el.children.forEach(child => {
        if (child.type === 'element' && child.value) {
          search(child.value);
        } else if (child.type === 'fragment' && child.value) {
          search(child.value);
        }
      });
    };
    
    elements.forEach(search);
    return results;
  }
  
  /**
   * Extract text content from JSX elements
   */
  extractTextContent(element: JSXElementInfo): string {
    const texts: string[] = [];
    
    const extract = (el: JSXElementInfo) => {
      el.children.forEach(child => {
        if (child.type === 'text') {
          texts.push(child.value);
        } else if (child.type === 'element' && child.value) {
          extract(child.value);
        } else if (child.type === 'fragment' && child.value) {
          extract(child.value);
        }
      });
    };
    
    extract(element);
    return texts.join(' ').trim();
  }
}