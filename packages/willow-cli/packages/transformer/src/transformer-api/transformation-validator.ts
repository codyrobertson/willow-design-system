/**
 * Validator for transformation results
 */

import * as ts from 'typescript';
import {
  TransformationValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  TransformContext,
  SourceLocation,
} from './index';

/**
 * Base class for transformation validators
 */
export abstract class BaseTransformationValidator
  implements TransformationValidator
{
  /**
   * Validate transformation results
   */
  validate(
    before: ts.SourceFile,
    after: ts.SourceFile,
    context: TransformContext
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Run validation checks
    this.validateSyntax(after, errors, warnings);
    this.validateSemantics(before, after, context, errors, warnings);
    this.validatePreservation(before, after, errors, warnings);
    this.validateCustomRules(before, after, context, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate syntax of transformed file
   */
  protected validateSyntax(
    file: ts.SourceFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for syntax errors
    const diagnostics = file['parseDiagnostics'] as ts.Diagnostic[] || [];
    
    for (const diagnostic of diagnostics) {
      const location = this.getDiagnosticLocation(diagnostic, file);
      
      errors.push({
        code: 'SYNTAX_ERROR',
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        severity: 'error',
        location,
      });
    }
  }

  /**
   * Validate semantic correctness
   */
  protected abstract validateSemantics(
    before: ts.SourceFile,
    after: ts.SourceFile,
    context: TransformContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void;

  /**
   * Validate that important code is preserved
   */
  protected abstract validatePreservation(
    before: ts.SourceFile,
    after: ts.SourceFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void;

  /**
   * Validate custom rules
   */
  protected validateCustomRules(
    before: ts.SourceFile,
    after: ts.SourceFile,
    context: TransformContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Override in subclasses to add custom validation
  }

  /**
   * Get location from diagnostic
   */
  protected getDiagnosticLocation(
    diagnostic: ts.Diagnostic,
    file: ts.SourceFile
  ): SourceLocation | undefined {
    if (diagnostic.start !== undefined) {
      const { line, character } = file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      return {
        line: line + 1,
        column: character + 1,
      };
    }
    return undefined;
  }

  /**
   * Get location from node
   */
  protected getNodeLocation(node: ts.Node): SourceLocation {
    const file = node.getSourceFile();
    const { line, character } = file.getLineAndCharacterOfPosition(
      node.getStart()
    );
    const { line: endLine, character: endColumn } =
      file.getLineAndCharacterOfPosition(node.getEnd());

    return {
      line: line + 1,
      column: character + 1,
      endLine: endLine + 1,
      endColumn: endColumn + 1,
    };
  }
}

/**
 * Import transformation validator
 */
export class ImportTransformationValidator extends BaseTransformationValidator {
  protected validateSemantics(
    before: ts.SourceFile,
    after: ts.SourceFile,
    context: TransformContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate that all imports are valid
    const afterImports = this.collectImports(after);
    
    for (const importDecl of afterImports) {
      // Check if module specifier is valid
      const moduleSpecifier = importDecl.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const moduleName = moduleSpecifier.text;
        
        // Validate module exists or is valid
        if (!this.isValidModule(moduleName, context)) {
          warnings.push({
            code: 'INVALID_MODULE',
            message: `Module "${moduleName}" may not exist or be accessible`,
            location: this.getNodeLocation(moduleSpecifier),
          });
        }
      }
    }
  }

  protected validatePreservation(
    before: ts.SourceFile,
    after: ts.SourceFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Ensure no imports were accidentally removed
    const beforeImports = this.collectImportSpecifiers(before);
    const afterImports = this.collectImportSpecifiers(after);

    for (const [name, module] of beforeImports) {
      if (!afterImports.has(name)) {
        errors.push({
          code: 'MISSING_IMPORT',
          message: `Import "${name}" from "${module}" was removed`,
          severity: 'error',
        });
      }
    }
  }

  private collectImports(file: ts.SourceFile): ts.ImportDeclaration[] {
    const imports: ts.ImportDeclaration[] = [];
    
    ts.forEachChild(file, (node) => {
      if (ts.isImportDeclaration(node)) {
        imports.push(node);
      }
    });
    
    return imports;
  }

  private collectImportSpecifiers(
    file: ts.SourceFile
  ): Map<string, string> {
    const specifiers = new Map<string, string>();
    
    ts.forEachChild(file, (node) => {
      if (ts.isImportDeclaration(node) && node.importClause) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        
        // Default import
        if (node.importClause.name) {
          specifiers.set(node.importClause.name.text, moduleSpecifier);
        }
        
        // Named imports
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            for (const element of node.importClause.namedBindings.elements) {
              specifiers.set(element.name.text, moduleSpecifier);
            }
          }
          // Namespace import
          else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            specifiers.set(node.importClause.namedBindings.name.text, moduleSpecifier);
          }
        }
      }
    });
    
    return specifiers;
  }

  private isValidModule(moduleName: string, context: TransformContext): boolean {
    // Check if it's a relative import
    if (moduleName.startsWith('.')) {
      return true; // Assume relative imports are valid
    }
    
    // Check if it's a node module
    // In a real implementation, we would check node_modules
    return true;
  }
}

/**
 * Component transformation validator
 */
export class ComponentTransformationValidator extends BaseTransformationValidator {
  protected validateSemantics(
    before: ts.SourceFile,
    after: ts.SourceFile,
    context: TransformContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate JSX elements
    const afterJsxElements = this.collectJsxElements(after);
    
    for (const element of afterJsxElements) {
      // Validate component names
      const tagName = this.getJsxTagName(element);
      if (tagName && this.isComponent(tagName)) {
        // Check if component is imported
        if (!this.isComponentImported(tagName, after)) {
          errors.push({
            code: 'MISSING_COMPONENT_IMPORT',
            message: `Component "${tagName}" is used but not imported`,
            severity: 'error',
            location: this.getNodeLocation(element),
          });
        }
      }
    }
  }

  protected validatePreservation(
    before: ts.SourceFile,
    after: ts.SourceFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Ensure component structure is preserved
    const beforeComponents = this.collectComponentDeclarations(before);
    const afterComponents = this.collectComponentDeclarations(after);

    for (const componentName of beforeComponents) {
      if (!afterComponents.has(componentName)) {
        errors.push({
          code: 'MISSING_COMPONENT',
          message: `Component "${componentName}" was removed`,
          severity: 'error',
        });
      }
    }
  }

  private collectJsxElements(file: ts.SourceFile): ts.JsxElement[] {
    const elements: ts.JsxElement[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        elements.push(node as any);
      }
      ts.forEachChild(node, visit);
    };
    
    visit(file);
    return elements;
  }

  private getJsxTagName(element: ts.JsxElement | ts.JsxSelfClosingElement): string | undefined {
    if (ts.isJsxElement(element)) {
      return element.openingElement.tagName.getText();
    } else if (ts.isJsxSelfClosingElement(element)) {
      return element.tagName.getText();
    }
    return undefined;
  }

  private isComponent(tagName: string): boolean {
    // Components start with uppercase
    return /^[A-Z]/.test(tagName);
  }

  private isComponentImported(componentName: string, file: ts.SourceFile): boolean {
    let imported = false;
    
    ts.forEachChild(file, (node) => {
      if (ts.isImportDeclaration(node) && node.importClause) {
        // Check default import
        if (node.importClause.name?.text === componentName) {
          imported = true;
        }
        
        // Check named imports
        if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          for (const element of node.importClause.namedBindings.elements) {
            if (element.name.text === componentName) {
              imported = true;
            }
          }
        }
      }
    });
    
    return imported;
  }

  private collectComponentDeclarations(file: ts.SourceFile): Set<string> {
    const components = new Set<string>();
    
    ts.forEachChild(file, (node) => {
      // Function declarations
      if (ts.isFunctionDeclaration(node) && node.name) {
        if (this.isComponent(node.name.text)) {
          components.add(node.name.text);
        }
      }
      
      // Variable declarations (arrow functions)
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && this.isComponent(decl.name.text)) {
            components.add(decl.name.text);
          }
        }
      }
    });
    
    return components;
  }
}

/**
 * Factory for creating validators
 */
export class TransformationValidatorFactory {
  private static validators = new Map<string, () => TransformationValidator>([
    ['import', () => new ImportTransformationValidator()],
    ['component', () => new ComponentTransformationValidator()],
  ]);

  static createValidator(type: string): TransformationValidator {
    const factory = this.validators.get(type);
    if (!factory) {
      throw new Error(`Unknown validator type: ${type}`);
    }
    return factory();
  }

  static registerValidator(
    type: string,
    factory: () => TransformationValidator
  ): void {
    this.validators.set(type, factory);
  }
}