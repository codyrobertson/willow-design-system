import { BaseTokenParser } from '../src/styles/theme-tokens/token-parser';
import { BaseTokenExtractor } from '../src/styles/theme-tokens/token-extractor';
import { BaseTokenTransformer } from '../src/styles/theme-tokens/token-transformer';
import { BaseTokenValidator } from '../src/styles/theme-tokens/token-validation';
import { TokenFormatConverterRegistry } from '../src/styles/theme-tokens/token-format-converters';
import {
  TokenFormat,
  TokenType,
  TokenCategory,
} from '../src/types/theme-tokens.types';
import {
  makeColorToken,
  makeMigrationContext,
  createCircularReferenceTokens,
  assertValidationError,
} from './helpers/token-factories';

describe('Token Migration Error Cases', () => {
  describe('Parser Error Handling', () => {
    let parser: BaseTokenParser;

    beforeEach(() => {
      parser = new BaseTokenParser();
    });

    it('should throw on invalid JSON', async () => {
      const invalidJsonCases = [
        '{ "tokens": }',
        '{ tokens: { color: "#fff" } }', // Missing quotes
        '{ "tokens": { "color": "#fff", } }', // Trailing comma
        '', // Empty string
        'null',
        'undefined',
      ];

      for (const invalidJson of invalidJsonCases) {
        await expect(
          parser.parseTokens(invalidJson, TokenFormat.JSON)
        ).rejects.toThrow();
      }
    });

    it('should throw on unsupported format', async () => {
      await expect(
        parser.parseTokens('{}', 'UNKNOWN_FORMAT' as TokenFormat)
      ).rejects.toThrow(/Unsupported.*format/);
    });

    it('should handle missing required fields', async () => {
      const incompleteToken = JSON.stringify({
        tokens: {
          color: {
            primary: {
              // Missing 'value' field
              type: 'color',
            },
          },
        },
      });

      await expect(
        parser.parseTokens(incompleteToken, TokenFormat.JSON)
      ).rejects.toThrow();
    });
  });

  describe('Extractor Error Handling', () => {
    let extractor: BaseTokenExtractor;

    beforeEach(() => {
      extractor = new BaseTokenExtractor();
    });

    it('should handle malformed CSS gracefully', async () => {
      const malformedCssCases = [
        '.class { color: }', // Missing value
        '.class { color: var(--missing-paren }', // Missing closing paren
        '.class { color: var(--); }', // Empty variable name
        '@import evil.css', // Potential security issue
      ];

      for (const css of malformedCssCases) {
        const result = await extractor.extractTokens(css, 'css');
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle unsupported languages', async () => {
      const result = await extractor.extractTokens(
        'some content',
        'unknown-language',
        { filePath: '/test.unknown' }
      );

      expect(result.tokens).toHaveLength(0);
      expect(result.metadata.language).toBe('unknown-language');
    });
  });

  describe('Transformer Error Handling', () => {
    let transformer: BaseTokenTransformer;

    beforeEach(() => {
      transformer = new BaseTokenTransformer();
    });

    it('should throw on invalid token values', async () => {
      const invalidTokens = [
        makeColorToken('color', 'not-a-color'),
        makeColorToken('color', 'rgb(300, 300, 300)'), // Out of range
        {
          name: 'invalid.dimension',
          value: '10pixels', // Should be '10px'
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
      ];

      const context = makeMigrationContext('custom', 'tailwind', {
        strictValidation: true,
      });

      for (const token of invalidTokens) {
        await expect(
          transformer.transformTokens([token], context)
        ).rejects.toThrow();
      }
    });

    it('should handle missing references', async () => {
      const tokensWithMissingRef = [
        {
          name: 'button.background',
          value: { $ref: 'colors.nonexistent' },
          type: TokenType.REFERENCE,
          category: TokenCategory.COLOR,
        },
      ];

      const context = makeMigrationContext('custom', 'tailwind');
      
      await expect(
        transformer.transformTokens(tokensWithMissingRef, context)
      ).rejects.toThrow(/Reference.*not found/);
    });
  });

  describe('Validator Error Detection', () => {
    let validator: BaseTokenValidator;

    beforeEach(() => {
      validator = new BaseTokenValidator();
    });

    it('should detect all types of conflicts', async () => {
      const conflictingTokens = [
        // Naming conflict
        makeColorToken('color.primary', '#ff0000'),
        makeColorToken('color.primary', '#00ff00'),
        // Value conflict (same name, different values)
        makeColorToken('brand.main', '#123456'),
        makeColorToken('brand.main', '#654321'),
      ];

      const conflicts = await validator.detectConflicts(conflictingTokens);

      expect(conflicts.hasConflicts).toBe(true);
      expect(conflicts.conflicts).toHaveLength(2);
      expect(conflicts.conflicts[0].type).toBe('naming');
      expect(conflicts.conflicts[1].type).toBe('naming');
    });

    it('should detect circular references', async () => {
      const tokens = createCircularReferenceTokens();
      const result = await validator.validateTokens(tokens);

      assertValidationError(result, /Circular reference/);
      expect(result.errors[0].path).toContain('token.a');
    });

    it('should validate naming conventions strictly', async () => {
      const invalidNameTokens = [
        makeColorToken('color with spaces', '#ff0000'),
        makeColorToken('color!@#$', '#ff0000'),
        makeColorToken('123color', '#ff0000'), // Starting with number
        makeColorToken('', '#ff0000'), // Empty name
      ];

      const context = makeMigrationContext('custom', 'tailwind', {
        strictValidation: true,
      });

      for (const token of invalidNameTokens) {
        const result = await validator.validateTokens([token], context);
        expect(result.valid).toBe(false);
        expect(result.errors[0].type).toBe('naming');
      }
    });

    it('should detect type mismatches', async () => {
      const typeMismatchTokens = [
        {
          name: 'color.as.dimension',
          value: '16px', // Dimension value
          type: TokenType.COLOR, // But marked as color
          category: TokenCategory.COLOR,
        },
        {
          name: 'dimension.as.color',
          value: '#ff0000', // Color value
          type: TokenType.DIMENSION, // But marked as dimension
          category: TokenCategory.SPACING,
        },
      ];

      const result = await validator.validateTokens(typeMismatchTokens);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].type).toBe('type');
    });
  });

  describe('Format Conversion Errors', () => {
    it('should throw on incompatible token formats', async () => {
      const incompatibleToken = {
        name: 'complex.token',
        value: {
          nested: {
            deeply: {
              value: 'test',
            },
          },
        },
        type: TokenType.COMPOSITE,
        category: TokenCategory.CUSTOM,
      };

      const converterRegistry = new TokenFormatConverterRegistry();
      
      // CSS Variables don't support deeply nested structures
      await expect(
        converterRegistry.convert([incompatibleToken], TokenFormat.CSS_VARIABLES)
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely long token names', async () => {
      const longName = 'a'.repeat(1000);
      const token = makeColorToken(longName, '#ff0000');

      const validator = new BaseTokenValidator();
      const result = await validator.validateTokens([token]);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('name length');
    });

    it('should handle very large token values', async () => {
      const largeArray = new Array(1000).fill('fallback-font');
      const token = {
        name: 'font.stack',
        value: { $array: largeArray },
        type: TokenType.FONT_FAMILY,
        category: TokenCategory.TYPOGRAPHY,
      };

      const transformer = new BaseTokenTransformer();
      const context = makeMigrationContext('custom', 'css');

      const result = await transformer.transformTokens([token], context);
      expect(result[0].metadata?.truncated).toBe(true);
    });

    it('should handle empty token sets', async () => {
      const emptyTokens: any[] = [];

      const transformer = new BaseTokenTransformer();
      const result = await transformer.transformTokens(
        emptyTokens,
        makeMigrationContext('custom', 'tailwind')
      );

      expect(result).toHaveLength(0);
    });

    it('should handle null and undefined values', async () => {
      const tokensWithNulls = [
        {
          name: 'null.token',
          value: null,
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
        {
          name: 'undefined.token',
          value: undefined,
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
      ];

      const validator = new BaseTokenValidator();
      const result = await validator.validateTokens(tokensWithNulls);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Security and Injection Prevention', () => {
    it('should sanitize token values to prevent injection', async () => {
      const maliciousTokens = [
        makeColorToken('xss.attempt', '<script>alert("xss")</script>'),
        makeColorToken('sql.injection', "'; DROP TABLE tokens; --"),
        {
          name: 'path.traversal',
          value: '../../../etc/passwd',
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
      ];

      const transformer = new BaseTokenTransformer();
      const context = makeMigrationContext('custom', 'html');

      const result = await transformer.transformTokens(maliciousTokens, context);

      // Values should be sanitized
      result.forEach(token => {
        expect(token.value).not.toContain('<script>');
        expect(token.value).not.toContain('DROP TABLE');
        expect(token.value).not.toContain('../..');
      });
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent modifications safely', async () => {
      const parser = new BaseTokenParser();
      const tokenConfig = JSON.stringify({
        tokens: {
          color: { primary: { value: '#ff0000', type: 'color' } },
        },
      });

      // Simulate concurrent parsing
      const promises = Array(10).fill(null).map(() =>
        parser.parseTokens(tokenConfig, TokenFormat.JSON)
      );

      const results = await Promise.all(promises);

      // All results should be identical
      const firstResult = JSON.stringify(results[0]);
      results.forEach(result => {
        expect(JSON.stringify(result)).toBe(firstResult);
      });
    });
  });
});