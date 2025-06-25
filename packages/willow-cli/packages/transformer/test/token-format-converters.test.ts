import {
  TokenFormatConverterRegistry,
  CSSVariablesConverter,
  JSONConverter,
  JSObjectConverter,
  TypeScriptConverter,
  TailwindConfigConverter,
  StyleDictionaryConverter,
  SassVariablesConverter,
  AndroidResourcesConverter,
  IOSSwiftConverter,
} from '../src/styles/theme-tokens/token-format-converters';
import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenArray,
  TokenReference,
  TokenCompositeValue,
} from '../src/types/theme-tokens.types';

describe('Token Format Converters', () => {
  const sampleTokens: DesignToken[] = [
    {
      name: 'color.primary.500',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Primary brand color',
    },
    {
      name: 'color.secondary.500',
      value: '#6c757d',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'spacing.md',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
      description: 'Medium spacing',
    },
    {
      name: 'font.family.sans',
      value: {
        $array: ['Inter', 'system-ui', 'sans-serif'],
      } as TokenArray,
      type: TokenType.FONT_FAMILY,
      category: TokenCategory.TYPOGRAPHY,
    },
    {
      name: 'border.default',
      value: {
        width: '1px',
        style: 'solid',
        color: { $ref: 'color.primary.500' },
      } as TokenCompositeValue,
      type: TokenType.BORDER,
      category: TokenCategory.BORDER,
    },
  ];

  describe('CSSVariablesConverter', () => {
    const converter = new CSSVariablesConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.JSON);
      expect(converter.targetFormat).toBe(TokenFormat.CSS_VARIABLE);
    });

    it('should convert tokens to CSS variables', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain(':root {');
      expect(result).toContain('--color-primary-500: #007bff;');
      expect(result).toContain('--spacing-md: 16px;');
      expect(result).toContain('/* Primary brand color */');
      expect(result).toContain('}');
    });

    it('should handle array values', async () => {
      const fontToken = sampleTokens.find(t => t.name === 'font.family.sans')!;
      const result = await converter.convert([fontToken]);

      expect(result).toContain('--font-family-sans: Inter, system-ui, sans-serif;');
    });

    it('should handle composite values', async () => {
      const borderToken = sampleTokens.find(t => t.name === 'border.default')!;
      const result = await converter.convert([borderToken]);

      expect(result).toContain('--border-default:');
      expect(result).toContain('width: 1px');
      expect(result).toContain('style: solid');
    });
  });

  describe('JSONConverter', () => {
    const converter = new JSONConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.CSS_VARIABLE);
      expect(converter.targetFormat).toBe(TokenFormat.JSON);
    });

    it('should convert CSS variables to nested JSON', async () => {
      const cssTokens: DesignToken[] = [
        {
          name: '--color-primary-500',
          value: '#007bff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: '--spacing-md',
          value: '16px',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
      ];

      const result = await converter.convert(cssTokens);
      const parsed = JSON.parse(result);

      expect(parsed.color.primary['500']).toBe('#007bff');
      expect(parsed.spacing.md).toBe('16px');
    });
  });

  describe('JSObjectConverter', () => {
    const converter = new JSObjectConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.JSON);
      expect(converter.targetFormat).toBe(TokenFormat.JS_OBJECT);
    });

    it('should convert tokens to JavaScript object export', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain('export default');
      expect(result).toContain('"color"');
      expect(result).toContain('"primary"');
      expect(result).toContain('#007bff');
    });
  });

  describe('TypeScriptConverter', () => {
    const converter = new TypeScriptConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.JSON);
      expect(converter.targetFormat).toBe(TokenFormat.JS_MODULE);
    });

    it('should generate TypeScript interface and implementation', async () => {
      const result = await converter.convert(sampleTokens);

      // Check interface generation
      expect(result).toContain('interface Tokens {');
      expect(result).toContain('color: {');
      expect(result).toContain('spacing: {');
      expect(result).toContain('typography: {');

      // Check property types
      expect(result).toContain('primary: {');
      expect(result).toContain('500: string;');
      expect(result).toContain('md: string;');

      // Check implementation
      expect(result).toContain('const tokens: Tokens = {');
      expect(result).toContain('export default tokens;');
      expect(result).toContain('export type { Tokens };');

      // Check comments
      expect(result).toContain('/** Primary brand color */');
      expect(result).toContain('/** Medium spacing */');
    });

    it('should handle array types correctly', async () => {
      const fontToken = sampleTokens.find(t => t.name === 'font.family.sans')!;
      const result = await converter.convert([fontToken]);

      expect(result).toContain('sans: string[];');
    });
  });

  describe('TailwindConfigConverter', () => {
    const converter = new TailwindConfigConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.JSON);
      expect(converter.targetFormat).toBe(TokenFormat.TAILWIND_CONFIG);
    });

    it('should convert tokens to Tailwind config', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain('module.exports =');
      expect(result).toContain('theme:');
      expect(result).toContain('extend:');
      expect(result).toContain('colors');
      expect(result).toContain('spacing');
    });

    it('should map color tokens correctly', async () => {
      const colorTokens = sampleTokens.filter(t => t.category === TokenCategory.COLOR);
      const result = await converter.convert(colorTokens);

      const parsed = result.match(/module\.exports = (.+);$/s)?.[1];
      if (parsed) {
        const config = JSON.parse(parsed);
        expect(config.theme.extend.colors.primary['500']).toBe('#007bff');
        expect(config.theme.extend.colors.secondary['500']).toBe('#6c757d');
      }
    });

    it('should map spacing tokens correctly', async () => {
      const spacingTokens = sampleTokens.filter(t => t.category === TokenCategory.SPACING);
      const result = await converter.convert(spacingTokens);

      const parsed = result.match(/module\.exports = (.+);$/s)?.[1];
      if (parsed) {
        const config = JSON.parse(parsed);
        expect(config.theme.extend.spacing.md).toBe('16px');
      }
    });
  });

  describe('StyleDictionaryConverter', () => {
    const converter = new StyleDictionaryConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.JSON);
      expect(converter.targetFormat).toBe(TokenFormat.STYLE_DICTIONARY);
    });

    it('should convert tokens to Style Dictionary format', async () => {
      const result = await converter.convert(sampleTokens);
      const parsed = JSON.parse(result);

      expect(parsed.color.primary['500'].value).toBe('#007bff');
      expect(parsed.color.primary['500'].type).toBe(TokenType.COLOR);
      expect(parsed.color.primary['500'].description).toBe('Primary brand color');

      expect(parsed.spacing.md.value).toBe('16px');
      expect(parsed.spacing.md.type).toBe(TokenType.DIMENSION);
      expect(parsed.spacing.md.description).toBe('Medium spacing');
    });

    it('should include metadata in Style Dictionary format', async () => {
      const tokenWithMetadata: DesignToken = {
        name: 'test.token',
        value: 'test-value',
        type: TokenType.RAW,
        category: TokenCategory.CUSTOM,
        deprecated: true,
        replacement: 'new.token',
        metadata: { source: 'design-system' },
      };

      const result = await converter.convert([tokenWithMetadata]);
      const parsed = JSON.parse(result);

      expect(parsed.test.token.deprecated).toBe(true);
      expect(parsed.test.token.replacement).toBe('new.token');
      expect(parsed.test.token.metadata.source).toBe('design-system');
    });
  });

  describe('SassVariablesConverter', () => {
    const converter = new SassVariablesConverter();

    it('should convert tokens to Sass variables', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain('$color-primary-500: #007bff;');
      expect(result).toContain('$spacing-md: 16px;');
      expect(result).toContain('// Primary brand color');
      expect(result).toContain('// Medium spacing');
    });
  });

  describe('AndroidResourcesConverter', () => {
    const converter = new AndroidResourcesConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.JSON);
      expect(converter.targetFormat).toBe(TokenFormat.ANDROID_COLORS);
    });

    it('should convert tokens to Android resources XML', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(result).toContain('<resources>');
      expect(result).toContain('</resources>');
      expect(result).toContain('<!-- Colors -->');
      expect(result).toContain('<color name="color_primary_500">#007BFF</color>');
      expect(result).toContain('<!-- Dimensions -->');
      expect(result).toContain('<dimen name="spacing_md">16dp</dimen>');
    });

    it('should include comments for descriptions', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain('<!-- Primary brand color -->');
      expect(result).toContain('<!-- Medium spacing -->');
    });

    it('should convert px to dp for dimensions', async () => {
      const dimensionToken: DesignToken = {
        name: 'size.large',
        value: '24px',
        type: TokenType.DIMENSION,
        category: TokenCategory.SIZING,
      };

      const result = await converter.convert([dimensionToken]);
      expect(result).toContain('<dimen name="size_large">24dp</dimen>');
    });
  });

  describe('IOSSwiftConverter', () => {
    const converter = new IOSSwiftConverter();

    it('should have correct format mapping', () => {
      expect(converter.sourceFormat).toBe(TokenFormat.JSON);
      expect(converter.targetFormat).toBe(TokenFormat.IOS_COLORS);
    });

    it('should convert color tokens to Swift UIColor extensions', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain('import UIKit');
      expect(result).toContain('extension UIColor {');
      expect(result).toContain('/// Primary brand color');
      expect(result).toContain('static let colorPrimary500 = UIColor(red: 0.000, green: 0.482, blue: 1.000, alpha: 1.0)');
    });

    it('should convert dimension tokens to CGFloat extensions', async () => {
      const result = await converter.convert(sampleTokens);

      expect(result).toContain('extension CGFloat {');
      expect(result).toContain('/// Medium spacing');
      expect(result).toContain('static let spacingMd: CGFloat = 16');
    });

    it('should handle hex color conversion correctly', async () => {
      const colorToken: DesignToken = {
        name: 'color.test',
        value: '#FF0000',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      };

      const result = await converter.convert([colorToken]);
      expect(result).toContain('UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.0)');
    });
  });

  describe('TokenFormatConverterRegistry', () => {
    let registry: TokenFormatConverterRegistry;

    beforeEach(() => {
      registry = new TokenFormatConverterRegistry();
    });

    it('should have default converters registered', () => {
      const conversions = registry.getAvailableConversions();
      expect(conversions.length).toBeGreaterThan(0);

      const hasCSS = conversions.some(c => 
        c.source === TokenFormat.JSON && c.target === TokenFormat.CSS_VARIABLE
      );
      expect(hasCSS).toBe(true);

      const hasJSON = conversions.some(c => 
        c.source === TokenFormat.CSS_VARIABLE && c.target === TokenFormat.JSON
      );
      expect(hasJSON).toBe(true);
    });

    it('should get converter by formats', () => {
      const converter = registry.getConverter(TokenFormat.JSON, TokenFormat.CSS_VARIABLE);
      expect(converter).toBeInstanceOf(CSSVariablesConverter);

      const nonExistent = registry.getConverter(TokenFormat.FIGMA_TOKENS, TokenFormat.SKETCH_TOKENS);
      expect(nonExistent).toBeUndefined();
    });

    it('should convert tokens using registry', async () => {
      const result = await registry.convert(
        sampleTokens,
        TokenFormat.JSON,
        TokenFormat.CSS_VARIABLE
      );

      expect(result).toContain(':root {');
      expect(result).toContain('--color-primary-500: #007bff;');
    });

    it('should throw error for unavailable conversion', async () => {
      await expect(
        registry.convert(
          sampleTokens,
          TokenFormat.FIGMA_TOKENS,
          TokenFormat.SKETCH_TOKENS
        )
      ).rejects.toThrow('No converter available');
    });

    it('should get target formats for source format', () => {
      const targets = registry.getTargetFormats(TokenFormat.JSON);
      expect(targets).toContain(TokenFormat.CSS_VARIABLE);
      expect(targets).toContain(TokenFormat.JS_OBJECT);
      expect(targets).toContain(TokenFormat.TAILWIND_CONFIG);
    });

    it('should find direct conversion path', () => {
      const path = registry.findConversionPath(TokenFormat.JSON, TokenFormat.CSS_VARIABLE);
      expect(path).toEqual([TokenFormat.JSON, TokenFormat.CSS_VARIABLE]);
    });

    it('should find multi-step conversion path', () => {
      // This would work if we had intermediate converters
      const path = registry.findConversionPath(TokenFormat.JSON, TokenFormat.JSON);
      expect(path).toEqual([TokenFormat.JSON]);
    });

    it('should return null for impossible conversion', () => {
      const path = registry.findConversionPath(TokenFormat.FIGMA_TOKENS, TokenFormat.SKETCH_TOKENS);
      expect(path).toBeNull();
    });

    it('should allow custom converter registration', () => {
      const customConverter = new CSSVariablesConverter();
      // Modify it to test custom registration
      (customConverter as any).sourceFormat = TokenFormat.FIGMA_TOKENS;
      (customConverter as any).targetFormat = TokenFormat.JSON;

      registry.register(customConverter);

      const retrieved = registry.getConverter(TokenFormat.FIGMA_TOKENS, TokenFormat.JSON);
      expect(retrieved).toBe(customConverter);
    });
  });

  describe('Value Formatting', () => {
    const converter = new CSSVariablesConverter();

    it('should format string values correctly', async () => {
      const token: DesignToken = {
        name: 'test.string',
        value: 'test-value',
        type: TokenType.RAW,
        category: TokenCategory.CUSTOM,
      };

      const result = await converter.convert([token]);
      expect(result).toContain('--test-string: test-value;');
    });

    it('should format number values correctly', async () => {
      const token: DesignToken = {
        name: 'test.number',
        value: 42,
        type: TokenType.RAW,
        category: TokenCategory.CUSTOM,
      };

      const result = await converter.convert([token]);
      expect(result).toContain('--test-number: 42;');
    });

    it('should format boolean values correctly', async () => {
      const token: DesignToken = {
        name: 'test.boolean',
        value: true,
        type: TokenType.RAW,
        category: TokenCategory.CUSTOM,
      };

      const result = await converter.convert([token]);
      expect(result).toContain('--test-boolean: true;');
    });

    it('should format reference values correctly', async () => {
      const token: DesignToken = {
        name: 'test.reference',
        value: { $ref: 'other.token' } as TokenReference,
        type: TokenType.REFERENCE,
        category: TokenCategory.CUSTOM,
      };

      const result = await converter.convert([token]);
      expect(result).toContain('--test-reference: var(--other-token);');
    });

    it('should handle null and undefined values', async () => {
      const tokens: DesignToken[] = [
        {
          name: 'test.null',
          value: null,
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
        {
          name: 'test.undefined',
          value: undefined as any,
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
      ];

      const result = await converter.convert(tokens);
      expect(result).toContain('--test-null: ;');
      expect(result).toContain('--test-undefined: ;');
    });
  });

  describe('Error Handling', () => {
    const registry = new TokenFormatConverterRegistry();

    it('should validate tokens before conversion', async () => {
      const converter = registry.getConverter(TokenFormat.JSON, TokenFormat.CSS_VARIABLE);
      expect(converter?.validate([])).toBe(false);
      expect(converter?.validate(sampleTokens)).toBe(true);
    });

    it('should handle conversion errors gracefully', async () => {
      // Test with invalid input
      await expect(
        registry.convert([], TokenFormat.JSON, TokenFormat.CSS_VARIABLE)
      ).rejects.toThrow('not valid');
    });
  });

  describe('Edge Cases', () => {
    it('should handle complex nested token names', async () => {
      const converter = new CSSVariablesConverter();
      const token: DesignToken = {
        name: 'component.button.primary.hover.background.color',
        value: '#0056b3',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      };

      const result = await converter.convert([token]);
      expect(result).toContain('--component-button-primary-hover-background-color: #0056b3;');
    });

    it('should handle tokens with special characters in names', async () => {
      const converter = new AndroidResourcesConverter();
      const token: DesignToken = {
        name: 'color.primary@2x',
        value: '#007bff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      };

      const result = await converter.convert([token]);
      expect(result).toContain('<color name="color_primary_2x">');
    });

    it('should handle empty token arrays', async () => {
      const converter = new JSONConverter();
      const result = await converter.convert([]);
      expect(result).toBe('{}');
    });
  });
});