import * as ts from 'typescript';
import type { ParserContext } from './types';

export class TypeStripper {
  /**
   * Strip TypeScript types from source code
   */
  stripTypes(sourceCode: string, filename: string): string {
    const isTypeScriptFile = filename.endsWith('.ts') || filename.endsWith('.tsx');
    const isFlowFile = this.hasFlowAnnotation(sourceCode);
    
    if (!isTypeScriptFile && !isFlowFile) {
      // Pure JavaScript, return as-is
      return sourceCode;
    }
    
    if (isFlowFile) {
      return this.stripFlowTypes(sourceCode);
    }
    
    return this.stripTypeScriptTypes(sourceCode, filename);
  }
  
  /**
   * Strip TypeScript types using compiler API
   */
  private stripTypeScriptTypes(sourceCode: string, filename: string): string {
    const sourceFile = ts.createSourceFile(
      filename,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    
    const transformer = this.createTypeStrippingTransformer();
    const result = ts.transform(sourceFile, [transformer]);
    const transformedSourceFile = result.transformed[0];
    
    // Print the transformed AST back to JavaScript
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });
    
    const output = printer.printFile(transformedSourceFile);
    result.dispose();
    
    return output;
  }
  
  /**
   * Create TypeScript transformer for type stripping
   */
  private createTypeStrippingTransformer(): ts.TransformerFactory<ts.SourceFile> {
    return (context) => {
      const visit: ts.Visitor = (node) => {
        // Remove type annotations
        if (ts.isTypeNode(node)) {
          return undefined;
        }
        
        // Remove interface declarations
        if (ts.isInterfaceDeclaration(node)) {
          return undefined;
        }
        
        // Remove type alias declarations
        if (ts.isTypeAliasDeclaration(node)) {
          return undefined;
        }
        
        // Remove type-only imports/exports
        if (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) {
          return undefined;
        }
        
        if (ts.isExportDeclaration(node) && node.isTypeOnly) {
          return undefined;
        }
        
        // Strip type parameters from functions/classes
        if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
          return ts.visitEachChild(node, (child) => {
            if (ts.isTypeParameterDeclaration(child)) {
              return undefined;
            }
            return visit(child);
          }, context);
        }
        
        // Strip type annotations from parameters
        if (ts.isParameter(node) && node.type) {
          return ts.factory.updateParameterDeclaration(
            node,
            node.modifiers,
            node.dotDotDotToken,
            node.name,
            node.questionToken,
            undefined, // Remove type annotation
            node.initializer
          );
        }
        
        // Strip type annotations from variable declarations
        if (ts.isVariableDeclaration(node) && node.type) {
          return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            undefined, // Remove type annotation
            node.initializer
          );
        }
        
        // Strip return type annotations
        if ((ts.isFunctionDeclaration(node) || 
             ts.isMethodDeclaration(node) || 
             ts.isArrowFunction(node) || 
             ts.isFunctionExpression(node)) && node.type) {
          if (ts.isFunctionDeclaration(node)) {
            return ts.factory.updateFunctionDeclaration(
              node,
              node.modifiers,
              node.asteriskToken,
              node.name,
              node.typeParameters,
              node.parameters,
              undefined, // Remove return type
              node.body
            );
          }
          // Similar updates for other function types...
        }
        
        // Remove type assertions
        if (ts.isAsExpression(node)) {
          return node.expression;
        }
        
        if (ts.isTypeAssertionExpression(node)) {
          return node.expression;
        }
        
        // Remove non-null assertions
        if (ts.isNonNullExpression(node)) {
          return node.expression;
        }
        
        return ts.visitEachChild(node, visit, context);
      };
      
      return (sourceFile) => ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };
  }
  
  /**
   * Check if source has Flow annotations
   */
  private hasFlowAnnotation(sourceCode: string): boolean {
    // Check for @flow pragma
    const flowPragmaRegex = /^\s*\/\/\s*@flow|^\s*\/\*\s*@flow\s*\*\//m;
    return flowPragmaRegex.test(sourceCode);
  }
  
  /**
   * Strip Flow types (basic implementation)
   */
  private stripFlowTypes(sourceCode: string): string {
    // Remove @flow pragma
    let stripped = sourceCode.replace(/^\s*\/\/\s*@flow.*$/m, '');
    stripped = stripped.replace(/^\s*\/\*\s*@flow\s*\*\/.*$/m, '');
    
    // Remove type imports
    stripped = stripped.replace(/import\s+type\s+{[^}]+}\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '');
    
    // Remove type annotations (simplified)
    // Function parameters: (param: Type) => (param)
    stripped = stripped.replace(/(\w+)\s*:\s*[\w<>\[\]|&\s]+(?=[,)])/g, '$1');
    
    // Variable declarations: const x: Type = => const x =
    stripped = stripped.replace(/(\w+)\s*:\s*[\w<>\[\]|&\s]+\s*=/g, '$1 =');
    
    // Return type annotations: ): Type => { => ) => {
    stripped = stripped.replace(/\)\s*:\s*[\w<>\[\]|&\s]+\s*(=>|\{)/g, ') $1');
    
    // Type aliases: type Foo = Type;
    stripped = stripped.replace(/^\s*type\s+\w+\s*=\s*[\w<>\[\]|&\s]+\s*;?\s*$/gm, '');
    
    // Interfaces (basic)
    stripped = stripped.replace(/^\s*interface\s+\w+\s*{[^}]+}\s*$/gm, '');
    
    // Generic type parameters: <T>
    stripped = stripped.replace(/<[\w\s,]+>/g, '');
    
    return stripped;
  }
  
  /**
   * Get JavaScript equivalent for TypeScript file
   */
  getJavaScriptFilename(filename: string): string {
    if (filename.endsWith('.ts')) {
      return filename.replace(/\.ts$/, '.js');
    }
    if (filename.endsWith('.tsx')) {
      return filename.replace(/\.tsx$/, '.jsx');
    }
    return filename;
  }
  
  /**
   * Check if file needs type stripping
   */
  needsTypeStripping(filename: string, content?: string): boolean {
    // TypeScript files always need stripping
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      return true;
    }
    
    // Check JavaScript files for Flow annotations
    if (content && (filename.endsWith('.js') || filename.endsWith('.jsx'))) {
      return this.hasFlowAnnotation(content);
    }
    
    return false;
  }
  
  /**
   * Strip types with source map support
   */
  stripTypesWithSourceMap(
    sourceCode: string, 
    filename: string
  ): { code: string; sourceMap?: string } {
    const isTypeScriptFile = filename.endsWith('.ts') || filename.endsWith('.tsx');
    
    if (!isTypeScriptFile) {
      return { code: sourceCode };
    }
    
    const sourceFile = ts.createSourceFile(
      filename,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    
    const transformer = this.createTypeStrippingTransformer();
    const result = ts.transform(sourceFile, [transformer]);
    const transformedSourceFile = result.transformed[0];
    
    // Create printer with source map support
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });
    
    // Generate source map
    const sourceMapGenerator = ts.createSourceMapGenerator(
      filename,
      this.getJavaScriptFilename(filename),
      sourceCode,
      true
    );
    
    const output = printer.printFile(
      transformedSourceFile,
      sourceMapGenerator.writeFile
    );
    
    result.dispose();
    
    return {
      code: output,
      sourceMap: sourceMapGenerator.toString(),
    };
  }
  
  /**
   * Extract type information before stripping
   */
  extractTypeInfo(sourceCode: string, filename: string): TypeInfo[] {
    const typeInfo: TypeInfo[] = [];
    const sourceFile = ts.createSourceFile(
      filename,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    
    const visit = (node: ts.Node) => {
      // Extract interface info
      if (ts.isInterfaceDeclaration(node)) {
        typeInfo.push({
          kind: 'interface',
          name: node.name.text,
          location: this.getLocation(node, sourceFile),
          text: node.getText(),
        });
      }
      
      // Extract type alias info
      if (ts.isTypeAliasDeclaration(node)) {
        typeInfo.push({
          kind: 'type',
          name: node.name.text,
          location: this.getLocation(node, sourceFile),
          text: node.getText(),
        });
      }
      
      // Extract parameter types
      if (ts.isParameter(node) && node.type) {
        const name = ts.isIdentifier(node.name) ? node.name.text : 'unknown';
        typeInfo.push({
          kind: 'parameter',
          name,
          location: this.getLocation(node.type, sourceFile),
          text: node.type.getText(),
        });
      }
      
      // Extract return types
      if ((ts.isFunctionDeclaration(node) || 
           ts.isMethodDeclaration(node) || 
           ts.isArrowFunction(node)) && node.type) {
        const name = node.name ? node.name.getText() : 'anonymous';
        typeInfo.push({
          kind: 'return',
          name,
          location: this.getLocation(node.type, sourceFile),
          text: node.type.getText(),
        });
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return typeInfo;
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

interface TypeInfo {
  kind: 'interface' | 'type' | 'parameter' | 'return' | 'generic';
  name: string;
  location: import('@willow-cli/types').SourceLocation;
  text: string;
}