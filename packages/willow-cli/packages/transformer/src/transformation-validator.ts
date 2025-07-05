/**
 * Transformation Validator Implementation
 */

import * as ts from 'typescript';
import {
  TransformationValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  TransformContext,
} from './index';

/**
 * Default implementation of transformation validator
 */
export class DefaultTransformationValidator implements TransformationValidator {
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

    // Basic syntax validation
    this.validateSyntax(after, errors);
    
    // Type checking validation (if type checker available)
    if (context.typeChecker) {
      this.validateTypes(before, after, context, errors, warnings);
    }

    // Import/export validation
    this.validateImports(before, after, warnings);

    // Code structure validation
    this.validateStructure(before, after, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateSyntax(sourceFile: ts.SourceFile, errors: ValidationError[]): void {
    // Check for syntax errors in the parsed file
    const diagnostics = (sourceFile as any).parseDiagnostics || [];
    
    for (const diagnostic of diagnostics) {
      if (diagnostic.start !== undefined) {
        const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push({
          code: 'SYNTAX_ERROR',
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          severity: 'error',
          location: {
            line: position.line + 1,
            column: position.character + 1,
          },
        });
      }
    }
  }

  private validateTypes(
    before: ts.SourceFile,
    after: ts.SourceFile,
    context: TransformContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    try {
      // Get semantic diagnostics for type checking
      const beforeDiagnostics = context.typeChecker.getSemanticDiagnostics(before);
      const afterDiagnostics = context.typeChecker.getSemanticDiagnostics(after);

      // Check if new type errors were introduced
      const beforeErrorCount = beforeDiagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length;
      const afterErrorCount = afterDiagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length;

      if (afterErrorCount > beforeErrorCount) {
        warnings.push({
          code: 'TYPE_ERRORS_INTRODUCED',
          message: `Transformation introduced ${afterErrorCount - beforeErrorCount} new type errors`,
          location: { line: 1, column: 1 },
        });
      }

      // Report critical type errors
      for (const diagnostic of afterDiagnostics) {
        if (diagnostic.category === ts.DiagnosticCategory.Error && diagnostic.start !== undefined) {
          const position = after.getLineAndCharacterOfPosition(diagnostic.start);
          errors.push({
            code: 'TYPE_ERROR',
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            severity: 'error',
            location: {
              line: position.line + 1,
              column: position.character + 1,
            },
          });
        }
      }
    } catch (error) {
      // Type checking failed - record as warning
      warnings.push({
        code: 'TYPE_CHECK_FAILED',
        message: `Type checking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        location: { line: 1, column: 1 },
      });
    }
  }

  private validateImports(
    before: ts.SourceFile,
    after: ts.SourceFile,
    warnings: ValidationWarning[]
  ): void {
    const beforeImports = this.extractImports(before);
    const afterImports = this.extractImports(after);

    // Check for removed imports that might be needed
    for (const beforeImport of beforeImports) {
      const stillExists = afterImports.some(afterImport => 
        afterImport.moduleSpecifier === beforeImport.moduleSpecifier
      );
      
      if (!stillExists) {
        warnings.push({
          code: 'IMPORT_REMOVED',
          message: `Import from "${beforeImport.moduleSpecifier}" was removed`,
          location: { line: 1, column: 1 },
        });
      }
    }

    // Check for duplicate imports
    const moduleSpecifiers = afterImports.map(imp => imp.moduleSpecifier);
    const duplicates = moduleSpecifiers.filter((item, index) => moduleSpecifiers.indexOf(item) !== index);
    
    for (const duplicate of [...new Set(duplicates)]) {
      warnings.push({
        code: 'DUPLICATE_IMPORT',
        message: `Duplicate import from "${duplicate}"`,
        location: { line: 1, column: 1 },
      });
    }
  }

  private validateStructure(
    before: ts.SourceFile,
    after: ts.SourceFile,
    warnings: ValidationWarning[]
  ): void {
    // Check that major structural elements are preserved
    const beforeExports = this.countExports(before);
    const afterExports = this.countExports(after);

    if (beforeExports > afterExports) {
      warnings.push({
        code: 'EXPORTS_REDUCED',
        message: `Number of exports reduced from ${beforeExports} to ${afterExports}`,
        location: { line: 1, column: 1 },
      });
    }

    // Check for significant changes in file size
    const beforeSize = before.text.length;
    const afterSize = after.text.length;
    const sizeChange = Math.abs(afterSize - beforeSize) / beforeSize;

    if (sizeChange > 0.5) { // More than 50% change
      warnings.push({
        code: 'SIGNIFICANT_SIZE_CHANGE',
        message: `File size changed significantly: ${beforeSize} -> ${afterSize} bytes`,
        location: { line: 1, column: 1 },
      });
    }
  }

  private extractImports(sourceFile: ts.SourceFile): Array<{ moduleSpecifier: string }> {
    const imports: Array<{ moduleSpecifier: string }> = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push({ moduleSpecifier: node.moduleSpecifier.text });
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  private countExports(sourceFile: ts.SourceFile): number {
    let count = 0;

    const visit = (node: ts.Node) => {
      if (ts.isExportDeclaration(node) || ts.isExportAssignment(node) || 
          (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) ||
          (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) ||
          (ts.isClassDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword))) {
        count++;
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return count;
  }
}