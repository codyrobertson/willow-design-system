import {
  DesignToken,
  TokenCategory,
  TokenType,
  TokenFormat,
  TokenMigrationStrategy,
  TokenMigrationMapping,
  TokenTransformationResult,
  TokenMigrationContext,
  TokenValidationRule,
  TokenTransform,
  TokenValue,
  TokenCompositeValue,
  TokenReference,
  TokenArray,
} from '../../types/theme-tokens.types';

/**
 * Token transformation interface
 */
export interface TokenTransformer {
  /**
   * Transform tokens according to strategy
   */
  transform(tokens: DesignToken[], strategy: TokenMigrationStrategy): Promise<TokenTransformationResult>;
  
  /**
   * Apply specific mapping to tokens
   */
  applyMapping(tokens: DesignToken[], mapping: TokenMigrationMapping): DesignToken[];
  
  /**
   * Validate transformed tokens
   */
  validate(tokens: DesignToken[], rules: TokenValidationRule[]): TokenValidationResult[];
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  token: DesignToken;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Base token transformer implementation
 */
export class BaseTokenTransformer implements TokenTransformer {
  async transform(tokens: DesignToken[], strategy: TokenMigrationStrategy): Promise<TokenTransformationResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let transformedTokens = [...tokens];
    let transformedCount = 0;
    let skippedCount = 0;

    try {
      // Apply pre-transforms
      if (strategy.preTransforms) {
        for (const transform of strategy.preTransforms) {
          transformedTokens = transformedTokens.map(token => this.applyTransform(token, transform));
          transformedCount += transformedTokens.length;
        }
      }

      // Apply mappings
      for (const mapping of strategy.mappings) {
        const beforeCount = transformedTokens.length;
        transformedTokens = this.applyMapping(transformedTokens, mapping);
        const afterCount = transformedTokens.length;
        
        if (afterCount !== beforeCount) {
          transformedCount += Math.abs(afterCount - beforeCount);
        }
      }

      // Apply post-transforms
      if (strategy.postTransforms) {
        for (const transform of strategy.postTransforms) {
          transformedTokens = transformedTokens.map(token => this.applyTransform(token, transform));
        }
      }

      // Validate if rules provided
      if (strategy.validation) {
        const validationResults = this.validate(transformedTokens, strategy.validation);
        for (const result of validationResults) {
          if (!result.valid) {
            errors.push(...result.errors);
            warnings.push(...result.warnings);
          }
        }
      }

      // Generate output
      const output = this.generateOutput(transformedTokens, strategy.targetFormat);

      const endTime = performance.now();

      return {
        success: errors.length === 0,
        tokens: transformedTokens,
        output,
        warnings,
        errors,
        metadata: {
          transformedCount,
          skippedCount,
          processingTime: endTime - startTime,
          strategy: strategy.name,
        },
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        success: false,
        tokens: [],
        output: '',
        warnings,
        errors: [error instanceof Error ? error.message : 'Unknown transformation error'],
        metadata: {
          transformedCount: 0,
          skippedCount: tokens.length,
          processingTime: endTime - startTime,
          strategy: strategy.name,
        },
      };
    }
  }

  applyMapping(tokens: DesignToken[], mapping: TokenMigrationMapping): DesignToken[] {
    const results: DesignToken[] = [];

    for (const token of tokens) {
      let matched = false;

      if (typeof mapping.source === 'string') {
        // Direct string match
        if (token.name === mapping.source) {
          matched = true;
          const newToken = this.mapToken(token, mapping);
          if (newToken) {
            results.push(newToken);
          }
        }
      } else if (mapping.source instanceof RegExp) {
        // Regex match
        const match = token.name.match(mapping.source);
        if (match) {
          matched = true;
          const newToken = this.mapToken(token, mapping, match);
          if (newToken) {
            results.push(newToken);
          }
        }
      }

      // Keep original token if not matched or if mapping preserves it
      if (!matched || !mapping.deprecated) {
        results.push(token);
      }
    }

    return results;
  }

  validate(tokens: DesignToken[], rules: TokenValidationRule[]): TokenValidationResult[] {
    const results: TokenValidationResult[] = [];

    for (const token of tokens) {
      const tokenResult: TokenValidationResult = {
        token,
        valid: true,
        errors: [],
        warnings: [],
      };

      for (const rule of rules) {
        if (rule.types.includes(token.type)) {
          const validation = rule.validate(token);
          
          if (!validation.valid) {
            tokenResult.valid = false;
            
            if (rule.severity === 'error') {
              tokenResult.errors.push(validation.message || `Validation failed for ${token.name}`);
            } else {
              tokenResult.warnings.push(validation.message || `Validation warning for ${token.name}`);
            }
          }
        }
      }

      results.push(tokenResult);
    }

    return results;
  }

  private mapToken(
    token: DesignToken,
    mapping: TokenMigrationMapping,
    regexMatch?: RegExpMatchArray
  ): DesignToken | null {
    let newName: string;

    if (typeof mapping.target === 'string') {
      newName = mapping.target;
    } else if (typeof mapping.target === 'function' && regexMatch) {
      newName = mapping.target(regexMatch[0]);
    } else {
      return null;
    }

    let newValue = token.value;

    // Apply value transformation if specified
    if (mapping.transform) {
      newValue = this.applyValueTransform(token.value, mapping.transform);
    }

    return {
      ...token,
      name: newName,
      value: newValue,
      metadata: {
        ...token.metadata,
        originalName: token.name,
        migrationMapping: mapping.notes,
      },
    };
  }

  private applyTransform(token: DesignToken, transform: TokenTransform): DesignToken {
    const newValue = this.applyValueTransform(token.value, transform);
    
    return {
      ...token,
      value: newValue,
      metadata: {
        ...token.metadata,
        transformApplied: transform.type,
      },
    };
  }

  protected applyValueTransform(value: TokenValue, transform: TokenTransform): TokenValue {
    if (transform.type === 'custom' && transform.transform) {
      return transform.transform(value);
    }

    if (typeof value === 'string') {
      return this.applyStringTransform(value, transform);
    }

    if (typeof value === 'number') {
      return this.applyNumberTransform(value, transform);
    }

    if (value && typeof value === 'object') {
      if ('$ref' in value) {
        // Transform reference values
        return value; // References typically don't need value transformation
      }

      if ('$array' in value) {
        // Transform array values
        const arrayValue = value as TokenArray;
        return {
          $array: arrayValue.$array.map(v => this.applyValueTransform(v, transform)),
        };
      }

      // Transform composite values
      const composite = value as TokenCompositeValue;
      const transformedComposite: TokenCompositeValue = {};
      
      for (const [key, val] of Object.entries(composite)) {
        transformedComposite[key] = this.applyValueTransform(val, transform);
      }
      
      return transformedComposite;
    }

    return value;
  }

  private applyStringTransform(value: string, transform: TokenTransform): string {
    const amount = transform.amount || 1;

    switch (transform.type) {
      case 'multiply':
        // Extract numeric part and multiply
        const multiplyMatch = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
        if (multiplyMatch) {
          const [, num, unit] = multiplyMatch;
          return `${parseFloat(num) * amount}${unit}`;
        }
        break;

      case 'divide':
        const divideMatch = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
        if (divideMatch) {
          const [, num, unit] = divideMatch;
          return `${parseFloat(num) / amount}${unit}`;
        }
        break;

      case 'add':
        const addMatch = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
        if (addMatch) {
          const [, num, unit] = addMatch;
          return `${parseFloat(num) + amount}${unit}`;
        }
        break;

      case 'subtract':
        const subtractMatch = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
        if (subtractMatch) {
          const [, num, unit] = subtractMatch;
          return `${parseFloat(num) - amount}${unit}`;
        }
        break;

      case 'lighten':
      case 'darken':
      case 'saturate':
      case 'desaturate':
        // Color transformations would require a color manipulation library
        // For now, return the original value
        return value;
    }

    return value;
  }

  private applyNumberTransform(value: number, transform: TokenTransform): number {
    const amount = transform.amount || 1;

    switch (transform.type) {
      case 'multiply':
        return value * amount;
      case 'divide':
        return value / amount;
      case 'add':
        return value + amount;
      case 'subtract':
        return value - amount;
      default:
        return value;
    }
  }

  private generateOutput(tokens: DesignToken[], format: TokenFormat): string {
    switch (format) {
      case TokenFormat.CSS_VARIABLE:
        return this.generateCSSVariables(tokens);
      case TokenFormat.JSON:
        return this.generateJSON(tokens);
      case TokenFormat.JS_OBJECT:
        return this.generateJSObject(tokens);
      case TokenFormat.TAILWIND_CONFIG:
        return this.generateTailwindConfig(tokens);
      case TokenFormat.STYLE_DICTIONARY:
        return this.generateStyleDictionary(tokens);
      default:
        return JSON.stringify(tokens, null, 2);
    }
  }

  private generateCSSVariables(tokens: DesignToken[]): string {
    const lines = [':root {'];
    
    for (const token of tokens) {
      const cssVar = token.name.startsWith('--') ? token.name : `--${token.name.replace(/\./g, '-')}`;
      const value = this.tokenValueToString(token.value);
      lines.push(`  ${cssVar}: ${value};`);
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  private generateJSON(tokens: DesignToken[]): string {
    const tokenMap: Record<string, any> = {};
    
    for (const token of tokens) {
      this.setNestedProperty(tokenMap, token.name, token.value);
    }
    
    return JSON.stringify(tokenMap, null, 2);
  }

  private generateJSObject(tokens: DesignToken[]): string {
    const tokenMap: Record<string, any> = {};
    
    for (const token of tokens) {
      this.setNestedProperty(tokenMap, token.name, token.value);
    }
    
    return `export default ${JSON.stringify(tokenMap, null, 2)};`;
  }

  private generateTailwindConfig(tokens: DesignToken[]): string {
    const theme: Record<string, any> = {};
    
    for (const token of tokens) {
      // Group tokens by category for Tailwind structure
      const parts = token.name.split('.');
      if (parts.length >= 2) {
        const category = parts[0];
        const path = parts.slice(1).join('.');
        
        if (!theme[category]) {
          theme[category] = {};
        }
        
        this.setNestedProperty(theme[category], path, this.tokenValueToString(token.value));
      }
    }
    
    return `module.exports = {
  theme: ${JSON.stringify(theme, null, 4)},
};`;
  }

  private generateStyleDictionary(tokens: DesignToken[]): string {
    const sdTokens: Record<string, any> = {};
    
    for (const token of tokens) {
      const tokenData = {
        value: token.value,
        type: token.type,
        ...(token.description && { description: token.description }),
        ...(token.metadata && { metadata: token.metadata }),
      };
      
      this.setNestedProperty(sdTokens, token.name, tokenData);
    }
    
    return JSON.stringify(sdTokens, null, 2);
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private tokenValueToString(value: TokenValue): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value && typeof value === 'object') {
      if ('$ref' in value) {
        const ref = value as TokenReference;
        return `var(--${ref.$ref.replace(/\./g, '-')})`;
      }

      if ('$array' in value) {
        const array = value as TokenArray;
        return array.$array.map(v => this.tokenValueToString(v)).join(', ');
      }

      // Composite value - convert to CSS-like string
      const composite = value as TokenCompositeValue;
      const parts: string[] = [];
      
      for (const [key, val] of Object.entries(composite)) {
        parts.push(`${key}: ${this.tokenValueToString(val)}`);
      }
      
      return parts.join('; ');
    }

    return String(value);
  }
}

/**
 * Advanced token transformer with additional features
 */
export class AdvancedTokenTransformer extends BaseTokenTransformer {
  private resolutionCache = new Map<string, TokenValue>();

  async transform(tokens: DesignToken[], strategy: TokenMigrationStrategy): Promise<TokenTransformationResult> {
    // Clear cache for new transformation
    this.resolutionCache.clear();
    
    // Resolve all references before transformation
    const resolvedTokens = this.resolveReferences(tokens);
    
    return super.transform(resolvedTokens, strategy);
  }

  /**
   * Resolve token references to their actual values
   */
  private resolveReferences(tokens: DesignToken[]): DesignToken[] {
    const tokenMap = new Map<string, DesignToken>();
    
    // Index all tokens
    for (const token of tokens) {
      tokenMap.set(token.name, token);
    }

    // Resolve references
    const resolvedTokens: DesignToken[] = [];
    
    for (const token of tokens) {
      const resolvedToken = this.resolveTokenReferences(token, tokenMap);
      resolvedTokens.push(resolvedToken);
    }

    return resolvedTokens;
  }

  private resolveTokenReferences(token: DesignToken, tokenMap: Map<string, DesignToken>): DesignToken {
    const cacheKey = token.name;
    
    if (this.resolutionCache.has(cacheKey)) {
      return {
        ...token,
        value: this.resolutionCache.get(cacheKey)!,
      };
    }

    const resolvedValue = this.resolveValue(token.value, tokenMap, new Set([token.name]));
    
    this.resolutionCache.set(cacheKey, resolvedValue);
    
    return {
      ...token,
      value: resolvedValue,
    };
  }

  private resolveValue(
    value: TokenValue,
    tokenMap: Map<string, DesignToken>,
    visited: Set<string>
  ): TokenValue {
    if (value && typeof value === 'object' && '$ref' in value) {
      const ref = value as TokenReference;
      const refName = ref.$ref;
      
      // Prevent circular references
      if (visited.has(refName)) {
        return value; // Return unresolved reference
      }

      const referencedToken = tokenMap.get(refName);
      if (!referencedToken) {
        return value; // Return unresolved reference
      }

      visited.add(refName);
      const resolvedValue = this.resolveValue(referencedToken.value, tokenMap, visited);
      visited.delete(refName);

      // Apply transformation if specified
      if (ref.$transform) {
        return this.applyValueTransform(resolvedValue, ref.$transform);
      }

      return resolvedValue;
    }

    if (value && typeof value === 'object' && '$array' in value) {
      const array = value as TokenArray;
      return {
        $array: array.$array.map(v => this.resolveValue(v, tokenMap, visited)),
      };
    }

    if (value && typeof value === 'object') {
      const composite = value as TokenCompositeValue;
      const resolvedComposite: TokenCompositeValue = {};
      
      for (const [key, val] of Object.entries(composite)) {
        resolvedComposite[key] = this.resolveValue(val, tokenMap, visited);
      }
      
      return resolvedComposite;
    }

    return value;
  }

  /**
   * Apply semantic transformations based on token context
   */
  applySemanticTransformation(
    tokens: DesignToken[],
    context: TokenMigrationContext
  ): DesignToken[] {
    return tokens.map(token => {
      // Apply framework-specific semantic transformations
      if (context.sourceFramework === 'tailwind' && context.targetFramework === 'chakra') {
        return this.transformTailwindToChakra(token);
      }

      if (context.sourceFramework === 'mui' && context.targetFramework === 'antd') {
        return this.transformMUIToAntD(token);
      }

      return token;
    });
  }

  private transformTailwindToChakra(token: DesignToken): DesignToken {
    // Example semantic transformations for Tailwind to Chakra
    let newName = token.name;
    
    // Transform color scales
    if (token.name.startsWith('colors.')) {
      newName = newName.replace('colors.', 'colors.');
      
      // Tailwind uses numeric scales, Chakra uses descriptive names
      newName = newName.replace('.50', '.50')
                       .replace('.100', '.100')
                       .replace('.500', '.500')
                       .replace('.900', '.900');
    }

    // Transform spacing
    if (token.name.startsWith('spacing.')) {
      newName = newName.replace('spacing.', 'space.');
    }

    return {
      ...token,
      name: newName,
    };
  }

  private transformMUIToAntD(token: DesignToken): DesignToken {
    // Example transformations for MUI to Ant Design
    let newName = token.name;
    
    if (token.name.startsWith('palette.')) {
      newName = newName.replace('palette.', 'colorPrimary.');
    }

    if (token.name.startsWith('typography.')) {
      newName = newName.replace('typography.', 'fontSize.');
    }

    return {
      ...token,
      name: newName,
    };
  }
}

/**
 * Token transformer registry
 */
export class TokenTransformerRegistry {
  private transformers = new Map<string, TokenTransformer>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.transformers.set('base', new BaseTokenTransformer());
    this.transformers.set('advanced', new AdvancedTokenTransformer());
  }

  register(name: string, transformer: TokenTransformer): void {
    this.transformers.set(name, transformer);
  }

  getTransformer(name: string): TokenTransformer | undefined {
    return this.transformers.get(name);
  }

  getAvailableTransformers(): string[] {
    return Array.from(this.transformers.keys());
  }

  async transform(
    tokens: DesignToken[],
    strategy: TokenMigrationStrategy,
    transformerName: string = 'advanced'
  ): Promise<TokenTransformationResult> {
    const transformer = this.getTransformer(transformerName);
    
    if (!transformer) {
      throw new Error(`No transformer available: ${transformerName}`);
    }

    return transformer.transform(tokens, strategy);
  }
}