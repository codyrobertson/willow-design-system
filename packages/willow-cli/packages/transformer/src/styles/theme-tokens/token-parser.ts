import {
  DesignToken,
  TokenCategory,
  TokenType,
  TokenFormat,
  TokenExtractionResult,
  TokenValue,
  TokenCompositeValue,
  TokenReference,
  TokenArray,
} from '../../types/theme-tokens.types';

/**
 * Base token parser interface
 */
export interface TokenParser {
  /**
   * Parse tokens from input content
   */
  parse(content: string, format: TokenFormat): Promise<TokenExtractionResult>;
  
  /**
   * Extract tokens from a specific source
   */
  extract(source: any): DesignToken[];
  
  /**
   * Validate token format support
   */
  supportsFormat(format: TokenFormat): boolean;
}

/**
 * Base implementation of token parser
 */
export abstract class BaseTokenParser implements TokenParser {
  protected supportedFormats: TokenFormat[] = [];

  abstract parse(content: string, format: TokenFormat): Promise<TokenExtractionResult>;
  abstract extract(source: any): DesignToken[];

  supportsFormat(format: TokenFormat): boolean {
    return this.supportedFormats.includes(format);
  }

  protected createExtractionResult(
    tokens: DesignToken[],
    warnings: string[] = [],
    source: string = 'unknown'
  ): TokenExtractionResult {
    const categoriesSet = new Set(tokens.map(t => t.category));
    const categories = Array.from(categoriesSet);
    
    return {
      tokens,
      warnings,
      metadata: {
        source,
        timestamp: new Date().toISOString(),
        tokenCount: tokens.length,
        categories,
      },
    };
  }

  protected normalizeTokenValue(value: any): TokenValue {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    // Handle references
    if (value && typeof value === 'object' && '$ref' in value) {
      return value as TokenReference;
    }

    // Handle arrays
    if (value && typeof value === 'object' && '$array' in value) {
      return value as TokenArray;
    }

    // Handle composite values
    if (value && typeof value === 'object') {
      return value as TokenCompositeValue;
    }

    return String(value);
  }

  protected detectTokenType(value: TokenValue, name: string): TokenType {
    if (value && typeof value === 'object' && '$ref' in value) {
      return TokenType.REFERENCE;
    }

    if (value && typeof value === 'object' && '$array' in value) {
      return TokenType.COMPOSITE;
    }

    if (typeof value === 'string') {
      // Color detection
      if (/^#[0-9a-fA-F]{3,8}$/.test(value) || 
          /^rgb\(/.test(value) || 
          /^hsl\(/.test(value) ||
          /^oklch\(/.test(value)) {
        return TokenType.COLOR;
      }

      // Dimension detection
      if (/^-?\d+(\.\d+)?(px|em|rem|vh|vw|%)$/.test(value)) {
        return TokenType.DIMENSION;
      }

      // Duration detection
      if (/^-?\d+(\.\d+)?(s|ms)$/.test(value)) {
        return TokenType.DURATION;
      }

      // Font family detection
      if (name.includes('font') && name.includes('family')) {
        return TokenType.FONT_FAMILY;
      }

      // Font weight detection
      if (name.includes('font') && name.includes('weight')) {
        return TokenType.FONT_WEIGHT;
      }

      // Cubic bezier detection
      if (/^cubic-bezier\(/.test(value)) {
        return TokenType.CUBIC_BEZIER;
      }
    }

    if (typeof value === 'number') {
      // Font weight numbers
      if (name.includes('font') && name.includes('weight') && value >= 100 && value <= 900) {
        return TokenType.FONT_WEIGHT;
      }
      
      // For other numbers, return as raw (could be z-index, opacity, etc.)
      return TokenType.RAW;
    }

    // Composite object detection
    if (value && typeof value === 'object') {
      if ('width' in value || 'style' in value || 'color' in value) {
        return TokenType.BORDER;
      }
      if ('offsetX' in value || 'offsetY' in value || 'blur' in value) {
        return TokenType.SHADOW;
      }
      if ('stops' in value || 'type' in value) {
        return TokenType.GRADIENT;
      }
      if ('fontSize' in value || 'fontWeight' in value || 'lineHeight' in value) {
        return TokenType.TYPOGRAPHY;
      }
      return TokenType.COMPOSITE;
    }

    return TokenType.RAW;
  }

  protected detectTokenCategory(name: string, type: TokenType): TokenCategory {
    const lowerName = name.toLowerCase();

    if (type === TokenType.COLOR || lowerName.includes('color')) {
      return TokenCategory.COLOR;
    }

    if (lowerName.includes('spacing') || 
        lowerName.includes('margin') || 
        lowerName.includes('padding') ||
        lowerName.includes('gap')) {
      return TokenCategory.SPACING;
    }

    if (lowerName.includes('width') || 
        lowerName.includes('height') || 
        lowerName.includes('size')) {
      return TokenCategory.SIZING;
    }

    if (type === TokenType.FONT_FAMILY || 
        type === TokenType.FONT_WEIGHT || 
        type === TokenType.TYPOGRAPHY ||
        lowerName.includes('font') || 
        lowerName.includes('text') ||
        lowerName.includes('typography')) {
      return TokenCategory.TYPOGRAPHY;
    }

    if (type === TokenType.BORDER || lowerName.includes('border')) {
      return TokenCategory.BORDER;
    }

    if (type === TokenType.SHADOW || lowerName.includes('shadow')) {
      return TokenCategory.SHADOW;
    }

    if (type === TokenType.GRADIENT || lowerName.includes('gradient')) {
      return TokenCategory.GRADIENT;
    }

    if (type === TokenType.DURATION || 
        type === TokenType.CUBIC_BEZIER ||
        lowerName.includes('timing') || 
        lowerName.includes('duration') ||
        lowerName.includes('transition') ||
        lowerName.includes('animation')) {
      return TokenCategory.TIMING;
    }

    if (lowerName.includes('opacity') || lowerName.includes('alpha')) {
      return TokenCategory.OPACITY;
    }

    if (lowerName.includes('z-index') || lowerName.includes('layer')) {
      return TokenCategory.Z_INDEX;
    }

    if (lowerName.includes('breakpoint') || lowerName.includes('screen')) {
      return TokenCategory.BREAKPOINT;
    }

    return TokenCategory.CUSTOM;
  }

  protected createToken(
    name: string,
    value: TokenValue,
    options: {
      type?: TokenType;
      category?: TokenCategory;
      description?: string;
      deprecated?: boolean;
      replacement?: string;
      metadata?: Record<string, any>;
    } = {}
  ): DesignToken {
    const type = options.type || this.detectTokenType(value, name);
    const category = options.category || this.detectTokenCategory(name, type);

    return {
      name,
      value,
      type,
      category,
      description: options.description,
      deprecated: options.deprecated,
      replacement: options.replacement,
      metadata: options.metadata,
    };
  }
}

/**
 * CSS Custom Properties parser
 */
export class CSSVariableParser extends BaseTokenParser {
  constructor() {
    super();
    this.supportedFormats = [TokenFormat.CSS_VARIABLE, TokenFormat.CSS_CUSTOM_PROPERTY];
  }

  async parse(content: string, format: TokenFormat): Promise<TokenExtractionResult> {
    if (!this.supportsFormat(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    const tokens = this.extract(content);
    return this.createExtractionResult(tokens, [], 'css-variables');
  }

  extract(content: string): DesignToken[] {
    const tokens: DesignToken[] = [];
    const warnings: string[] = [];

    // Match CSS custom properties: --property-name: value;
    const cssVarRegex = /--([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*([^;]+);/g;
    let match;

    while ((match = cssVarRegex.exec(content)) !== null) {
      const [, name, rawValue] = match;
      const cleanValue = rawValue.trim();

      try {
        // Handle var() references
        if (cleanValue.startsWith('var(')) {
          const refMatch = cleanValue.match(/var\(--([^,)]+)(?:,\s*([^)]+))?\)/);
          if (refMatch) {
            const [, refName, fallback] = refMatch;
            const tokenValue: TokenReference = {
              $ref: refName,
            };
            
            tokens.push(this.createToken(`--${name}`, tokenValue, {
              type: TokenType.REFERENCE,
              metadata: { fallback },
            }));
            continue;
          }
        }

        // Parse regular values
        const normalizedValue = this.normalizeTokenValue(this.parseValue(cleanValue));
        tokens.push(this.createToken(`--${name}`, normalizedValue));
      } catch (error) {
        warnings.push(`Failed to parse token --${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return tokens;
  }

  private parseValue(value: string): any {
    const trimmed = value.trim();

    // Remove quotes
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Try to parse as number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    // Keep as string
    return trimmed;
  }
}

/**
 * JavaScript object parser for design tokens
 */
export class JSObjectParser extends BaseTokenParser {
  constructor() {
    super();
    this.supportedFormats = [TokenFormat.JS_OBJECT, TokenFormat.JS_MODULE, TokenFormat.JSON];
  }

  async parse(content: string, format: TokenFormat): Promise<TokenExtractionResult> {
    if (!this.supportsFormat(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    let source: any;
    try {
      if (format === TokenFormat.JSON) {
        source = JSON.parse(content);
      } else {
        // Handle JS module exports
        source = this.parseJSObject(content);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const tokens = this.extract(source);
    return this.createExtractionResult(tokens, [], format);
  }

  extract(source: any): DesignToken[] {
    if (!source || typeof source !== 'object') {
      return [];
    }

    return this.extractTokensRecursive(source);
  }

  private parseJSObject(content: string): any {
    // Simple JS object parsing (for basic cases)
    // In production, you might want to use a proper JS parser
    try {
      // Try to extract object literal
      const objectMatch = content.match(/export\s+(?:default\s+)?(\{[\s\S]*\})/);
      if (objectMatch) {
        // This is a simplified approach - in practice you'd want proper AST parsing
        return JSON.parse(objectMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
      }

      // Try direct JSON parsing
      return JSON.parse(content);
    } catch {
      throw new Error('Unable to parse JavaScript object');
    }
  }

  private extractTokensRecursive(
    obj: any,
    prefix: string = '',
    tokens: DesignToken[] = []
  ): DesignToken[] {
    for (const [key, value] of Object.entries(obj)) {
      const tokenName = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Check if this is a token definition with $value
        if ('$value' in value) {
          const tokenDef = value as any;
          const tokenValue = this.normalizeTokenValue(tokenDef.$value);
          tokens.push(this.createToken(tokenName, tokenValue, {
            type: tokenDef.$type as TokenType,
            description: tokenDef.$description,
            metadata: tokenDef.$extensions,
          }));
        } else if (this.isTokenValue(value)) {
          // This object represents a token value
          const tokenValue = this.normalizeTokenValue(value);
          tokens.push(this.createToken(tokenName, tokenValue));
        } else {
          // Recurse into nested object
          this.extractTokensRecursive(value, tokenName, tokens);
        }
      } else {
        // Direct value
        const tokenValue = this.normalizeTokenValue(value);
        tokens.push(this.createToken(tokenName, tokenValue));
      }
    }

    return tokens;
  }

  private isTokenValue(obj: any): boolean {
    // Check if object has token-like properties
    const tokenKeys = ['$ref', '$array', 'offsetX', 'offsetY', 'blur', 'spread', 'color', 
                      'width', 'style', 'fontSize', 'fontWeight', 'lineHeight', 'stops'];
    
    return tokenKeys.some(key => key in obj);
  }
}

/**
 * Tailwind config parser
 */
export class TailwindConfigParser extends BaseTokenParser {
  constructor() {
    super();
    this.supportedFormats = [TokenFormat.TAILWIND_CONFIG];
  }

  async parse(content: string, format: TokenFormat): Promise<TokenExtractionResult> {
    if (!this.supportsFormat(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    try {
      const config = this.parseTailwindConfig(content);
      const tokens = this.extract(config);
      return this.createExtractionResult(tokens, [], 'tailwind-config');
    } catch (error) {
      throw new Error(`Failed to parse Tailwind config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extract(config: any): DesignToken[] {
    if (!config || !config.theme) {
      return [];
    }

    const tokens: DesignToken[] = [];
    const theme = config.theme;

    // Extract core theme values
    if (theme.colors) {
      tokens.push(...this.extractColorTokens(theme.colors, 'colors'));
    }

    if (theme.spacing) {
      tokens.push(...this.extractSpacingTokens(theme.spacing, 'spacing'));
    }

    if (theme.fontSize) {
      tokens.push(...this.extractFontSizeTokens(theme.fontSize, 'fontSize'));
    }

    if (theme.fontFamily) {
      tokens.push(...this.extractFontFamilyTokens(theme.fontFamily, 'fontFamily'));
    }

    if (theme.fontWeight) {
      tokens.push(...this.extractFontWeightTokens(theme.fontWeight, 'fontWeight'));
    }

    if (theme.borderRadius) {
      tokens.push(...this.extractBorderRadiusTokens(theme.borderRadius, 'borderRadius'));
    }

    if (theme.boxShadow) {
      tokens.push(...this.extractShadowTokens(theme.boxShadow, 'boxShadow'));
    }

    return tokens;
  }

  private parseTailwindConfig(content: string): any {
    // Simplified Tailwind config parsing
    // In production, use proper AST parsing
    try {
      const moduleMatch = content.match(/module\.exports\s*=\s*(\{[\s\S]*\})/);
      if (moduleMatch) {
        // Basic object literal parsing
        return JSON.parse(moduleMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
      }

      const exportMatch = content.match(/export\s+default\s+(\{[\s\S]*\})/);
      if (exportMatch) {
        return JSON.parse(exportMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
      }

      throw new Error('Could not find config export');
    } catch {
      throw new Error('Failed to parse Tailwind config syntax');
    }
  }

  private extractColorTokens(colors: any, prefix: string): DesignToken[] {
    return this.extractNestedTokens(colors, prefix, TokenCategory.COLOR, TokenType.COLOR);
  }

  private extractSpacingTokens(spacing: any, prefix: string): DesignToken[] {
    return this.extractNestedTokens(spacing, prefix, TokenCategory.SPACING, TokenType.DIMENSION);
  }

  private extractFontSizeTokens(fontSize: any, prefix: string): DesignToken[] {
    const tokens: DesignToken[] = [];
    
    for (const [key, value] of Object.entries(fontSize)) {
      const tokenName = `${prefix}.${key}`;
      
      if (Array.isArray(value)) {
        // Tailwind fontSize format: ['14px', '20px'] or ['14px', { lineHeight: '20px' }]
        const [size, options] = value;
        const compositeValue: TokenCompositeValue = { fontSize: this.normalizeTokenValue(size) };
        
        if (typeof options === 'string') {
          compositeValue.lineHeight = this.normalizeTokenValue(options);
        } else if (options && typeof options === 'object') {
          Object.assign(compositeValue, options);
        }
        
        tokens.push(this.createToken(tokenName, compositeValue, {
          type: TokenType.TYPOGRAPHY,
          category: TokenCategory.TYPOGRAPHY,
        }));
      } else {
        tokens.push(this.createToken(tokenName, this.normalizeTokenValue(value), {
          type: TokenType.DIMENSION,
          category: TokenCategory.TYPOGRAPHY,
        }));
      }
    }
    
    return tokens;
  }

  private extractFontFamilyTokens(fontFamily: any, prefix: string): DesignToken[] {
    const tokens: DesignToken[] = [];
    
    for (const [key, value] of Object.entries(fontFamily)) {
      const tokenName = `${prefix}.${key}`;
      
      if (Array.isArray(value)) {
        const arrayValue: TokenArray = { $array: value.map(v => this.normalizeTokenValue(v)) };
        tokens.push(this.createToken(tokenName, arrayValue, {
          type: TokenType.FONT_FAMILY,
          category: TokenCategory.TYPOGRAPHY,
        }));
      } else {
        tokens.push(this.createToken(tokenName, this.normalizeTokenValue(value), {
          type: TokenType.FONT_FAMILY,
          category: TokenCategory.TYPOGRAPHY,
        }));
      }
    }
    
    return tokens;
  }

  private extractFontWeightTokens(fontWeight: any, prefix: string): DesignToken[] {
    return this.extractNestedTokens(fontWeight, prefix, TokenCategory.TYPOGRAPHY, TokenType.FONT_WEIGHT);
  }

  private extractBorderRadiusTokens(borderRadius: any, prefix: string): DesignToken[] {
    return this.extractNestedTokens(borderRadius, prefix, TokenCategory.BORDER, TokenType.DIMENSION);
  }

  private extractShadowTokens(boxShadow: any, prefix: string): DesignToken[] {
    return this.extractNestedTokens(boxShadow, prefix, TokenCategory.SHADOW, TokenType.SHADOW);
  }

  private extractNestedTokens(
    obj: any,
    prefix: string,
    category: TokenCategory,
    type: TokenType
  ): DesignToken[] {
    const tokens: DesignToken[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const tokenName = `${prefix}.${key}`;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        tokens.push(...this.extractNestedTokens(value, tokenName, category, type));
      } else {
        tokens.push(this.createToken(tokenName, this.normalizeTokenValue(value), { type, category }));
      }
    }

    return tokens;
  }
}

/**
 * Token parser registry
 */
export class TokenParserRegistry {
  private parsers = new Map<TokenFormat, TokenParser>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const cssParser = new CSSVariableParser();
    cssParser.supportsFormat(TokenFormat.CSS_VARIABLE) && 
      this.parsers.set(TokenFormat.CSS_VARIABLE, cssParser);
    cssParser.supportsFormat(TokenFormat.CSS_CUSTOM_PROPERTY) && 
      this.parsers.set(TokenFormat.CSS_CUSTOM_PROPERTY, cssParser);

    const jsParser = new JSObjectParser();
    jsParser.supportsFormat(TokenFormat.JS_OBJECT) && 
      this.parsers.set(TokenFormat.JS_OBJECT, jsParser);
    jsParser.supportsFormat(TokenFormat.JS_MODULE) && 
      this.parsers.set(TokenFormat.JS_MODULE, jsParser);
    jsParser.supportsFormat(TokenFormat.JSON) && 
      this.parsers.set(TokenFormat.JSON, jsParser);

    const tailwindParser = new TailwindConfigParser();
    tailwindParser.supportsFormat(TokenFormat.TAILWIND_CONFIG) && 
      this.parsers.set(TokenFormat.TAILWIND_CONFIG, tailwindParser);
  }

  register(format: TokenFormat, parser: TokenParser): void {
    this.parsers.set(format, parser);
  }

  getParser(format: TokenFormat): TokenParser | undefined {
    return this.parsers.get(format);
  }

  getSupportedFormats(): TokenFormat[] {
    return Array.from(this.parsers.keys());
  }

  async parse(content: string, format: TokenFormat): Promise<TokenExtractionResult> {
    const parser = this.getParser(format);
    if (!parser) {
      throw new Error(`No parser available for format: ${format}`);
    }

    return parser.parse(content, format);
  }
}