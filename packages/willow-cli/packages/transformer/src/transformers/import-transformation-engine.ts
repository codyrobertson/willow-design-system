import * as ts from 'typescript';
import type { TransformContext, ImportMappingConfig, SpecifierMapping } from '../types';
import { ImportTransformer, ImportDetails } from './import-transformer';
import { ImportParser } from './import-parser';
import { ImportPathResolver } from './import-path-resolver';

/**
 * Main import transformation engine
 */
export class ImportTransformationEngine extends ImportTransformer {
  private pathResolver: ImportPathResolver;
  private importGroups: Map<string, ImportDetails[]> = new Map();
  
  constructor(context: TransformContext, config: ImportMappingConfig) {
    super(context, config);
    this.pathResolver = new ImportPathResolver(config, context);
  }
  
  /**
   * Transform imports with merging and organization
   */
  transform(sourceFile: ts.SourceFile): ts.SourceFile {
    // First pass: collect and transform imports
    const firstPass = super.transform(sourceFile);
    
    // Second pass: merge and organize imports
    return this.mergeAndOrganizeImports(firstPass);
  }
  
  /**
   * Transform a single import declaration
   */
  protected transformImport(node: ts.ImportDeclaration): ts.ImportDeclaration | undefined {
    try {
      const details = ImportParser.parse(node);
      const originalSource = details.source;
      
      // Validate import path
      const validation = this.pathResolver.validatePath(originalSource);
      if (!validation.valid) {
        this.reportError(validation.reason || 'Invalid import path', details.location);
        return node;
      }
      
      // Resolve new import path
      const resolvedSource = this.pathResolver.resolve(originalSource);
      details.source = resolvedSource;
      
      // Transform import specifiers if needed
      if (details.namedImports && this.config.specifierMappings) {
        details.namedImports = this.transformSpecifiers(
          details.namedImports,
          originalSource,
          resolvedSource
        );
      }
      
      // Check if import should be removed
      if (this.shouldRemoveImport(details)) {
        this.reportTransformation(
          'import removal',
          node.getText(),
          '// Removed',
          details.location
        );
        return undefined;
      }
      
      // Store for merging
      this.addToImportGroup(details);
      
      // Report transformation if changed
      if (resolvedSource !== originalSource || this.hasSpecifierChanges(node, details)) {
        const newImport = ImportParser.create(details);
        this.reportTransformation(
          'import',
          node.getText(),
          newImport.getText(),
          details.location
        );
        return newImport;
      }
      
      return node;
    } catch (error) {
      this.reportError(
        `Failed to transform import: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.getLocation(node)
      );
      return node;
    }
  }
  
  /**
   * Transform import specifiers
   */
  private transformSpecifiers(
    specifiers: Array<{ name: string; alias?: string }>,
    originalSource: string,
    resolvedSource: string
  ): Array<{ name: string; alias?: string }> {
    if (!this.config.specifierMappings) {
      return specifiers;
    }
    
    return specifiers.map(spec => {
      // Check for specifier mapping
      const mappingKey = `${originalSource}:${spec.name}`;
      const mapping = this.config.specifierMappings![mappingKey];
      
      if (mapping) {
        if (mapping.remove) {
          return null;
        }
        
        return {
          name: mapping.target || spec.name,
          alias: spec.alias,
        };
      }
      
      // Check for global specifier mapping
      const globalMapping = this.config.specifierMappings![spec.name];
      if (globalMapping && globalMapping.source === originalSource) {
        if (globalMapping.remove) {
          return null;
        }
        
        return {
          name: globalMapping.target || spec.name,
          alias: spec.alias,
        };
      }
      
      return spec;
    }).filter(Boolean) as Array<{ name: string; alias?: string }>;
  }
  
  /**
   * Check if import should be removed
   */
  private shouldRemoveImport(details: ImportDetails): boolean {
    // Remove if all specifiers were removed
    if (details.namedImports && details.namedImports.length === 0 && 
        !details.defaultImport && !details.namespaceImport) {
      return true;
    }
    
    // Check if entire module should be removed
    const removeMapping = this.config.packageMappings[details.source];
    if (removeMapping === null || removeMapping === '') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if specifiers have changed
   */
  private hasSpecifierChanges(original: ts.ImportDeclaration, transformed: ImportDetails): boolean {
    const originalDetails = ImportParser.parse(original);
    
    if (originalDetails.namedImports?.length !== transformed.namedImports?.length) {
      return true;
    }
    
    if (originalDetails.namedImports && transformed.namedImports) {
      const originalNames = new Set(originalDetails.namedImports.map(s => s.name));
      const transformedNames = new Set(transformed.namedImports.map(s => s.name));
      
      for (const name of originalNames) {
        if (!transformedNames.has(name)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Add import to group for merging
   */
  private addToImportGroup(details: ImportDetails): void {
    const group = this.importGroups.get(details.source) || [];
    group.push(details);
    this.importGroups.set(details.source, group);
  }
  
  /**
   * Merge and organize imports
   */
  private mergeAndOrganizeImports(sourceFile: ts.SourceFile): ts.SourceFile {
    // Create transformer that removes all imports and adds merged ones
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      let importStatements: ts.ImportDeclaration[] = [];
      let firstImportIndex = -1;
      let lastImportIndex = -1;
      
      // Create merged imports
      for (const [source, group] of this.importGroups) {
        try {
          const merged = ImportParser.merge(group);
          if (merged) {
            importStatements.push(ImportParser.create(merged));
          }
        } catch (error) {
          this.reportError(
            `Failed to merge imports from ${source}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          // Add original imports as fallback
          group.forEach(details => {
            importStatements.push(ImportParser.create(details));
          });
        }
      }
      
      // Sort imports
      importStatements = this.sortImports(importStatements);
      
      const visit: ts.Visitor = (node) => {
        // Track import positions
        if (ts.isImportDeclaration(node)) {
          const index = sourceFile.statements.indexOf(node as any);
          if (firstImportIndex === -1) firstImportIndex = index;
          lastImportIndex = index;
          return undefined; // Remove original import
        }
        
        return node;
      };
      
      return (sourceFile) => {
        // Visit and remove original imports
        const statements = sourceFile.statements.map(s => ts.visitNode(s, visit)).filter(Boolean) as ts.Statement[];
        
        // Insert merged imports at the beginning
        const newStatements = [
          ...importStatements,
          ...statements,
        ];
        
        return ts.factory.updateSourceFile(
          sourceFile,
          newStatements,
          sourceFile.isDeclarationFile,
          sourceFile.referencedFiles,
          sourceFile.typeReferenceDirectives,
          sourceFile.hasNoDefaultLib,
          sourceFile.libReferenceDirectives
        );
      };
    };
    
    const result = ts.transform(sourceFile, [transformer]);
    return result.transformed[0];
  }
  
  /**
   * Sort imports by type and alphabetically
   */
  private sortImports(imports: ts.ImportDeclaration[]): ts.ImportDeclaration[] {
    return imports.sort((a, b) => {
      const sourceA = ImportParser.parse(a).source;
      const sourceB = ImportParser.parse(b).source;
      
      // Group by type
      const typeA = ImportParser.getImportType(sourceA);
      const typeB = ImportParser.getImportType(sourceB);
      
      // Order: package -> absolute -> relative
      const typeOrder = { package: 0, absolute: 1, relative: 2 };
      const typeDiff = typeOrder[typeA] - typeOrder[typeB];
      
      if (typeDiff !== 0) {
        return typeDiff;
      }
      
      // Within same type, sort alphabetically
      return sourceA.localeCompare(sourceB);
    });
  }
}