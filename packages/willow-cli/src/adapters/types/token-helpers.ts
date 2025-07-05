/**
 * Type-safe token system helpers for design tokens
 */

import {
  TokenConfig,
  ColorTokens,
  ColorScale,
  TypographyTokens,
  SpacingTokens,
  BorderTokens,
  ShadowTokens,
  AnimationTokens,
  BreakpointTokens,
} from './AdapterTypes.js';

// ============================================================================
// Token Path Types
// ============================================================================

/**
 * Dot-notation path for nested token access
 * @example "colors.primary.500" | "typography.fontSize.base"
 */
export type TokenPath<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}` | `${K}.${TokenPath<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;

/**
 * Extract value type from a token path
 */
export type TokenValue<T, Path extends string> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends object
      ? TokenValue<T[K], Rest>
      : never
    : never
  : Path extends keyof T
  ? T[Path]
  : never;

// ============================================================================
// Token Builders
// ============================================================================

/**
 * Type-safe color scale builder
 */
export function createColorScale(baseColor: string, options?: {
  steps?: Array<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950>;
  algorithm?: 'lighten' | 'darken' | 'saturate' | 'desaturate';
}): ColorScale {
  const steps = options?.steps || [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const scale: Partial<ColorScale> = {};
  
  // Simple color scale generation (would use proper color library in production)
  steps.forEach((step) => {
    const factor = step / 500;
    scale[step] = adjustColor(baseColor, factor, options?.algorithm || 'lighten');
  });
  
  return scale as ColorScale;
}

/**
 * Type-safe color tokens builder
 */
export function createColorTokens<T extends Partial<ColorTokens>>(tokens: T): T {
  return tokens;
}

/**
 * Type-safe typography tokens builder
 */
export function createTypographyTokens<T extends Partial<TypographyTokens>>(tokens: T): T {
  return tokens;
}

/**
 * Type-safe spacing tokens builder
 */
export function createSpacingTokens<T extends Partial<SpacingTokens>>(
  base: number = 4,
  scale: number[] = [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32]
): SpacingTokens {
  const tokens: Partial<SpacingTokens> = {
    0: '0',
    px: '1px',
  };
  
  scale.forEach((multiplier) => {
    const key = multiplier.toString().replace('.', '.') as keyof SpacingTokens;
    tokens[key] = `${base * multiplier}px`;
  });
  
  return tokens as SpacingTokens;
}

// ============================================================================
// Token Accessors
// ============================================================================

/**
 * Type-safe token getter with path support
 */
export function getToken<T extends TokenConfig, P extends TokenPath<T['tokens']>>(
  config: T,
  path: P
): TokenValue<T['tokens'], P> | undefined {
  const parts = path.split('.');
  let current: any = config.tokens;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Type-safe token setter
 */
export function setToken<T extends TokenConfig, P extends TokenPath<T['tokens']>>(
  config: T,
  path: P,
  value: TokenValue<T['tokens'], P>
): T {
  const parts = path.split('.');
  const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone
  let current: any = newConfig.tokens;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return newConfig;
}

/**
 * Check if a token exists
 */
export function hasToken<T extends TokenConfig>(
  config: T,
  path: TokenPath<T['tokens']>
): boolean {
  return getToken(config, path) !== undefined;
}

// ============================================================================
// Token Validators
// ============================================================================

/**
 * Validate color token format
 */
export function isValidColorToken(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  // Check hex format
  if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{8}$/.test(value)) {
    return true;
  }
  
  // Check rgb/rgba format with proper range validation
  const rgbMatch = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+)?\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  }
  
  // Check hsl/hsla format
  if (/^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*(,\s*[\d.]+)?\s*\)$/.test(value)) {
    return true;
  }
  
  // Check named colors
  const namedColors = ['transparent', 'currentColor', 'inherit'];
  return namedColors.includes(value);
}

/**
 * Validate spacing token format
 */
export function isValidSpacingToken(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  // Check common units
  return /^\d+(\.\d+)?(px|rem|em|vh|vw|%|ch|ex)$/.test(value) || value === '0';
}

/**
 * Validate font size token
 */
export function isValidFontSizeToken(value: unknown): value is string {
  return isValidSpacingToken(value);
}

/**
 * Validate font weight token
 */
export function isValidFontWeightToken(value: unknown): value is number | string {
  if (typeof value === 'number') {
    return value >= 100 && value <= 900 && value % 100 === 0;
  }
  
  if (typeof value === 'string') {
    const namedWeights = ['normal', 'bold', 'lighter', 'bolder'];
    return namedWeights.includes(value);
  }
  
  return false;
}

// ============================================================================
// Token Transformers
// ============================================================================

/**
 * Convert pixel values to rem
 */
export function pxToRem(px: string | number, baseFontSize: number = 16): string {
  const pxValue = typeof px === 'string' ? parseFloat(px) : px;
  return `${pxValue / baseFontSize}rem`;
}

/**
 * Convert rem values to pixels
 */
export function remToPx(rem: string | number, baseFontSize: number = 16): string {
  const remValue = typeof rem === 'string' ? parseFloat(rem) : rem;
  return `${remValue * baseFontSize}px`;
}

/**
 * Convert hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// Token Mergers
// ============================================================================

/**
 * Deep merge token configurations
 */
export function mergeTokens<T extends TokenConfig>(
  base: T,
  ...overrides: Partial<T>[]
): T {
  const merged = JSON.parse(JSON.stringify(base)); // Deep clone
  
  for (const override of overrides) {
    deepMerge(merged, override);
  }
  
  return merged;
}

/**
 * Extract tokens by category
 */
export function extractTokensByCategory<K extends keyof NonNullable<TokenConfig['tokens']>>(
  config: TokenConfig,
  category: K
): NonNullable<TokenConfig['tokens']>[K] | undefined {
  return config.tokens?.[category];
}

/**
 * Flatten nested tokens to dot notation
 */
export function flattenTokens(
  tokens: Record<string, any>,
  prefix: string = ''
): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(tokens)) {
    const path = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenTokens(value, path));
    } else {
      flattened[path] = value;
    }
  }
  
  return flattened;
}

// ============================================================================
// Token Type Guards
// ============================================================================

/**
 * Check if value is a color scale
 */
export function isColorScale(value: unknown): value is ColorScale {
  if (!value || typeof value !== 'object') return false;
  
  const validKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  const keys = Object.keys(value);
  
  return keys.some(key => validKeys.includes(key)) &&
    keys.every(key => validKeys.includes(key)) &&
    Object.values(value).every(v => isValidColorToken(v));
}

/**
 * Check if value is valid color tokens
 */
export function isColorTokens(value: unknown): value is ColorTokens {
  if (!value || typeof value !== 'object') return false;
  
  const colorTokens = value as any;
  const validCategories = [
    'primary', 'secondary', 'neutral', 'success', 
    'warning', 'error', 'info', 'accent'
  ];
  
  return Object.keys(colorTokens).some(key => 
    validCategories.includes(key) || 
    key === 'background' || 
    key === 'foreground' || 
    key === 'text' || 
    key === 'border' ||
    key === 'semantic'
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simple color adjustment (would use proper color library in production)
 */
function adjustColor(
  color: string,
  factor: number,
  algorithm: 'lighten' | 'darken' | 'saturate' | 'desaturate'
): string {
  // This is a simplified implementation
  // In production, use a proper color manipulation library
  if (!color.startsWith('#')) return color;
  
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  let newR, newG, newB;
  
  switch (algorithm) {
    case 'lighten':
      newR = Math.min(255, r + (255 - r) * factor);
      newG = Math.min(255, g + (255 - g) * factor);
      newB = Math.min(255, b + (255 - b) * factor);
      break;
    
    case 'darken':
      newR = Math.max(0, r * (1 - factor));
      newG = Math.max(0, g * (1 - factor));
      newB = Math.max(0, b * (1 - factor));
      break;
    
    default:
      newR = r;
      newG = g;
      newB = b;
  }
  
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Deep merge helper
 */
function deepMerge(target: any, source: any): void {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// ============================================================================
// Token CSS Variable Generators
// ============================================================================

/**
 * Generate CSS custom properties from tokens
 */
export function tokensToCSSVariables(
  tokens: TokenConfig['tokens'],
  prefix: string = '--token'
): Record<string, string> {
  const flattened = flattenTokens(tokens || {});
  const cssVars: Record<string, string> = {};
  
  for (const [path, value] of Object.entries(flattened)) {
    const varName = `${prefix}-${path.replace(/\./g, '-')}`;
    cssVars[varName] = String(value);
  }
  
  return cssVars;
}

/**
 * Generate CSS string from tokens
 */
export function tokensToCSSString(
  tokens: TokenConfig['tokens'],
  selector: string = ':root',
  prefix?: string
): string {
  const cssVars = tokensToCSSVariables(tokens, prefix);
  const lines = Object.entries(cssVars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  
  return `${selector} {\n${lines}\n}`;
}