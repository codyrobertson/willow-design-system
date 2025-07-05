import * as ts from 'typescript';
import type { ComponentInfo, ComponentType } from '@willow-cli/types';
import type { ParserContext, ComponentPattern } from './types';

export class ComponentDetector {
  private patterns: ComponentPattern[];
  
  constructor(customPatterns?: RegExp[]) {
    this.patterns = this.createDefaultPatterns();
    
    // Add custom patterns if provided
    if (customPatterns) {
      customPatterns.forEach((regex, index) => {
        this.patterns.push({
          name: `custom-${index}`,
          detect: (node) => {
            const name = this.getNodeName(node);
            return name ? regex.test(name) : false;
          },
          extract: (node, context) => ({
            name: this.getNodeName(node) || 'Unknown',
            type: 'functional',
          }),
        });
      });
    }
  }
  
  /**
   * Detect components in source file
   */
  detect(sourceFile: ts.SourceFile, context: ParserContext): ComponentInfo[] {
    const components: ComponentInfo[] = [];
    const detectedNames = new Set<string>();
    
    const visit = (node: ts.Node) => {
      for (const pattern of this.patterns) {
        if (pattern.detect(node, context)) {
          const info = this.extractComponentInfo(node, pattern, context);
          if (info && !detectedNames.has(info.name)) {
            detectedNames.add(info.name);
            components.push(info);
          }
          break; // Only match first pattern
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return components;
  }
  
  /**
   * Create default component detection patterns
   */
  private createDefaultPatterns(): ComponentPattern[] {
    return [
      // Function components with JSX return
      {
        name: 'function-component-jsx',
        detect: (node, context) => {
          if (!ts.isFunctionDeclaration(node) && !ts.isArrowFunction(node)) {
            return false;
          }
          
          const name = this.getNodeName(node);
          if (!name || !this.isComponentName(name)) {
            return false;
          }
          
          return this.returnsJSX(node, context);
        },
        extract: (node, context) => {
          const name = this.getNodeName(node) || 'Unknown';
          const props = this.extractProps(node, context);
          
          return {
            name,
            type: 'functional',
            props,
            location: this.getLocation(node, context.sourceFile),
          };
        },
      },
      
      // Arrow function components
      {
        name: 'arrow-component',
        detect: (node, context) => {
          if (!ts.isVariableStatement(node)) {
            return false;
          }
          
          const declaration = node.declarationList.declarations[0];
          if (!declaration || !ts.isIdentifier(declaration.name)) {
            return false;
          }
          
          const name = declaration.name.text;
          if (!this.isComponentName(name)) {
            return false;
          }
          
          const initializer = declaration.initializer;
          if (!initializer || !ts.isArrowFunction(initializer)) {
            return false;
          }
          
          return this.returnsJSX(initializer, context);
        },
        extract: (node, context) => {
          const declaration = (node as ts.VariableStatement).declarationList.declarations[0];
          const name = (declaration.name as ts.Identifier).text;
          const arrow = declaration.initializer as ts.ArrowFunction;
          const props = this.extractProps(arrow, context);
          
          return {
            name,
            type: 'functional',
            props,
            location: this.getLocation(node, context.sourceFile),
          };
        },
      },
      
      // Class components
      {
        name: 'class-component',
        detect: (node, context) => {
          if (!ts.isClassDeclaration(node)) {
            return false;
          }
          
          const name = node.name?.text;
          if (!name || !this.isComponentName(name)) {
            return false;
          }
          
          return this.extendsReactComponent(node, context);
        },
        extract: (node, context) => {
          const classNode = node as ts.ClassDeclaration;
          const name = classNode.name?.text || 'Unknown';
          const props = this.extractClassProps(classNode, context);
          
          return {
            name,
            type: 'class',
            props,
            location: this.getLocation(node, context.sourceFile),
          };
        },
      },
      
      // React.memo wrapped components
      {
        name: 'memo-component',
        detect: (node, context) => {
          if (!ts.isVariableStatement(node)) {
            return false;
          }
          
          const declaration = node.declarationList.declarations[0];
          if (!declaration || !ts.isIdentifier(declaration.name)) {
            return false;
          }
          
          const name = declaration.name.text;
          if (!this.isComponentName(name)) {
            return false;
          }
          
          const initializer = declaration.initializer;
          if (!initializer || !ts.isCallExpression(initializer)) {
            return false;
          }
          
          return this.isReactMemo(initializer, context);
        },
        extract: (node, context) => {
          const declaration = (node as ts.VariableStatement).declarationList.declarations[0];
          const name = (declaration.name as ts.Identifier).text;
          const callExpr = declaration.initializer as ts.CallExpression;
          const props = this.extractMemoProps(callExpr, context);
          
          return {
            name,
            type: 'functional',
            props,
            location: this.getLocation(node, context.sourceFile),
            memo: true,
          };
        },
      },
      
      // React.forwardRef wrapped components
      {
        name: 'forwardref-component',
        detect: (node, context) => {
          if (!ts.isVariableStatement(node)) {
            return false;
          }
          
          const declaration = node.declarationList.declarations[0];
          if (!declaration || !ts.isIdentifier(declaration.name)) {
            return false;
          }
          
          const name = declaration.name.text;
          if (!this.isComponentName(name)) {
            return false;
          }
          
          const initializer = declaration.initializer;
          if (!initializer || !ts.isCallExpression(initializer)) {
            return false;
          }
          
          return this.isReactForwardRef(initializer, context);
        },
        extract: (node, context) => {
          const declaration = (node as ts.VariableStatement).declarationList.declarations[0];
          const name = (declaration.name as ts.Identifier).text;
          const callExpr = declaration.initializer as ts.CallExpression;
          const props = this.extractForwardRefProps(callExpr, context);
          
          return {
            name,
            type: 'functional',
            props,
            location: this.getLocation(node, context.sourceFile),
            forwardRef: true,
          };
        },
      },
    ];
  }
  
  /**
   * Check if name follows component naming convention
   */
  private isComponentName(name: string): boolean {
    return /^[A-Z]/.test(name);
  }
  
  /**
   * Check if function returns JSX
   */
  private returnsJSX(node: ts.FunctionDeclaration | ts.ArrowFunction, context: ParserContext): boolean {
    let hasJSX = false;
    
    const visit = (n: ts.Node) => {
      if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
        hasJSX = true;
        return;
      }
      
      // Check return statements
      if (ts.isReturnStatement(n) && n.expression) {
        if (ts.isJsxElement(n.expression) || 
            ts.isJsxSelfClosingElement(n.expression) || 
            ts.isJsxFragment(n.expression)) {
          hasJSX = true;
          return;
        }
      }
      
      if (!hasJSX) {
        ts.forEachChild(n, visit);
      }
    };
    
    if (node.body) {
      visit(node.body);
    }
    
    return hasJSX;
  }
  
  /**
   * Check if class extends React.Component
   */
  private extendsReactComponent(node: ts.ClassDeclaration, context: ParserContext): boolean {
    if (!node.heritageClauses) {
      return false;
    }
    
    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        for (const type of clause.types) {
          const typeName = type.expression.getText();
          if (typeName === 'Component' || 
              typeName === 'React.Component' || 
              typeName === 'PureComponent' ||
              typeName === 'React.PureComponent') {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if call expression is React.memo
   */
  private isReactMemo(node: ts.CallExpression, context: ParserContext): boolean {
    const callee = node.expression.getText();
    return callee === 'memo' || callee === 'React.memo';
  }
  
  /**
   * Check if call expression is React.forwardRef
   */
  private isReactForwardRef(node: ts.CallExpression, context: ParserContext): boolean {
    const callee = node.expression.getText();
    return callee === 'forwardRef' || callee === 'React.forwardRef';
  }
  
  /**
   * Extract component info
   */
  private extractComponentInfo(
    node: ts.Node, 
    pattern: ComponentPattern, 
    context: ParserContext
  ): ComponentInfo | null {
    try {
      const baseInfo = pattern.extract(node, context);
      if (!baseInfo.name) {
        return null;
      }
      
      return {
        name: baseInfo.name,
        type: baseInfo.type || 'functional',
        props: baseInfo.props || [],
        location: baseInfo.location || this.getLocation(node, context.sourceFile),
        exported: this.isExported(node),
        ...baseInfo,
      };
    } catch (error) {
      context.errors.push({
        message: `Failed to extract component info: ${error}`,
        severity: 'warning',
        location: this.getLocation(node, context.sourceFile),
      });
      return null;
    }
  }
  
  /**
   * Extract props from function component
   */
  private extractProps(
    node: ts.FunctionDeclaration | ts.ArrowFunction, 
    context: ParserContext
  ): ComponentInfo['props'] {
    const props: ComponentInfo['props'] = [];
    
    if (node.parameters.length > 0) {
      const param = node.parameters[0];
      
      // Props parameter with type annotation
      if (param.type && ts.isTypeReferenceNode(param.type)) {
        const typeName = param.type.typeName.getText();
        props.push({
          name: 'props',
          type: typeName,
          required: !param.questionToken,
        });
      }
      
      // Destructured props
      else if (param.name && ts.isObjectBindingPattern(param.name)) {
        param.name.elements.forEach(element => {
          if (ts.isBindingElement(element) && element.name && ts.isIdentifier(element.name)) {
            props.push({
              name: element.name.text,
              required: !element.dotDotDotToken && !element.initializer,
              defaultValue: element.initializer?.getText(),
            });
          }
        });
      }
    }
    
    return props;
  }
  
  /**
   * Extract props from class component
   */
  private extractClassProps(node: ts.ClassDeclaration, context: ParserContext): ComponentInfo['props'] {
    const props: ComponentInfo['props'] = [];
    
    // Check heritage clauses for props type
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          for (const type of clause.types) {
            if (type.typeArguments && type.typeArguments.length > 0) {
              const propsType = type.typeArguments[0];
              if (ts.isTypeReferenceNode(propsType)) {
                props.push({
                  name: 'props',
                  type: propsType.typeName.getText(),
                  required: true,
                });
              }
            }
          }
        }
      }
    }
    
    return props;
  }
  
  /**
   * Extract props from memo component
   */
  private extractMemoProps(node: ts.CallExpression, context: ParserContext): ComponentInfo['props'] {
    if (node.arguments.length > 0) {
      const component = node.arguments[0];
      if (ts.isArrowFunction(component) || ts.isFunctionExpression(component)) {
        return this.extractProps(component as ts.ArrowFunction, context);
      }
    }
    return [];
  }
  
  /**
   * Extract props from forwardRef component
   */
  private extractForwardRefProps(node: ts.CallExpression, context: ParserContext): ComponentInfo['props'] {
    if (node.arguments.length > 0) {
      const component = node.arguments[0];
      if (ts.isArrowFunction(component) || ts.isFunctionExpression(component)) {
        return this.extractProps(component as ts.ArrowFunction, context);
      }
    }
    return [];
  }
  
  /**
   * Check if node is exported
   */
  private isExported(node: ts.Node): boolean {
    return node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
  }
  
  /**
   * Get node name
   */
  private getNodeName(node: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
      return node.name?.text;
    }
    
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration && ts.isIdentifier(declaration.name)) {
        return declaration.name.text;
      }
    }
    
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
      }
    }
    
    return undefined;
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
}