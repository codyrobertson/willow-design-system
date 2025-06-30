/**
 * File Organizer
 * Organizes generated code files according to various strategies
 */

import * as path from 'path';
import * as ts from 'typescript';
import {
  FileOrganizationConfig,
  CodeGenerationResult,
  IFileOrganizer,
  OrganizedFiles,
  DirectoryStructure,
  FileNamingConvention,
} from './types';

export class FileOrganizer implements IFileOrganizer {
  /**
   * Organize generated files according to configuration
   */
  organize(files: CodeGenerationResult[], config: FileOrganizationConfig): OrganizedFiles {
    const directories = new Map<string, CodeGenerationResult[]>();

    // Process each file
    for (const file of files) {
      const outputPath = this.getOutputPathForFile(file, config);
      const dir = path.dirname(outputPath);

      // Update file path
      file.filePath = outputPath;

      // Group by directory
      if (!directories.has(dir)) {
        directories.set(dir, []);
      }
      directories.get(dir)!.push(file);
    }

    // Generate structure visualization
    const structure = this.generateStructureVisualization(directories, config.outputDir);

    return {
      directories,
      fileCount: files.length,
      structure,
    };
  }

  /**
   * Get output path for a single file
   */
  getOutputPath(sourceFile: ts.SourceFile, config: FileOrganizationConfig): string {
    const result: CodeGenerationResult = {
      code: '',
      filePath: sourceFile.fileName,
    };

    return this.getOutputPathForFile(result, config);
  }

  /**
   * Get output path for a file based on organization strategy
   */
  private getOutputPathForFile(file: CodeGenerationResult, config: FileOrganizationConfig): string {
    let relativePath: string;
    const originalPath = file.filePath;
    const baseName = path.basename(originalPath);
    const dirName = path.dirname(originalPath);

    // Apply directory structure strategy
    switch (config.structure) {
      case DirectoryStructure.Flat:
        relativePath = baseName;
        break;

      case DirectoryStructure.Mirror:
        relativePath = config.preserveStructure
          ? originalPath
          : path.relative(process.cwd(), originalPath);
        break;

      case DirectoryStructure.Feature:
        relativePath = this.organizeByFeature(originalPath, file);
        break;

      case DirectoryStructure.Type:
        relativePath = this.organizeByType(originalPath, file);
        break;

      case DirectoryStructure.Custom:
        if (config.customMapper) {
          // For custom mapping, we need the AST
          const sourceFile = this.createSourceFileFromResult(file);
          relativePath = config.customMapper(originalPath, sourceFile);
        } else {
          relativePath = originalPath;
        }
        break;

      default:
        relativePath = originalPath;
    }

    // Apply file naming convention
    if (config.fileNaming && config.fileNaming !== FileNamingConvention.Original) {
      const ext = path.extname(relativePath);
      const nameWithoutExt = path.basename(relativePath, ext);
      const transformedName = this.transformFileName(nameWithoutExt, config.fileNaming);
      relativePath = path.join(path.dirname(relativePath), transformedName + ext);
    }

    // Combine with output directory
    return path.join(config.outputDir, relativePath);
  }

  /**
   * Organize files by feature/module
   */
  private organizeByFeature(filePath: string, file: CodeGenerationResult): string {
    const segments = filePath.split(path.sep);
    const fileName = path.basename(filePath);

    // Try to detect feature from path
    // Look for common patterns like src/features/*, src/modules/*, etc.
    const featurePatterns = ['features', 'modules', 'domains', 'areas'];

    for (let i = 0; i < segments.length - 1; i++) {
      if (featurePatterns.includes(segments[i])) {
        // Next segment is likely the feature name
        const feature = segments[i + 1];
        const remainingPath = segments.slice(i + 2).join(path.sep);
        return path.join(feature, remainingPath || fileName);
      }
    }

    // If no feature pattern found, try to infer from file name
    const feature = this.inferFeatureFromFileName(fileName);
    return path.join(feature, fileName);
  }

  /**
   * Organize files by type
   */
  private organizeByType(filePath: string, file: CodeGenerationResult): string {
    const fileName = path.basename(filePath);
    const type = this.detectFileType(fileName, file);

    // Create type-based directory structure
    const typeDir = this.getDirectoryForType(type);

    // Check if we should preserve subdirectory structure within type
    const segments = filePath.split(path.sep);
    const srcIndex = segments.findIndex((s) => s === 'src');

    if (srcIndex !== -1 && srcIndex < segments.length - 2) {
      // Preserve structure after src
      const subPath = segments.slice(srcIndex + 1, -1).join(path.sep);
      return path.join(typeDir, subPath, fileName);
    }

    return path.join(typeDir, fileName);
  }

  /**
   * Detect file type from file name and content
   */
  private detectFileType(fileName: string, file: CodeGenerationResult): string {
    const lowerFileName = fileName.toLowerCase();

    // Check common patterns
    if (lowerFileName.includes('.test.') || lowerFileName.includes('.spec.')) {
      return 'tests';
    }

    if (lowerFileName.includes('.story.') || lowerFileName.includes('.stories.')) {
      return 'stories';
    }

    if (lowerFileName.endsWith('.d.ts')) {
      return 'types';
    }

    if (lowerFileName.includes('hook') || lowerFileName.startsWith('use')) {
      return 'hooks';
    }

    if (lowerFileName.includes('util') || lowerFileName.includes('helper')) {
      return 'utils';
    }

    if (lowerFileName.includes('service') || lowerFileName.includes('api')) {
      return 'services';
    }

    if (lowerFileName.includes('model') || lowerFileName.includes('schema')) {
      return 'models';
    }

    if (lowerFileName.includes('component') || this.isComponentFile(file)) {
      return 'components';
    }

    if (lowerFileName.includes('constant') || lowerFileName.includes('config')) {
      return 'constants';
    }

    if (
      lowerFileName.includes('style') ||
      lowerFileName.endsWith('.css') ||
      lowerFileName.endsWith('.scss') ||
      lowerFileName.endsWith('.less')
    ) {
      return 'styles';
    }

    return 'misc';
  }

  /**
   * Check if file contains React/Vue/Angular components
   */
  private isComponentFile(file: CodeGenerationResult): boolean {
    const code = file.code.toLowerCase();

    // React patterns
    if (
      code.includes('react.component') ||
      code.includes('react.fc') ||
      code.includes('react.functioncomponent') ||
      code.includes('extends component') ||
      code.includes('extends react.component')
    ) {
      return true;
    }

    // JSX/TSX
    if (code.includes('return (') && code.includes('</')) {
      return true;
    }

    // Vue patterns
    if (
      code.includes('vue.component') ||
      code.includes('definecomponent') ||
      code.includes('<template>')
    ) {
      return true;
    }

    // Angular patterns
    if (code.includes('@component') || code.includes('angular.component')) {
      return true;
    }

    return false;
  }

  /**
   * Get directory name for a file type
   */
  private getDirectoryForType(type: string): string {
    const typeDirectoryMap: Record<string, string> = {
      components: 'components',
      hooks: 'hooks',
      utils: 'utils',
      services: 'services',
      models: 'models',
      types: 'types',
      tests: '__tests__',
      stories: 'stories',
      constants: 'constants',
      styles: 'styles',
      misc: 'misc',
    };

    return typeDirectoryMap[type] || type;
  }

  /**
   * Infer feature name from file name
   */
  private inferFeatureFromFileName(fileName: string): string {
    // Remove extension
    const nameWithoutExt = path.parse(fileName).name;

    // Try to extract feature from common patterns
    // e.g., UserProfile.tsx -> user
    // e.g., AuthService.ts -> auth
    const patterns = [
      /^([A-Z][a-z]+)(?=[A-Z])/, // First word in PascalCase
      /^([a-z]+)(?=[A-Z])/, // First word in camelCase
      /^([a-z]+)[-_]/, // First word before separator
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    // Default to using first 3-6 characters
    return nameWithoutExt.substring(0, 6).toLowerCase();
  }

  /**
   * Transform file name according to naming convention
   */
  private transformFileName(name: string, convention: FileNamingConvention): string {
    switch (convention) {
      case FileNamingConvention.KebabCase:
        return this.toKebabCase(name);

      case FileNamingConvention.CamelCase:
        return this.toCamelCase(name);

      case FileNamingConvention.PascalCase:
        return this.toPascalCase(name);

      case FileNamingConvention.Custom:
        // Custom naming would be handled by a user-provided function
        return name;

      default:
        return name;
    }
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\-]+/g, '-') // Replace special characters with dashes
      .replace(/\-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^\-|\-$/g, '') // Remove leading/trailing dashes
      .toLowerCase();
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^[a-z]/, (char) => char.toUpperCase());
  }

  /**
   * Create a minimal source file from generation result
   */
  private createSourceFileFromResult(file: CodeGenerationResult): ts.SourceFile {
    return ts.createSourceFile(file.filePath, file.code, ts.ScriptTarget.Latest, true);
  }

  /**
   * Generate directory structure visualization
   */
  private generateStructureVisualization(
    directories: Map<string, CodeGenerationResult[]>,
    baseDir: string
  ): string {
    const tree: any = {};

    // Build tree structure
    for (const [dir, files] of directories) {
      const relativePath = path.relative(baseDir, dir);
      const segments = relativePath.split(path.sep).filter((s) => s);

      let current = tree;
      for (const segment of segments) {
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      }

      // Add files to current directory
      current['__files__'] = files.map((f) => path.basename(f.filePath));
    }

    // Convert tree to string
    return this.treeToString(tree, '', true);
  }

  /**
   * Convert tree structure to string visualization
   */
  private treeToString(tree: any, prefix: string = '', isLast: boolean = true): string {
    let result = '';
    const entries = Object.entries(tree).filter(([key]) => key !== '__files__');
    const files = tree['__files__'] || [];

    entries.forEach(([key, value], index) => {
      const isLastEntry = index === entries.length - 1 && files.length === 0;
      const connector = isLastEntry ? '└── ' : '├── ';
      const extension = isLastEntry ? '    ' : '│   ';

      result += prefix + connector + key + '/\n';

      if (typeof value === 'object' && value !== null) {
        result += this.treeToString(value, prefix + extension, isLastEntry);
      }
    });

    files.forEach((file: string, index: number) => {
      const isLastFile = index === files.length - 1;
      const connector = isLastFile ? '└── ' : '├── ';
      result += prefix + connector + file + '\n';
    });

    return result;
  }
}
