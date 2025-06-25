import {
  TokenMappingStrategyRegistry,
  tailwindToChakraMappingStrategy,
  muiToAntdMappingStrategy,
  bootstrapToTailwindMappingStrategy,
  designTokensToCSSMappingStrategy,
  cssToTailwindMappingStrategy,
} from '../src/styles/theme-tokens/token-mapping-strategies';
import {
  TokenFormat,
  TokenType,
  TokenCategory,
  DesignToken,
  TokenMigrationMapping,
} from '../src/types/theme-tokens.types';

describe('Token Mapping Strategies', () => {
  describe('Tailwind to Chakra Strategy', () => {
    const strategy = tailwindToChakraMappingStrategy;

    it('should have correct metadata', () => {
      expect(strategy.name).toBe('Tailwind CSS to Chakra UI');
      expect(strategy.sourceFormat).toBe(TokenFormat.TAILWIND_CONFIG);
      expect(strategy.targetFormat).toBe(TokenFormat.CHAKRA_THEME);
      expect(strategy.mappings.length).toBeGreaterThan(0);
      expect(strategy.validation).toBeDefined();
    });

    it('should map color tokens correctly', () => {
      const colorMappings = strategy.mappings.filter(m => 
        typeof m.source === 'object' && m.source instanceof RegExp && 
        m.source.source.includes('colors')
      );

      expect(colorMappings.length).toBeGreaterThan(0);

      // Test gray color mapping
      const grayMapping = colorMappings.find(m => 
        m.source instanceof RegExp && m.source.test('colors.gray.500')
      );
      expect(grayMapping).toBeDefined();
      
      if (grayMapping && typeof grayMapping.target === 'function') {
        const result = grayMapping.target('colors.gray.500');
        expect(result).toBe('colors.gray.500');
      }

      // Test blue color mapping
      const blueMapping = colorMappings.find(m => 
        m.source instanceof RegExp && m.source.test('colors.blue.600')
      );
      expect(blueMapping).toBeDefined();
    });

    it('should map spacing tokens correctly', () => {
      const spacingMappings = strategy.mappings.filter(m => 
        (typeof m.source === 'string' && m.source.includes('spacing')) ||
        (m.source instanceof RegExp && m.source.source.includes('spacing'))
      );

      expect(spacingMappings.length).toBeGreaterThan(0);

      // Test numeric spacing mapping
      const numericMapping = spacingMappings.find(m => 
        m.source instanceof RegExp && m.source.test('spacing.4')
      );
      expect(numericMapping).toBeDefined();
      
      if (numericMapping && typeof numericMapping.target === 'function') {
        const result = numericMapping.target('spacing.4');
        expect(result).toBe('space.4');
      }

      // Test px spacing mapping
      const pxMapping = spacingMappings.find(m => 
        m.source === 'spacing.px'
      );
      expect(pxMapping).toBeDefined();
      expect(pxMapping?.target).toBe('space.px');
    });

    it('should map font size tokens correctly', () => {
      const fontSizeMappings = strategy.mappings.filter(m => 
        (typeof m.source === 'string' && m.source.includes('fontSize')) ||
        (m.source instanceof RegExp && m.source.source.includes('fontSize'))
      );

      expect(fontSizeMappings.length).toBeGreaterThan(0);

      // Test base font size mapping
      const baseMapping = fontSizeMappings.find(m => m.source === 'fontSize.base');
      expect(baseMapping).toBeDefined();
      expect(baseMapping?.target).toBe('fontSizes.md');

      // Test xl font size mapping
      const xlMapping = fontSizeMappings.find(m => 
        m.source instanceof RegExp && m.source.test('fontSize.2xl')
      );
      expect(xlMapping).toBeDefined();
    });

    it('should include validation rules', () => {
      expect(strategy.validation).toBeDefined();
      expect(strategy.validation!.length).toBeGreaterThan(0);

      const colorValidation = strategy.validation!.find(rule => 
        rule.types.includes(TokenType.COLOR)
      );
      expect(colorValidation).toBeDefined();
      expect(colorValidation?.severity).toBe('warning');
    });
  });

  describe('MUI to Ant Design Strategy', () => {
    const strategy = muiToAntdMappingStrategy;

    it('should have correct metadata', () => {
      expect(strategy.name).toBe('Material-UI to Ant Design');
      expect(strategy.sourceFormat).toBe(TokenFormat.MUI_THEME);
      expect(strategy.targetFormat).toBe(TokenFormat.ANTD_THEME);
    });

    it('should map palette tokens correctly', () => {
      const primaryMapping = strategy.mappings.find(m => 
        m.source === 'palette.primary.main'
      );
      expect(primaryMapping).toBeDefined();
      expect(primaryMapping?.target).toBe('colorPrimary');

      const errorMapping = strategy.mappings.find(m => 
        m.source === 'palette.error.main'
      );
      expect(errorMapping).toBeDefined();
      expect(errorMapping?.target).toBe('colorError');
    });

    it('should map typography tokens correctly', () => {
      const h1Mapping = strategy.mappings.find(m => 
        m.source === 'typography.h1.fontSize'
      );
      expect(h1Mapping).toBeDefined();
      expect(h1Mapping?.target).toBe('fontSizeHeading1');

      const body1Mapping = strategy.mappings.find(m => 
        m.source === 'typography.body1.fontSize'
      );
      expect(body1Mapping).toBeDefined();
      expect(body1Mapping?.target).toBe('fontSize');
    });

    it('should map spacing with transformation', () => {
      const spacingMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('spacing(2)')
      );
      expect(spacingMapping).toBeDefined();
      expect(spacingMapping?.transform).toBeDefined();
      expect(spacingMapping?.transform?.type).toBe('multiply');
      expect(spacingMapping?.transform?.amount).toBe(8);

      if (spacingMapping && typeof spacingMapping.target === 'function') {
        const result = spacingMapping.target('spacing(2)');
        expect(result).toBe('sizeStep2');
      }
    });

    it('should map shadow levels correctly', () => {
      const shadowMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('shadows.4')
      );
      expect(shadowMapping).toBeDefined();

      if (shadowMapping && typeof shadowMapping.target === 'function') {
        const result = shadowMapping.target('shadows.4');
        expect(result).toBe('boxShadow');
      }
    });
  });

  describe('Bootstrap to Tailwind Strategy', () => {
    const strategy = bootstrapToTailwindMappingStrategy;

    it('should have correct metadata', () => {
      expect(strategy.name).toBe('Bootstrap to Tailwind CSS');
      expect(strategy.sourceFormat).toBe(TokenFormat.CSS_VARIABLE);
      expect(strategy.targetFormat).toBe(TokenFormat.TAILWIND_CONFIG);
    });

    it('should map Bootstrap colors to Tailwind', () => {
      const primaryMapping = strategy.mappings.find(m => 
        m.source === '--bs-primary'
      );
      expect(primaryMapping).toBeDefined();
      expect(primaryMapping?.target).toBe('colors.blue.600');

      const dangerMapping = strategy.mappings.find(m => 
        m.source === '--bs-danger'
      );
      expect(dangerMapping).toBeDefined();
      expect(dangerMapping?.target).toBe('colors.red.600');
    });

    it('should map Bootstrap utilities correctly', () => {
      const borderRadiusMapping = strategy.mappings.find(m => 
        m.source === '--bs-border-radius'
      );
      expect(borderRadiusMapping).toBeDefined();
      expect(borderRadiusMapping?.target).toBe('borderRadius.DEFAULT');

      const fontSizeMapping = strategy.mappings.find(m => 
        m.source === '--bs-font-size-base'
      );
      expect(fontSizeMapping).toBeDefined();
      expect(fontSizeMapping?.target).toBe('fontSize.base');
    });
  });

  describe('Design Tokens to CSS Strategy', () => {
    const strategy = designTokensToCSSMappingStrategy;

    it('should have correct metadata', () => {
      expect(strategy.name).toBe('Design Tokens to CSS Variables');
      expect(strategy.sourceFormat).toBe(TokenFormat.DESIGN_TOKENS);
      expect(strategy.targetFormat).toBe(TokenFormat.CSS_VARIABLE);
    });

    it('should convert dot notation to CSS variables', () => {
      const mainMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('color.primary.500')
      );
      expect(mainMapping).toBeDefined();

      if (mainMapping && typeof mainMapping.target === 'function') {
        const result = mainMapping.target('color.primary.500');
        expect(result).toBe('--color-primary-500');
      }
    });

    it('should have pre-transforms for $value extraction', () => {
      expect(strategy.preTransforms).toBeDefined();
      expect(strategy.preTransforms!.length).toBe(1);

      const transform = strategy.preTransforms![0];
      expect(transform.type).toBe('custom');
      expect(transform.transform).toBeDefined();

      // Test $value extraction
      const testValue = { $value: '#007bff', $type: 'color' };
      const result = transform.transform!(testValue);
      expect(result).toBe('#007bff');
    });
  });

  describe('CSS to Tailwind Strategy', () => {
    const strategy = cssToTailwindMappingStrategy;

    it('should have correct metadata', () => {
      expect(strategy.name).toBe('CSS Variables to Tailwind Config');
      expect(strategy.sourceFormat).toBe(TokenFormat.CSS_VARIABLE);
      expect(strategy.targetFormat).toBe(TokenFormat.TAILWIND_CONFIG);
    });

    it('should map color variables correctly', () => {
      const colorMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('--color-primary-500')
      );
      expect(colorMapping).toBeDefined();

      if (colorMapping && typeof colorMapping.target === 'function') {
        const result = colorMapping.target('--color-primary-500');
        expect(result).toBe('colors.primary.500');
      }
    });

    it('should map spacing variables correctly', () => {
      const spacingMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('--spacing-md')
      );
      expect(spacingMapping).toBeDefined();

      if (spacingMapping && typeof spacingMapping.target === 'function') {
        const result = spacingMapping.target('--spacing-md');
        expect(result).toBe('spacing.md');
      }
    });

    it('should handle multi-category text variables', () => {
      const textMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('--text-lg')
      );
      expect(textMapping).toBeDefined();

      if (textMapping && typeof textMapping.target === 'function') {
        const fontSizeResult = textMapping.target('--text-lg');
        expect(fontSizeResult).toBe('fontSize.lg');

        const colorResult = textMapping.target('--text-primary-500');
        expect(colorResult).toBe('colors.primary.500');
      }
    });
  });

  describe('TokenMappingStrategyRegistry', () => {
    let registry: TokenMappingStrategyRegistry;

    beforeEach(() => {
      registry = new TokenMappingStrategyRegistry();
    });

    it('should have default strategies registered', () => {
      const strategies = registry.getAvailableStrategies();
      
      expect(strategies).toContain('tailwind-to-chakra');
      expect(strategies).toContain('mui-to-antd');
      expect(strategies).toContain('bootstrap-to-tailwind');
      expect(strategies).toContain('design-tokens-to-css');
      expect(strategies).toContain('css-to-tailwind');
    });

    it('should get strategies by name', () => {
      const strategy = registry.getStrategy('tailwind-to-chakra');
      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('Tailwind CSS to Chakra UI');

      const nonExistent = registry.getStrategy('non-existent');
      expect(nonExistent).toBeUndefined();
    });

    it('should allow custom strategy registration', () => {
      const customStrategy = {
        name: 'Custom Strategy',
        sourceFormat: TokenFormat.JSON,
        targetFormat: TokenFormat.CSS_VARIABLE,
        mappings: [
          {
            source: 'test.token',
            target: '--test-token',
          },
        ],
      };

      registry.register('custom', customStrategy);

      const retrieved = registry.getStrategy('custom');
      expect(retrieved).toBe(customStrategy);

      const strategies = registry.getAvailableStrategies();
      expect(strategies).toContain('custom');
    });

    it('should get strategies by format', () => {
      const tailwindStrategies = registry.getStrategiesByFormats(TokenFormat.TAILWIND_CONFIG);
      expect(tailwindStrategies.length).toBeGreaterThan(0);
      expect(tailwindStrategies[0].sourceFormat).toBe(TokenFormat.TAILWIND_CONFIG);

      const cssToTailwind = registry.getStrategiesByFormats(
        TokenFormat.CSS_VARIABLE,
        TokenFormat.TAILWIND_CONFIG
      );
      expect(cssToTailwind.length).toBeGreaterThan(0);
      expect(cssToTailwind[0].targetFormat).toBe(TokenFormat.TAILWIND_CONFIG);
    });

    it('should create custom strategy from base', () => {
      const customMappings: TokenMigrationMapping[] = [
        {
          source: 'custom.token',
          target: 'mapped.custom.token',
          notes: 'Custom mapping',
        },
      ];

      const customStrategy = registry.createCustomStrategy(
        'tailwind-to-chakra-custom',
        'tailwind-to-chakra',
        customMappings
      );

      expect(customStrategy.name).toBe('tailwind-to-chakra-custom');
      expect(customStrategy.mappings.length).toBeGreaterThan(tailwindToChakraMappingStrategy.mappings.length);
      expect(customStrategy.mappings).toContain(customMappings[0]);

      const retrieved = registry.getStrategy('tailwind-to-chakra-custom');
      expect(retrieved).toBe(customStrategy);
    });

    it('should merge multiple strategies', () => {
      // First create a simple strategy to merge
      const simpleStrategy = {
        name: 'Simple Strategy',
        sourceFormat: TokenFormat.CSS_VARIABLE,
        targetFormat: TokenFormat.TAILWIND_CONFIG,
        mappings: [
          {
            source: '--simple',
            target: 'simple',
          },
        ],
      };
      registry.register('simple', simpleStrategy);

      const mergedStrategy = registry.mergeStrategies(
        'merged-strategy',
        TokenFormat.CSS_VARIABLE,
        TokenFormat.TAILWIND_CONFIG,
        ['bootstrap-to-tailwind', 'simple']
      );

      expect(mergedStrategy.name).toBe('merged-strategy');
      expect(mergedStrategy.sourceFormat).toBe(TokenFormat.CSS_VARIABLE);
      expect(mergedStrategy.targetFormat).toBe(TokenFormat.TAILWIND_CONFIG);
      expect(mergedStrategy.mappings.length).toBeGreaterThan(bootstrapToTailwindMappingStrategy.mappings.length);

      const retrieved = registry.getStrategy('merged-strategy');
      expect(retrieved).toBe(mergedStrategy);
    });

    it('should throw error for non-existent base strategy', () => {
      expect(() => {
        registry.createCustomStrategy('test', 'non-existent', []);
      }).toThrow('Base strategy not found: non-existent');
    });

    it('should throw error for non-existent strategy in merge', () => {
      expect(() => {
        registry.mergeStrategies(
          'test',
          TokenFormat.JSON,
          TokenFormat.CSS_VARIABLE,
          ['non-existent']
        );
      }).toThrow('Strategy not found: non-existent');
    });

    it('should get all strategies', () => {
      const allStrategies = registry.getAllStrategies();
      expect(allStrategies.size).toBeGreaterThan(0);
      expect(allStrategies.has('tailwind-to-chakra')).toBe(true);
      expect(allStrategies.get('tailwind-to-chakra')).toBe(tailwindToChakraMappingStrategy);
    });
  });

  describe('Strategy Validation Rules', () => {
    it('should validate tokens according to strategy rules', () => {
      const strategy = tailwindToChakraMappingStrategy;
      const colorRule = strategy.validation!.find(rule => 
        rule.types.includes(TokenType.COLOR)
      );

      expect(colorRule).toBeDefined();

      // Test valid color
      const validColorToken: DesignToken = {
        name: 'colors.blue.500',
        value: '#007bff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      };

      const validResult = colorRule!.validate(validColorToken);
      expect(validResult.valid).toBe(true);

      // Test invalid color
      const invalidColorToken: DesignToken = {
        name: 'colors.blue.500',
        value: 'blue',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      };

      const invalidResult = colorRule!.validate(invalidColorToken);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.message).toBe('Color must be a valid hex code');
    });

    it('should validate dimension tokens', () => {
      const strategy = tailwindToChakraMappingStrategy;
      const dimensionRule = strategy.validation!.find(rule => 
        rule.types.includes(TokenType.DIMENSION)
      );

      expect(dimensionRule).toBeDefined();

      // Test valid dimension
      const validDimensionToken: DesignToken = {
        name: 'spacing.4',
        value: '16px',
        type: TokenType.DIMENSION,
        category: TokenCategory.SPACING,
      };

      const validResult = dimensionRule!.validate(validDimensionToken);
      expect(validResult.valid).toBe(true);

      // Test invalid dimension
      const invalidDimensionToken: DesignToken = {
        name: 'spacing.4',
        value: '16',
        type: TokenType.DIMENSION,
        category: TokenCategory.SPACING,
      };

      const invalidResult = dimensionRule!.validate(invalidDimensionToken);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('Mapping Function Behavior', () => {
    it('should handle regex capture groups correctly', () => {
      const strategy = tailwindToChakraMappingStrategy;
      const grayMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('colors.gray.500')
      );

      expect(grayMapping).toBeDefined();
      expect(typeof grayMapping!.target).toBe('function');

      if (typeof grayMapping!.target === 'function') {
        const result = grayMapping!.target('colors.gray.500');
        expect(result).toBe('colors.gray.500');
      }
    });

    it('should handle complex target transformations', () => {
      const strategy = muiToAntdMappingStrategy;
      const shadowMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('shadows.1')
      );

      expect(shadowMapping).toBeDefined();

      if (typeof shadowMapping!.target === 'function') {
        expect(shadowMapping!.target('shadows.1')).toBe('boxShadowSecondary');
        expect(shadowMapping!.target('shadows.4')).toBe('boxShadow');
        expect(shadowMapping!.target('shadows.12')).toBe('boxShadowTertiary');
      }
    });

    it('should handle conditional mappings', () => {
      const strategy = cssToTailwindMappingStrategy;
      const textMapping = strategy.mappings.find(m => 
        m.source instanceof RegExp && m.source.test('--text-lg')
      );

      expect(textMapping).toBeDefined();

      if (typeof textMapping!.target === 'function') {
        // Should map to fontSize for size values
        expect(textMapping!.target('--text-lg')).toBe('fontSize.lg');
        expect(textMapping!.target('--text-xl')).toBe('fontSize.xl');
        
        // Should map to colors for color values
        expect(textMapping!.target('--text-primary')).toBe('colors.primary');
        expect(textMapping!.target('--text-blue-500')).toBe('colors.blue.500');
      }
    });
  });
});