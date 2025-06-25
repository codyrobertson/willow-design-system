import {
  TokenCategory,
  TokenType,
  TokenFormat,
  DesignToken,
  TokenCollection,
  TokenMigrationMapping,
  TokenMigrationStrategy,
  TokenValidationRule,
  TokenUsage,
  TokenConflict,
  TokenMigrationContext,
} from '../src/types/theme-tokens.types';
import { StyleType } from '../src/types/style-transformation.types';

describe('Theme Token Types', () => {
  describe('Token enums', () => {
    it('should define token categories', () => {
      expect(TokenCategory.COLOR).toBe('color');
      expect(TokenCategory.SPACING).toBe('spacing');
      expect(TokenCategory.TYPOGRAPHY).toBe('typography');
      expect(TokenCategory.BORDER).toBe('border');
      expect(TokenCategory.SHADOW).toBe('shadow');
    });

    it('should define token types', () => {
      expect(TokenType.DIMENSION).toBe('dimension');
      expect(TokenType.COLOR).toBe('color');
      expect(TokenType.CUBIC_BEZIER).toBe('cubicBezier');
      expect(TokenType.DURATION).toBe('duration');
      expect(TokenType.FONT_FAMILY).toBe('fontFamily');
    });

    it('should define token formats', () => {
      expect(TokenFormat.CSS_VARIABLE).toBe('css-variable');
      expect(TokenFormat.JS_OBJECT).toBe('js-object');
      expect(TokenFormat.TAILWIND_CONFIG).toBe('tailwind-config');
      expect(TokenFormat.FIGMA_TOKENS).toBe('figma-tokens');
    });
  });

  describe('DesignToken interface', () => {
    it('should create a basic design token', () => {
      const token: DesignToken = {
        name: 'color.primary.500',
        value: '#007bff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        description: 'Primary blue color',
      };

      expect(token.name).toBe('color.primary.500');
      expect(token.value).toBe('#007bff');
      expect(token.type).toBe(TokenType.COLOR);
      expect(token.category).toBe(TokenCategory.COLOR);
      expect(token.description).toBe('Primary blue color');
    });

    it('should support token references', () => {
      const aliasToken: DesignToken = {
        name: 'color.brand',
        value: { $ref: 'color.primary.500' },
        type: TokenType.REFERENCE,
        category: TokenCategory.COLOR,
        reference: 'color.primary.500',
      };

      expect(aliasToken.reference).toBe('color.primary.500');
      expect(typeof aliasToken.value).toBe('object');
      expect((aliasToken.value as any).$ref).toBe('color.primary.500');
    });

    it('should support composite tokens', () => {
      const borderToken: DesignToken = {
        name: 'border.default',
        value: {
          width: '1px',
          style: 'solid',
          color: { $ref: 'color.gray.300' },
        },
        type: TokenType.BORDER,
        category: TokenCategory.BORDER,
      };

      expect(borderToken.type).toBe(TokenType.BORDER);
      expect(typeof borderToken.value).toBe('object');
      expect((borderToken.value as any).width).toBe('1px');
    });

    it('should support deprecated tokens', () => {
      const deprecatedToken: DesignToken = {
        name: 'color.old-primary',
        value: '#0066cc',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        deprecated: true,
        replacement: 'color.primary.500',
      };

      expect(deprecatedToken.deprecated).toBe(true);
      expect(deprecatedToken.replacement).toBe('color.primary.500');
    });
  });

  describe('TokenCollection interface', () => {
    it('should create a token collection', () => {
      const collection: TokenCollection = {
        name: 'Brand Theme',
        description: 'Main brand design tokens',
        version: '1.0.0',
        tokens: new Map(),
      };

      collection.tokens.set('color.primary', {
        name: 'color.primary',
        value: '#007bff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      });

      expect(collection.name).toBe('Brand Theme');
      expect(collection.tokens.size).toBe(1);
      expect(collection.tokens.has('color.primary')).toBe(true);
    });

    it('should support token groups', () => {
      const collection: TokenCollection = {
        name: 'Design System',
        tokens: new Map(),
        groups: new Map(),
      };

      collection.groups!.set('colors', {
        name: 'colors',
        description: 'Color tokens',
        tokens: ['color.primary', 'color.secondary'],
        type: TokenCategory.COLOR,
      });

      expect(collection.groups!.has('colors')).toBe(true);
      expect(collection.groups!.get('colors')!.tokens).toHaveLength(2);
    });
  });

  describe('TokenMigrationMapping interface', () => {
    it('should create string-based mapping', () => {
      const mapping: TokenMigrationMapping = {
        source: 'colors.blue.500',
        target: 'color.primary.500',
        priority: 1,
        notes: 'Migrate to semantic naming',
      };

      expect(mapping.source).toBe('colors.blue.500');
      expect(mapping.target).toBe('color.primary.500');
      expect(mapping.priority).toBe(1);
    });

    it('should create regex-based mapping', () => {
      const mapping: TokenMigrationMapping = {
        source: /^colors\.(\w+)\.(\d+)$/,
        target: (match) => match.replace('colors.', 'color.'),
        transform: {
          type: 'custom',
          transform: (value) => value,
        },
      };

      expect(mapping.source).toBeInstanceOf(RegExp);
      expect(typeof mapping.target).toBe('function');
      expect(mapping.transform?.type).toBe('custom');
    });
  });

  describe('TokenMigrationStrategy interface', () => {
    it('should create a migration strategy', () => {
      const strategy: TokenMigrationStrategy = {
        name: 'Tailwind to Design System',
        sourceFormat: TokenFormat.TAILWIND_CONFIG,
        targetFormat: TokenFormat.STYLE_DICTIONARY,
        mappings: [
          {
            source: 'colors.blue.500',
            target: 'color.primary.500',
          },
        ],
        validation: [
          {
            name: 'Color format validation',
            types: [TokenType.COLOR],
            validate: (token) => ({
              valid: typeof token.value === 'string',
              message: 'Color must be a string',
            }),
            severity: 'error',
          },
        ],
      };

      expect(strategy.name).toBe('Tailwind to Design System');
      expect(strategy.sourceFormat).toBe(TokenFormat.TAILWIND_CONFIG);
      expect(strategy.mappings).toHaveLength(1);
      expect(strategy.validation).toHaveLength(1);
    });
  });

  describe('TokenValidationRule interface', () => {
    it('should create validation rules', () => {
      const rule: TokenValidationRule = {
        name: 'Dimension units',
        types: [TokenType.DIMENSION],
        validate: (token) => {
          const value = token.value as string;
          const hasValidUnit = /^-?\d+(\.\d+)?(px|rem|em|%)$/.test(value);
          return {
            valid: hasValidUnit,
            message: hasValidUnit ? undefined : 'Invalid dimension unit',
            suggestion: 'Use px, rem, em, or %',
          };
        },
        severity: 'warning',
      };

      expect(rule.name).toBe('Dimension units');
      expect(rule.types).toContain(TokenType.DIMENSION);
      expect(typeof rule.validate).toBe('function');

      // Test validation
      const validToken: DesignToken = {
        name: 'spacing.md',
        value: '16px',
        type: TokenType.DIMENSION,
        category: TokenCategory.SPACING,
      };

      const result = rule.validate(validToken);
      expect(result.valid).toBe(true);
    });
  });

  describe('TokenUsage interface', () => {
    it('should track token usage', () => {
      const usage: TokenUsage = {
        tokenName: 'color.primary.500',
        locations: [
          {
            filePath: 'src/components/Button.tsx',
            line: 15,
            column: 20,
            context: 'backgroundColor',
            rawValue: 'var(--color-primary-500)',
          },
          {
            filePath: 'src/styles/main.css',
            line: 42,
            column: 12,
            context: 'color',
            rawValue: '#007bff',
          },
        ],
        count: 2,
        lastUsed: '2024-01-15T10:30:00Z',
        context: {
          styleType: StyleType.CSS_IN_JS,
          sourceFramework: 'react',
          targetFramework: 'willow',
          filePath: 'src/components/Button.tsx',
        },
      };

      expect(usage.tokenName).toBe('color.primary.500');
      expect(usage.locations).toHaveLength(2);
      expect(usage.count).toBe(2);
      expect(usage.locations[0].filePath).toBe('src/components/Button.tsx');
    });
  });

  describe('TokenConflict interface', () => {
    it('should detect token conflicts', () => {
      const conflict: TokenConflict = {
        type: 'name',
        tokens: ['color.primary', 'colors.primary'],
        description: 'Conflicting token names with similar semantics',
        severity: 'warning',
        resolution: 'Rename one token to avoid confusion',
        autoResolvable: false,
      };

      expect(conflict.type).toBe('name');
      expect(conflict.tokens).toHaveLength(2);
      expect(conflict.severity).toBe('warning');
      expect(conflict.autoResolvable).toBe(false);
    });

    it('should handle value conflicts', () => {
      const conflict: TokenConflict = {
        type: 'value',
        tokens: ['spacing.md', 'spacing.medium'],
        description: 'Different tokens with same value',
        severity: 'info',
        resolution: 'Consider consolidating to a single token',
        autoResolvable: true,
      };

      expect(conflict.type).toBe('value');
      expect(conflict.autoResolvable).toBe(true);
    });
  });

  describe('TokenMigrationContext interface', () => {
    it('should create migration context', () => {
      const context: TokenMigrationContext = {
        styleType: StyleType.CSS_MODULES,
        sourceFramework: 'tailwind',
        targetFramework: 'chakra',
        filePath: 'tailwind.config.js',
        sourceTokenFormat: TokenFormat.TAILWIND_CONFIG,
        targetTokenFormat: TokenFormat.CHAKRA_THEME,
        strategy: 'tailwind-to-chakra',
        options: {
          preserveDeprecated: false,
          generateDocs: true,
          validate: true,
          conflictResolution: 'merge',
        },
      };

      expect(context.sourceTokenFormat).toBe(TokenFormat.TAILWIND_CONFIG);
      expect(context.targetTokenFormat).toBe(TokenFormat.CHAKRA_THEME);
      expect(context.strategy).toBe('tailwind-to-chakra');
      expect(context.options.generateDocs).toBe(true);
    });
  });

  describe('Complex token scenarios', () => {
    it('should handle nested token references', () => {
      const shadowToken: DesignToken = {
        name: 'shadow.card',
        value: {
          offsetX: '0',
          offsetY: '2px',
          blurRadius: '4px',
          spreadRadius: '0',
          color: { $ref: 'color.gray.200' },
        },
        type: TokenType.SHADOW,
        category: TokenCategory.SHADOW,
        metadata: {
          source: 'design-system',
          examples: [
            'box-shadow: 0 2px 4px 0 var(--color-gray-200);',
          ],
        },
      };

      expect(shadowToken.type).toBe(TokenType.SHADOW);
      expect((shadowToken.value as any).color.$ref).toBe('color.gray.200');
      expect(shadowToken.metadata?.examples).toHaveLength(1);
    });

    it('should support array tokens', () => {
      const fontFamilyToken: DesignToken = {
        name: 'font.family.body',
        value: {
          $array: ['Inter', 'system-ui', 'sans-serif'],
        },
        type: TokenType.FONT_FAMILY,
        category: TokenCategory.TYPOGRAPHY,
      };

      expect((fontFamilyToken.value as any).$array).toHaveLength(3);
      expect((fontFamilyToken.value as any).$array[0]).toBe('Inter');
    });

    it('should support token transformations', () => {
      const lighterToken: DesignToken = {
        name: 'color.primary.lighter',
        value: {
          $ref: 'color.primary.500',
          $transform: {
            type: 'lighten',
            amount: 0.2,
          },
        },
        type: TokenType.REFERENCE,
        category: TokenCategory.COLOR,
      };

      expect((lighterToken.value as any).$transform.type).toBe('lighten');
      expect((lighterToken.value as any).$transform.amount).toBe(0.2);
    });
  });
});