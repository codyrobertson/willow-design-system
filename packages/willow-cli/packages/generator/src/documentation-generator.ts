/**
 * Documentation Generator
 * Generates documentation from TypeScript AST
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  DocumentationOptions,
  DocumentationResult,
  DocumentationFile,
  DocumentationEntry,
  DocumentationFormat,
  IDocumentationGenerator,
  TableOfContents,
  TOCEntry,
  ParameterDoc,
  SourceLocation,
} from './types';

export class DocumentationGenerator implements IDocumentationGenerator {
  private entries: Map<string, DocumentationEntry[]> = new Map();
  private toc: TOCEntry[] = [];

  /**
   * Generate documentation from AST
   */
  async generate(
    sourceFiles: ts.SourceFile[],
    options: DocumentationOptions
  ): Promise<DocumentationResult> {
    // Clear previous state
    this.entries.clear();
    this.toc = [];

    // Extract documentation from all source files
    for (const sourceFile of sourceFiles) {
      this.extractFromSourceFile(sourceFile, options);
    }

    // Generate documentation files
    const files = await this.generateDocumentationFiles(options);

    // Generate table of contents
    const toc = options.generateTOC ? this.generateTableOfContents() : undefined;

    // Prepare metadata
    const metadata = {
      title: options.metadata?.title || 'API Documentation',
      description: options.metadata?.description,
      version: options.metadata?.version,
      author: options.metadata?.author,
      license: options.metadata?.license,
      repository: options.metadata?.repository,
      homepage: options.metadata?.homepage,
    };

    return {
      files,
      toc,
      metadata,
    };
  }

  /**
   * Extract documentation from single node
   */
  extractDocs(node: ts.Node): DocumentationEntry {
    const name = this.getNodeName(node);
    const kind = this.getNodeKind(node);
    const description = this.extractJSDoc(node);
    const modifiers = this.getModifiers(node);
    const source = this.getSourceLocation(node);

    let entry: DocumentationEntry = {
      name,
      kind,
      description,
      modifiers,
      source,
    };

    // Extract additional information based on node type
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      entry.parameters = this.extractParameters(node);
      entry.returns = this.extractReturnType(node);
    } else if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      entry.type = this.extractTypeInfo(node);
    } else if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
      entry.type = this.extractPropertyType(node);
    } else if (ts.isTypeAliasDeclaration(node)) {
      entry.type = this.extractTypeAliasInfo(node);
    } else if (ts.isEnumDeclaration(node)) {
      entry.type = this.extractEnumInfo(node);
    }

    return entry;
  }

  /**
   * Extract documentation from source file
   */
  private extractFromSourceFile(
    sourceFile: ts.SourceFile,
    options: DocumentationOptions
  ): void {
    const fileName = path.basename(sourceFile.fileName);
    const entries: DocumentationEntry[] = [];

    const visit = (node: ts.Node) => {
      // Check if node should be documented
      if (this.shouldDocument(node, options)) {
        const entry = this.extractDocs(node);
        entries.push(entry);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (entries.length > 0) {
      this.entries.set(fileName, entries);
    }
  }

  /**
   * Check if node should be documented
   */
  private shouldDocument(node: ts.Node, options: DocumentationOptions): boolean {
    // Skip nodes without names
    const name = this.getNodeName(node);
    if (!name) return false;

    // Check modifiers
    const modifiers = this.getModifiers(node);
    
    // Skip private members unless configured
    if (!options.includePrivate && modifiers.includes('private')) {
      return false;
    }

    // Skip internal members (starting with _)
    if (!options.includePrivate && name.startsWith('_')) {
      return false;
    }

    // Only document exported declarations by default
    const isExported = modifiers.includes('export') || modifiers.includes('default');
    
    // Document these node types
    return (
      isExported &&
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isVariableStatement(node) ||
        (options.includePrivate && ts.isMethodDeclaration(node)) ||
        (options.includePrivate && ts.isPropertyDeclaration(node)))
    );
  }

  /**
   * Get node name
   */
  private getNodeName(node: ts.Node): string {
    if ('name' in node && node.name) {
      if (ts.isIdentifier(node.name)) {
        return node.name.text;
      }
    }
    
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration && ts.isIdentifier(declaration.name)) {
        return declaration.name.text;
      }
    }

    return '';
  }

  /**
   * Get node kind
   */
  private getNodeKind(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node)) return 'function';
    if (ts.isClassDeclaration(node)) return 'class';
    if (ts.isInterfaceDeclaration(node)) return 'interface';
    if (ts.isTypeAliasDeclaration(node)) return 'type';
    if (ts.isEnumDeclaration(node)) return 'enum';
    if (ts.isMethodDeclaration(node)) return 'method';
    if (ts.isPropertyDeclaration(node)) return 'property';
    if (ts.isVariableStatement(node)) return 'variable';
    if (ts.isModuleDeclaration(node)) return 'module';
    
    return 'unknown';
  }

  /**
   * Extract JSDoc comments
   */
  private extractJSDoc(node: ts.Node): string | undefined {
    const jsDocTags = ts.getJSDocTags(node);
    const comments = ts.getLeadingCommentRanges(
      node.getSourceFile().getFullText(),
      node.getFullStart()
    );

    if (!comments) return undefined;

    const sourceText = node.getSourceFile().getFullText();
    const jsDocComments: string[] = [];

    for (const comment of comments) {
      const commentText = sourceText.substring(comment.pos, comment.end);
      
      // Check if it's a JSDoc comment
      if (commentText.startsWith('/**')) {
        // Remove /** and */ and clean up
        const cleaned = commentText
          .replace(/^\/\*\*\s*/, '')
          .replace(/\s*\*\/$/, '')
          .split('\n')
          .map(line => line.replace(/^\s*\*\s?/, ''))
          .join('\n')
          .trim();
        
        jsDocComments.push(cleaned);
      }
    }

    return jsDocComments.length > 0 ? jsDocComments.join('\n\n') : undefined;
  }

  /**
   * Get node modifiers
   */
  private getModifiers(node: ts.Node): string[] {
    const modifiers: string[] = [];

    if ('modifiers' in node && node.modifiers) {
      for (const modifier of node.modifiers) {
        modifiers.push(ts.tokenToString(modifier.kind) || '');
      }
    }

    return modifiers.filter(m => m);
  }

  /**
   * Get source location
   */
  private getSourceLocation(node: ts.Node): SourceLocation {
    const sourceFile = node.getSourceFile();
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    
    return {
      file: sourceFile.fileName,
      line: line + 1,
      column: character + 1,
    };
  }

  /**
   * Extract function parameters
   */
  private extractParameters(
    node: ts.FunctionDeclaration | ts.MethodDeclaration
  ): ParameterDoc[] {
    const parameters: ParameterDoc[] = [];

    for (const param of node.parameters) {
      const name = ts.isIdentifier(param.name) ? param.name.text : 'unknown';
      const type = param.type ? this.typeToString(param.type) : 'any';
      const optional = !!param.questionToken;
      const defaultValue = param.initializer
        ? param.initializer.getText()
        : undefined;

      parameters.push({
        name,
        type,
        optional,
        defaultValue,
        description: this.extractParamJSDoc(node, name),
      });
    }

    return parameters;
  }

  /**
   * Extract parameter JSDoc
   */
  private extractParamJSDoc(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    paramName: string
  ): string | undefined {
    const jsDocTags = ts.getJSDocTags(node);
    
    for (const tag of jsDocTags) {
      if (tag.tagName.text === 'param' && ts.isJSDocParameterTag(tag)) {
        const name = tag.name?.getText();
        if (name === paramName && tag.comment) {
          return typeof tag.comment === 'string' 
            ? tag.comment 
            : tag.comment.map(c => c.text).join('');
        }
      }
    }

    return undefined;
  }

  /**
   * Extract return type
   */
  private extractReturnType(
    node: ts.FunctionDeclaration | ts.MethodDeclaration
  ): string | undefined {
    if (node.type) {
      return this.typeToString(node.type);
    }

    // Try to infer from JSDoc
    const jsDocTags = ts.getJSDocTags(node);
    for (const tag of jsDocTags) {
      if (tag.tagName.text === 'returns' || tag.tagName.text === 'return') {
        if (ts.isJSDocReturnTag(tag) && tag.typeExpression) {
          return tag.typeExpression.type.getText();
        }
      }
    }

    return undefined;
  }

  /**
   * Extract type information
   */
  private extractTypeInfo(
    node: ts.ClassDeclaration | ts.InterfaceDeclaration
  ): string {
    const members: string[] = [];

    if ('members' in node) {
      for (const member of node.members) {
        const memberName = this.getNodeName(member);
        const memberType = this.getMemberType(member);
        if (memberName) {
          members.push(`${memberName}: ${memberType}`);
        }
      }
    }

    return `{ ${members.join('; ')} }`;
  }

  /**
   * Extract property type
   */
  private extractPropertyType(
    node: ts.PropertyDeclaration | ts.PropertySignature
  ): string {
    if (node.type) {
      return this.typeToString(node.type);
    }
    return 'any';
  }

  /**
   * Extract type alias information
   */
  private extractTypeAliasInfo(node: ts.TypeAliasDeclaration): string {
    return this.typeToString(node.type);
  }

  /**
   * Extract enum information
   */
  private extractEnumInfo(node: ts.EnumDeclaration): string {
    const members = node.members.map(member => {
      const name = member.name ? member.name.getText() : 'unknown';
      const value = member.initializer ? member.initializer.getText() : undefined;
      return value ? `${name} = ${value}` : name;
    });

    return `{ ${members.join(', ')} }`;
  }

  /**
   * Get member type
   */
  private getMemberType(member: ts.Node): string {
    if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
      return member.type ? this.typeToString(member.type) : 'any';
    }
    
    if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
      const params = member.parameters
        .map(p => (p.name as ts.Identifier).text + ': ' + 
             (p.type ? this.typeToString(p.type) : 'any'))
        .join(', ');
      const returnType = member.type ? this.typeToString(member.type) : 'void';
      return `(${params}) => ${returnType}`;
    }

    return 'any';
  }

  /**
   * Convert type node to string
   */
  private typeToString(type: ts.TypeNode): string {
    // For simple cases, just get the text
    return type.getText();
  }

  /**
   * Generate documentation files
   */
  private async generateDocumentationFiles(
    options: DocumentationOptions
  ): Promise<DocumentationFile[]> {
    const files: DocumentationFile[] = [];

    switch (options.format) {
      case DocumentationFormat.Markdown:
        files.push(...(await this.generateMarkdownDocs(options)));
        break;
      
      case DocumentationFormat.HTML:
        files.push(...(await this.generateHTMLDocs(options)));
        break;
      
      case DocumentationFormat.JSON:
        files.push(...(await this.generateJSONDocs(options)));
        break;
      
      default:
        throw new Error(`Unsupported documentation format: ${options.format}`);
    }

    return files;
  }

  /**
   * Generate Markdown documentation
   */
  private async generateMarkdownDocs(
    options: DocumentationOptions
  ): Promise<DocumentationFile[]> {
    const files: DocumentationFile[] = [];

    // Generate main documentation file
    let mainContent = `# ${options.metadata?.title || 'API Documentation'}\n\n`;
    
    if (options.metadata?.description) {
      mainContent += `${options.metadata.description}\n\n`;
    }

    if (options.generateTOC) {
      mainContent += `## Table of Contents\n\n`;
      mainContent += this.generateMarkdownTOC();
      mainContent += '\n\n';
    }

    // Generate documentation for each file
    for (const [fileName, entries] of this.entries) {
      const fileContent = this.generateMarkdownForFile(fileName, entries, options);
      mainContent += fileContent;
      mainContent += '\n\n';
    }

    files.push({
      path: path.join(options.outputDir, 'README.md'),
      content: mainContent,
      format: DocumentationFormat.Markdown,
    });

    return files;
  }

  /**
   * Generate Markdown for a single file
   */
  private generateMarkdownForFile(
    fileName: string,
    entries: DocumentationEntry[],
    options: DocumentationOptions
  ): string {
    let content = `## ${fileName}\n\n`;

    // Group entries by kind
    const grouped = this.groupEntriesByKind(entries);

    for (const [kind, kindEntries] of grouped) {
      content += `### ${this.kindToTitle(kind)}\n\n`;

      for (const entry of kindEntries) {
        content += this.generateMarkdownForEntry(entry);
        content += '\n\n';
      }
    }

    return content;
  }

  /**
   * Generate Markdown for a single entry
   */
  private generateMarkdownForEntry(entry: DocumentationEntry): string {
    let content = `#### ${entry.name}\n\n`;

    if (entry.description) {
      content += `${entry.description}\n\n`;
    }

    if (entry.modifiers && entry.modifiers.length > 0) {
      content += `**Modifiers:** ${entry.modifiers.join(', ')}\n\n`;
    }

    if (entry.type) {
      content += `**Type:** \`${entry.type}\`\n\n`;
    }

    if (entry.parameters && entry.parameters.length > 0) {
      content += `**Parameters:**\n\n`;
      for (const param of entry.parameters) {
        content += `- \`${param.name}\``;
        if (param.optional) content += '?';
        content += `: \`${param.type}\``;
        if (param.defaultValue) content += ` = \`${param.defaultValue}\``;
        if (param.description) content += ` - ${param.description}`;
        content += '\n';
      }
      content += '\n';
    }

    if (entry.returns) {
      content += `**Returns:** \`${entry.returns}\`\n\n`;
    }

    if (entry.source) {
      content += `*Defined in ${entry.source.file}:${entry.source.line}*\n`;
    }

    return content;
  }

  /**
   * Generate HTML documentation
   */
  private async generateHTMLDocs(
    options: DocumentationOptions
  ): Promise<DocumentationFile[]> {
    const files: DocumentationFile[] = [];

    // Generate main HTML file
    const htmlContent = this.generateHTMLTemplate(options);

    files.push({
      path: path.join(options.outputDir, 'index.html'),
      content: htmlContent,
      format: DocumentationFormat.HTML,
    });

    return files;
  }

  /**
   * Generate HTML template
   */
  private generateHTMLTemplate(options: DocumentationOptions): string {
    const title = options.metadata?.title || 'API Documentation';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #333; }
        h2 { color: #555; margin-top: 40px; }
        h3 { color: #666; margin-top: 30px; }
        h4 { color: #777; margin-top: 20px; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 12px; border-radius: 5px; overflow-x: auto; }
        .parameter { margin-left: 20px; }
        .source { color: #999; font-size: 0.9em; font-style: italic; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${options.metadata?.description ? `<p>${options.metadata.description}</p>` : ''}
    ${this.generateHTMLContent(options)}
</body>
</html>`;
  }

  /**
   * Generate HTML content
   */
  private generateHTMLContent(options: DocumentationOptions): string {
    let content = '';

    for (const [fileName, entries] of this.entries) {
      content += `<h2>${fileName}</h2>`;
      
      const grouped = this.groupEntriesByKind(entries);
      
      for (const [kind, kindEntries] of grouped) {
        content += `<h3>${this.kindToTitle(kind)}</h3>`;
        
        for (const entry of kindEntries) {
          content += this.generateHTMLForEntry(entry);
        }
      }
    }

    return content;
  }

  /**
   * Generate HTML for a single entry
   */
  private generateHTMLForEntry(entry: DocumentationEntry): string {
    let content = `<div class="entry">`;
    content += `<h4>${entry.name}</h4>`;
    
    if (entry.description) {
      content += `<p>${entry.description}</p>`;
    }
    
    if (entry.type) {
      content += `<p><strong>Type:</strong> <code>${this.escapeHtml(entry.type)}</code></p>`;
    }
    
    if (entry.parameters && entry.parameters.length > 0) {
      content += `<p><strong>Parameters:</strong></p><ul>`;
      for (const param of entry.parameters) {
        content += `<li class="parameter">`;
        content += `<code>${param.name}${param.optional ? '?' : ''}: ${param.type}</code>`;
        if (param.description) content += ` - ${param.description}`;
        content += `</li>`;
      }
      content += `</ul>`;
    }
    
    if (entry.returns) {
      content += `<p><strong>Returns:</strong> <code>${this.escapeHtml(entry.returns)}</code></p>`;
    }
    
    if (entry.source) {
      content += `<p class="source">Defined in ${entry.source.file}:${entry.source.line}</p>`;
    }
    
    content += `</div>`;
    return content;
  }

  /**
   * Generate JSON documentation
   */
  private async generateJSONDocs(
    options: DocumentationOptions
  ): Promise<DocumentationFile[]> {
    const files: DocumentationFile[] = [];

    const jsonData = {
      metadata: options.metadata,
      entries: Object.fromEntries(this.entries),
      toc: options.generateTOC ? this.toc : undefined,
    };

    files.push({
      path: path.join(options.outputDir, 'api.json'),
      content: JSON.stringify(jsonData, null, 2),
      format: DocumentationFormat.JSON,
    });

    return files;
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(): TableOfContents | undefined {
    this.toc = [];
    let currentLevel = 0;

    for (const [fileName, entries] of this.entries) {
      this.toc.push({
        title: fileName,
        link: `#${this.slugify(fileName)}`,
        level: 0,
        children: [],
      });

      const grouped = this.groupEntriesByKind(entries);
      
      for (const [kind, kindEntries] of grouped) {
        const kindToc: TOCEntry = {
          title: this.kindToTitle(kind),
          link: `#${this.slugify(fileName + '-' + kind)}`,
          level: 1,
          children: [],
        };

        for (const entry of kindEntries) {
          kindToc.children?.push({
            title: entry.name,
            link: `#${this.slugify(fileName + '-' + kind + '-' + entry.name)}`,
            level: 2,
          });
        }

        this.toc[this.toc.length - 1].children?.push(kindToc);
      }
    }

    return {
      entries: this.toc,
      tree: this.buildTOCTree(this.toc),
    };
  }

  /**
   * Generate Markdown TOC
   */
  private generateMarkdownTOC(): string {
    let content = '';

    for (const entry of this.toc) {
      content += this.generateMarkdownTOCEntry(entry, 0);
    }

    return content;
  }

  /**
   * Generate Markdown TOC entry
   */
  private generateMarkdownTOCEntry(entry: TOCEntry, indent: number): string {
    let content = '  '.repeat(indent) + `- [${entry.title}](${entry.link})\n`;

    if (entry.children) {
      for (const child of entry.children) {
        content += this.generateMarkdownTOCEntry(child, indent + 1);
      }
    }

    return content;
  }

  /**
   * Build TOC tree
   */
  private buildTOCTree(entries: TOCEntry[]): TOCEntry {
    return {
      title: 'Table of Contents',
      link: '#',
      level: -1,
      children: entries,
    };
  }

  /**
   * Group entries by kind
   */
  private groupEntriesByKind(
    entries: DocumentationEntry[]
  ): Map<string, DocumentationEntry[]> {
    const grouped = new Map<string, DocumentationEntry[]>();

    for (const entry of entries) {
      if (!grouped.has(entry.kind)) {
        grouped.set(entry.kind, []);
      }
      grouped.get(entry.kind)!.push(entry);
    }

    return grouped;
  }

  /**
   * Convert kind to title
   */
  private kindToTitle(kind: string): string {
    const titles: Record<string, string> = {
      'function': 'Functions',
      'class': 'Classes',
      'interface': 'Interfaces',
      'type': 'Type Aliases',
      'enum': 'Enumerations',
      'variable': 'Variables',
      'method': 'Methods',
      'property': 'Properties',
      'module': 'Modules',
    };

    return titles[kind] || kind.charAt(0).toUpperCase() + kind.slice(1) + 's';
  }

  /**
   * Convert string to slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }
}