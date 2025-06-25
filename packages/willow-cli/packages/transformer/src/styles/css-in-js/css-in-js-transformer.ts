/**
 * Comprehensive CSS-in-JS Transformer
 * Handles styled-components, emotion, and other CSS-in-JS libraries
 */

import * as ts from 'typescript';
import { BaseStyleTransformer } from '../base-style-transformer';
import {
  StyleType,
  StyleTransformationContext,
  StyleTransformationResult,
  StyleTransformerConfig,
} from '../../types/style-transformation.types';

export interface CssInJsConfig extends StyleTransformerConfig {
  /** Target CSS-in-JS library */
  targetLibrary: 'styled-components' | 'emotion' | '@stitches/react' | 'vanilla-extract';
  
  /** Transform nested selectors */
  transformNestedSelectors?: boolean;
  
  /** Process media queries */
  processMediaQueries?: boolean;
  
  /** Resolve CSS variables and theme tokens */
  resolveVariables?: boolean;
  
  /** Add vendor prefixes */
  addVendorPrefixes?: boolean;
  
  /** Optimize output (remove redundant styles) */
  optimize?: boolean;
  
  /** Theme token mappings */
  themeTokens?: Record<string, string>;
  
  /** Breakpoint configurations */
  breakpoints?: Record<string, string>;
}

export interface CssInJsPattern {
  type: 'template-literal' | 'object-literal' | 'function-call';
  node: ts.Node;
  library: string;
  content: string | object;
}

/**
 * Comprehensive CSS-in-JS transformer with full AST support
 */
export class CssInJsTransformer extends BaseStyleTransformer {
  name = 'css-in-js';
  supportedTypes: StyleType[] = [StyleType.CSS_IN_JS];
  priority = 30;

  private config: CssInJsConfig = {
    targetLibrary: 'styled-components',
    transformNestedSelectors: true,
    processMediaQueries: true,
    resolveVariables: true,
    addVendorPrefixes: false,
    optimize: true,
  };

  /**
   * Main transformation method
   */
  async transform(
    input: ts.SourceFile,
    context: StyleTransformationContext,
    config: CssInJsConfig
  ): Promise<StyleTransformationResult> {
    this.config = { ...this.config, ...config };
    const startTime = Date.now();
    
    try {
      // Step 1: Parse and identify CSS-in-JS patterns
      const patterns = this.identifyCssInJsPatterns(input);
      
      if (patterns.length === 0) {
        return this.createSuccessResult(input, input, {
          transformationsApplied: 0,
          processingTime: Date.now() - startTime,
          styleType: StyleType.CSS_IN_JS,
        });
      }

      // Step 2: Transform the AST
      const transformer = this.createASTTransformer(patterns);
      const result = ts.transform(input, [transformer]);
      const transformedFile = result.transformed[0] as ts.SourceFile;
      result.dispose();

      return this.createSuccessResult(transformedFile, input, {
        transformationsApplied: patterns.length,
        processingTime: Date.now() - startTime,
        styleType: StyleType.CSS_IN_JS,
      });

    } catch (error) {
      return {
        success: false,
        transformed: input,
        original: input,
        warnings: [],
        errors: [{
          code: 'CSS_IN_JS_TRANSFORM_ERROR',
          message: `CSS-in-JS transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          line: 1,
          column: 1,
        }],
        metadata: {
          transformationsApplied: 0,
          processingTime: Date.now() - startTime,
          styleType: StyleType.CSS_IN_JS,
        },
      };
    }
  }

  /**
   * Step 1: Parse and identify CSS-in-JS patterns
   */
  private identifyCssInJsPatterns(sourceFile: ts.SourceFile): CssInJsPattern[] {
    const patterns: CssInJsPattern[] = [];

    const visit = (node: ts.Node) => {
      // Styled-components: styled.div`...` or styled(Component)`...`
      if (this.isStyledComponentsPattern(node)) {
        patterns.push(this.parseStyledComponentsPattern(node));
      }
      
      // Emotion: css`...` or styled.div`...`
      else if (this.isEmotionPattern(node)) {
        patterns.push(this.parseEmotionPattern(node));
      }
      
      // CSS prop: <div css={{...}} /> or <div css={css`...`} />
      else if (this.isCssPropPattern(node)) {
        patterns.push(this.parseCssPropPattern(node));
      }
      
      // Object-based styles: { color: 'red', '&:hover': {...} }
      else if (this.isStyleObjectPattern(node)) {
        patterns.push(this.parseStyleObjectPattern(node));
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return patterns;
  }

  /**
   * Check if node is a styled-components pattern
   */
  private isStyledComponentsPattern(node: ts.Node): boolean {
    // styled.div`...` or styled(Component)`...`
    if (ts.isTaggedTemplateExpression(node)) {
      const tag = node.tag;
      
      // styled.div
      if (ts.isPropertyAccessExpression(tag) && 
          ts.isIdentifier(tag.expression) && 
          tag.expression.text === 'styled') {
        return true;
      }
      
      // styled(Component)
      if (ts.isCallExpression(tag) && 
          ts.isIdentifier(tag.expression) && 
          tag.expression.text === 'styled') {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if node is an emotion pattern
   */
  private isEmotionPattern(node: ts.Node): boolean {
    if (ts.isTaggedTemplateExpression(node)) {
      const tag = node.tag;
      
      // css`...`
      if (ts.isIdentifier(tag) && tag.text === 'css') {
        return true;
      }
      
      // styled.div (emotion)
      if (ts.isPropertyAccessExpression(tag) && 
          ts.isIdentifier(tag.expression) && 
          tag.expression.text === 'styled') {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if node is a CSS prop pattern
   */
  private isCssPropPattern(node: ts.Node): boolean {
    if (ts.isJsxAttribute(node) && 
        ts.isIdentifier(node.name) && 
        node.name.text === 'css') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if node is a style object pattern
   */
  private isStyleObjectPattern(node: ts.Node): boolean {
    if (ts.isObjectLiteralExpression(node)) {
      // Check if object contains CSS-like properties
      return node.properties.some(prop => 
        ts.isPropertyAssignment(prop) && 
        ts.isStringLiteral(prop.name) &&
        this.isCssProperty(prop.name.text)
      );
    }
    
    return false;
  }

  /**
   * Parse styled-components pattern
   */
  private parseStyledComponentsPattern(node: ts.Node): CssInJsPattern {
    const templateNode = node as ts.TaggedTemplateExpression;
    const content = this.extractTemplateContent(templateNode);
    
    return {
      type: 'template-literal',
      node,
      library: 'styled-components',
      content,
    };
  }

  /**
   * Parse emotion pattern
   */
  private parseEmotionPattern(node: ts.Node): CssInJsPattern {
    const templateNode = node as ts.TaggedTemplateExpression;
    const content = this.extractTemplateContent(templateNode);
    
    return {
      type: 'template-literal',
      node,
      library: 'emotion',
      content,
    };
  }

  /**
   * Parse CSS prop pattern
   */
  private parseCssPropPattern(node: ts.Node): CssInJsPattern {
    const attribute = node as ts.JsxAttribute;
    let content = '';
    
    if (attribute.initializer) {
      if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
        if (ts.isObjectLiteralExpression(attribute.initializer.expression)) {
          content = this.extractObjectContent(attribute.initializer.expression);
        } else if (ts.isTaggedTemplateExpression(attribute.initializer.expression)) {
          content = this.extractTemplateContent(attribute.initializer.expression);
        }
      }
    }
    
    return {
      type: 'object-literal',
      node,
      library: 'css-prop',
      content,
    };
  }

  /**
   * Parse style object pattern
   */
  private parseStyleObjectPattern(node: ts.Node): CssInJsPattern {
    const objectNode = node as ts.ObjectLiteralExpression;
    const content = this.extractObjectContent(objectNode);
    
    return {
      type: 'object-literal',
      node,
      library: 'object-styles',
      content,
    };
  }

  /**
   * Extract content from template literal
   */
  private extractTemplateContent(node: ts.TaggedTemplateExpression): string {
    if (ts.isNoSubstitutionTemplateLiteral(node.template)) {
      return node.template.text;
    } else if (ts.isTemplateExpression(node.template)) {
      // Handle template with substitutions
      let content = node.template.head.text;
      
      for (let i = 0; i < node.template.templateSpans.length; i++) {
        const span = node.template.templateSpans[i];
        content += '${' + span.expression.getText() + '}';
        content += span.literal.text;
      }
      
      return content;
    }
    
    return '';
  }

  /**
   * Extract content from object literal
   */
  private extractObjectContent(node: ts.ObjectLiteralExpression): object {
    const result: any = {};
    
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const key = this.getPropertyName(prop);
        const value = this.getPropertyValue(prop);
        if (key && value !== undefined) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Get property name from property assignment
   */
  private getPropertyName(prop: ts.PropertyAssignment): string | null {
    if (ts.isIdentifier(prop.name)) {
      return prop.name.text;
    } else if (ts.isStringLiteral(prop.name)) {
      return prop.name.text;
    } else if (ts.isComputedPropertyName(prop.name)) {
      return prop.name.expression.getText();
    }
    
    return null;
  }

  /**
   * Get property value from property assignment
   */
  private getPropertyValue(prop: ts.PropertyAssignment): any {
    if (ts.isStringLiteral(prop.initializer)) {
      return prop.initializer.text;
    } else if (ts.isNumericLiteral(prop.initializer)) {
      return Number(prop.initializer.text);
    } else if (ts.isObjectLiteralExpression(prop.initializer)) {
      return this.extractObjectContent(prop.initializer);
    }
    
    return prop.initializer.getText();
  }

  /**
   * Create AST transformer
   */
  private createASTTransformer(patterns: CssInJsPattern[]): ts.TransformerFactory<ts.SourceFile> {
    return (context) => {
      return (sourceFile) => {
        const visit = (node: ts.Node): ts.Node => {
          // Find matching pattern for this node
          const pattern = patterns.find(p => p.node === node);
          
          if (pattern) {
            return this.transformPattern(node, pattern, context);
          }
          
          return ts.visitEachChild(node, visit, context);
        };
        
        return ts.visitNode(sourceFile, visit) as ts.SourceFile;
      };
    };
  }

  /**
   * Transform a specific pattern
   */
  private transformPattern(
    node: ts.Node, 
    pattern: CssInJsPattern, 
    context: ts.TransformationContext
  ): ts.Node {
    switch (pattern.type) {
      case 'template-literal':
        return this.transformTemplateLiteral(node as ts.TaggedTemplateExpression, pattern);
      case 'object-literal':
        return this.transformObjectLiteral(node, pattern);
      default:
        return node;
    }
  }

  /**
   * Transform template literal CSS
   */
  private transformTemplateLiteral(
    node: ts.TaggedTemplateExpression, 
    pattern: CssInJsPattern
  ): ts.TaggedTemplateExpression {
    const cssContent = pattern.content as string;
    const transformedCss = this.transformCssString(cssContent);
    
    if (ts.isNoSubstitutionTemplateLiteral(node.template)) {
      const newTemplate = ts.factory.createNoSubstitutionTemplateLiteral(transformedCss);
      return ts.factory.updateTaggedTemplateExpression(node, node.tag, undefined, newTemplate);
    }
    
    return node;
  }

  /**
   * Transform object literal styles
   */
  private transformObjectLiteral(node: ts.Node, pattern: CssInJsPattern): ts.Node {
    if (ts.isObjectLiteralExpression(node)) {
      const styleObject = pattern.content as object;
      const transformedStyles = this.transformStyleObject(styleObject);
      
      // Create new object literal with transformed properties
      const newProperties = this.createObjectProperties(transformedStyles);
      return ts.factory.updateObjectLiteralExpression(node, newProperties);
    }
    
    return node;
  }

  /**
   * Step 2: Transform nested selectors
   */
  private transformCssString(css: string): string {
    if (!this.config.transformNestedSelectors) {
      return css;
    }

    let transformed = css;

    // Transform nested selectors (&:hover, &.class, & > child)
    transformed = this.transformNestedSelectors(transformed);
    
    // Step 3: Handle media queries
    if (this.config.processMediaQueries) {
      transformed = this.transformMediaQueries(transformed);
    }
    
    // Step 4: Process CSS variables and theme tokens
    if (this.config.resolveVariables) {
      transformed = this.resolveVariables(transformed);
    }
    
    // Step 5: Add vendor prefixes
    if (this.config.addVendorPrefixes) {
      transformed = this.addVendorPrefixes(transformed);
    }

    return transformed;
  }

  /**
   * Transform nested selectors
   */
  private transformNestedSelectors(css: string): string {
    // Transform &:hover -> :hover
    css = css.replace(/&:([a-z-]+)/g, ':$1');
    
    // Transform &.class -> .class
    css = css.replace(/&\.([a-zA-Z0-9_-]+)/g, '.$1');
    
    // Transform & > child -> > child
    css = css.replace(/&\s*([>+~])\s*/g, '$1 ');
    
    // Transform && -> &
    css = css.replace(/&&/g, '&');
    
    return css;
  }

  /**
   * Step 3: Transform media queries
   */
  private transformMediaQueries(css: string): string {
    if (!this.config.breakpoints) {
      return css;
    }

    let transformed = css;
    
    // Replace breakpoint tokens with actual values
    for (const [token, value] of Object.entries(this.config.breakpoints)) {
      const regex = new RegExp(`@media\\s+\\$\\{?${token}\\}?`, 'g');
      transformed = transformed.replace(regex, `@media ${value}`);
    }
    
    return transformed;
  }

  /**
   * Step 4: Resolve CSS variables and theme tokens
   */
  private resolveVariables(css: string): string {
    if (!this.config.themeTokens) {
      return css;
    }

    let transformed = css;
    
    // Replace theme tokens
    for (const [token, value] of Object.entries(this.config.themeTokens)) {
      // Handle ${theme.colors.primary} patterns
      const themeRegex = new RegExp(`\\$\\{theme\\.${token}\\}`, 'g');
      transformed = transformed.replace(themeRegex, value);
      
      // Handle var(--token) patterns
      const varRegex = new RegExp(`var\\(--${token}\\)`, 'g');
      transformed = transformed.replace(varRegex, value);
    }
    
    return transformed;
  }

  /**
   * Step 5: Add vendor prefixes
   */
  private addVendorPrefixes(css: string): string {
    const prefixMap: Record<string, string[]> = {
      'transform': ['-webkit-transform', '-moz-transform', '-ms-transform'],
      'transition': ['-webkit-transition', '-moz-transition', '-ms-transition'],
      'animation': ['-webkit-animation', '-moz-animation', '-ms-animation'],
      'border-radius': ['-webkit-border-radius', '-moz-border-radius'],
      'box-shadow': ['-webkit-box-shadow', '-moz-box-shadow'],
      'user-select': ['-webkit-user-select', '-moz-user-select', '-ms-user-select'],
    };

    let transformed = css;
    
    for (const [property, prefixes] of Object.entries(prefixMap)) {
      const regex = new RegExp(`(\\s|^)${property}\\s*:`, 'g');
      transformed = transformed.replace(regex, (match) => {
        const prefixedProps = prefixes.map(prefix => match.replace(property, prefix)).join('\n  ');
        return prefixedProps + '\n  ' + match;
      });
    }
    
    return transformed;
  }

  /**
   * Transform style object
   */
  private transformStyleObject(styleObj: object): object {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(styleObj)) {
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects (selectors, media queries)
        if (key.startsWith('&') || key.startsWith('@media')) {
          transformed[key] = this.transformStyleObject(value);
        } else {
          transformed[key] = value;
        }
      } else if (typeof value === 'string') {
        // Process string values for variables and tokens
        transformed[key] = this.config.resolveVariables ? 
          this.resolveVariables(value) : value;
      } else {
        transformed[key] = value;
      }
    }
    
    return transformed;
  }

  /**
   * Create object properties from transformed styles
   */
  private createObjectProperties(styleObj: object): ts.ObjectLiteralElementLike[] {
    const properties: ts.ObjectLiteralElementLike[] = [];
    
    for (const [key, value] of Object.entries(styleObj)) {
      const propertyName = ts.factory.createStringLiteral(key);
      let propertyValue: ts.Expression;
      
      if (typeof value === 'string') {
        propertyValue = ts.factory.createStringLiteral(value);
      } else if (typeof value === 'number') {
        propertyValue = ts.factory.createNumericLiteral(value);
      } else if (typeof value === 'object') {
        propertyValue = ts.factory.createObjectLiteralExpression(
          this.createObjectProperties(value)
        );
      } else {
        propertyValue = ts.factory.createStringLiteral(String(value));
      }
      
      properties.push(ts.factory.createPropertyAssignment(propertyName, propertyValue));
    }
    
    return properties;
  }

  /**
   * Check if a string is a CSS property
   */
  private isCssProperty(prop: string): boolean {
    const cssProperties = [
      'color', 'background', 'margin', 'padding', 'border', 'font',
      'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom',
      'flex', 'grid', 'transform', 'transition', 'animation', 'opacity',
      'z-index', 'overflow', 'text-align', 'line-height', 'letter-spacing'
    ];
    
    return cssProperties.some(cssProp => 
      prop === cssProp || 
      prop.startsWith(cssProp + '-') ||
      prop.startsWith('&') ||
      prop.startsWith('@media')
    );
  }
}