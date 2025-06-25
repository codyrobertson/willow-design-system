import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenValue,
  TokenDocumentation,
  TokenExample,
  TokenSemanticContext,
  TokenMigrationContext,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
} from '../../types/theme-tokens.types';

/**
 * Token documentation generator interface
 */
export interface TokenDocumentationGenerator {
  /**
   * Generate documentation for a single token
   */
  generateTokenDocumentation(
    token: DesignToken,
    context?: TokenSemanticContext
  ): Promise<TokenDocumentation>;

  /**
   * Generate documentation for multiple tokens
   */
  generateTokensDocumentation(
    tokens: DesignToken[],
    context?: TokenSemanticContext
  ): Promise<TokenDocumentation[]>;

  /**
   * Generate migration guide documentation
   */
  generateMigrationGuide(
    sourceTokens: DesignToken[],
    targetTokens: DesignToken[],
    migrationContext: TokenMigrationContext
  ): Promise<string>;

  /**
   * Generate usage documentation
   */
  generateUsageDocumentation(
    tokens: DesignToken[],
    outputFormat: DocumentationFormat
  ): Promise<string>;

  /**
   * Export documentation in various formats
   */
  exportDocumentation(
    documentation: TokenDocumentation[],
    format: DocumentationFormat,
    options?: DocumentationExportOptions
  ): Promise<string>;
}

/**
 * Documentation output formats
 */
export enum DocumentationFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  JSON = 'json',
  STORYBOOK = 'storybook',
  FIGMA = 'figma',
  PDF = 'pdf',
}

/**
 * Documentation generation options
 */
export interface DocumentationGenerationOptions {
  /** Include visual previews */
  includeVisualPreviews?: boolean;
  
  /** Include code examples */
  includeCodeExamples?: boolean;
  
  /** Include migration notes */
  includeMigrationNotes?: boolean;
  
  /** Include accessibility information */
  includeAccessibility?: boolean;
  
  /** Include semantic relationships */
  includeSemanticRelationships?: boolean;
  
  /** Generate interactive examples */
  generateInteractiveExamples?: boolean;
  
  /** Framework-specific examples */
  frameworkExamples?: string[];
  
  /** Custom template path */
  customTemplate?: string;
}

/**
 * Documentation export options
 */
export interface DocumentationExportOptions {
  /** Output file path */
  outputPath?: string;
  
  /** Include table of contents */
  includeTableOfContents?: boolean;
  
  /** Include index/search */
  includeIndex?: boolean;
  
  /** Group by category */
  groupByCategory?: boolean;
  
  /** Include metadata */
  includeMetadata?: boolean;
  
  /** Custom CSS/styling */
  customStyling?: string;
  
  /** Asset base URL */
  assetBaseUrl?: string;
}

/**
 * Documentation section types
 */
export enum DocumentationSection {
  OVERVIEW = 'overview',
  USAGE = 'usage',
  EXAMPLES = 'examples',
  ACCESSIBILITY = 'accessibility',
  MIGRATION = 'migration',
  RELATED = 'related',
  METADATA = 'metadata',
}

/**
 * Base token documentation generator implementation
 */
export class BaseTokenDocumentationGenerator implements TokenDocumentationGenerator {
  private templateCache = new Map<string, string>();
  private exampleCache = new Map<string, TokenExample[]>();
  private generationOptions: DocumentationGenerationOptions;

  constructor(options: DocumentationGenerationOptions = {}) {
    this.generationOptions = {
      includeVisualPreviews: true,
      includeCodeExamples: true,
      includeMigrationNotes: true,
      includeAccessibility: true,
      includeSemanticRelationships: true,
      generateInteractiveExamples: false,
      frameworkExamples: ['css', 'react', 'vue'],
      ...options,
    };
  }

  async generateTokenDocumentation(
    token: DesignToken,
    context?: TokenSemanticContext
  ): Promise<TokenDocumentation> {
    const cacheKey = this.getCacheKey(token, context);
    
    // Generate main documentation content
    const documentation = await this.generateDocumentationContent(token, context);
    
    // Generate code examples
    const examples = this.generationOptions.includeCodeExamples
      ? await this.generateCodeExamples(token, context)
      : [];
    
    // Find related tokens
    const related = this.generationOptions.includeSemanticRelationships
      ? this.findRelatedTokens(token)
      : [];
    
    // Generate migration notes
    const migrationNotes = this.generationOptions.includeMigrationNotes
      ? this.generateMigrationNotes(token, context)
      : undefined;

    const result: TokenDocumentation = {
      token,
      documentation,
      examples,
      related,
      migrationNotes,
    };

    return result;
  }

  async generateTokensDocumentation(
    tokens: DesignToken[],
    context?: TokenSemanticContext
  ): Promise<TokenDocumentation[]> {
    const documentation: TokenDocumentation[] = [];
    
    // Process tokens in batches for performance
    const batchSize = 10;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const batchPromises = batch.map(token => 
        this.generateTokenDocumentation(token, context)
      );
      
      const batchResults = await Promise.all(batchPromises);
      documentation.push(...batchResults);
    }

    return documentation;
  }

  async generateMigrationGuide(
    sourceTokens: DesignToken[],
    targetTokens: DesignToken[],
    migrationContext: TokenMigrationContext
  ): Promise<string> {
    const sections: string[] = [];

    // Header
    sections.push(this.generateMigrationHeader(migrationContext));

    // Overview
    sections.push(this.generateMigrationOverview(sourceTokens, targetTokens, migrationContext));

    // Token mapping table
    sections.push(this.generateTokenMappingTable(sourceTokens, targetTokens));

    // Breaking changes
    sections.push(this.generateBreakingChanges(sourceTokens, targetTokens));

    // Migration steps
    sections.push(this.generateMigrationSteps(migrationContext));

    // Code examples
    sections.push(this.generateMigrationCodeExamples(sourceTokens, targetTokens, migrationContext));

    // Validation and testing
    sections.push(this.generateMigrationValidation());

    return sections.join('\n\n');
  }

  async generateUsageDocumentation(
    tokens: DesignToken[],
    outputFormat: DocumentationFormat
  ): Promise<string> {
    switch (outputFormat) {
      case DocumentationFormat.MARKDOWN:
        return this.generateMarkdownUsageDoc(tokens);
      case DocumentationFormat.HTML:
        return this.generateHtmlUsageDoc(tokens);
      case DocumentationFormat.JSON:
        return this.generateJsonUsageDoc(tokens);
      case DocumentationFormat.STORYBOOK:
        return this.generateStorybookUsageDoc(tokens);
      default:
        throw new Error(`Unsupported documentation format: ${outputFormat}`);
    }
  }

  async exportDocumentation(
    documentation: TokenDocumentation[],
    format: DocumentationFormat,
    options: DocumentationExportOptions = {}
  ): Promise<string> {
    const { groupByCategory = true, includeTableOfContents = true } = options;

    switch (format) {
      case DocumentationFormat.MARKDOWN:
        return this.exportMarkdownDocumentation(documentation, options);
      case DocumentationFormat.HTML:
        return this.exportHtmlDocumentation(documentation, options);
      case DocumentationFormat.JSON:
        return this.exportJsonDocumentation(documentation, options);
      case DocumentationFormat.STORYBOOK:
        return this.exportStorybookDocumentation(documentation, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async generateDocumentationContent(
    token: DesignToken,
    context?: TokenSemanticContext
  ): Promise<string> {
    const sections: string[] = [];

    // Token overview
    sections.push(this.generateTokenOverview(token));

    // Token details
    sections.push(this.generateTokenDetails(token));

    // Visual preview (for visual tokens)
    if (this.generationOptions.includeVisualPreviews && this.isVisualToken(token)) {
      sections.push(this.generateVisualPreview(token));
    }

    // Usage guidelines
    sections.push(this.generateUsageGuidelines(token, context));

    // Accessibility information
    if (this.generationOptions.includeAccessibility) {
      sections.push(this.generateAccessibilityInfo(token));
    }

    return sections.join('\n\n');
  }

  private async generateCodeExamples(
    token: DesignToken,
    context?: TokenSemanticContext
  ): Promise<TokenExample[]> {
    const cacheKey = `${token.name}-${context?.framework || 'default'}`;
    if (this.exampleCache.has(cacheKey)) {
      return this.exampleCache.get(cacheKey)!;
    }

    const examples: TokenExample[] = [];
    const frameworks = this.generationOptions.frameworkExamples || ['css'];

    for (const framework of frameworks) {
      const frameworkExamples = this.generateFrameworkExamples(token, framework, context);
      examples.push(...frameworkExamples);
    }

    this.exampleCache.set(cacheKey, examples);
    return examples;
  }

  private generateFrameworkExamples(
    token: DesignToken,
    framework: string,
    context?: TokenSemanticContext
  ): TokenExample[] {
    const examples: TokenExample[] = [];

    switch (framework.toLowerCase()) {
      case 'css':
        examples.push(...this.generateCssExamples(token));
        break;
      case 'react':
        examples.push(...this.generateReactExamples(token));
        break;
      case 'vue':
        examples.push(...this.generateVueExamples(token));
        break;
      case 'angular':
        examples.push(...this.generateAngularExamples(token));
        break;
      case 'svelte':
        examples.push(...this.generateSvelteExamples(token));
        break;
    }

    return examples;
  }

  private generateCssExamples(token: DesignToken): TokenExample[] {
    const examples: TokenExample[] = [];
    const tokenVar = `--${token.name.replace(/\./g, '-')}`;

    // CSS Variable usage
    examples.push({
      title: 'CSS Variable Usage',
      description: `Using ${token.name} as a CSS custom property`,
      code: `:root {
  ${tokenVar}: ${this.formatTokenValue(token.value)};
}

.my-element {
  ${this.getCssProperty(token)}: var(${tokenVar});
}`,
      language: 'css',
      category: 'css',
    });

    // Direct usage
    examples.push({
      title: 'Direct CSS Usage',
      description: `Direct usage of ${token.name} value`,
      code: `.my-element {
  ${this.getCssProperty(token)}: ${this.formatTokenValue(token.value)};
}`,
      language: 'css',
      category: 'css',
    });

    return examples;
  }

  private generateReactExamples(token: DesignToken): TokenExample[] {
    const examples: TokenExample[] = [];

    // Styled components
    examples.push({
      title: 'Styled Components',
      description: `Using ${token.name} with styled-components`,
      code: `import styled from 'styled-components';

const StyledComponent = styled.div\`
  ${this.getCssProperty(token)}: \${props => props.theme.${token.name}};
\`;

// Usage
<StyledComponent />`,
      language: 'jsx',
      category: 'component',
    });

    // CSS-in-JS
    examples.push({
      title: 'CSS-in-JS Object',
      description: `Using ${token.name} in CSS-in-JS`,
      code: `const styles = {
  myElement: {
    ${this.getCamelCaseProperty(token)}: '${this.formatTokenValue(token.value)}',
  },
};

// Usage
<div style={styles.myElement} />`,
      language: 'jsx',
      category: 'component',
    });

    return examples;
  }

  private generateVueExamples(token: DesignToken): TokenExample[] {
    const examples: TokenExample[] = [];

    // Vue SFC
    examples.push({
      title: 'Vue Single File Component',
      description: `Using ${token.name} in Vue component`,
      code: `<template>
  <div class="my-element">Content</div>
</template>

<style scoped>
.my-element {
  ${this.getCssProperty(token)}: ${this.formatTokenValue(token.value)};
}
</style>`,
      language: 'vue',
      category: 'component',
    });

    return examples;
  }

  private generateAngularExamples(token: DesignToken): TokenExample[] {
    const examples: TokenExample[] = [];

    // Angular component
    examples.push({
      title: 'Angular Component',
      description: `Using ${token.name} in Angular component`,
      code: `@Component({
  selector: 'app-my-component',
  template: '<div class="my-element">Content</div>',
  styles: [\`
    .my-element {
      ${this.getCssProperty(token)}: ${this.formatTokenValue(token.value)};
    }
  \`]
})
export class MyComponent {}`,
      language: 'typescript',
      category: 'component',
    });

    return examples;
  }

  private generateSvelteExamples(token: DesignToken): TokenExample[] {
    const examples: TokenExample[] = [];

    // Svelte component
    examples.push({
      title: 'Svelte Component',
      description: `Using ${token.name} in Svelte component`,
      code: `<div class="my-element">Content</div>

<style>
  .my-element {
    ${this.getCssProperty(token)}: ${this.formatTokenValue(token.value)};
  }
</style>`,
      language: 'svelte',
      category: 'component',
    });

    return examples;
  }

  private generateTokenOverview(token: DesignToken): string {
    const sections: string[] = [];

    sections.push(`# ${token.name}`);
    
    if (token.description) {
      sections.push(token.description);
    }

    sections.push(`**Type:** ${token.type}`);
    sections.push(`**Category:** ${token.category}`);
    sections.push(`**Value:** \`${this.formatTokenValue(token.value)}\``);

    if (token.deprecated) {
      sections.push(`⚠️ **Deprecated**: ${token.replacement ? `Use \`${token.replacement}\` instead.` : 'This token is deprecated.'}`);
    }

    return sections.join('\n\n');
  }

  private generateTokenDetails(token: DesignToken): string {
    const sections: string[] = [];

    sections.push('## Details');

    // Value information
    sections.push(`**Raw Value:** \`${JSON.stringify(token.value)}\``);
    
    // Type-specific information
    switch (token.type) {
      case TokenType.COLOR:
        sections.push(this.generateColorDetails(token));
        break;
      case TokenType.DIMENSION:
        sections.push(this.generateDimensionDetails(token));
        break;
      case TokenType.FONT_FAMILY:
        sections.push(this.generateFontFamilyDetails(token));
        break;
      // Add more type-specific details as needed
    }

    // Metadata
    if (token.metadata) {
      sections.push('### Metadata');
      sections.push('```json');
      sections.push(JSON.stringify(token.metadata, null, 2));
      sections.push('```');
    }

    return sections.join('\n\n');
  }

  private generateColorDetails(token: DesignToken): string {
    const value = token.value as string;
    const sections: string[] = [];

    if (typeof value === 'string') {
      // Color format analysis
      if (value.startsWith('#')) {
        sections.push(`**Format:** Hex`);
        sections.push(`**Length:** ${value.length === 7 ? '6-digit' : '3-digit'}`);
      } else if (value.startsWith('rgb')) {
        sections.push(`**Format:** RGB${value.includes('rgba') ? 'A' : ''}`);
      } else if (value.startsWith('hsl')) {
        sections.push(`**Format:** HSL${value.includes('hsla') ? 'A' : ''}`);
      }

      // Contrast information placeholder
      sections.push(`**Accessibility:** Check contrast ratio when used as text color`);
    }

    return sections.join('\n');
  }

  private generateDimensionDetails(token: DesignToken): string {
    const value = token.value as string;
    const sections: string[] = [];

    if (typeof value === 'string') {
      const match = value.match(/^([\d.]+)(.*)$/);
      if (match) {
        sections.push(`**Numeric Value:** ${match[1]}`);
        sections.push(`**Unit:** ${match[2] || 'unitless'}`);
      }
    }

    return sections.join('\n');
  }

  private generateFontFamilyDetails(token: DesignToken): string {
    const sections: string[] = [];

    if (this.isTokenArray(token.value)) {
      const fontStack = (token.value as TokenArray).$array;
      sections.push(`**Font Stack:** ${fontStack.length} fonts`);
      sections.push(`**Primary Font:** ${fontStack[0]}`);
      sections.push(`**Fallbacks:** ${fontStack.slice(1).join(', ')}`);
    }

    return sections.join('\n');
  }

  private generateVisualPreview(token: DesignToken): string {
    const sections: string[] = [];

    sections.push('## Visual Preview');

    switch (token.category) {
      case TokenCategory.COLOR:
        sections.push(this.generateColorPreview(token));
        break;
      case TokenCategory.SPACING:
        sections.push(this.generateSpacingPreview(token));
        break;
      case TokenCategory.TYPOGRAPHY:
        sections.push(this.generateTypographyPreview(token));
        break;
      case TokenCategory.SHADOW:
        sections.push(this.generateShadowPreview(token));
        break;
      case TokenCategory.BORDER:
        sections.push(this.generateBorderPreview(token));
        break;
    }

    return sections.join('\n\n');
  }

  private generateColorPreview(token: DesignToken): string {
    const value = this.formatTokenValue(token.value);
    return `<div style="width: 100px; height: 100px; background-color: ${value}; border: 1px solid #ccc; display: inline-block; margin: 8px;"></div>

**Color:** ${value}`;
  }

  private generateSpacingPreview(token: DesignToken): string {
    const value = this.formatTokenValue(token.value);
    return `<div style="width: ${value}; height: 20px; background-color: #007bff; margin: 8px 0;"></div>

**Spacing:** ${value}`;
  }

  private generateTypographyPreview(token: DesignToken): string {
    const value = this.formatTokenValue(token.value);
    const property = this.getCssProperty(token);
    
    return `<div style="${property}: ${value};">Sample text using ${token.name}</div>

**${property}:** ${value}`;
  }

  private generateShadowPreview(token: DesignToken): string {
    const value = this.formatTokenValue(token.value);
    return `<div style="width: 100px; height: 100px; background-color: #fff; box-shadow: ${value}; border: 1px solid #eee; margin: 20px; display: inline-block;"></div>

**Shadow:** ${value}`;
  }

  private generateBorderPreview(token: DesignToken): string {
    const value = this.formatTokenValue(token.value);
    return `<div style="width: 100px; height: 100px; border: ${value}; margin: 8px; display: inline-block;"></div>

**Border:** ${value}`;
  }

  private generateUsageGuidelines(token: DesignToken, context?: TokenSemanticContext): string {
    const sections: string[] = [];

    sections.push('## Usage Guidelines');

    // Generic usage guidelines based on token type
    switch (token.category) {
      case TokenCategory.COLOR:
        sections.push('- Use for backgrounds, text, borders, and other color applications');
        sections.push('- Ensure adequate contrast ratios for accessibility');
        sections.push('- Consider context and brand guidelines');
        break;
      case TokenCategory.SPACING:
        sections.push('- Use for margins, padding, gaps, and layout spacing');
        sections.push('- Maintain consistent spacing throughout the design');
        sections.push('- Consider responsive design implications');
        break;
      case TokenCategory.TYPOGRAPHY:
        sections.push('- Use for font sizes, line heights, and typographic scale');
        sections.push('- Ensure readability across different devices');
        sections.push('- Follow accessibility guidelines for text');
        break;
    }

    // Framework-specific guidelines
    if (context?.framework) {
      sections.push(`### ${context.framework} Guidelines`);
      sections.push(this.generateFrameworkGuidelines(token, context.framework));
    }

    return sections.join('\n\n');
  }

  private generateFrameworkGuidelines(token: DesignToken, framework: string): string {
    switch (framework.toLowerCase()) {
      case 'tailwind':
        return this.generateTailwindGuidelines(token);
      case 'chakra':
        return this.generateChakraGuidelines(token);
      case 'mui':
        return this.generateMuiGuidelines(token);
      default:
        return 'Follow framework-specific best practices when using this token.';
    }
  }

  private generateTailwindGuidelines(token: DesignToken): string {
    const sections: string[] = [];

    switch (token.category) {
      case TokenCategory.COLOR:
        sections.push('- Use with Tailwind color utilities: `bg-`, `text-`, `border-`');
        sections.push('- Consider arbitrary value syntax: `bg-[#color]`');
        break;
      case TokenCategory.SPACING:
        sections.push('- Use with spacing utilities: `p-`, `m-`, `gap-`, `space-`');
        sections.push('- Compatible with Tailwind spacing scale');
        break;
    }

    return sections.join('\n');
  }

  private generateChakraGuidelines(token: DesignToken): string {
    const sections: string[] = [];

    switch (token.category) {
      case TokenCategory.COLOR:
        sections.push('- Access via `theme.colors` in component styles');
        sections.push('- Use with Chakra color props: `bg`, `color`, `borderColor`');
        break;
      case TokenCategory.SPACING:
        sections.push('- Access via `theme.space` in component styles');
        sections.push('- Use with Chakra spacing props: `p`, `m`, `gap`');
        break;
    }

    return sections.join('\n');
  }

  private generateMuiGuidelines(token: DesignToken): string {
    const sections: string[] = [];

    switch (token.category) {
      case TokenCategory.COLOR:
        sections.push('- Define in Material-UI theme palette');
        sections.push('- Access via `theme.palette` in components');
        break;
      case TokenCategory.SPACING:
        sections.push('- Use with Material-UI spacing function');
        sections.push('- Access via `theme.spacing()` in components');
        break;
    }

    return sections.join('\n');
  }

  private generateAccessibilityInfo(token: DesignToken): string {
    const sections: string[] = [];

    sections.push('## Accessibility');

    switch (token.category) {
      case TokenCategory.COLOR:
        sections.push('### Color Accessibility');
        sections.push('- Ensure WCAG AA contrast ratio (4.5:1) for normal text');
        sections.push('- Ensure WCAG AA contrast ratio (3:1) for large text');
        sections.push('- Do not rely solely on color to convey information');
        sections.push('- Consider color blindness and visual impairments');
        break;
      case TokenCategory.TYPOGRAPHY:
        sections.push('### Typography Accessibility');
        sections.push('- Maintain readable font sizes (minimum 16px for body text)');
        sections.push('- Ensure adequate line height for readability');
        sections.push('- Consider users with dyslexia and other reading difficulties');
        break;
      case TokenCategory.SPACING:
        sections.push('### Spacing Accessibility');
        sections.push('- Provide adequate touch target sizes (minimum 44px)');
        sections.push('- Ensure sufficient spacing between interactive elements');
        sections.push('- Consider users with motor impairments');
        break;
    }

    return sections.join('\n\n');
  }

  private findRelatedTokens(token: DesignToken): string[] {
    // Simple implementation - in practice, this would use semantic analysis
    const related: string[] = [];
    const nameParts = token.name.split('.');
    
    // Find tokens with similar name patterns
    if (nameParts.length > 1) {
      const base = nameParts.slice(0, -1).join('.');
      // Would search through all tokens to find related ones
      // For now, just return suggested related patterns
      related.push(`${base}.light`, `${base}.dark`, `${base}.variant`);
    }

    return related.filter(name => name !== token.name);
  }

  private generateMigrationNotes(token: DesignToken, context?: TokenSemanticContext): string[] | undefined {
    if (!context?.sourceFramework || !token.deprecated) {
      return undefined;
    }

    const notes: string[] = [];

    if (token.deprecated) {
      notes.push(`This token is deprecated and will be removed in a future version.`);
      
      if (token.replacement) {
        notes.push(`Use \`${token.replacement}\` instead.`);
        notes.push(`Example: Replace \`${token.name}\` with \`${token.replacement}\` in your code.`);
      }
    }

    // Framework-specific migration notes
    if (context.sourceFramework !== context.framework) {
      notes.push(`When migrating from ${context.sourceFramework} to ${context.framework}:`);
      notes.push(this.generateFrameworkMigrationNotes(token, context.sourceFramework, context.framework!));
    }

    return notes.length > 0 ? notes : undefined;
  }

  private generateFrameworkMigrationNotes(token: DesignToken, sourceFramework: string, targetFramework: string): string {
    // Framework-specific migration guidance
    const migrationMap: Record<string, Record<string, string>> = {
      'tailwind': {
        'chakra': 'Update class names to match Chakra UI conventions',
        'mui': 'Convert to Material-UI theme structure',
      },
      'chakra': {
        'tailwind': 'Convert theme values to Tailwind configuration',
        'mui': 'Restructure for Material-UI theme format',
      },
    };

    return migrationMap[sourceFramework]?.[targetFramework] || 
           `Review framework documentation for migration guidance from ${sourceFramework} to ${targetFramework}.`;
  }

  private generateMigrationHeader(context: TokenMigrationContext): string {
    return `# Token Migration Guide

Migrating from **${context.sourceFramework}** to **${context.targetFramework}**

Generated on: ${new Date().toISOString()}`;
  }

  private generateMigrationOverview(
    sourceTokens: DesignToken[],
    targetTokens: DesignToken[],
    context: TokenMigrationContext
  ): string {
    const sections: string[] = [];

    sections.push('## Overview');
    sections.push(`This guide covers the migration of ${sourceTokens.length} design tokens from ${context.sourceFramework} to ${context.targetFramework}.`);
    sections.push(`Target system will contain ${targetTokens.length} tokens after migration.`);

    // Summary statistics
    const sourceCategories = new Set(sourceTokens.map(t => t.category));
    const targetCategories = new Set(targetTokens.map(t => t.category));
    
    sections.push(`**Categories affected:** ${Array.from(sourceCategories).join(', ')}`);
    sections.push(`**New categories:** ${Array.from(targetCategories).filter(c => !sourceCategories.has(c)).join(', ') || 'None'}`);

    return sections.join('\n\n');
  }

  private generateTokenMappingTable(sourceTokens: DesignToken[], targetTokens: DesignToken[]): string {
    const sections: string[] = [];

    sections.push('## Token Mapping');
    sections.push('| Source Token | Target Token | Type | Notes |');
    sections.push('|--------------|--------------|------|-------|');

    // Simple mapping - in practice, this would use sophisticated mapping logic
    sourceTokens.forEach((sourceToken, index) => {
      const targetToken = targetTokens[index] || null;
      const targetName = targetToken?.name || '*Manual mapping required*';
      const notes = targetToken ? 'Automatic' : 'Requires manual review';
      
      sections.push(`| \`${sourceToken.name}\` | \`${targetName}\` | ${sourceToken.type} | ${notes} |`);
    });

    return sections.join('\n');
  }

  private generateBreakingChanges(sourceTokens: DesignToken[], targetTokens: DesignToken[]): string {
    const sections: string[] = [];

    sections.push('## Breaking Changes');

    // Find deprecated or removed tokens
    const deprecatedTokens = sourceTokens.filter(t => t.deprecated);
    if (deprecatedTokens.length > 0) {
      sections.push('### Deprecated Tokens');
      deprecatedTokens.forEach(token => {
        sections.push(`- **${token.name}**: ${token.replacement ? `Use \`${token.replacement}\` instead` : 'No direct replacement'}`);
      });
    }

    // Find value changes (simplified)
    sections.push('### Value Changes');
    sections.push('Review all token values carefully as some may have changed during migration.');

    return sections.join('\n\n');
  }

  private generateMigrationSteps(context: TokenMigrationContext): string {
    const sections: string[] = [];

    sections.push('## Migration Steps');
    sections.push('1. **Backup your current implementation**');
    sections.push('2. **Update token definitions** using the mapping table above');
    sections.push('3. **Update imports and references** in your codebase');
    sections.push('4. **Test visual changes** in your application');
    sections.push('5. **Validate accessibility** after migration');
    sections.push('6. **Update documentation** to reflect changes');

    return sections.join('\n');
  }

  private generateMigrationCodeExamples(
    sourceTokens: DesignToken[],
    targetTokens: DesignToken[],
    context: TokenMigrationContext
  ): string {
    const sections: string[] = [];

    sections.push('## Code Examples');

    // Before/after examples
    if (sourceTokens.length > 0 && targetTokens.length > 0) {
      const sourceExample = sourceTokens[0];
      const targetExample = targetTokens[0];

      sections.push('### Before (Source)');
      sections.push('```css');
      sections.push(`.element {
  ${this.getCssProperty(sourceExample)}: ${this.formatTokenValue(sourceExample.value)};
}`);
      sections.push('```');

      sections.push('### After (Target)');
      sections.push('```css');
      sections.push(`.element {
  ${this.getCssProperty(targetExample)}: ${this.formatTokenValue(targetExample.value)};
}`);
      sections.push('```');
    }

    return sections.join('\n\n');
  }

  private generateMigrationValidation(): string {
    const sections: string[] = [];

    sections.push('## Validation and Testing');
    sections.push('### Automated Testing');
    sections.push('- Run visual regression tests');
    sections.push('- Validate token usage across components');
    sections.push('- Check for unused or missing tokens');

    sections.push('### Manual Review');
    sections.push('- Review color contrast ratios');
    sections.push('- Verify spacing and layout consistency');
    sections.push('- Test responsive behavior');
    sections.push('- Validate dark mode compatibility (if applicable)');

    return sections.join('\n\n');
  }

  private generateMarkdownUsageDoc(tokens: DesignToken[]): string {
    const sections: string[] = [];

    sections.push('# Design Token Usage Guide');
    sections.push('');

    // Group by category
    const tokensByCategory = this.groupTokensByCategory(tokens);

    for (const [category, categoryTokens] of Array.from(tokensByCategory)) {
      sections.push(`## ${this.formatCategoryName(category)}`);
      sections.push('');

      categoryTokens.forEach(token => {
        sections.push(`### ${token.name}`);
        if (token.description) {
          sections.push(token.description);
        }
        sections.push(`**Value:** \`${this.formatTokenValue(token.value)}\``);
        sections.push('');
      });
    }

    return sections.join('\n');
  }

  private generateHtmlUsageDoc(tokens: DesignToken[]): string {
    // HTML documentation generation
    return `<!DOCTYPE html>
<html>
<head>
    <title>Design Token Usage Guide</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; }
        .token { margin: 1rem 0; padding: 1rem; border: 1px solid #eee; }
        .token-name { font-weight: bold; color: #333; }
        .token-value { font-family: monospace; background: #f5f5f5; padding: 0.25rem; }
    </style>
</head>
<body>
    <h1>Design Token Usage Guide</h1>
    ${tokens.map(token => `
        <div class="token">
            <div class="token-name">${token.name}</div>
            <div class="token-description">${token.description || ''}</div>
            <div class="token-value">${this.formatTokenValue(token.value)}</div>
        </div>
    `).join('')}
</body>
</html>`;
  }

  private generateJsonUsageDoc(tokens: DesignToken[]): string {
    const doc = {
      title: 'Design Token Usage Guide',
      generatedAt: new Date().toISOString(),
      tokens: tokens.map(token => ({
        name: token.name,
        value: token.value,
        type: token.type,
        category: token.category,
        description: token.description,
        usage: this.generateTokenUsageInfo(token),
      })),
    };

    return JSON.stringify(doc, null, 2);
  }

  private generateStorybookUsageDoc(tokens: DesignToken[]): string {
    // Generate Storybook-compatible documentation
    return `import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Tokens',
  parameters: {
    docs: {
      description: {
        component: 'Design token usage examples and documentation.',
      },
    },
  },
};

export default meta;

${tokens.map(token => `
export const ${this.sanitizeForStorybook(token.name)}: StoryObj = {
  name: '${token.name}',
  render: () => (
    <div>
      <h3>${token.name}</h3>
      <p>${token.description || 'No description available'}</p>
      <code>${this.formatTokenValue(token.value)}</code>
    </div>
  ),
};
`).join('')}`;
  }

  private exportMarkdownDocumentation(
    documentation: TokenDocumentation[],
    options: DocumentationExportOptions
  ): string {
    const sections: string[] = [];

    // Header
    sections.push('# Design Token Documentation');
    sections.push('');
    sections.push(`Generated on: ${new Date().toISOString()}`);
    sections.push('');

    // Table of contents
    if (options.includeTableOfContents) {
      sections.push('## Table of Contents');
      documentation.forEach(doc => {
        sections.push(`- [${doc.token.name}](#${doc.token.name.replace(/\./g, '-').toLowerCase()})`);
      });
      sections.push('');
    }

    // Documentation for each token
    documentation.forEach(doc => {
      sections.push(doc.documentation);
      
      if (doc.examples.length > 0) {
        sections.push('### Examples');
        doc.examples.forEach(example => {
          sections.push(`#### ${example.title}`);
          if (example.description) {
            sections.push(example.description);
          }
          sections.push('```' + example.language);
          sections.push(example.code);
          sections.push('```');
          sections.push('');
        });
      }

      sections.push('---');
      sections.push('');
    });

    return sections.join('\n');
  }

  private exportHtmlDocumentation(
    documentation: TokenDocumentation[],
    options: DocumentationExportOptions
  ): string {
    const customCSS = options.customStyling || this.getDefaultHtmlStyling();
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>Design Token Documentation</title>
    <style>${customCSS}</style>
</head>
<body>
    <div class="container">
        <h1>Design Token Documentation</h1>
        <p>Generated on: ${new Date().toISOString()}</p>
        
        ${documentation.map(doc => `
            <div class="token-doc">
                ${doc.documentation.replace(/\n/g, '<br>')}
                
                ${doc.examples.length > 0 ? `
                    <div class="examples">
                        <h3>Examples</h3>
                        ${doc.examples.map(example => `
                            <div class="example">
                                <h4>${example.title}</h4>
                                ${example.description ? `<p>${example.description}</p>` : ''}
                                <pre><code class="language-${example.language}">${example.code}</code></pre>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  private exportJsonDocumentation(
    documentation: TokenDocumentation[],
    options: DocumentationExportOptions
  ): string {
    const exportData = {
      title: 'Design Token Documentation',
      generatedAt: new Date().toISOString(),
      options,
      documentation: documentation.map(doc => ({
        token: {
          name: doc.token.name,
          value: doc.token.value,
          type: doc.token.type,
          category: doc.token.category,
          description: doc.token.description,
        },
        documentation: doc.documentation,
        examples: doc.examples,
        related: doc.related,
        migrationNotes: doc.migrationNotes,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  private exportStorybookDocumentation(
    documentation: TokenDocumentation[],
    options: DocumentationExportOptions
  ): string {
    // Generate comprehensive Storybook documentation
    return `import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Token Documentation',
  parameters: {
    docs: {
      description: {
        component: 'Comprehensive design token documentation with examples and usage guidelines.',
      },
    },
  },
};

export default meta;

${documentation.map(doc => `
export const ${this.sanitizeForStorybook(doc.token.name)}: StoryObj = {
  name: '${doc.token.name}',
  parameters: {
    docs: {
      description: {
        story: \`${doc.documentation.replace(/`/g, '\\`')}\`,
      },
    },
  },
  render: () => (
    <div>
      <h2>${doc.token.name}</h2>
      <p><strong>Value:</strong> <code>${this.formatTokenValue(doc.token.value)}</code></p>
      <p><strong>Type:</strong> ${doc.token.type}</p>
      <p><strong>Category:</strong> ${doc.token.category}</p>
      ${doc.token.description ? `<p>${doc.token.description}</p>` : ''}
      
      ${doc.examples.length > 0 ? `
        <div>
          <h3>Examples</h3>
          ${doc.examples.map(example => `
            <div key="${example.title}">
              <h4>${example.title}</h4>
              <pre><code>${example.code}</code></pre>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  ),
};
`).join('')}`;
  }

  // Helper methods
  private getCacheKey(token: DesignToken, context?: TokenSemanticContext): string {
    return `${token.name}-${token.type}-${context?.framework || 'default'}`;
  }

  private formatTokenValue(value: TokenValue): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    
    if (this.isTokenReference(value)) {
      return `var(--${(value as TokenReference).$ref.replace(/\./g, '-')})`;
    }
    
    if (this.isTokenArray(value)) {
      return (value as TokenArray).$array.map(v => this.formatTokenValue(v)).join(', ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  private getCssProperty(token: DesignToken): string {
    switch (token.category) {
      case TokenCategory.COLOR:
        return 'color';
      case TokenCategory.SPACING:
        return 'margin';
      case TokenCategory.TYPOGRAPHY:
        return token.type === TokenType.DIMENSION ? 'font-size' : 'font-family';
      case TokenCategory.BORDER:
        return 'border';
      case TokenCategory.SHADOW:
        return 'box-shadow';
      default:
        return 'property';
    }
  }

  private getCamelCaseProperty(token: DesignToken): string {
    const kebabCase = this.getCssProperty(token);
    return kebabCase.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private isVisualToken(token: DesignToken): boolean {
    return [
      TokenCategory.COLOR,
      TokenCategory.SPACING,
      TokenCategory.SHADOW,
      TokenCategory.BORDER,
      TokenCategory.GRADIENT,
    ].includes(token.category);
  }

  private isTokenReference(value: any): boolean {
    return value && typeof value === 'object' && '$ref' in value;
  }

  private isTokenArray(value: any): boolean {
    return value && typeof value === 'object' && '$array' in value;
  }

  private groupTokensByCategory(tokens: DesignToken[]): Map<TokenCategory, DesignToken[]> {
    const grouped = new Map<TokenCategory, DesignToken[]>();
    
    tokens.forEach(token => {
      if (!grouped.has(token.category)) {
        grouped.set(token.category, []);
      }
      grouped.get(token.category)!.push(token);
    });
    
    return grouped;
  }

  private formatCategoryName(category: TokenCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  }

  private generateTokenUsageInfo(token: DesignToken): Record<string, any> {
    return {
      cssProperty: this.getCssProperty(token),
      cssValue: this.formatTokenValue(token.value),
      jsProperty: this.getCamelCaseProperty(token),
      category: token.category,
      type: token.type,
    };
  }

  private sanitizeForStorybook(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, 'Token$&');
  }

  private getDefaultHtmlStyling(): string {
    return `
      body {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      .container {
        background: #fff;
      }
      
      .token-doc {
        margin: 2rem 0;
        padding: 1.5rem;
        border: 1px solid #eee;
        border-radius: 8px;
      }
      
      .examples {
        margin-top: 1rem;
      }
      
      .example {
        margin: 1rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
      }
      
      pre {
        background: #f1f3f4;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
      }
      
      code {
        background: #f1f3f4;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        font-family: 'SF Mono', Consolas, monospace;
      }
      
      h1, h2, h3, h4 {
        color: #1a1a1a;
      }
    `;
  }
}

/**
 * Token documentation generator registry
 */
export class TokenDocumentationGeneratorRegistry {
  private generators = new Map<string, TokenDocumentationGenerator>();

  constructor() {
    // Register default generator
    this.register('base', new BaseTokenDocumentationGenerator());
  }

  register(name: string, generator: TokenDocumentationGenerator): void {
    this.generators.set(name, generator);
  }

  getGenerator(name: string = 'base'): TokenDocumentationGenerator {
    const generator = this.generators.get(name);
    if (!generator) {
      throw new Error(`No documentation generator available for: ${name}`);
    }
    return generator;
  }

  getAvailableGenerators(): string[] {
    return Array.from(this.generators.keys());
  }

  async generateTokenDocumentation(
    token: DesignToken,
    context?: TokenSemanticContext,
    generatorName: string = 'base'
  ): Promise<TokenDocumentation> {
    const generator = this.getGenerator(generatorName);
    return generator.generateTokenDocumentation(token, context);
  }

  async generateTokensDocumentation(
    tokens: DesignToken[],
    context?: TokenSemanticContext,
    generatorName: string = 'base'
  ): Promise<TokenDocumentation[]> {
    const generator = this.getGenerator(generatorName);
    return generator.generateTokensDocumentation(tokens, context);
  }

  async generateMigrationGuide(
    sourceTokens: DesignToken[],
    targetTokens: DesignToken[],
    migrationContext: TokenMigrationContext,
    generatorName: string = 'base'
  ): Promise<string> {
    const generator = this.getGenerator(generatorName);
    return generator.generateMigrationGuide(sourceTokens, targetTokens, migrationContext);
  }

  async exportDocumentation(
    documentation: TokenDocumentation[],
    format: DocumentationFormat,
    options?: DocumentationExportOptions,
    generatorName: string = 'base'
  ): Promise<string> {
    const generator = this.getGenerator(generatorName);
    return generator.exportDocumentation(documentation, format, options);
  }
}