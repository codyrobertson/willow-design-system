/**
 * Token Mapper
 * Maps tokens between different naming conventions and formats
 */

import { TokenDefinition, TokenValue } from '../../types/theme-tokens.types';

export interface TokenMappingRule {
  /**
   * Source token pattern (regex or exact match)
   */
  source: string | RegExp;
  
  /**
   * Target token name or pattern
   */
  target: string;
  
  /**
   * Value transformation function
   */
  transform?: (value: TokenValue) => TokenValue;
  
  /**
   * Mapping category
   */
  category?: string;
  
  /**
   * Mapping priority (higher = applied first)
   */
  priority?: number;
}

export interface TokenMappingOptions {
  /**
   * Mapping rules to apply
   */
  rules: TokenMappingRule[];
  
  /**
   * Source naming convention
   */
  sourceConvention: 'kebab-case' | 'camelCase' | 'snake_case' | 'custom';
  
  /**
   * Target naming convention
   */
  targetConvention: 'kebab-case' | 'camelCase' | 'snake_case' | 'custom';
  
  /**
   * Preserve original tokens alongside mapped ones
   */
  preserveOriginal?: boolean;
  
  /**
   * Apply case conversion
   */
  convertCase?: boolean;
}

export interface TokenMappingResult {
  /**
   * Mapped tokens
   */
  mappedTokens: TokenDefinition[];
  
  /**
   * Mapping statistics
   */
  statistics: {
    totalOriginal: number;
    totalMapped: number;
    rulesApplied: number;
    unmappedTokens: string[];
  };
  
  /**
   * Mapping warnings
   */
  warnings: string[];
}

/**
 * Base token mapper class
 */
export abstract class BaseTokenMapper {
  /**
   * Map tokens according to rules and options
   */
  abstract mapTokens(
    tokens: TokenDefinition[],
    options: TokenMappingOptions
  ): Promise<TokenMappingResult>;
  
  /**
   * Apply a single mapping rule to a token
   */
  protected applyRule(token: TokenDefinition, rule: TokenMappingRule): TokenDefinition | null {
    const matches = this.matchesRule(token, rule);
    if (!matches) {
      return null;
    }
    
    const mappedToken: TokenDefinition = {
      ...token,
      name: this.applyNameTransform(token.name, rule),
    };
    
    if (rule.transform) {
      mappedToken.value = rule.transform(token.value);
    }
    
    if (rule.category) {
      mappedToken.category = rule.category;
    }
    
    return mappedToken;
  }
  
  /**
   * Check if token matches a rule
   */
  private matchesRule(token: TokenDefinition, rule: TokenMappingRule): boolean {
    if (typeof rule.source === 'string') {
      return token.name === rule.source;
    } else {
      return rule.source.test(token.name);
    }
  }
  
  /**
   * Apply name transformation from rule
   */
  private applyNameTransform(tokenName: string, rule: TokenMappingRule): string {
    if (typeof rule.source === 'string') {
      return rule.target;
    } else {
      return tokenName.replace(rule.source, rule.target);
    }
  }
  
  /**
   * Convert case based on convention
   */
  protected convertCase(name: string, fromConvention: string, toConvention: string): string {
    if (fromConvention === toConvention) {
      return name;
    }
    
    // Convert from source convention to normalized form
    let normalized = name;
    switch (fromConvention) {
      case 'kebab-case':
        normalized = name.replace(/-/g, ' ');
        break;
      case 'snake_case':
        normalized = name.replace(/_/g, ' ');
        break;
      case 'camelCase':
        normalized = name.replace(/([A-Z])/g, ' $1').toLowerCase();
        break;
    }
    
    // Convert from normalized form to target convention
    const words = normalized.split(/\s+/).filter(Boolean);
    switch (toConvention) {
      case 'kebab-case':
        return words.join('-').toLowerCase();
      case 'snake_case':
        return words.join('_').toLowerCase();
      case 'camelCase':
        return words[0].toLowerCase() + words.slice(1).map(w => 
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join('');
      default:
        return name;
    }
  }
}

/**
 * Default token mapper implementation
 */
export class DefaultTokenMapper extends BaseTokenMapper {
  async mapTokens(
    tokens: TokenDefinition[],
    options: TokenMappingOptions
  ): Promise<TokenMappingResult> {
    const mappedTokens: TokenDefinition[] = [];
    const unmappedTokens: string[] = [];
    const warnings: string[] = [];
    let rulesApplied = 0;
    
    // Sort rules by priority
    const sortedRules = [...options.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    for (const token of tokens) {
      let wasMapped = false;
      
      // Try to apply each rule
      for (const rule of sortedRules) {
        const mappedToken = this.applyRule(token, rule);
        if (mappedToken) {
          // Apply case conversion if enabled
          if (options.convertCase) {
            mappedToken.name = this.convertCase(
              mappedToken.name,
              options.sourceConvention,
              options.targetConvention
            );
          }
          
          mappedTokens.push(mappedToken);
          rulesApplied++;
          wasMapped = true;
          break; // Stop at first matching rule
        }
      }
      
      // If no rule matched, handle case conversion
      if (!wasMapped) {
        if (options.convertCase) {
          const convertedToken: TokenDefinition = {
            ...token,
            name: this.convertCase(
              token.name,
              options.sourceConvention,
              options.targetConvention
            ),
          };
          mappedTokens.push(convertedToken);
        } else {
          unmappedTokens.push(token.name);
          if (options.preserveOriginal) {
            mappedTokens.push(token);
          }
        }
      }
      
      // Always preserve original if requested
      if (options.preserveOriginal && wasMapped) {
        mappedTokens.push(token);
      }
    }
    
    // Check for duplicate names
    const nameCount = new Map<string, number>();
    for (const token of mappedTokens) {
      nameCount.set(token.name, (nameCount.get(token.name) || 0) + 1);
    }
    
    for (const [name, count] of nameCount) {
      if (count > 1) {
        warnings.push(`Duplicate token name after mapping: ${name} (${count} occurrences)`);
      }
    }
    
    return {
      mappedTokens,
      statistics: {
        totalOriginal: tokens.length,
        totalMapped: mappedTokens.length,
        rulesApplied,
        unmappedTokens,
      },
      warnings,
    };
  }
}

/**
 * Preset mapping rules for common scenarios
 */
export class TokenMappingPresets {
  /**
   * CSS custom properties to design tokens
   */
  static cssToDesignTokens(): TokenMappingRule[] {
    return [
      {
        source: /^--color-(.+)$/,
        target: 'color.$1',
        category: 'color',
        priority: 10,
      },
      {
        source: /^--spacing-(.+)$/,
        target: 'spacing.$1',
        category: 'spacing',
        priority: 10,
      },
      {
        source: /^--font-size-(.+)$/,
        target: 'fontSize.$1',
        category: 'typography',
        priority: 10,
      },
      {
        source: /^--(.+)$/,
        target: '$1',
        priority: 1,
      },
    ];
  }
  
  /**
   * Bootstrap to design tokens
   */
  static bootstrapToDesignTokens(): TokenMappingRule[] {
    return [
      {
        source: /^primary$/,
        target: 'color.primary',
        category: 'color',
      },
      {
        source: /^secondary$/,
        target: 'color.secondary',
        category: 'color',
      },
      {
        source: /^spacer$/,
        target: 'spacing.base',
        category: 'spacing',
      },
    ];
  }
  
  /**
   * Material-UI to design tokens
   */
  static muiToDesignTokens(): TokenMappingRule[] {
    return [
      {
        source: /^palette\.(.+)$/,
        target: 'color.$1',
        category: 'color',
      },
      {
        source: /^spacing\((\d+)\)$/,
        target: 'spacing.$1',
        category: 'spacing',
      },
      {
        source: /^typography\.(.+)$/,
        target: 'typography.$1',
        category: 'typography',
      },
    ];
  }
}