/**
 * AST to Code Converter
 * Converts TypeScript AST nodes back to source code
 */

import * as ts from 'typescript';
import {
  CodeGeneratorOptions,
  CodeGenerationResult,
  GenerationMetadata,
  IASTToCodeConverter,
  OutputFormat,
} from './types';

export class ASTToCodeConverter implements IASTToCodeConverter {
  private printer: ts.Printer;
  private defaultOptions: CodeGeneratorOptions = {
    format: OutputFormat.TypeScript,
    preserveComments: true,
    sourceMaps: false,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
  };

  constructor(private options?: Partial<CodeGeneratorOptions>) {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Create printer with custom options
    this.printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: !mergedOptions.preserveComments,
      omitTrailingSemicolon: false,
      ...mergedOptions.printOptions,
    });
  }

  /**
   * Convert AST to code string
   */
  convert(
    sourceFile: ts.SourceFile,
    options?: CodeGeneratorOptions
  ): CodeGenerationResult {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...this.options, ...options };
    
    // Create a new source file if we need to change the output format
    const outputSourceFile = this.prepareSourceFile(sourceFile, mergedOptions);
    
    // Generate the code
    const code = this.printer.printFile(outputSourceFile);
    
    // Apply format-specific transformations
    const formattedCode = this.applyFormatTransformations(code, mergedOptions);
    
    // Generate source map if requested
    const sourceMap = mergedOptions.sourceMaps
      ? this.generateSourceMap(sourceFile, outputSourceFile)
      : undefined;
    
    // Determine output file path
    const filePath = this.determineOutputPath(sourceFile.fileName, mergedOptions);
    
    // Collect diagnostics
    const diagnostics = this.collectDiagnostics(outputSourceFile);
    
    // Create metadata
    const metadata: GenerationMetadata = {
      timestamp: new Date(),
      version: '1.0.0',
      sourceFile: sourceFile.fileName,
      nodeCount: this.countNodes(sourceFile),
      duration: Date.now() - startTime,
      format: mergedOptions.format,
    };
    
    return {
      code: formattedCode,
      sourceMap,
      filePath,
      diagnostics,
      metadata,
    };
  }

  /**
   * Convert single AST node to code
   */
  convertNode(
    node: ts.Node,
    options?: CodeGeneratorOptions
  ): string {
    const mergedOptions = { ...this.defaultOptions, ...this.options, ...options };
    
    // For single nodes, we need to consider the context
    const sourceFile = this.getSourceFile(node);
    
    // Print the node
    let code = this.printer.printNode(
      ts.EmitHint.Unspecified,
      node,
      sourceFile
    );
    
    // Apply format-specific transformations
    code = this.applyFormatTransformations(code, mergedOptions);
    
    return code;
  }

  /**
   * Batch convert multiple source files
   */
  convertBatch(
    sourceFiles: ts.SourceFile[],
    options?: CodeGeneratorOptions
  ): CodeGenerationResult[] {
    return sourceFiles.map(sourceFile => this.convert(sourceFile, options));
  }

  /**
   * Prepare source file for the target output format
   */
  private prepareSourceFile(
    sourceFile: ts.SourceFile,
    options: CodeGeneratorOptions
  ): ts.SourceFile {
    // If converting TypeScript to JavaScript, we need to strip types
    if (this.shouldStripTypes(sourceFile.fileName, options.format)) {
      return this.stripTypes(sourceFile, options);
    }
    
    // If converting module formats, transform the imports/exports
    if (this.shouldTransformModules(options)) {
      return this.transformModules(sourceFile, options);
    }
    
    return sourceFile;
  }

  /**
   * Apply format-specific transformations to the generated code
   */
  private applyFormatTransformations(
    code: string,
    options: CodeGeneratorOptions
  ): string {
    let result = code;
    
    // Handle JSX/TSX specific transformations
    if (options.format === OutputFormat.JSX || options.format === OutputFormat.TSX) {
      result = this.ensureJSXPragma(result, options);
    }
    
    // Handle module format transformations
    if (options.format === OutputFormat.CommonJS) {
      result = this.transformToCommonJS(result);
    } else if (options.format === OutputFormat.ESModule) {
      result = this.ensureESModules(result);
    }
    
    return result;
  }

  /**
   * Strip TypeScript types from the AST
   */
  private stripTypes(
    sourceFile: ts.SourceFile,
    options: CodeGeneratorOptions
  ): ts.SourceFile {
    const transformer = (context: ts.TransformationContext) => {
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
        
        // Strip type parameters from functions and classes
        if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
          return this.stripTypeParameters(node);
        }
        
        // Strip type assertions
        if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
          return node.expression;
        }
        
        return ts.visitEachChild(node, visit, context);
      };
      
      return (node: ts.SourceFile) => ts.visitNode(node, visit);
    };
    
    const result = ts.transform(sourceFile, [transformer], {
      target: options.target || ts.ScriptTarget.ES2020,
      module: options.module || ts.ModuleKind.ESNext,
    });
    
    return result.transformed[0] as ts.SourceFile;
  }

  /**
   * Transform module imports/exports
   */
  private transformModules(
    sourceFile: ts.SourceFile,
    options: CodeGeneratorOptions
  ): ts.SourceFile {
    if (options.module === ts.ModuleKind.CommonJS) {
      return this.transformToCommonJSAST(sourceFile);
    }
    
    return sourceFile;
  }

  /**
   * Transform to CommonJS AST
   */
  private transformToCommonJSAST(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer = (context: ts.TransformationContext) => {
      const visit: ts.Visitor = (node) => {
        // Transform import declarations to require
        if (ts.isImportDeclaration(node)) {
          return this.createRequireStatement(node);
        }
        
        // Transform export declarations
        if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
          return this.createModuleExports(node);
        }
        
        return ts.visitEachChild(node, visit, context);
      };
      
      return (node: ts.SourceFile) => ts.visitNode(node, visit);
    };
    
    const result = ts.transform(sourceFile, [transformer]);
    return result.transformed[0] as ts.SourceFile;
  }

  /**
   * Create require statement from import
   */
  private createRequireStatement(node: ts.ImportDeclaration): ts.Statement | undefined {
    const moduleSpecifier = node.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) return undefined;
    
    // Handle different import types
    if (node.importClause) {
      const { name, namedBindings } = node.importClause;
      
      // Default import: import foo from 'module' -> const foo = require('module')
      if (name) {
        return ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [ts.factory.createVariableDeclaration(
              name,
              undefined,
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createIdentifier('require'),
                undefined,
                [moduleSpecifier]
              )
            )],
            ts.NodeFlags.Const
          )
        );
      }
      
      // Named imports: import { foo, bar } from 'module'
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        const destructuring = ts.factory.createObjectBindingPattern(
          namedBindings.elements.map(element =>
            ts.factory.createBindingElement(
              undefined,
              element.propertyName,
              element.name,
              undefined
            )
          )
        );
        
        return ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [ts.factory.createVariableDeclaration(
              destructuring,
              undefined,
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createIdentifier('require'),
                undefined,
                [moduleSpecifier]
              )
            )],
            ts.NodeFlags.Const
          )
        );
      }
    }
    
    return undefined;
  }

  /**
   * Create module.exports statement
   */
  private createModuleExports(
    node: ts.ExportDeclaration | ts.ExportAssignment
  ): ts.Statement {
    if (ts.isExportAssignment(node)) {
      // export default foo -> module.exports = foo
      return ts.factory.createExpressionStatement(
        ts.factory.createBinaryExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('module'),
            'exports'
          ),
          ts.SyntaxKind.EqualsToken,
          node.expression
        )
      );
    }
    
    // Handle named exports
    return node; // Keep as-is for now
  }

  /**
   * Strip type parameters from a node
   */
  private stripTypeParameters<T extends ts.Node>(node: T): T {
    if (ts.isFunctionDeclaration(node)) {
      return ts.factory.updateFunctionDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.asteriskToken,
        node.name,
        undefined, // Remove type parameters
        node.parameters.map(p => this.stripParameterTypes(p)),
        undefined, // Remove return type
        node.body
      ) as any;
    }
    
    return node;
  }

  /**
   * Strip types from parameters
   */
  private stripParameterTypes(param: ts.ParameterDeclaration): ts.ParameterDeclaration {
    return ts.factory.updateParameterDeclaration(
      param,
      param.decorators,
      param.modifiers,
      param.dotDotDotToken,
      param.name,
      param.questionToken,
      undefined, // Remove type
      param.initializer
    );
  }

  /**
   * Check if we should strip types based on format
   */
  private shouldStripTypes(fileName: string, format: OutputFormat): boolean {
    const isTypeScript = fileName.endsWith('.ts') || fileName.endsWith('.tsx');
    const isJavaScriptFormat = format === OutputFormat.JavaScript || 
                               format === OutputFormat.JSX ||
                               format === OutputFormat.CommonJS ||
                               format === OutputFormat.ESModule;
    
    return isTypeScript && isJavaScriptFormat;
  }

  /**
   * Check if we should transform modules
   */
  private shouldTransformModules(options: CodeGeneratorOptions): boolean {
    return options.module === ts.ModuleKind.CommonJS ||
           options.format === OutputFormat.CommonJS;
  }

  /**
   * Ensure JSX pragma is present if needed
   */
  private ensureJSXPragma(code: string, options: CodeGeneratorOptions): string {
    // Check if pragma already exists
    if (code.includes('/** @jsx') || code.includes('/* @jsx')) {
      return code;
    }
    
    // Add default React pragma if using JSX
    if (options.format === OutputFormat.JSX || options.format === OutputFormat.TSX) {
      return `/** @jsx React.createElement */\n${code}`;
    }
    
    return code;
  }

  /**
   * Transform code to CommonJS format
   */
  private transformToCommonJS(code: string): string {
    // This is a simplified transformation - in practice, you'd want
    // to use a proper AST transformation
    let result = code;
    
    // Transform export default
    result = result.replace(/export default\s+/g, 'module.exports = ');
    
    // Transform named exports
    result = result.replace(/export\s+{([^}]+)}/g, (match, exports) => {
      const exportList = exports.split(',').map((e: string) => e.trim());
      return exportList.map((e: string) => `exports.${e} = ${e};`).join('\n');
    });
    
    // Transform imports
    result = result.replace(
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      "const $1 = require('$2')"
    );
    
    result = result.replace(
      /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
      "const {$1} = require('$2')"
    );
    
    return result;
  }

  /**
   * Ensure ES modules format
   */
  private ensureESModules(code: string): string {
    // Add .js extension to relative imports if missing
    return code.replace(
      /from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g,
      "from '$1.js'"
    );
  }

  /**
   * Generate source map
   */
  private generateSourceMap(
    sourceFile: ts.SourceFile,
    outputFile: ts.SourceFile
  ): string {
    // This is a placeholder - real implementation would use source-map library
    return JSON.stringify({
      version: 3,
      file: outputFile.fileName,
      sourceRoot: '',
      sources: [sourceFile.fileName],
      names: [],
      mappings: '',
    });
  }

  /**
   * Determine output file path based on format
   */
  private determineOutputPath(
    originalPath: string,
    options: CodeGeneratorOptions
  ): string {
    const extensionMap: Record<OutputFormat, string> = {
      [OutputFormat.TypeScript]: '.ts',
      [OutputFormat.JavaScript]: '.js',
      [OutputFormat.JSX]: '.jsx',
      [OutputFormat.TSX]: '.tsx',
      [OutputFormat.ESModule]: '.mjs',
      [OutputFormat.CommonJS]: '.cjs',
    };
    
    const extension = extensionMap[options.format];
    return originalPath.replace(/\.[^.]+$/, extension);
  }

  /**
   * Collect diagnostics from the source file
   */
  private collectDiagnostics(sourceFile: ts.SourceFile): ts.Diagnostic[] {
    // In a real implementation, this would collect actual diagnostics
    // from the TypeScript compiler
    return [];
  }

  /**
   * Count nodes in the AST
   */
  private countNodes(node: ts.Node): number {
    let count = 1;
    
    ts.forEachChild(node, child => {
      count += this.countNodes(child);
    });
    
    return count;
  }

  /**
   * Get source file from a node
   */
  private getSourceFile(node: ts.Node): ts.SourceFile {
    while (node && !ts.isSourceFile(node)) {
      node = node.parent;
    }
    
    return node as ts.SourceFile;
  }
}