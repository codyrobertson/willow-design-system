import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenUsage,
  TokenUsageLocation,
  TokenSemanticContext,
  TokenMigrationContext,
  StyleTransformationContext,
} from '../../types/theme-tokens.types';
import * as ts from 'typescript';
import * as path from 'path';

/**
 * Token usage tracking interface
 */
export interface TokenUsageTracker {
  /**
   * Scan files to find token usage
   */
  scanForTokenUsage(
    filePaths: string[],
    tokens: DesignToken[],
    context?: TokenUsageTrackingContext
  ): Promise<TokenUsageReport>;

  /**
   * Track usage in a specific file
   */
  trackFileUsage(
    filePath: string,
    content: string,
    tokens: DesignToken[],
    context?: TokenUsageTrackingContext
  ): Promise<TokenUsage[]>;

  /**
   * Generate usage analytics
   */
  generateUsageAnalytics(
    usageReport: TokenUsageReport
  ): Promise<TokenUsageAnalytics>;

  /**
   * Find unused tokens
   */
  findUnusedTokens(
    tokens: DesignToken[],
    usageReport: TokenUsageReport
  ): DesignToken[];

  /**
   * Generate refactoring suggestions
   */
  generateRefactoringSuggestions(
    usageReport: TokenUsageReport,
    context?: TokenMigrationContext
  ): Promise<RefactoringSuggestion[]>;
}

/**
 * Token usage tracking context
 */
export interface TokenUsageTrackingContext extends StyleTransformationContext {
  /** File patterns to include */
  includePatterns?: string[];
  
  /** File patterns to exclude */
  excludePatterns?: string[];
  
  /** Maximum search depth */
  maxDepth?: number;
  
  /** Track usage in comments */
  trackComments?: boolean;
  
  /** Track usage in strings */
  trackStrings?: boolean;
  
  /** Custom token pattern matchers */
  customMatchers?: TokenMatcher[];
  
  /** Framework-specific tracking rules */
  frameworkRules?: FrameworkTrackingRules;
  
  /** Include dependency analysis */
  includeDependencies?: boolean;
}

/**
 * Token usage report
 */
export interface TokenUsageReport {
  /** Scan metadata */
  metadata: {
    scannedFiles: number;
    scannedLines: number;
    scanDuration: number;
    timestamp: string;
    context: TokenUsageTrackingContext;
  };
  
  /** Token usage data */
  tokenUsages: Map<string, TokenUsage>;
  
  /** File-level usage summary */
  fileUsages: Map<string, FileUsageSummary>;
  
  /** Unused tokens */
  unusedTokens: DesignToken[];
  
  /** Usage patterns */
  usagePatterns: UsagePattern[];
  
  /** Dependency graph */
  dependencyGraph?: TokenDependencyGraph;
}

/**
 * Token usage analytics
 */
export interface TokenUsageAnalytics {
  /** Total tokens tracked */
  totalTokens: number;
  
  /** Used tokens count */
  usedTokens: number;
  
  /** Unused tokens count */
  unusedTokens: number;
  
  /** Usage by category */
  usageByCategory: Map<TokenCategory, number>;
  
  /** Usage by file type */
  usageByFileType: Map<string, number>;
  
  /** Most used tokens */
  mostUsedTokens: Array<{ token: string; count: number }>;
  
  /** Least used tokens */
  leastUsedTokens: Array<{ token: string; count: number }>;
  
  /** Usage trends */
  usageTrends: UsageTrend[];
  
  /** Hot spots (files with most token usage) */
  hotSpots: Array<{ file: string; tokenCount: number; uniqueTokens: number }>;
  
  /** Coverage metrics */
  coverage: {
    tokenCoverage: number; // % of tokens used
    fileCoverage: number; // % of files using tokens
    categoryCoverage: Map<TokenCategory, number>;
  };
}

/**
 * File usage summary
 */
export interface FileUsageSummary {
  filePath: string;
  tokenCount: number;
  uniqueTokens: string[];
  usagesByCategory: Map<TokenCategory, number>;
  lastModified: string;
  fileSize: number;
  language: string;
}

/**
 * Usage pattern detection
 */
export interface UsagePattern {
  pattern: string;
  description: string;
  examples: string[];
  frequency: number;
  confidence: number;
  category: 'good' | 'warning' | 'error';
  suggestion?: string;
}

/**
 * Token dependency graph
 */
export interface TokenDependencyGraph {
  nodes: TokenNode[];
  edges: TokenEdge[];
  clusters: TokenCluster[];
}

export interface TokenNode {
  id: string;
  tokenName: string;
  type: TokenType;
  category: TokenCategory;
  usageCount: number;
  files: string[];
}

export interface TokenEdge {
  source: string;
  target: string;
  relationship: 'reference' | 'similar' | 'composite' | 'derived';
  weight: number;
}

export interface TokenCluster {
  id: string;
  name: string;
  tokens: string[];
  category: TokenCategory;
  cohesion: number;
}

/**
 * Token matcher for custom patterns
 */
export interface TokenMatcher {
  name: string;
  pattern: RegExp | ((content: string) => TokenMatch[]);
  fileTypes: string[];
  priority: number;
}

export interface TokenMatch {
  tokenName: string;
  start: number;
  end: number;
  context: string;
  confidence: number;
}

/**
 * Framework-specific tracking rules
 */
export interface FrameworkTrackingRules {
  framework: string;
  patterns: {
    cssVariables: RegExp[];
    themeAccess: RegExp[];
    componentProps: RegExp[];
    imports: RegExp[];
  };
  transformations: {
    nameMapping: Map<string, string>;
    valueMapping: Map<string, string>;
  };
}

/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
  type: 'consolidate' | 'rename' | 'remove' | 'extract' | 'migrate';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  confidence: number;
  affectedFiles: string[];
  affectedTokens: string[];
  beforeExample?: string;
  afterExample?: string;
  automatable: boolean;
  steps: string[];
}

/**
 * Usage trend analysis
 */
export interface UsageTrend {
  period: string;
  tokenName: string;
  usageCount: number;
  changeFromPrevious: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Base token usage tracker implementation
 */
export class BaseTokenUsageTracker implements TokenUsageTracker {
  private fileCache = new Map<string, string>();
  private astCache = new Map<string, ts.SourceFile>();
  private usageCache = new Map<string, TokenUsage[]>();
  private trackingContext: TokenUsageTrackingContext;

  constructor(context: TokenUsageTrackingContext = {}) {
    this.trackingContext = {
      includePatterns: ['**/*.{ts,tsx,js,jsx,css,scss,sass,less,vue,svelte}'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      maxDepth: 10,
      trackComments: false,
      trackStrings: true,
      customMatchers: [],
      includeDependencies: true,
      ...context,
    };
  }

  async scanForTokenUsage(
    filePaths: string[],
    tokens: DesignToken[],
    context?: TokenUsageTrackingContext
  ): Promise<TokenUsageReport> {
    const startTime = performance.now();
    const scanContext = { ...this.trackingContext, ...context };
    
    const tokenUsages = new Map<string, TokenUsage>();
    const fileUsages = new Map<string, FileUsageSummary>();
    let scannedLines = 0;

    // Create token lookup for efficient searching
    const tokenLookup = new Map<string, DesignToken>();
    tokens.forEach(token => tokenLookup.set(token.name, token));

    // Process files in batches
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchPromises = batch.map(async filePath => {
        try {
          const content = await this.readFile(filePath);
          scannedLines += content.split('\n').length;
          
          const fileUsage = await this.trackFileUsage(filePath, content, tokens, scanContext);
          
          // Aggregate usage data
          fileUsage.forEach(usage => {
            if (tokenUsages.has(usage.tokenName)) {
              const existing = tokenUsages.get(usage.tokenName)!;
              existing.locations.push(...usage.locations);
              existing.count += usage.count;
              existing.lastUsed = usage.lastUsed;
            } else {
              tokenUsages.set(usage.tokenName, usage);
            }
          });

          // Create file summary
          const uniqueTokens = [...new Set(fileUsage.map(u => u.tokenName))];
          const usagesByCategory = new Map<TokenCategory, number>();
          
          uniqueTokens.forEach(tokenName => {
            const token = tokenLookup.get(tokenName);
            if (token) {
              const count = usagesByCategory.get(token.category) || 0;
              usagesByCategory.set(token.category, count + 1);
            }
          });

          fileUsages.set(filePath, {
            filePath,
            tokenCount: fileUsage.reduce((sum, u) => sum + u.count, 0),
            uniqueTokens,
            usagesByCategory,
            lastModified: new Date().toISOString(),
            fileSize: content.length,
            language: this.detectLanguage(filePath),
          });

        } catch (error) {
          console.warn(`Failed to scan file ${filePath}:`, error);
        }
      });

      await Promise.all(batchPromises);
    }

    // Find unused tokens
    const usedTokenNames = new Set(tokenUsages.keys());
    const unusedTokens = tokens.filter(token => !usedTokenNames.has(token.name));

    // Detect usage patterns
    const usagePatterns = this.detectUsagePatterns(tokenUsages, fileUsages);

    // Build dependency graph if requested
    const dependencyGraph = scanContext.includeDependencies 
      ? this.buildDependencyGraph(tokens, tokenUsages)
      : undefined;

    const endTime = performance.now();

    return {
      metadata: {
        scannedFiles: filePaths.length,
        scannedLines,
        scanDuration: endTime - startTime,
        timestamp: new Date().toISOString(),
        context: scanContext,
      },
      tokenUsages,
      fileUsages,
      unusedTokens,
      usagePatterns,
      dependencyGraph,
    };
  }

  async trackFileUsage(
    filePath: string,
    content: string,
    tokens: DesignToken[],
    context?: TokenUsageTrackingContext
  ): Promise<TokenUsage[]> {
    const cacheKey = `${filePath}-${this.hashContent(content)}`;
    if (this.usageCache.has(cacheKey)) {
      return this.usageCache.get(cacheKey)!;
    }

    const trackingContext = { ...this.trackingContext, ...context };
    const usages: TokenUsage[] = [];
    const language = this.detectLanguage(filePath);

    // Create token patterns for efficient searching
    const tokenPatterns = this.createTokenPatterns(tokens, language, trackingContext);

    // Track usage based on file type
    switch (language) {
      case 'typescript':
      case 'javascript':
        usages.push(...await this.trackJavaScriptUsage(filePath, content, tokenPatterns, trackingContext));
        break;
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        usages.push(...this.trackCSSUsage(filePath, content, tokenPatterns, trackingContext));
        break;
      case 'vue':
        usages.push(...this.trackVueUsage(filePath, content, tokenPatterns, trackingContext));
        break;
      case 'svelte':
        usages.push(...this.trackSvelteUsage(filePath, content, tokenPatterns, trackingContext));
        break;
      default:
        usages.push(...this.trackGenericUsage(filePath, content, tokenPatterns, trackingContext));
    }

    // Apply custom matchers
    if (trackingContext.customMatchers) {
      for (const matcher of trackingContext.customMatchers) {
        if (matcher.fileTypes.includes(language)) {
          const customUsages = this.applyCustomMatcher(filePath, content, tokens, matcher);
          usages.push(...customUsages);
        }
      }
    }

    this.usageCache.set(cacheKey, usages);
    return usages;
  }

  async generateUsageAnalytics(usageReport: TokenUsageReport): Promise<TokenUsageAnalytics> {
    const { tokenUsages, fileUsages, unusedTokens, metadata } = usageReport;
    
    const totalTokens = tokenUsages.size + unusedTokens.length;
    const usedTokens = tokenUsages.size;

    // Usage by category
    const usageByCategory = new Map<TokenCategory, number>();
    const usageByFileType = new Map<string, number>();

    for (const [tokenName, usage] of Array.from(tokenUsages)) {
      // This would require token lookup - simplified for now
      usageByCategory.set(TokenCategory.CUSTOM, (usageByCategory.get(TokenCategory.CUSTOM) || 0) + 1);
    }

    for (const [filePath, fileUsage] of Array.from(fileUsages)) {
      const fileType = this.detectLanguage(filePath);
      usageByFileType.set(fileType, (usageByFileType.get(fileType) || 0) + fileUsage.tokenCount);
    }

    // Most/least used tokens
    const tokenCounts = Array.from(tokenUsages).map(([name, usage]) => ({
      token: name,
      count: usage.count,
    }));

    const mostUsedTokens = tokenCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const leastUsedTokens = tokenCounts
      .filter(t => t.count > 0)
      .sort((a, b) => a.count - b.count)
      .slice(0, 10);

    // Hot spots
    const hotSpots = Array.from(fileUsages)
      .map(([file, usage]) => ({
        file,
        tokenCount: usage.tokenCount,
        uniqueTokens: usage.uniqueTokens.length,
      }))
      .sort((a, b) => b.tokenCount - a.tokenCount)
      .slice(0, 10);

    // Coverage metrics
    const tokenCoverage = totalTokens > 0 ? (usedTokens / totalTokens) * 100 : 0;
    const filesWithTokens = Array.from(fileUsages).filter(([_, usage]) => usage.tokenCount > 0).length;
    const fileCoverage = metadata.scannedFiles > 0 ? (filesWithTokens / metadata.scannedFiles) * 100 : 0;
    
    const categoryCoverage = new Map<TokenCategory, number>();
    // Would need access to original tokens to calculate category coverage

    return {
      totalTokens,
      usedTokens,
      unusedTokens: unusedTokens.length,
      usageByCategory,
      usageByFileType,
      mostUsedTokens,
      leastUsedTokens,
      usageTrends: [], // Would require historical data
      hotSpots,
      coverage: {
        tokenCoverage,
        fileCoverage,
        categoryCoverage,
      },
    };
  }

  findUnusedTokens(tokens: DesignToken[], usageReport: TokenUsageReport): DesignToken[] {
    return usageReport.unusedTokens;
  }

  async generateRefactoringSuggestions(
    usageReport: TokenUsageReport,
    context?: TokenMigrationContext
  ): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];
    const { tokenUsages, unusedTokens, usagePatterns } = usageReport;

    // Suggest removing unused tokens
    if (unusedTokens.length > 0) {
      suggestions.push({
        type: 'remove',
        title: `Remove ${unusedTokens.length} unused tokens`,
        description: `These tokens are not used anywhere in the codebase and can be safely removed.`,
        impact: 'low',
        effort: 'low',
        confidence: 0.9,
        affectedFiles: [],
        affectedTokens: unusedTokens.map(t => t.name),
        automatable: true,
        steps: [
          'Review unused tokens list',
          'Confirm tokens are not used in external systems',
          'Remove token definitions',
          'Update documentation',
        ],
      });
    }

    // Suggest consolidating similar tokens
    const similarTokenGroups = this.findSimilarTokens(tokenUsages);
    for (const group of similarTokenGroups) {
      if (group.length > 1) {
        suggestions.push({
          type: 'consolidate',
          title: `Consolidate ${group.length} similar tokens`,
          description: `These tokens have similar values and could be consolidated into a single token.`,
          impact: 'medium',
          effort: 'medium',
          confidence: 0.7,
          affectedFiles: Array.from(new Set(group.flatMap(name => {
            const usage = tokenUsages.get(name);
            return usage ? usage.locations.map(l => l.filePath) : [];
          }))),
          affectedTokens: group,
          automatable: false,
          steps: [
            'Analyze token usage patterns',
            'Choose canonical token name',
            'Create migration mapping',
            'Update all references',
            'Remove duplicate tokens',
          ],
        });
      }
    }

    // Suggest extracting common patterns
    const extractionOpportunities = this.findExtractionOpportunities(usagePatterns);
    for (const opportunity of extractionOpportunities) {
      suggestions.push({
        type: 'extract',
        title: opportunity.title,
        description: opportunity.description,
        impact: 'medium',
        effort: 'high',
        confidence: opportunity.confidence,
        affectedFiles: opportunity.files,
        affectedTokens: [],
        beforeExample: opportunity.beforeExample,
        afterExample: opportunity.afterExample,
        automatable: false,
        steps: opportunity.steps,
      });
    }

    // Framework-specific migration suggestions
    if (context?.targetFramework) {
      const migrationSuggestions = this.generateMigrationSuggestions(tokenUsages, context);
      suggestions.push(...migrationSuggestions);
    }

    return suggestions.sort((a, b) => (b.confidence * this.getImpactWeight(b.impact)) - (a.confidence * this.getImpactWeight(a.impact)));
  }

  // Private helper methods

  private async readFile(filePath: string): Promise<string> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }

    // In a real implementation, this would read from filesystem
    // For now, return empty string as placeholder
    const content = '';
    this.fileCache.set(filePath, content);
    return content;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
    };
    return langMap[ext] || 'unknown';
  }

  private hashContent(content: string): string {
    // Simple hash for caching - in production, use a proper hash function
    return content.length.toString() + content.slice(0, 100);
  }

  private createTokenPatterns(
    tokens: DesignToken[],
    language: string,
    context: TokenUsageTrackingContext
  ): Map<string, RegExp[]> {
    const patterns = new Map<string, RegExp[]>();

    tokens.forEach(token => {
      const tokenPatterns: RegExp[] = [];
      const escapedName = token.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      switch (language) {
        case 'typescript':
        case 'javascript':
          // Theme object access: theme.colors.primary
          tokenPatterns.push(new RegExp(`theme\\.${escapedName.replace(/\./g, '\\.')}`, 'g'));
          // CSS variable: var(--colors-primary)
          tokenPatterns.push(new RegExp(`var\\(--${escapedName.replace(/\./g, '-')}\\)`, 'g'));
          // String literal: 'colors.primary'
          if (context.trackStrings) {
            tokenPatterns.push(new RegExp(`['"\`]${escapedName}['"\`]`, 'g'));
          }
          break;

        case 'css':
        case 'scss':
        case 'sass':
        case 'less':
          // CSS variables
          tokenPatterns.push(new RegExp(`var\\(--${escapedName.replace(/\./g, '-')}\\)`, 'g'));
          // SCSS variables
          tokenPatterns.push(new RegExp(`\\$${escapedName.replace(/\./g, '-')}`, 'g'));
          break;

        case 'vue':
          // Vue template usage
          tokenPatterns.push(new RegExp(`\\$${escapedName.replace(/\./g, '\\.')}`, 'g'));
          tokenPatterns.push(new RegExp(`theme\\.${escapedName.replace(/\./g, '\\.')}`, 'g'));
          break;
      }

      patterns.set(token.name, tokenPatterns);
    });

    return patterns;
  }

  private async trackJavaScriptUsage(
    filePath: string,
    content: string,
    tokenPatterns: Map<string, RegExp[]>,
    context: TokenUsageTrackingContext
  ): Promise<TokenUsage[]> {
    const usages: TokenUsage[] = [];

    // Use TypeScript compiler API for precise analysis
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      // Track property access: theme.colors.primary
      if (ts.isPropertyAccessExpression(node)) {
        const fullText = node.getFullText(sourceFile);
        for (const [tokenName, patterns] of Array.from(tokenPatterns)) {
          for (const pattern of patterns) {
            const matches = fullText.match(pattern);
            if (matches) {
              this.addTokenUsage(usages, tokenName, filePath, node, sourceFile, context);
            }
          }
        }
      }

      // Track string literals
      if (ts.isStringLiteral(node) && context.trackStrings) {
        const text = node.text;
        for (const [tokenName, patterns] of Array.from(tokenPatterns)) {
          for (const pattern of patterns) {
            if (pattern.test(text)) {
              this.addTokenUsage(usages, tokenName, filePath, node, sourceFile, context);
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return usages;
  }

  private trackCSSUsage(
    filePath: string,
    content: string,
    tokenPatterns: Map<string, RegExp[]>,
    context: TokenUsageTrackingContext
  ): TokenUsage[] {
    const usages: TokenUsage[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      for (const [tokenName, patterns] of Array.from(tokenPatterns)) {
        for (const pattern of patterns) {
          const matches = [...line.matchAll(pattern)];
          matches.forEach(match => {
            const usage = this.createTokenUsage(
              tokenName,
              filePath,
              lineIndex + 1,
              match.index || 0,
              line.trim(),
              context
            );
            this.mergeUsage(usages, usage);
          });
        }
      }
    });

    return usages;
  }

  private trackVueUsage(
    filePath: string,
    content: string,
    tokenPatterns: Map<string, RegExp[]>,
    context: TokenUsageTrackingContext
  ): TokenUsage[] {
    const usages: TokenUsage[] = [];

    // Parse Vue SFC structure
    const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);

    // Track usage in template
    if (templateMatch) {
      const templateUsages = this.trackGenericUsage(
        filePath,
        templateMatch[1],
        tokenPatterns,
        context
      );
      usages.push(...templateUsages);
    }

    // Track usage in script
    if (scriptMatch) {
      // Would use JavaScript tracking here
      const scriptUsages = this.trackGenericUsage(
        filePath,
        scriptMatch[1],
        tokenPatterns,
        context
      );
      usages.push(...scriptUsages);
    }

    // Track usage in style
    if (styleMatch) {
      const styleUsages = this.trackCSSUsage(
        filePath,
        styleMatch[1],
        tokenPatterns,
        context
      );
      usages.push(...styleUsages);
    }

    return usages;
  }

  private trackSvelteUsage(
    filePath: string,
    content: string,
    tokenPatterns: Map<string, RegExp[]>,
    context: TokenUsageTrackingContext
  ): TokenUsage[] {
    // Similar to Vue but with Svelte-specific patterns
    return this.trackGenericUsage(filePath, content, tokenPatterns, context);
  }

  private trackGenericUsage(
    filePath: string,
    content: string,
    tokenPatterns: Map<string, RegExp[]>,
    context: TokenUsageTrackingContext
  ): TokenUsage[] {
    const usages: TokenUsage[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      for (const [tokenName, patterns] of Array.from(tokenPatterns)) {
        for (const pattern of patterns) {
          const matches = [...line.matchAll(pattern)];
          matches.forEach(match => {
            const usage = this.createTokenUsage(
              tokenName,
              filePath,
              lineIndex + 1,
              match.index || 0,
              line.trim(),
              context
            );
            this.mergeUsage(usages, usage);
          });
        }
      }
    });

    return usages;
  }

  private applyCustomMatcher(
    filePath: string,
    content: string,
    tokens: DesignToken[],
    matcher: TokenMatcher
  ): TokenUsage[] {
    const usages: TokenUsage[] = [];

    if (typeof matcher.pattern === 'function') {
      const matches = matcher.pattern(content);
      matches.forEach(match => {
        const token = tokens.find(t => t.name === match.tokenName);
        if (token) {
          const lines = content.slice(0, match.start).split('\n');
          const lineNumber = lines.length;
          const columnNumber = lines[lines.length - 1].length;

          const usage = this.createTokenUsage(
            match.tokenName,
            filePath,
            lineNumber,
            columnNumber,
            match.context,
            {}
          );
          this.mergeUsage(usages, usage);
        }
      });
    } else {
      const matches = [...content.matchAll(matcher.pattern)];
      matches.forEach(match => {
        const tokenName = match[1]; // Assuming first capture group is token name
        const token = tokens.find(t => t.name === tokenName);
        if (token) {
          const lines = content.slice(0, match.index).split('\n');
          const lineNumber = lines.length;
          const columnNumber = lines[lines.length - 1].length;

          const usage = this.createTokenUsage(
            tokenName,
            filePath,
            lineNumber,
            columnNumber,
            match[0],
            {}
          );
          this.mergeUsage(usages, usage);
        }
      });
    }

    return usages;
  }

  private addTokenUsage(
    usages: TokenUsage[],
    tokenName: string,
    filePath: string,
    node: ts.Node,
    sourceFile: ts.SourceFile,
    context: StyleTransformationContext
  ): void {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const lineText = sourceFile.getFullText().split('\n')[start.line];

    const usage = this.createTokenUsage(
      tokenName,
      filePath,
      start.line + 1,
      start.character,
      lineText.trim(),
      context
    );

    this.mergeUsage(usages, usage);
  }

  private createTokenUsage(
    tokenName: string,
    filePath: string,
    line: number,
    column: number,
    rawValue: string,
    context: StyleTransformationContext
  ): TokenUsage {
    return {
      tokenName,
      locations: [{
        filePath,
        line,
        column,
        context: 'usage',
        rawValue,
      }],
      count: 1,
      lastUsed: new Date().toISOString(),
      context,
    };
  }

  private mergeUsage(usages: TokenUsage[], newUsage: TokenUsage): void {
    const existing = usages.find(u => u.tokenName === newUsage.tokenName);
    if (existing) {
      existing.locations.push(...newUsage.locations);
      existing.count += newUsage.count;
      existing.lastUsed = newUsage.lastUsed;
    } else {
      usages.push(newUsage);
    }
  }

  private detectUsagePatterns(
    tokenUsages: Map<string, TokenUsage>,
    fileUsages: Map<string, FileUsageSummary>
  ): UsagePattern[] {
    const patterns: UsagePattern[] = [];

    // Pattern: Direct value usage instead of tokens
    const directValuePattern = this.detectDirectValueUsage(tokenUsages);
    if (directValuePattern) {
      patterns.push(directValuePattern);
    }

    // Pattern: Inconsistent naming conventions
    const namingPattern = this.detectNamingInconsistencies(tokenUsages);
    if (namingPattern) {
      patterns.push(namingPattern);
    }

    // Pattern: Over-usage of specific tokens
    const overUsagePattern = this.detectOverUsage(tokenUsages);
    if (overUsagePattern) {
      patterns.push(overUsagePattern);
    }

    return patterns;
  }

  private detectDirectValueUsage(tokenUsages: Map<string, TokenUsage>): UsagePattern | null {
    // Check for hardcoded values that could be tokens
    const directValues = [];
    for (const [_, usage] of Array.from(tokenUsages)) {
      usage.locations.forEach(location => {
        if (location.rawValue.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|\d+px|\d+rem/)) {
          directValues.push(location.rawValue);
        }
      });
    }

    if (directValues.length > 5) {
      return {
        pattern: 'direct-value-usage',
        description: 'Direct color/size values used instead of design tokens',
        examples: directValues.slice(0, 3),
        frequency: directValues.length,
        confidence: 0.8,
        category: 'warning',
        suggestion: 'Replace hardcoded values with design tokens for consistency',
      };
    }

    return null;
  }

  private detectNamingInconsistencies(tokenUsages: Map<string, TokenUsage>): UsagePattern | null {
    const tokenNames = Array.from(tokenUsages.keys());
    const inconsistencies = [];

    // Check for mixed naming conventions
    const hasCamelCase = tokenNames.some(name => /[a-z][A-Z]/.test(name));
    const hasKebabCase = tokenNames.some(name => /-/.test(name));
    const hasDotNotation = tokenNames.some(name => /\./.test(name));

    if ([hasCamelCase, hasKebabCase, hasDotNotation].filter(Boolean).length > 1) {
      inconsistencies.push('Mixed naming conventions detected');
    }

    if (inconsistencies.length > 0) {
      return {
        pattern: 'naming-inconsistency',
        description: 'Inconsistent token naming conventions found',
        examples: tokenNames.slice(0, 3),
        frequency: inconsistencies.length,
        confidence: 0.7,
        category: 'warning',
        suggestion: 'Standardize on a single naming convention',
      };
    }

    return null;
  }

  private detectOverUsage(tokenUsages: Map<string, TokenUsage>): UsagePattern | null {
    const usageCounts = Array.from(tokenUsages.values()).map(u => u.count);
    const averageUsage = usageCounts.reduce((sum, count) => sum + count, 0) / usageCounts.length;
    const threshold = averageUsage * 3;

    const overUsedTokens = Array.from(tokenUsages)
      .filter(([_, usage]) => usage.count > threshold)
      .map(([name, usage]) => ({ name, count: usage.count }));

    if (overUsedTokens.length > 0) {
      return {
        pattern: 'token-over-usage',
        description: 'Some tokens are used excessively, may indicate missing semantic tokens',
        examples: overUsedTokens.slice(0, 3).map(t => `${t.name} (${t.count} uses)`),
        frequency: overUsedTokens.length,
        confidence: 0.6,
        category: 'warning',
        suggestion: 'Consider creating semantic tokens for frequently used combinations',
      };
    }

    return null;
  }

  private buildDependencyGraph(
    tokens: DesignToken[],
    tokenUsages: Map<string, TokenUsage>
  ): TokenDependencyGraph {
    const nodes: TokenNode[] = [];
    const edges: TokenEdge[] = [];
    const clusters: TokenCluster[] = [];

    // Create nodes
    tokens.forEach(token => {
      const usage = tokenUsages.get(token.name);
      nodes.push({
        id: token.name,
        tokenName: token.name,
        type: token.type,
        category: token.category,
        usageCount: usage?.count || 0,
        files: usage?.locations.map(l => l.filePath) || [],
      });
    });

    // Create edges based on co-usage patterns
    const fileTokenMap = new Map<string, string[]>();
    for (const [tokenName, usage] of Array.from(tokenUsages)) {
      usage.locations.forEach(location => {
        if (!fileTokenMap.has(location.filePath)) {
          fileTokenMap.set(location.filePath, []);
        }
        fileTokenMap.get(location.filePath)!.push(tokenName);
      });
    }

    // Build co-usage edges
    for (const [filePath, fileTokens] of Array.from(fileTokenMap)) {
      for (let i = 0; i < fileTokens.length; i++) {
        for (let j = i + 1; j < fileTokens.length; j++) {
          const existingEdge = edges.find(e => 
            (e.source === fileTokens[i] && e.target === fileTokens[j]) ||
            (e.source === fileTokens[j] && e.target === fileTokens[i])
          );

          if (existingEdge) {
            existingEdge.weight += 1;
          } else {
            edges.push({
              source: fileTokens[i],
              target: fileTokens[j],
              relationship: 'similar',
              weight: 1,
            });
          }
        }
      }
    }

    // Create clusters by category
    const categoryGroups = new Map<TokenCategory, string[]>();
    tokens.forEach(token => {
      if (!categoryGroups.has(token.category)) {
        categoryGroups.set(token.category, []);
      }
      categoryGroups.get(token.category)!.push(token.name);
    });

    for (const [category, tokenNames] of Array.from(categoryGroups)) {
      if (tokenNames.length > 1) {
        clusters.push({
          id: category,
          name: category,
          tokens: tokenNames,
          category,
          cohesion: this.calculateClusterCohesion(tokenNames, edges),
        });
      }
    }

    return { nodes, edges, clusters };
  }

  private calculateClusterCohesion(tokenNames: string[], edges: TokenEdge[]): number {
    const clusterEdges = edges.filter(edge => 
      tokenNames.includes(edge.source) && tokenNames.includes(edge.target)
    );
    const maxPossibleEdges = (tokenNames.length * (tokenNames.length - 1)) / 2;
    return maxPossibleEdges > 0 ? clusterEdges.length / maxPossibleEdges : 0;
  }

  private findSimilarTokens(tokenUsages: Map<string, TokenUsage>): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const [tokenName, usage] of Array.from(tokenUsages)) {
      if (processed.has(tokenName)) continue;

      const similarTokens = [tokenName];
      const tokenFiles = new Set(usage.locations.map(l => l.filePath));

      for (const [otherName, otherUsage] of Array.from(tokenUsages)) {
        if (otherName === tokenName || processed.has(otherName)) continue;

        const otherFiles = new Set(otherUsage.locations.map(l => l.filePath));
        const intersection = new Set([...tokenFiles].filter(f => otherFiles.has(f)));
        const union = new Set([...tokenFiles, ...otherFiles]);
        const similarity = intersection.size / union.size;

        if (similarity > 0.7) {
          similarTokens.push(otherName);
          processed.add(otherName);
        }
      }

      if (similarTokens.length > 1) {
        groups.push(similarTokens);
      }
      processed.add(tokenName);
    }

    return groups;
  }

  private findExtractionOpportunities(patterns: UsagePattern[]): Array<{
    title: string;
    description: string;
    confidence: number;
    files: string[];
    beforeExample: string;
    afterExample: string;
    steps: string[];
  }> {
    // Placeholder for pattern-based extraction opportunities
    return patterns
      .filter(p => p.category === 'warning')
      .map(pattern => ({
        title: `Extract pattern: ${pattern.pattern}`,
        description: pattern.description,
        confidence: pattern.confidence,
        files: [], // Would be extracted from pattern data
        beforeExample: pattern.examples[0] || '',
        afterExample: pattern.suggestion || '',
        steps: [
          'Identify common usage pattern',
          'Create semantic token',
          'Update references',
          'Validate changes',
        ],
      }));
  }

  private generateMigrationSuggestions(
    tokenUsages: Map<string, TokenUsage>,
    context: TokenMigrationContext
  ): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];

    // Framework-specific migration patterns
    if (context.sourceFramework === 'custom' && context.targetFramework === 'tailwind') {
      suggestions.push({
        type: 'migrate',
        title: 'Migrate to Tailwind CSS configuration',
        description: 'Convert custom tokens to Tailwind theme configuration format',
        impact: 'high',
        effort: 'high',
        confidence: 0.8,
        affectedFiles: Array.from(new Set(
          Array.from(tokenUsages.values())
            .flatMap(usage => usage.locations.map(l => l.filePath))
        )),
        affectedTokens: Array.from(tokenUsages.keys()),
        automatable: true,
        steps: [
          'Generate Tailwind theme configuration',
          'Update CSS classes to use Tailwind utilities',
          'Replace CSS variables with Tailwind classes',
          'Validate responsive behavior',
        ],
      });
    }

    return suggestions;
  }

  private getImpactWeight(impact: string): number {
    switch (impact) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }
}

/**
 * Token usage tracker registry
 */
export class TokenUsageTrackerRegistry {
  private trackers = new Map<string, TokenUsageTracker>();

  constructor() {
    // Register default tracker
    this.register('base', new BaseTokenUsageTracker());
  }

  register(name: string, tracker: TokenUsageTracker): void {
    this.trackers.set(name, tracker);
  }

  getTracker(name: string = 'base'): TokenUsageTracker {
    const tracker = this.trackers.get(name);
    if (!tracker) {
      throw new Error(`No token usage tracker available for: ${name}`);
    }
    return tracker;
  }

  getAvailableTrackers(): string[] {
    return Array.from(this.trackers.keys());
  }

  async scanForTokenUsage(
    filePaths: string[],
    tokens: DesignToken[],
    context?: TokenUsageTrackingContext,
    trackerName: string = 'base'
  ): Promise<TokenUsageReport> {
    const tracker = this.getTracker(trackerName);
    return tracker.scanForTokenUsage(filePaths, tokens, context);
  }

  async generateUsageAnalytics(
    usageReport: TokenUsageReport,
    trackerName: string = 'base'
  ): Promise<TokenUsageAnalytics> {
    const tracker = this.getTracker(trackerName);
    return tracker.generateUsageAnalytics(usageReport);
  }

  async generateRefactoringSuggestions(
    usageReport: TokenUsageReport,
    context?: TokenMigrationContext,
    trackerName: string = 'base'
  ): Promise<RefactoringSuggestion[]> {
    const tracker = this.getTracker(trackerName);
    return tracker.generateRefactoringSuggestions(usageReport, context);
  }
}