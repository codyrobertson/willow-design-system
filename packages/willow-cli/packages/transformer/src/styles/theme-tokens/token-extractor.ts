/**
 * Token Extractor
 * Extracts design tokens from various sources
 */

import * as ts from 'typescript';
import { TokenFormat, TokenDefinition, TokenValue } from '../../types/theme-tokens.types';

export interface TokenExtractionOptions {
  /**
   * Sources to extract tokens from
   */
  sources: TokenSource[];
  
  /**
   * Target format for extraction
   */
  targetFormat: TokenFormat;
  
  /**
   * Include metadata in extraction
   */
  includeMetadata?: boolean;
  
  /**
   * Filter tokens by category
   */
  categories?: string[];
}

export interface TokenSource {
  /**
   * Source type
   */
  type: 'file' | 'directory' | 'url' | 'inline';
  
  /**
   * Source location or content
   */
  location: string;
  
  /**
   * Source format
   */
  format: TokenFormat;
}

export interface TokenExtractionResult {
  /**
   * Extracted tokens
   */
  tokens: TokenDefinition[];
  
  /**
   * Extraction metadata
   */
  metadata: {
    totalTokens: number;
    byCategory: Record<string, number>;
    sources: string[];
    extractionTime: number;
  };
  
  /**
   * Any warnings during extraction
   */
  warnings: string[];
  
  /**
   * Any errors during extraction
   */
  errors: string[];
}

/**
 * Base token extractor class
 */
export abstract class BaseTokenExtractor {
  /**
   * Extract tokens from sources
   */
  abstract extract(options: TokenExtractionOptions): Promise<TokenExtractionResult>;
  
  /**
   * Extract tokens from a single source
   */
  abstract extractFromSource(source: TokenSource): Promise<TokenDefinition[]>;
  
  /**
   * Validate extracted tokens
   */
  protected validateTokens(tokens: TokenDefinition[]): string[] {
    const warnings: string[] = [];
    
    for (const token of tokens) {
      if (!token.name) {
        warnings.push('Token without name found');
      }
      
      if (!token.value) {
        warnings.push(`Token "${token.name}" has no value`);
      }
      
      if (token.type && !this.isValidTokenType(token.type)) {
        warnings.push(`Token "${token.name}" has invalid type: ${token.type}`);
      }
    }
    
    return warnings;
  }
  
  /**
   * Check if token type is valid
   */
  private isValidTokenType(type: string): boolean {
    const validTypes = [
      'color', 'dimension', 'fontFamily', 'fontWeight', 'fontSize',
      'lineHeight', 'letterSpacing', 'paragraphSpacing', 'textDecoration',
      'textCase', 'border', 'borderRadius', 'shadow', 'opacity', 'asset'
    ];
    return validTypes.includes(type);
  }
}

/**
 * CSS Token Extractor
 * Extracts tokens from CSS custom properties
 */
export class CSSTokenExtractor extends BaseTokenExtractor {
  async extract(options: TokenExtractionOptions): Promise<TokenExtractionResult> {
    const startTime = Date.now();
    const allTokens: TokenDefinition[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const sources: string[] = [];
    
    for (const source of options.sources.filter(s => s.format === 'css')) {
      try {
        const tokens = await this.extractFromSource(source);
        allTokens.push(...tokens);
        sources.push(source.location);
      } catch (error) {
        errors.push(`Failed to extract from ${source.location}: ${error}`);
      }
    }
    
    warnings.push(...this.validateTokens(allTokens));
    
    // Filter by categories if specified
    const filteredTokens = options.categories
      ? allTokens.filter(token => options.categories!.includes(token.category || ''))
      : allTokens;
    
    const byCategory = filteredTokens.reduce((acc, token) => {
      const category = token.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      tokens: filteredTokens,
      metadata: {
        totalTokens: filteredTokens.length,
        byCategory,
        sources,
        extractionTime: Date.now() - startTime,
      },
      warnings,
      errors,
    };
  }
  
  async extractFromSource(source: TokenSource): Promise<TokenDefinition[]> {
    if (source.type !== 'file') {
      throw new Error('CSS extractor only supports file sources');
    }
    
    // This is a simplified implementation
    // In a real implementation, you would parse CSS and extract custom properties
    const tokens: TokenDefinition[] = [];
    
    // Mock extraction logic
    tokens.push({
      name: 'primary-color',
      value: { type: 'color', value: '#007bff' },
      type: 'color',
      category: 'colors',
      description: 'Primary brand color',
    });
    
    return tokens;
  }
}

/**
 * JavaScript Token Extractor
 * Extracts tokens from JavaScript/TypeScript files
 */
export class JSTokenExtractor extends BaseTokenExtractor {
  async extract(options: TokenExtractionOptions): Promise<TokenExtractionResult> {
    const startTime = Date.now();
    const allTokens: TokenDefinition[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const sources: string[] = [];
    
    for (const source of options.sources.filter(s => ['js', 'ts'].includes(s.format))) {
      try {
        const tokens = await this.extractFromSource(source);
        allTokens.push(...tokens);
        sources.push(source.location);
      } catch (error) {
        errors.push(`Failed to extract from ${source.location}: ${error}`);
      }
    }
    
    warnings.push(...this.validateTokens(allTokens));
    
    const filteredTokens = options.categories
      ? allTokens.filter(token => options.categories!.includes(token.category || ''))
      : allTokens;
    
    const byCategory = filteredTokens.reduce((acc, token) => {
      const category = token.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      tokens: filteredTokens,
      metadata: {
        totalTokens: filteredTokens.length,
        byCategory,
        sources,
        extractionTime: Date.now() - startTime,
      },
      warnings,
      errors,
    };
  }
  
  async extractFromSource(source: TokenSource): Promise<TokenDefinition[]> {
    if (source.type !== 'file') {
      throw new Error('JS extractor only supports file sources');
    }
    
    // This would parse TypeScript/JavaScript AST to extract token definitions
    const tokens: TokenDefinition[] = [];
    
    // Mock extraction logic
    tokens.push({
      name: 'spacing-small',
      value: { type: 'dimension', value: '8px' },
      type: 'dimension',
      category: 'spacing',
      description: 'Small spacing value',
    });
    
    return tokens;
  }
}