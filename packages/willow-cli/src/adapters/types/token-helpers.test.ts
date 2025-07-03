import { describe, it, expect } from 'vitest';
import {
  createColorScale,
  createColorTokens,
  createTypographyTokens,
  createSpacingTokens,
  getToken,
  setToken,
  hasToken,
  isValidColorToken,
  isValidSpacingToken,
  isValidFontSizeToken,
  isValidFontWeightToken,
  pxToRem,
  remToPx,
  hexToRgba,
  mergeTokens,
  extractTokensByCategory,
  flattenTokens,
  isColorScale,
  isColorTokens,
  tokensToCSSVariables,
  tokensToCSSString,
  TokenPath,
  TokenValue,
} from './token-helpers';
import { createCompleteTokenConfig, createMinimalTokenConfig } from '../test-fixtures';

describe.shuffle('Token Helpers', () => {
  describe('Type Safety', () => {
    it('should enforce correct token paths at compile time', () => {
      const config = createCompleteTokenConfig();
      
      // Valid paths
      type ValidPaths = TokenPath<typeof config.tokens>;
      const validPath: ValidPaths = 'colors.primary.500';
      
      // Get token with type inference
      const colorValue = getToken(config, 'colors.primary.500');
      expect(colorValue).toBe('#2196f3');
      
      // Type should be inferred correctly
      const fontSize = getToken(config, 'typography.fontSize.base');
      expect(fontSize).toBe('16px');
    });

    it('should extract correct value types from paths', () => {
      const config = createCompleteTokenConfig();
      
      // Color value should be string
      type ColorValue = TokenValue<typeof config.tokens, 'colors.primary.500'>;
      const color: ColorValue = '#2196f3';
      expect(typeof color).toBe('string');
      
      // Font weight should be number
      type WeightValue = TokenValue<typeof config.tokens, 'typography.fontWeight.bold'>;
      const weight: WeightValue = 700;
      expect(typeof weight).toBe('number');
    });
  });

  describe('Token Builders', () => {
    it('should create color scale with exact values', () => {
      const scale = createColorScale('#007bff', {
        steps: [50, 100, 500, 900],
      });
      
      expect(scale).toHaveProperty('50');
      expect(scale).toHaveProperty('100');
      expect(scale).toHaveProperty('500');
      expect(scale).toHaveProperty('900');
      expect(scale['500']).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should create type-safe color tokens', () => {
      const tokens = createColorTokens({
        primary: {
          500: '#007bff',
          600: '#0056b3',
        },
        text: {
          primary: '#212529',
          secondary: '#6c757d',
        },
      });
      
      expect(tokens.primary?.['500']).toBe('#007bff');
      expect(tokens.text?.primary).toBe('#212529');
    });

    it('should create spacing tokens with exact scale', () => {
      const tokens = createSpacingTokens(4, [0, 1, 2, 4, 8]);
      
      expect(tokens).toEqual({
        0: '0',
        px: '1px',
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '4': '16px',
        '8': '32px',
      });
    });
  });

  describe('Token Accessors', () => {
    it('should get nested tokens with exact values', () => {
      const config = createCompleteTokenConfig();
      
      // Test various paths
      expect(getToken(config, 'colors.primary.500')).toBe('#2196f3');
      expect(getToken(config, 'typography.fontSize.lg')).toBe('18px');
      expect(getToken(config, 'spacing.4')).toBe('16px');
      expect(getToken(config, 'borders.radius.full')).toBe('9999px');
      
      // Non-existent path
      expect(getToken(config, 'colors.invalid.path' as any)).toBeUndefined();
    });

    it('should set tokens and return new config', () => {
      const config = createMinimalTokenConfig();
      
      const updated = setToken(config, 'colors.primary.500', '#ff0000');
      
      // Original should be unchanged
      expect(getToken(config, 'colors.primary.500')).toBe('#007bff');
      
      // Updated should have new value
      expect(getToken(updated, 'colors.primary.500')).toBe('#ff0000');
    });

    it('should check token existence accurately', () => {
      const config = createCompleteTokenConfig();
      
      expect(hasToken(config, 'colors.primary.500')).toBe(true);
      expect(hasToken(config, 'typography.fontFamily.sans')).toBe(true);
      expect(hasToken(config, 'invalid.path' as any)).toBe(false);
    });
  });

  describe('Token Validators', () => {
    it('should validate color tokens with exact formats', () => {
      // Valid hex colors
      expect(isValidColorToken('#fff')).toBe(true);
      expect(isValidColorToken('#ffffff')).toBe(true);
      expect(isValidColorToken('#ffffff00')).toBe(true);
      
      // Valid rgb/rgba
      expect(isValidColorToken('rgb(255, 255, 255)')).toBe(true);
      expect(isValidColorToken('rgba(255, 255, 255, 0.5)')).toBe(true);
      
      // Valid hsl/hsla
      expect(isValidColorToken('hsl(360, 100%, 50%)')).toBe(true);
      expect(isValidColorToken('hsla(360, 100%, 50%, 0.5)')).toBe(true);
      
      // Valid named colors
      expect(isValidColorToken('transparent')).toBe(true);
      expect(isValidColorToken('currentColor')).toBe(true);
      
      // Invalid colors
      expect(isValidColorToken('#gg0000')).toBe(false);
      expect(isValidColorToken('rgb(256, 0, 0)')).toBe(false);
      expect(isValidColorToken('notacolor')).toBe(false);
      expect(isValidColorToken(123)).toBe(false);
    });

    it('should validate spacing tokens with exact formats', () => {
      // Valid spacing
      expect(isValidSpacingToken('0')).toBe(true);
      expect(isValidSpacingToken('16px')).toBe(true);
      expect(isValidSpacingToken('1.5rem')).toBe(true);
      expect(isValidSpacingToken('100%')).toBe(true);
      expect(isValidSpacingToken('50vh')).toBe(true);
      
      // Invalid spacing
      expect(isValidSpacingToken('16')).toBe(false);
      expect(isValidSpacingToken('px')).toBe(false);
      expect(isValidSpacingToken('auto')).toBe(false);
      expect(isValidSpacingToken(16)).toBe(false);
    });

    it('should validate font weights with exact values', () => {
      // Valid numeric weights
      expect(isValidFontWeightToken(100)).toBe(true);
      expect(isValidFontWeightToken(400)).toBe(true);
      expect(isValidFontWeightToken(700)).toBe(true);
      expect(isValidFontWeightToken(900)).toBe(true);
      
      // Valid string weights
      expect(isValidFontWeightToken('normal')).toBe(true);
      expect(isValidFontWeightToken('bold')).toBe(true);
      expect(isValidFontWeightToken('lighter')).toBe(true);
      
      // Invalid weights
      expect(isValidFontWeightToken(150)).toBe(false);
      expect(isValidFontWeightToken(1000)).toBe(false);
      expect(isValidFontWeightToken('extra-bold')).toBe(false);
    });
  });

  describe('Token Transformers', () => {
    it('should convert px to rem with exact calculations', () => {
      expect(pxToRem('16px')).toBe('1rem');
      expect(pxToRem('24px')).toBe('1.5rem');
      expect(pxToRem(32)).toBe('2rem');
      expect(pxToRem('20px', 10)).toBe('2rem'); // Custom base
    });

    it('should convert rem to px with exact calculations', () => {
      expect(remToPx('1rem')).toBe('16px');
      expect(remToPx('1.5rem')).toBe('24px');
      expect(remToPx(2)).toBe('32px');
      expect(remToPx('2rem', 10)).toBe('20px'); // Custom base
    });

    it('should convert hex to rgba with exact format', () => {
      expect(hexToRgba('#ffffff')).toBe('rgba(255, 255, 255, 1)');
      expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
      expect(hexToRgba('#ff0000', 0)).toBe('rgba(255, 0, 0, 0)');
      
      // Should handle with or without #
      expect(hexToRgba('00ff00')).toBe('rgba(0, 255, 0, 1)');
      
      // Should throw on invalid hex
      expect(() => hexToRgba('#gg0000')).toThrow('Invalid hex color');
    });
  });

  describe('Token Mergers', () => {
    it('should deep merge tokens with exact precedence', () => {
      const base = createMinimalTokenConfig();
      const override1 = {
        tokens: {
          colors: {
            primary: {
              500: '#ff0000',
              600: '#cc0000',
            },
            secondary: {
              500: '#00ff00',
            },
          },
        },
      };
      const override2 = {
        tokens: {
          colors: {
            primary: {
              500: '#0000ff', // Should override override1
            },
          },
        },
      };
      
      const merged = mergeTokens(base, override1, override2);
      
      expect(getToken(merged, 'colors.primary.500')).toBe('#0000ff');
      expect(getToken(merged, 'colors.primary.600')).toBe('#cc0000');
      expect(getToken(merged, 'colors.secondary.500')).toBe('#00ff00');
    });

    it('should extract tokens by category', () => {
      const config = createCompleteTokenConfig();
      
      const colors = extractTokensByCategory(config, 'colors');
      expect(colors).toBeDefined();
      expect(colors?.primary?.['500']).toBe('#2196f3');
      
      const typography = extractTokensByCategory(config, 'typography');
      expect(typography?.fontSize?.base).toBe('16px');
    });

    it('should flatten tokens to exact dot notation', () => {
      const tokens = {
        colors: {
          primary: {
            500: '#007bff',
            600: '#0056b3',
          },
          text: {
            primary: '#212529',
          },
        },
        spacing: {
          sm: '8px',
          md: '16px',
        },
      };
      
      const flattened = flattenTokens(tokens);
      
      expect(flattened).toEqual({
        'colors.primary.500': '#007bff',
        'colors.primary.600': '#0056b3',
        'colors.text.primary': '#212529',
        'spacing.sm': '8px',
        'spacing.md': '16px',
      });
    });
  });

  describe('Type Guards', () => {
    it('should identify color scales accurately', () => {
      const validScale = {
        50: '#e3f2fd',
        100: '#bbdefb',
        500: '#2196f3',
        900: '#0d47a1',
      };
      
      const invalidScale = {
        light: '#ffffff',
        dark: '#000000',
      };
      
      expect(isColorScale(validScale)).toBe(true);
      expect(isColorScale(invalidScale)).toBe(false);
      expect(isColorScale(null)).toBe(false);
      expect(isColorScale({ 500: 'not-a-color' })).toBe(false);
    });

    it('should identify color tokens accurately', () => {
      const validTokens = {
        primary: { 500: '#007bff' },
        text: { primary: '#212529' },
      };
      
      const invalidTokens = {
        someKey: 'value',
      };
      
      expect(isColorTokens(validTokens)).toBe(true);
      expect(isColorTokens(invalidTokens)).toBe(false);
      expect(isColorTokens(null)).toBe(false);
    });
  });

  describe('CSS Variable Generation', () => {
    it('should generate CSS variables with exact names', () => {
      const tokens = {
        colors: {
          primary: {
            500: '#007bff',
          },
        },
        spacing: {
          md: '16px',
        },
      };
      
      const cssVars = tokensToCSSVariables(tokens);
      
      expect(cssVars).toEqual({
        '--token-colors-primary-500': '#007bff',
        '--token-spacing-md': '16px',
      });
      
      // Custom prefix
      const customVars = tokensToCSSVariables(tokens, '--ds');
      expect(customVars).toEqual({
        '--ds-colors-primary-500': '#007bff',
        '--ds-spacing-md': '16px',
      });
    });

    it('should generate CSS string with exact format', () => {
      const tokens = {
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
        },
      };
      
      const css = tokensToCSSString(tokens);
      
      expect(css).toBe(`:root {
  --token-colors-primary: #007bff;
  --token-colors-secondary: #6c757d;
}`);
      
      // Custom selector and prefix
      const customCss = tokensToCSSString(tokens, '.theme-root', '--theme');
      expect(customCss).toContain('.theme-root {');
      expect(customCss).toContain('--theme-colors-primary: #007bff;');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty or null token configs', () => {
      const emptyConfig = { category: 'test', path: 'test', value: null };
      
      expect(getToken(emptyConfig as any, 'any.path' as any)).toBeUndefined();
      expect(flattenTokens({})).toEqual({});
      expect(tokensToCSSVariables(undefined)).toEqual({});
    });

    it('should handle deeply nested paths', () => {
      const deepTokens = {
        a: { b: { c: { d: { e: { f: 'deep-value' } } } } },
      };
      
      const config = { 
        category: 'test', 
        path: 'test', 
        value: null,
        tokens: deepTokens,
      };
      
      expect(getToken(config as any, 'a.b.c.d.e.f' as any)).toBe('deep-value');
      
      const flattened = flattenTokens(deepTokens);
      expect(flattened['a.b.c.d.e.f']).toBe('deep-value');
    });

    it('should handle special characters in token names', () => {
      const tokens = {
        '2xl': '32px',
        'colors-primary': '#007bff',
        'spacing/large': '24px',
      };
      
      const cssVars = tokensToCSSVariables(tokens);
      expect(cssVars['--token-2xl']).toBe('32px');
      expect(cssVars['--token-colors-primary']).toBe('#007bff');
      expect(cssVars['--token-spacing/large']).toBe('24px');
    });
  });
});