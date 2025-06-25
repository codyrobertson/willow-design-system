import {
  DesignToken,
  TokenFormat,
  TokenType,
  TokenCategory,
  TokenValue,
  TokenCompositeValue,
  TokenReference,
  TokenArray,
  TokenCollection,
  TokenExtractionResult,
} from '../../types/theme-tokens.types';

/**
 * Token format converter interface
 */
export interface TokenFormatConverter {
  /**
   * Source format this converter handles
   */
  readonly sourceFormat: TokenFormat;
  
  /**
   * Target format this converter produces
   */
  readonly targetFormat: TokenFormat;
  
  /**
   * Convert tokens from source to target format
   */
  convert(tokens: DesignToken[]): Promise<string>;
  
  /**
   * Validate if tokens are compatible with this converter
   */
  validate(tokens: DesignToken[]): boolean;
}

/**
 * Base token format converter
 */
export abstract class BaseTokenFormatConverter implements TokenFormatConverter {
  abstract readonly sourceFormat: TokenFormat;
  abstract readonly targetFormat: TokenFormat;
  
  abstract convert(tokens: DesignToken[]): Promise<string>;
  
  validate(tokens: DesignToken[]): boolean {
    return tokens.length > 0;
  }

  protected formatTokenValue(value: TokenValue, format: TokenFormat): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return this.formatStringValue(value, format);
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    if (value && typeof value === 'object') {
      if ('$ref' in value) {
        return this.formatReference(value as TokenReference, format);
      }

      if ('$array' in value) {
        return this.formatArray(value as TokenArray, format);
      }

      return this.formatComposite(value as TokenCompositeValue, format);
    }

    return String(value);
  }

  protected formatStringValue(value: string, format: TokenFormat): string {
    switch (format) {
      case TokenFormat.CSS_VARIABLE:
        return value;
      case TokenFormat.JSON:
        return JSON.stringify(value);
      case TokenFormat.JS_OBJECT:
        return JSON.stringify(value);
      default:
        return value;
    }
  }

  protected formatReference(ref: TokenReference, format: TokenFormat): string {
    switch (format) {
      case TokenFormat.CSS_VARIABLE:
        return `var(--${ref.$ref.replace(/\./g, '-')})`;
      case TokenFormat.JSON:
      case TokenFormat.JS_OBJECT:
        return JSON.stringify(ref);
      case TokenFormat.STYLE_DICTIONARY:
        return `{${ref.$ref}}`;
      default:
        return ref.$ref;
    }
  }

  protected formatArray(array: TokenArray, format: TokenFormat): string {
    const formattedValues = array.$array.map(v => this.formatTokenValue(v, format));
    
    switch (format) {
      case TokenFormat.CSS_VARIABLE:
        return formattedValues.join(', ');
      case TokenFormat.JSON:
      case TokenFormat.JS_OBJECT:
        return JSON.stringify(formattedValues);
      default:
        return formattedValues.join(', ');
    }
  }

  protected formatComposite(composite: TokenCompositeValue, format: TokenFormat): string {
    switch (format) {
      case TokenFormat.CSS_VARIABLE:
        return Object.entries(composite)
          .map(([key, value]) => `${key}: ${this.formatTokenValue(value, format)}`)
          .join('; ');
      case TokenFormat.JSON:
      case TokenFormat.JS_OBJECT:
        return JSON.stringify(composite);
      default:
        return JSON.stringify(composite);
    }
  }

  protected escapeIdentifier(name: string): string {
    // Convert to valid JavaScript identifier
    return name
      .replace(/[^a-zA-Z0-9_$]/g, '_')
      .replace(/^[0-9]/, '_$&');
  }

  protected kebabCase(str: string): string {
    return str.replace(/\./g, '-').toLowerCase();
  }

  protected camelCase(str: string): string {
    return str
      .replace(/[-_.]/g, ' ')
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^\w/, char => char.toLowerCase());
  }
}

/**
 * CSS Variables format converter
 */
export class CSSVariablesConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.CSS_VARIABLE;

  async convert(tokens: DesignToken[]): Promise<string> {
    const lines = [':root {'];
    
    for (const token of tokens) {
      const cssVarName = token.name.startsWith('--') 
        ? token.name 
        : `--${this.kebabCase(token.name)}`;
      
      const value = this.formatTokenValue(token.value, this.targetFormat);
      
      if (token.description) {
        lines.push(`  /* ${token.description} */`);
      }
      
      lines.push(`  ${cssVarName}: ${value};`);
    }
    
    lines.push('}');
    return lines.join('\n');
  }
}

/**
 * JSON format converter
 */
export class JSONConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.CSS_VARIABLE;
  readonly targetFormat = TokenFormat.JSON;

  async convert(tokens: DesignToken[]): Promise<string> {
    const tokenObject: Record<string, any> = {};
    
    for (const token of tokens) {
      const path = token.name.replace(/^--/, '').replace(/-/g, '.');
      this.setNestedProperty(tokenObject, path, token.value);
    }
    
    return JSON.stringify(tokenObject, null, 2);
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
}

/**
 * JavaScript object format converter
 */
export class JSObjectConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.JS_OBJECT;

  async convert(tokens: DesignToken[]): Promise<string> {
    const tokenObject: Record<string, any> = {};
    
    for (const token of tokens) {
      this.setNestedProperty(tokenObject, token.name, token.value);
    }
    
    const jsonString = JSON.stringify(tokenObject, null, 2);
    return `export default ${jsonString};`;
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
}

/**
 * TypeScript definitions converter
 */
export class TypeScriptConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.JS_MODULE;

  async convert(tokens: DesignToken[]): Promise<string> {
    const lines: string[] = [];
    
    // Generate interface
    lines.push('interface Tokens {');
    
    const groupedTokens = this.groupTokensByCategory(tokens);
    
    for (const [category, categoryTokens] of Array.from(groupedTokens)) {
      lines.push(`  ${this.camelCase(category)}: {`);
      
      for (const token of categoryTokens) {
        const key = this.getTokenKey(token.name, category);
        const valueType = this.getTypeScriptType(token.value, token.type);
        
        if (token.description) {
          lines.push(`    /** ${token.description} */`);
        }
        
        lines.push(`    ${key}: ${valueType};`);
      }
      
      lines.push('  };');
    }
    
    lines.push('}');
    lines.push('');
    
    // Generate implementation
    lines.push('const tokens: Tokens = {');
    
    for (const [category, categoryTokens] of Array.from(groupedTokens)) {
      lines.push(`  ${this.camelCase(category)}: {`);
      
      for (const token of categoryTokens) {
        const key = this.getTokenKey(token.name, category);
        const value = this.formatTokenValue(token.value, TokenFormat.JSON);
        lines.push(`    ${key}: ${value},`);
      }
      
      lines.push('  },');
    }
    
    lines.push('};');
    lines.push('');
    lines.push('export default tokens;');
    lines.push('export type { Tokens };');
    
    return lines.join('\n');
  }

  private groupTokensByCategory(tokens: DesignToken[]): Map<string, DesignToken[]> {
    const groups = new Map<string, DesignToken[]>();
    
    for (const token of tokens) {
      const category = token.category || 'misc';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(token);
    }
    
    return groups;
  }

  private getTokenKey(tokenName: string, category: string): string {
    const withoutCategory = tokenName.replace(`${category}.`, '');
    return this.camelCase(withoutCategory);
  }

  private getTypeScriptType(value: TokenValue, type: TokenType): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'string') {
      return 'string';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (value && typeof value === 'object') {
      if ('$ref' in value) {
        return 'string'; // References resolve to strings
      }

      if ('$array' in value) {
        const array = value as TokenArray;
        if (array.$array.length > 0) {
          const firstType = this.getTypeScriptType(array.$array[0], type);
          return `${firstType}[]`;
        }
        return 'any[]';
      }

      // Composite value
      return 'object';
    }

    return 'any';
  }
}

/**
 * Tailwind config converter
 */
export class TailwindConfigConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.TAILWIND_CONFIG;

  async convert(tokens: DesignToken[]): Promise<string> {
    const theme: Record<string, any> = {};
    
    for (const token of tokens) {
      const tailwindPath = this.mapToTailwindPath(token);
      if (tailwindPath) {
        this.setNestedProperty(theme, tailwindPath, token.value);
      }
    }
    
    const config = {
      theme: {
        extend: theme,
      },
    };
    
    return `module.exports = ${JSON.stringify(config, null, 2)};`;
  }

  private mapToTailwindPath(token: DesignToken): string | null {
    const parts = token.name.split('.');
    
    // Map common token patterns to Tailwind theme keys
    switch (token.category) {
      case TokenCategory.COLOR:
        if (parts[0] === 'color' || parts[0] === 'colors') {
          return `colors.${parts.slice(1).join('.')}`;
        }
        return `colors.${token.name}`;
        
      case TokenCategory.SPACING:
        if (parts[0] === 'spacing' || parts[0] === 'space') {
          return `spacing.${parts.slice(1).join('.')}`;
        }
        return `spacing.${token.name}`;
        
      case TokenCategory.TYPOGRAPHY:
        if (token.type === TokenType.FONT_FAMILY) {
          return `fontFamily.${parts.slice(1).join('.')}`;
        }
        if (token.type === TokenType.FONT_WEIGHT) {
          return `fontWeight.${parts.slice(1).join('.')}`;
        }
        if (parts.includes('fontSize') || parts.includes('font-size')) {
          return `fontSize.${parts.slice(1).join('.')}`;
        }
        return null;
        
      case TokenCategory.BORDER:
        if (parts.includes('radius')) {
          return `borderRadius.${parts.slice(1).join('.')}`;
        }
        return null;
        
      case TokenCategory.SHADOW:
        if (parts.includes('shadow') || parts.includes('boxShadow')) {
          return `boxShadow.${parts.slice(1).join('.')}`;
        }
        return null;
        
      default:
        return null;
    }
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
}

/**
 * Style Dictionary converter
 */
export class StyleDictionaryConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.STYLE_DICTIONARY;

  async convert(tokens: DesignToken[]): Promise<string> {
    const sdTokens: Record<string, any> = {};
    
    for (const token of tokens) {
      const tokenData = {
        value: token.value,
        type: token.type,
        ...(token.description && { description: token.description }),
        ...(token.deprecated && { deprecated: token.deprecated }),
        ...(token.replacement && { replacement: token.replacement }),
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
}

/**
 * Sass variables converter
 */
export class SassVariablesConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.CSS_VARIABLE; // Using CSS_VARIABLE as closest match

  async convert(tokens: DesignToken[]): Promise<string> {
    const lines: string[] = [];
    
    for (const token of tokens) {
      const sassVarName = `$${this.kebabCase(token.name)}`;
      const value = this.formatTokenValue(token.value, TokenFormat.CSS_VARIABLE);
      
      if (token.description) {
        lines.push(`// ${token.description}`);
      }
      
      lines.push(`${sassVarName}: ${value};`);
    }
    
    return lines.join('\n');
  }
}

/**
 * Android resources converter
 */
export class AndroidResourcesConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.ANDROID_COLORS;

  async convert(tokens: DesignToken[]): Promise<string> {
    const lines = ['<?xml version="1.0" encoding="utf-8"?>'];
    lines.push('<resources>');
    
    const colorTokens = tokens.filter(token => token.type === TokenType.COLOR);
    const dimensionTokens = tokens.filter(token => token.type === TokenType.DIMENSION);
    
    if (colorTokens.length > 0) {
      lines.push('  <!-- Colors -->');
      for (const token of colorTokens) {
        const name = this.androidResourceName(token.name);
        const value = this.formatAndroidColor(token.value);
        
        if (token.description) {
          lines.push(`  <!-- ${token.description} -->`);
        }
        
        lines.push(`  <color name="${name}">${value}</color>`);
      }
    }
    
    if (dimensionTokens.length > 0) {
      lines.push('  <!-- Dimensions -->');
      for (const token of dimensionTokens) {
        const name = this.androidResourceName(token.name);
        const value = this.formatAndroidDimension(token.value);
        
        if (token.description) {
          lines.push(`  <!-- ${token.description} -->`);
        }
        
        lines.push(`  <dimen name="${name}">${value}</dimen>`);
      }
    }
    
    lines.push('</resources>');
    return lines.join('\n');
  }

  private androidResourceName(name: string): string {
    return name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  }

  private formatAndroidColor(value: TokenValue): string {
    if (typeof value === 'string' && value.startsWith('#')) {
      return value.toUpperCase();
    }
    return String(value);
  }

  private formatAndroidDimension(value: TokenValue): string {
    if (typeof value === 'string') {
      // Convert px to dp for Android
      if (value.endsWith('px')) {
        const num = parseFloat(value);
        return `${num}dp`;
      }
      return value;
    }
    return `${value}dp`;
  }
}

/**
 * iOS Swift converter
 */
export class IOSSwiftConverter extends BaseTokenFormatConverter {
  readonly sourceFormat = TokenFormat.JSON;
  readonly targetFormat = TokenFormat.IOS_COLORS;

  async convert(tokens: DesignToken[]): Promise<string> {
    const lines = ['import UIKit', '', 'extension UIColor {'];
    
    const colorTokens = tokens.filter(token => token.type === TokenType.COLOR);
    
    for (const token of colorTokens) {
      const name = this.swiftPropertyName(token.name);
      const value = this.formatSwiftColor(token.value);
      
      if (token.description) {
        lines.push(`  /// ${token.description}`);
      }
      
      lines.push(`  static let ${name} = ${value}`);
    }
    
    lines.push('}');
    lines.push('');
    
    // Add font sizes
    const fontTokens = tokens.filter(token => 
      token.type === TokenType.DIMENSION && 
      token.category === TokenCategory.TYPOGRAPHY
    );
    
    if (fontTokens.length > 0) {
      lines.push('extension CGFloat {');
      
      for (const token of fontTokens) {
        const name = this.swiftPropertyName(token.name);
        const value = this.formatSwiftDimension(token.value);
        
        if (token.description) {
          lines.push(`  /// ${token.description}`);
        }
        
        lines.push(`  static let ${name}: CGFloat = ${value}`);
      }
      
      lines.push('}');
    }
    
    return lines.join('\n');
  }

  private swiftPropertyName(name: string): string {
    return this.camelCase(name.replace(/[^a-zA-Z0-9]/g, '_'));
  }

  private formatSwiftColor(value: TokenValue): string {
    if (typeof value === 'string' && value.startsWith('#')) {
      const hex = value.substring(1);
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return `UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: 1.0)`;
      }
    }
    return 'UIColor.clear';
  }

  private formatSwiftDimension(value: TokenValue): string {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return num.toString();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return '0';
  }
}

/**
 * Format converter registry
 */
export class TokenFormatConverterRegistry {
  private converters = new Map<string, TokenFormatConverter>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const converters: TokenFormatConverter[] = [
      new CSSVariablesConverter(),
      new JSONConverter(),
      new JSObjectConverter(),
      new TypeScriptConverter(),
      new TailwindConfigConverter(),
      new StyleDictionaryConverter(),
      new SassVariablesConverter(),
      new AndroidResourcesConverter(),
      new IOSSwiftConverter(),
    ];

    for (const converter of converters) {
      const key = `${converter.sourceFormat}-to-${converter.targetFormat}`;
      this.converters.set(key, converter);
    }
  }

  register(converter: TokenFormatConverter): void {
    const key = `${converter.sourceFormat}-to-${converter.targetFormat}`;
    this.converters.set(key, converter);
  }

  getConverter(sourceFormat: TokenFormat, targetFormat: TokenFormat): TokenFormatConverter | undefined {
    const key = `${sourceFormat}-to-${targetFormat}`;
    return this.converters.get(key);
  }

  getAvailableConversions(): Array<{ source: TokenFormat; target: TokenFormat }> {
    const conversions: Array<{ source: TokenFormat; target: TokenFormat }> = [];
    
    for (const converter of Array.from(this.converters.values())) {
      conversions.push({
        source: converter.sourceFormat,
        target: converter.targetFormat,
      });
    }
    
    return conversions;
  }

  async convert(
    tokens: DesignToken[],
    sourceFormat: TokenFormat,
    targetFormat: TokenFormat
  ): Promise<string> {
    const converter = this.getConverter(sourceFormat, targetFormat);
    
    if (!converter) {
      throw new Error(`No converter available for ${sourceFormat} to ${targetFormat}`);
    }

    if (!converter.validate(tokens)) {
      throw new Error(`Tokens are not valid for ${sourceFormat} to ${targetFormat} conversion`);
    }

    return converter.convert(tokens);
  }

  /**
   * Get all possible target formats for a given source format
   */
  getTargetFormats(sourceFormat: TokenFormat): TokenFormat[] {
    const targets: TokenFormat[] = [];
    
    for (const converter of Array.from(this.converters.values())) {
      if (converter.sourceFormat === sourceFormat) {
        targets.push(converter.targetFormat);
      }
    }
    
    return targets;
  }

  /**
   * Get conversion path between formats (for multi-step conversions)
   */
  findConversionPath(sourceFormat: TokenFormat, targetFormat: TokenFormat): TokenFormat[] | null {
    if (sourceFormat === targetFormat) {
      return [sourceFormat];
    }

    // Direct conversion available
    if (this.getConverter(sourceFormat, targetFormat)) {
      return [sourceFormat, targetFormat];
    }

    // Try to find a path through intermediate formats
    const visited = new Set<TokenFormat>();
    const queue: { format: TokenFormat; path: TokenFormat[] }[] = [
      { format: sourceFormat, path: [sourceFormat] }
    ];

    while (queue.length > 0) {
      const { format, path } = queue.shift()!;
      
      if (visited.has(format)) {
        continue;
      }
      
      visited.add(format);
      
      const targets = this.getTargetFormats(format);
      
      for (const target of targets) {
        if (target === targetFormat) {
          return [...path, target];
        }
        
        if (!visited.has(target) && path.length < 3) { // Limit path length
          queue.push({ format: target, path: [...path, target] });
        }
      }
    }

    return null; // No conversion path found
  }

  /**
   * Perform multi-step conversion if direct conversion is not available
   */
  async convertWithPath(
    tokens: DesignToken[],
    sourceFormat: TokenFormat,
    targetFormat: TokenFormat
  ): Promise<string> {
    const path = this.findConversionPath(sourceFormat, targetFormat);
    
    if (!path || path.length < 2) {
      throw new Error(`No conversion path found from ${sourceFormat} to ${targetFormat}`);
    }

    if (path.length === 2) {
      // Direct conversion
      return this.convert(tokens, sourceFormat, targetFormat);
    }

    // Multi-step conversion
    let currentTokens = tokens;
    let currentFormat = sourceFormat;
    
    for (let i = 1; i < path.length; i++) {
      const nextFormat = path[i];
      const converter = this.getConverter(currentFormat, nextFormat);
      
      if (!converter) {
        throw new Error(`Missing converter in path: ${currentFormat} to ${nextFormat}`);
      }
      
      const output = await converter.convert(currentTokens);
      
      // For intermediate steps, we'd need to parse the output back to tokens
      // This is simplified for the example
      if (i < path.length - 1) {
        // In a real implementation, you'd parse the output back to tokens
        throw new Error('Multi-step conversion requires output parsing (not implemented)');
      }
      
      if (i === path.length - 1) {
        return output;
      }
    }

    throw new Error('Conversion path failed');
  }
}