import {
  BaseTokenTransformer,
  AdvancedTokenTransformer,
  TokenTransformerRegistry,
} from '../src/styles/theme-tokens/token-transformer';
import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenMigrationStrategy,
  TokenMigrationMapping,
  TokenTransform,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
} from '../src/types/theme-tokens.types';

describe('Token Transformer System', () => {
  describe('BaseTokenTransformer', () => {
    const transformer = new BaseTokenTransformer();

    const sampleTokens: DesignToken[] = [
      {
        name: 'color.primary',
        value: '#007bff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      },
      {
        name: 'spacing.md',
        value: '16px',
        type: TokenType.DIMENSION,
        category: TokenCategory.SPACING,
      },
      {
        name: 'font.weight.bold',
        value: 700,
        type: TokenType.FONT_WEIGHT,
        category: TokenCategory.TYPOGRAPHY,
      },
    ];

    it('should apply string-based mappings', () => {
      const mapping: TokenMigrationMapping = {
        source: 'color.primary',
        target: 'colors.brand.primary',
      };

      const result = transformer.applyMapping(sampleTokens, mapping);

      expect(result).toHaveLength(3);
      
      const mappedToken = result.find(t => t.name === 'colors.brand.primary');
      expect(mappedToken).toBeDefined();
      expect(mappedToken?.value).toBe('#007bff');
      expect(mappedToken?.metadata?.originalName).toBe('color.primary');
      
      // Original token should still exist
      const originalToken = result.find(t => t.name === 'color.primary');
      expect(originalToken).toBeDefined();
    });

    it('should apply regex-based mappings', () => {
      const mapping: TokenMigrationMapping = {
        source: /^color\.(.+)$/,
        target: (match: string) => match.replace('color.', 'colors.'),
      };

      const result = transformer.applyMapping(sampleTokens, mapping);

      const mappedToken = result.find(t => t.name === 'colors.primary');
      expect(mappedToken).toBeDefined();
      expect(mappedToken?.value).toBe('#007bff');
    });

    it('should apply value transformations', () => {
      const mapping: TokenMigrationMapping = {
        source: 'spacing.md',
        target: 'spacing.medium',
        transform: {
          type: 'multiply',
          amount: 2,
        },
      };

      const result = transformer.applyMapping(sampleTokens, mapping);

      const transformedToken = result.find(t => t.name === 'spacing.medium');
      expect(transformedToken).toBeDefined();
      expect(transformedToken?.value).toBe('32px');
    });

    it('should handle deprecated mappings', () => {
      const mapping: TokenMigrationMapping = {
        source: 'color.primary',
        target: 'colors.brand',
        deprecated: true,
      };

      const result = transformer.applyMapping(sampleTokens, mapping);

      // Original token should be removed when deprecated
      const originalToken = result.find(t => t.name === 'color.primary');
      expect(originalToken).toBeUndefined();
      
      const newToken = result.find(t => t.name === 'colors.brand');
      expect(newToken).toBeDefined();
    });

    it('should validate tokens with rules', () => {
      const rules = [
        {
          name: 'Color format validation',
          types: [TokenType.COLOR],
          validate: (token: DesignToken) => ({
            valid: typeof token.value === 'string' && /^#[0-9a-fA-F]{6}$/.test(token.value),
            message: 'Color must be a valid hex code',
          }),
          severity: 'error' as const,
        },
        {
          name: 'Dimension unit validation',
          types: [TokenType.DIMENSION],
          validate: (token: DesignToken) => ({
            valid: typeof token.value === 'string' && /px|rem|em$/.test(token.value),
            message: 'Dimension must have valid unit',
          }),
          severity: 'warning' as const,
        },
      ];

      const validationResults = transformer.validate(sampleTokens, rules);

      expect(validationResults).toHaveLength(3);
      
      const colorResult = validationResults.find(r => r.token.name === 'color.primary');
      expect(colorResult?.valid).toBe(true);
      
      const spacingResult = validationResults.find(r => r.token.name === 'spacing.md');
      expect(spacingResult?.valid).toBe(true);
    });

    it('should perform full transformation with strategy', async () => {
      const strategy: TokenMigrationStrategy = {
        name: 'Test Migration',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.CSS_VARIABLE,
        mappings: [
          {
            source: /^color\.(.+)$/,
            target: (match: string) => match.replace('color.', 'colors.'),
          },
          {
            source: 'spacing.md',
            target: 'spacing.medium',
            transform: {
              type: 'multiply',
              amount: 1.5,
            },
          },
        ],
        validation: [
          {
            name: 'Valid values',
            types: [TokenType.COLOR, TokenType.DIMENSION, TokenType.FONT_WEIGHT],
            validate: (token) => ({ valid: token.value !== null }),
            severity: 'error' as const,
          },
        ],
      };

      const result = await transformer.transform(sampleTokens, strategy);

      expect(result.success).toBe(true);
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.output).toContain(':root');
      expect(result.output).toContain('--colors-primary');
      expect(result.metadata.strategy).toBe('Test Migration');
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should generate different output formats', async () => {
      // CSS Variables
      const cssStrategy: TokenMigrationStrategy = {
        name: 'CSS Variables',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.CSS_VARIABLE,
        mappings: [],
      };

      const cssResult = await transformer.transform(sampleTokens, cssStrategy);
      expect(cssResult.output).toContain(':root');
      expect(cssResult.output).toContain('--color-primary: #007bff;');

      // JSON
      const jsonStrategy: TokenMigrationStrategy = {
        name: 'JSON',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      const jsonResult = await transformer.transform(sampleTokens, jsonStrategy);
      const parsed = JSON.parse(jsonResult.output);
      expect(parsed.color.primary).toBe('#007bff');

      // Tailwind Config
      const tailwindStrategy: TokenMigrationStrategy = {
        name: 'Tailwind',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.TAILWIND_CONFIG,
        mappings: [],
      };

      const tailwindResult = await transformer.transform(sampleTokens, tailwindStrategy);
      expect(tailwindResult.output).toContain('module.exports');
      expect(tailwindResult.output).toContain('theme:');
    });

    it('should handle value transformation types', () => {
      const transforms: Array<{ transform: TokenTransform; input: string; expected: string }> = [
        {
          transform: { type: 'multiply', amount: 2 },
          input: '16px',
          expected: '32px',
        },
        {
          transform: { type: 'divide', amount: 2 },
          input: '32px',
          expected: '16px',
        },
        {
          transform: { type: 'add', amount: 8 },
          input: '16px',
          expected: '24px',
        },
        {
          transform: { type: 'subtract', amount: 4 },
          input: '16px',
          expected: '12px',
        },
      ];

      for (const { transform, input, expected } of transforms) {
        const token: DesignToken = {
          name: 'test',
          value: input,
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        };

        const mapping: TokenMigrationMapping = {
          source: 'test',
          target: 'test-transformed',
          transform,
        };

        const result = transformer.applyMapping([token], mapping);
        const transformed = result.find(t => t.name === 'test-transformed');
        
        expect(transformed?.value).toBe(expected);
      }
    });

    it('should handle numeric transformations', () => {
      const numericToken: DesignToken = {
        name: 'z-index.modal',
        value: 1000,
        type: TokenType.RAW,
        category: TokenCategory.Z_INDEX,
      };

      const mapping: TokenMigrationMapping = {
        source: 'z-index.modal',
        target: 'z-index.modal-high',
        transform: {
          type: 'add',
          amount: 100,
        },
      };

      const result = transformer.applyMapping([numericToken], mapping);
      const transformed = result.find(t => t.name === 'z-index.modal-high');
      
      expect(transformed?.value).toBe(1100);
    });

    it('should handle custom transformations', () => {
      const customTransform: TokenTransform = {
        type: 'custom',
        transform: (value) => {
          if (typeof value === 'string' && value.endsWith('px')) {
            const num = parseFloat(value);
            return `${num / 16}rem`;
          }
          return value;
        },
      };

      const token: DesignToken = {
        name: 'spacing.lg',
        value: '32px',
        type: TokenType.DIMENSION,
        category: TokenCategory.SPACING,
      };

      const mapping: TokenMigrationMapping = {
        source: 'spacing.lg',
        target: 'spacing.large',
        transform: customTransform,
      };

      const result = transformer.applyMapping([token], mapping);
      const transformed = result.find(t => t.name === 'spacing.large');
      
      expect(transformed?.value).toBe('2rem');
    });
  });

  describe('AdvancedTokenTransformer', () => {
    const transformer = new AdvancedTokenTransformer();

    it('should resolve token references', async () => {
      const tokensWithRefs: DesignToken[] = [
        {
          name: 'color.primary',
          value: '#007bff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'color.brand',
          value: { $ref: 'color.primary' } as TokenReference,
          type: TokenType.REFERENCE,
          category: TokenCategory.COLOR,
        },
        {
          name: 'color.link',
          value: { $ref: 'color.brand' } as TokenReference,
          type: TokenType.REFERENCE,
          category: TokenCategory.COLOR,
        },
      ];

      const strategy: TokenMigrationStrategy = {
        name: 'Reference Resolution',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      const result = await transformer.transform(tokensWithRefs, strategy);

      expect(result.success).toBe(true);
      
      const brandToken = result.tokens.find(t => t.name === 'color.brand');
      expect(brandToken?.value).toBe('#007bff');
      
      const linkToken = result.tokens.find(t => t.name === 'color.link');
      expect(linkToken?.value).toBe('#007bff');
    });

    it('should handle circular references safely', async () => {
      const circularTokens: DesignToken[] = [
        {
          name: 'color.a',
          value: { $ref: 'color.b' } as TokenReference,
          type: TokenType.REFERENCE,
          category: TokenCategory.COLOR,
        },
        {
          name: 'color.b',
          value: { $ref: 'color.a' } as TokenReference,
          type: TokenType.REFERENCE,
          category: TokenCategory.COLOR,
        },
      ];

      const strategy: TokenMigrationStrategy = {
        name: 'Circular Reference Test',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      const result = await transformer.transform(circularTokens, strategy);

      expect(result.success).toBe(true);
      // Should not crash and should preserve unresolved references
      expect(result.tokens).toHaveLength(2);
    });

    it('should resolve composite token references', async () => {
      const compositeTokens: DesignToken[] = [
        {
          name: 'color.primary',
          value: '#007bff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'border.default',
          value: {
            width: '1px',
            style: 'solid',
            color: { $ref: 'color.primary' },
          } as TokenCompositeValue,
          type: TokenType.BORDER,
          category: TokenCategory.BORDER,
        },
      ];

      const strategy: TokenMigrationStrategy = {
        name: 'Composite Resolution',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      const result = await transformer.transform(compositeTokens, strategy);

      expect(result.success).toBe(true);
      
      const borderToken = result.tokens.find(t => t.name === 'border.default');
      expect(borderToken).toBeDefined();
      
      const borderValue = borderToken?.value as TokenCompositeValue;
      expect(borderValue.color).toBe('#007bff');
    });

    it('should resolve array token references', async () => {
      const arrayTokens: DesignToken[] = [
        {
          name: 'font.family.primary',
          value: 'Inter',
          type: TokenType.FONT_FAMILY,
          category: TokenCategory.TYPOGRAPHY,
        },
        {
          name: 'font.family.fallback',
          value: 'system-ui',
          type: TokenType.FONT_FAMILY,
          category: TokenCategory.TYPOGRAPHY,
        },
        {
          name: 'font.family.stack',
          value: {
            $array: [
              { $ref: 'font.family.primary' },
              { $ref: 'font.family.fallback' },
              'sans-serif',
            ],
          } as TokenArray,
          type: TokenType.FONT_FAMILY,
          category: TokenCategory.TYPOGRAPHY,
        },
      ];

      const strategy: TokenMigrationStrategy = {
        name: 'Array Resolution',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      const result = await transformer.transform(arrayTokens, strategy);

      expect(result.success).toBe(true);
      
      const stackToken = result.tokens.find(t => t.name === 'font.family.stack');
      expect(stackToken).toBeDefined();
      
      const stackValue = stackToken?.value as TokenArray;
      expect(stackValue.$array).toEqual(['Inter', 'system-ui', 'sans-serif']);
    });

    it('should apply reference transformations', async () => {
      const transformedRefTokens: DesignToken[] = [
        {
          name: 'spacing.base',
          value: '16px',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
        {
          name: 'spacing.large',
          value: {
            $ref: 'spacing.base',
            $transform: {
              type: 'multiply',
              amount: 2,
            },
          } as TokenReference,
          type: TokenType.REFERENCE,
          category: TokenCategory.SPACING,
        },
      ];

      const strategy: TokenMigrationStrategy = {
        name: 'Transform Resolution',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      const result = await transformer.transform(transformedRefTokens, strategy);

      expect(result.success).toBe(true);
      
      const largeToken = result.tokens.find(t => t.name === 'spacing.large');
      expect(largeToken?.value).toBe('32px');
    });
  });

  describe('TokenTransformerRegistry', () => {
    const registry = new TokenTransformerRegistry();

    it('should have default transformers registered', () => {
      const transformers = registry.getAvailableTransformers();
      expect(transformers).toContain('base');
      expect(transformers).toContain('advanced');
    });

    it('should get registered transformers', () => {
      const baseTransformer = registry.getTransformer('base');
      expect(baseTransformer).toBeInstanceOf(BaseTokenTransformer);

      const advancedTransformer = registry.getTransformer('advanced');
      expect(advancedTransformer).toBeInstanceOf(AdvancedTokenTransformer);
    });

    it('should allow custom transformer registration', () => {
      const customTransformer = new BaseTokenTransformer();
      registry.register('custom', customTransformer);

      const retrieved = registry.getTransformer('custom');
      expect(retrieved).toBe(customTransformer);

      const transformers = registry.getAvailableTransformers();
      expect(transformers).toContain('custom');
    });

    it('should transform using registry', async () => {
      const tokens: DesignToken[] = [
        {
          name: 'color.primary',
          value: '#007bff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ];

      const strategy: TokenMigrationStrategy = {
        name: 'Registry Test',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.CSS_VARIABLE,
        mappings: [],
      };

      const result = await registry.transform(tokens, strategy, 'advanced');

      expect(result.success).toBe(true);
      expect(result.output).toContain(':root');
    });

    it('should throw error for unknown transformer', async () => {
      const tokens: DesignToken[] = [];
      const strategy: TokenMigrationStrategy = {
        name: 'Test',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      await expect(
        registry.transform(tokens, strategy, 'nonexistent')
      ).rejects.toThrow('No transformer available: nonexistent');
    });
  });

  describe('Output Format Generation', () => {
    const transformer = new BaseTokenTransformer();
    
    const testTokens: DesignToken[] = [
      {
        name: 'color.primary.500',
        value: '#007bff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      },
      {
        name: 'spacing.md',
        value: '16px',
        type: TokenType.DIMENSION,
        category: TokenCategory.SPACING,
      },
      {
        name: 'font.weight.bold',
        value: 700,
        type: TokenType.FONT_WEIGHT,
        category: TokenCategory.TYPOGRAPHY,
      },
    ];

    it('should generate CSS variables format', async () => {
      const strategy: TokenMigrationStrategy = {
        name: 'CSS Variables',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.CSS_VARIABLE,
        mappings: [],
      };

      const result = await transformer.transform(testTokens, strategy);

      expect(result.output).toContain(':root {');
      expect(result.output).toContain('--color-primary-500: #007bff;');
      expect(result.output).toContain('--spacing-md: 16px;');
      expect(result.output).toContain('--font-weight-bold: 700;');
      expect(result.output).toContain('}');
    });

    it('should generate JSON format', async () => {
      const strategy: TokenMigrationStrategy = {
        name: 'JSON',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
      };

      const result = await transformer.transform(testTokens, strategy);

      const parsed = JSON.parse(result.output);
      expect(parsed.color.primary['500']).toBe('#007bff');
      expect(parsed.spacing.md).toBe('16px');
      expect(parsed.font.weight.bold).toBe(700);
    });

    it('should generate JavaScript object format', async () => {
      const strategy: TokenMigrationStrategy = {
        name: 'JS Object',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JS_OBJECT,
        mappings: [],
      };

      const result = await transformer.transform(testTokens, strategy);

      expect(result.output).toContain('export default');
      expect(result.output).toContain('"color"');
      expect(result.output).toContain('#007bff');
    });

    it('should generate Tailwind config format', async () => {
      const strategy: TokenMigrationStrategy = {
        name: 'Tailwind Config',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.TAILWIND_CONFIG,
        mappings: [],
      };

      const result = await transformer.transform(testTokens, strategy);

      expect(result.output).toContain('module.exports = {');
      expect(result.output).toContain('theme:');
      expect(result.output).toContain('color');
      expect(result.output).toContain('spacing');
    });

    it('should generate Style Dictionary format', async () => {
      const strategy: TokenMigrationStrategy = {
        name: 'Style Dictionary',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.STYLE_DICTIONARY,
        mappings: [],
      };

      const result = await transformer.transform(testTokens, strategy);

      const parsed = JSON.parse(result.output);
      expect(parsed.color.primary['500'].value).toBe('#007bff');
      expect(parsed.color.primary['500'].type).toBe(TokenType.COLOR);
      expect(parsed.spacing.md.value).toBe('16px');
    });
  });

  describe('Error Handling', () => {
    const transformer = new BaseTokenTransformer();

    it('should handle validation errors gracefully', async () => {
      const tokens: DesignToken[] = [
        {
          name: 'invalid.color',
          value: 'not-a-color',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ];

      const strategy: TokenMigrationStrategy = {
        name: 'Validation Test',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.JSON,
        mappings: [],
        validation: [
          {
            name: 'Color validation',
            types: [TokenType.COLOR],
            validate: (token) => ({
              valid: typeof token.value === 'string' && token.value.startsWith('#'),
              message: 'Invalid color format',
            }),
            severity: 'error' as const,
          },
        ],
      };

      const result = await transformer.transform(tokens, strategy);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid color format');
    });

    it('should handle mapping errors gracefully', () => {
      const tokens: DesignToken[] = [
        {
          name: 'test.token',
          value: 'value',
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
      ];

      const invalidMapping: TokenMigrationMapping = {
        source: 'test.token',
        target: () => {
          throw new Error('Mapping error');
        },
      };

      // Should not crash
      expect(() => {
        transformer.applyMapping(tokens, invalidMapping);
      }).not.toThrow();
    });
  });
});