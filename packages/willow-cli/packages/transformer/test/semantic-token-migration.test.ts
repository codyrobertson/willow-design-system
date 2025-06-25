import {
  BaseSemanticTokenMigrator,
  SemanticTokenMigratorRegistry,
  SemanticRelationshipType,
  type SemanticRelationship,
  type SemanticConflict,
  type ConflictResolution,
} from '../src/styles/theme-tokens/semantic-token-migration';
import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenSemanticContext,
  TokenMigrationContext,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
} from '../src/types/theme-tokens.types';

describe('Semantic Token Migration', () => {
  const sampleTokens: DesignToken[] = [
    {
      name: 'colors.primary.500',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Primary brand color',
    },
    {
      name: 'colors.primary.600',
      value: '#0056b3',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Darker primary color',
    },
    {
      name: 'colors.secondary.500',
      value: '#6c757d',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'spacing.sm',
      value: '8px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
    },
    {
      name: 'spacing.md',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
      description: 'Medium spacing',
    },
    {
      name: 'spacing.lg',
      value: '24px',
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
    },
    {
      name: 'fontSize.base',
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.TYPOGRAPHY,
    },
    {
      name: 'fontSize.lg',
      value: '18px',
      type: TokenType.DIMENSION,
      category: TokenCategory.TYPOGRAPHY,
    },
    {
      name: 'borderRadius.default',
      value: '4px',
      type: TokenType.DIMENSION,
      category: TokenCategory.BORDER,
    },
    {
      name: 'button.primary.background',
      value: { $ref: 'colors.primary.500' } as TokenReference,
      type: TokenType.REFERENCE,
      category: TokenCategory.CUSTOM,
    },
  ];

  const tailwindContext: TokenSemanticContext = {
    framework: 'tailwind',
    version: '3.4.0',
    sourceFramework: 'custom',
  };

  const chakraContext: TokenSemanticContext = {
    framework: 'chakra',
    version: '2.8.0',
    sourceFramework: 'tailwind',
  };

  describe('BaseSemanticTokenMigrator', () => {
    let migrator: BaseSemanticTokenMigrator;

    beforeEach(() => {
      migrator = new BaseSemanticTokenMigrator();
    });

    describe('analyzeSemanticRelationships', () => {
      it('should identify color scale relationships', () => {
        const colorTokens: DesignToken[] = [
          {
            name: 'colors.blue.400',
            value: '#60a5fa',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'colors.blue.500',
            value: '#3b82f6',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'colors.blue.600',
            value: '#2563eb',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
        ];

        const relationships = migrator.analyzeSemanticRelationships(colorTokens);

        expect(relationships.scales).toBeDefined();
        expect(relationships.scales.length).toBeGreaterThan(0);

        const blueScale = relationships.scales.find(scale => 
          scale.name.includes('blue') || scale.tokens.some(token => token.includes('blue'))
        );
        expect(blueScale).toBeDefined();
        expect(blueScale?.tokens).toContain('colors.blue.400');
        expect(blueScale?.tokens).toContain('colors.blue.500');
        expect(blueScale?.tokens).toContain('colors.blue.600');
      });

      it('should identify hierarchical relationships', () => {
        const hierarchicalTokens: DesignToken[] = [
          {
            name: 'button.primary.background',
            value: '#007bff',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'button.primary.color',
            value: '#ffffff',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'button.secondary.background',
            value: '#6c757d',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
        ];

        const relationships = migrator.analyzeSemanticRelationships(hierarchicalTokens);

        expect(relationships.hierarchies).toBeDefined();
        expect(relationships.hierarchies.length).toBeGreaterThan(0);

        const buttonHierarchy = relationships.hierarchies.find(h => 
          h.base.includes('button')
        );
        expect(buttonHierarchy).toBeDefined();
      });

      it('should identify variant relationships', () => {
        const variantTokens: DesignToken[] = [
          {
            name: 'typography.heading.h1',
            value: '32px',
            type: TokenType.DIMENSION,
            category: TokenCategory.TYPOGRAPHY,
          },
          {
            name: 'typography.heading.h2',
            value: '24px',
            type: TokenType.DIMENSION,
            category: TokenCategory.TYPOGRAPHY,
          },
          {
            name: 'typography.heading.h3',
            value: '20px',
            type: TokenType.DIMENSION,
            category: TokenCategory.TYPOGRAPHY,
          },
        ];

        const relationships = migrator.analyzeSemanticRelationships(variantTokens);

        expect(relationships.variants).toBeDefined();
        expect(relationships.variants.length).toBeGreaterThan(0);

        const headingVariants = relationships.variants.find(v => 
          v.base.includes('heading')
        );
        expect(headingVariants).toBeDefined();
        expect(headingVariants?.variants).toHaveProperty('h1');
        expect(headingVariants?.variants).toHaveProperty('h2');
        expect(headingVariants?.variants).toHaveProperty('h3');
      });

      it('should identify reference relationships', () => {
        const referenceTokens: DesignToken[] = [
          {
            name: 'colors.primary',
            value: '#007bff',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'button.background',
            value: { $ref: 'colors.primary' } as TokenReference,
            type: TokenType.REFERENCE,
            category: TokenCategory.CUSTOM,
          },
        ];

        const relationships = migrator.analyzeSemanticRelationships(referenceTokens);

        expect(relationships.relationships).toBeDefined();
        expect(relationships.relationships.length).toBeGreaterThan(0);

        const referenceRelationship = relationships.relationships.find(r => 
          r.type === SemanticRelationshipType.HIERARCHY &&
          r.sourceToken === 'button.background' &&
          r.targetToken === 'colors.primary'
        );
        expect(referenceRelationship).toBeDefined();
        expect(referenceRelationship?.confidence).toBeGreaterThan(0.8);
      });
    });

    describe('generateSemanticMappings', () => {
      it('should generate mappings between frameworks', () => {
        const mappings = migrator.generateSemanticMappings('tailwind', 'chakra');

        expect(mappings).toBeDefined();
        expect(Array.isArray(mappings)).toBe(true);
        expect(mappings.length).toBeGreaterThan(0);

        // Check for color scale mapping
        const colorMapping = mappings.find(m => 
          m.semanticRole === 'color-scale-value' || m.semanticRole === 'color-palette-value'
        );
        expect(colorMapping).toBeDefined();
        expect(colorMapping?.confidence).toBeGreaterThan(0);
      });

      it('should cache mappings for performance', () => {
        const mappings1 = migrator.generateSemanticMappings('tailwind', 'chakra');
        const mappings2 = migrator.generateSemanticMappings('tailwind', 'chakra');

        expect(mappings1).toBe(mappings2); // Should return same reference
      });

      it('should throw error for unknown frameworks', () => {
        expect(() => {
          migrator.generateSemanticMappings('unknown', 'chakra');
        }).toThrow('Framework rules not found');
      });
    });

    describe('migrate', () => {
      it('should successfully migrate tokens between frameworks', async () => {
        const result = await migrator.migrate(sampleTokens, tailwindContext, chakraContext);

        expect(result.success).toBe(true);
        expect(result.tokens).toBeDefined();
        expect(result.tokens.length).toBeGreaterThan(0);
        expect(result.output).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.transformedCount).toBeGreaterThan(0);
      });

      it('should preserve semantic relationships during migration', async () => {
        const tokensWithReferences: DesignToken[] = [
          {
            name: 'colors.primary.500',
            value: '#007bff',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'button.background',
            value: { $ref: 'colors.primary.500' } as TokenReference,
            type: TokenType.REFERENCE,
            category: TokenCategory.CUSTOM,
          },
        ];

        const result = await migrator.migrate(tokensWithReferences, tailwindContext, chakraContext);

        expect(result.success).toBe(true);
        expect(result.tokens.length).toBe(2);

        // Check that reference is preserved
        const buttonToken = result.tokens.find(t => t.name.includes('button'));
        expect(buttonToken).toBeDefined();
        expect(buttonToken?.metadata?.originalName).toBeDefined();
      });

      it('should handle migration errors gracefully', async () => {
        const invalidContext: TokenSemanticContext = {
          framework: 'nonexistent',
          version: '1.0.0',
          sourceFramework: 'tailwind',
        };

        const result = await migrator.migrate(sampleTokens, tailwindContext, invalidContext);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.tokens).toEqual([]);
      });

      it('should include semantic metadata in output', async () => {
        const result = await migrator.migrate(sampleTokens, tailwindContext, chakraContext);

        expect(result.metadata).toBeDefined();
        expect(result.metadata.semanticRelationships).toBeDefined();
        expect(result.metadata.strategy).toContain('semantic');
        expect(result.output).toContain('framework');
        expect(result.output).toContain('migrationTimestamp');
      });
    });

    describe('resolveSemanticConflicts', () => {
      it('should resolve naming conflicts automatically when confidence is high', () => {
        const conflicts: SemanticConflict[] = [
          {
            type: 'naming',
            sourceToken: 'colors.primary',
            targetCandidates: ['colors.brand', 'colors.primary'],
            confidence: [0.9, 0.7],
            reason: 'Multiple mapping candidates',
          },
        ];

        const context: TokenMigrationContext = {
          sourceFramework: 'tailwind',
          targetFramework: 'chakra',
          preserveSemantics: true,
          strictValidation: false,
        };

        const resolutions = migrator.resolveSemanticConflicts(conflicts, context);

        expect(resolutions).toBeDefined();
        expect(resolutions.length).toBe(1);
        expect(resolutions[0].resolution).toBe('auto');
        expect(resolutions[0].selectedTarget).toBe('colors.brand');
      });

      it('should flag conflicts for manual resolution when confidence is low', () => {
        const conflicts: SemanticConflict[] = [
          {
            type: 'naming',
            sourceToken: 'colors.accent',
            targetCandidates: ['colors.secondary', 'colors.tertiary'],
            confidence: [0.5, 0.4],
            reason: 'Ambiguous mapping',
          },
        ];

        const context: TokenMigrationContext = {
          sourceFramework: 'tailwind',
          targetFramework: 'chakra',
          preserveSemantics: true,
          strictValidation: true,
        };

        const resolutions = migrator.resolveSemanticConflicts(conflicts, context);

        expect(resolutions).toBeDefined();
        expect(resolutions.length).toBe(1);
        expect(resolutions[0].resolution).toBe('manual');
        expect(resolutions[0].reasoning).toContain('manual review');
      });

      it('should handle value conflicts with semantic equivalence', () => {
        const conflicts: SemanticConflict[] = [
          {
            type: 'value',
            sourceToken: 'spacing.medium',
            targetCandidates: ['space.md', 'space.4'],
            confidence: [0.8, 0.6],
            reason: 'Value mismatch',
          },
        ];

        const context: TokenMigrationContext = {
          sourceFramework: 'custom',
          targetFramework: 'chakra',
          preserveSemantics: true,
          strictValidation: false,
        };

        const resolutions = migrator.resolveSemanticConflicts(conflicts, context);

        expect(resolutions).toBeDefined();
        expect(resolutions.length).toBe(1);
        expect(resolutions[0].resolution).toBe('auto');
      });

      it('should handle hierarchy conflicts', () => {
        const conflicts: SemanticConflict[] = [
          {
            type: 'hierarchy',
            sourceToken: 'components.button.primary',
            targetCandidates: ['Button.primary', 'button.primary'],
            confidence: [0.7, 0.8],
            reason: 'Hierarchy structure differs',
          },
        ];

        const context: TokenMigrationContext = {
          sourceFramework: 'styled-system',
          targetFramework: 'chakra',
          preserveSemantics: true,
          strictValidation: false,
        };

        const resolutions = migrator.resolveSemanticConflicts(conflicts, context);

        expect(resolutions).toBeDefined();
        expect(resolutions.length).toBe(1);
        expect(resolutions[0].resolution).toBe('auto');
        expect(resolutions[0].reasoning).toContain('flattening');
      });
    });
  });

  describe('Semantic Analysis Edge Cases', () => {
    let migrator: BaseSemanticTokenMigrator;

    beforeEach(() => {
      migrator = new BaseSemanticTokenMigrator();
    });

    it('should handle tokens with no clear semantic patterns', () => {
      const customTokens: DesignToken[] = [
        {
          name: 'weirdToken123',
          value: 'some-value',
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
        {
          name: 'another_custom_thing',
          value: '42px',
          type: TokenType.DIMENSION,
          category: TokenCategory.CUSTOM,
        },
      ];

      const relationships = migrator.analyzeSemanticRelationships(customTokens);

      expect(relationships).toBeDefined();
      expect(relationships.relationships).toBeDefined();
      expect(relationships.hierarchies).toBeDefined();
      expect(relationships.scales).toBeDefined();
      expect(relationships.variants).toBeDefined();
    });

    it('should handle single token categories', () => {
      const singleToken: DesignToken[] = [
        {
          name: 'colors.unique',
          value: '#ff0000',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ];

      const relationships = migrator.analyzeSemanticRelationships(singleToken);

      expect(relationships).toBeDefined();
      expect(relationships.scales.length).toBe(0); // No scales with single token
      expect(relationships.variants.length).toBe(0); // No variants with single token
    });

    it('should detect linear vs exponential scales', () => {
      const linearSpacing: DesignToken[] = [
        {
          name: 'spacing.1',
          value: '4px',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
        {
          name: 'spacing.2',
          value: '8px',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
        {
          name: 'spacing.3',
          value: '12px',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
        {
          name: 'spacing.4',
          value: '16px',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
      ];

      const relationships = migrator.analyzeSemanticRelationships(linearSpacing);

      expect(relationships.scales.length).toBeGreaterThan(0);
      const spacingScale = relationships.scales[0];
      expect(spacingScale.scaleType).toBe('linear');
    });

    it('should handle complex nested token structures', () => {
      const nestedTokens: DesignToken[] = [
        {
          name: 'components.forms.input.variants.primary.background.default',
          value: '#ffffff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'components.forms.input.variants.primary.background.hover',
          value: '#f8f9fa',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'components.forms.input.variants.secondary.background.default',
          value: '#e9ecef',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ];

      const relationships = migrator.analyzeSemanticRelationships(nestedTokens);

      expect(relationships.hierarchies.length).toBeGreaterThan(0);
      expect(relationships.variants.length).toBeGreaterThan(0);

      // Should find multiple levels of hierarchy
      const deepHierarchy = relationships.hierarchies.find(h => h.level > 3);
      expect(deepHierarchy).toBeDefined();
    });

    it('should handle array and composite token values', () => {
      const complexTokens: DesignToken[] = [
        {
          name: 'font.family.sans',
          value: {
            $array: ['Inter', 'system-ui', 'sans-serif'],
          } as TokenArray,
          type: TokenType.FONT_FAMILY,
          category: TokenCategory.TYPOGRAPHY,
        },
        {
          name: 'shadow.elevated',
          value: {
            x: '0px',
            y: '4px',
            blur: '8px',
            color: 'rgba(0, 0, 0, 0.1)',
          } as TokenCompositeValue,
          type: TokenType.SHADOW,
          category: TokenCategory.SHADOW,
        },
      ];

      const relationships = migrator.analyzeSemanticRelationships(complexTokens);

      expect(relationships).toBeDefined();
      // Should handle complex values without errors
    });
  });

  describe('SemanticTokenMigratorRegistry', () => {
    let registry: SemanticTokenMigratorRegistry;

    beforeEach(() => {
      registry = new SemanticTokenMigratorRegistry();
    });

    it('should have default migrators registered', () => {
      const migrators = registry.getAvailableMigrators();
      expect(migrators).toContain('base');
    });

    it('should allow custom migrator registration', () => {
      const customMigrator = new BaseSemanticTokenMigrator();
      registry.register('custom', customMigrator);

      const retrieved = registry.getMigrator('custom');
      expect(retrieved).toBe(customMigrator);

      const migrators = registry.getAvailableMigrators();
      expect(migrators).toContain('custom');
    });

    it('should migrate tokens using registry', async () => {
      const result = await registry.migrate(
        sampleTokens,
        tailwindContext,
        chakraContext
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown migrator', async () => {
      await expect(
        registry.migrate(
          sampleTokens,
          tailwindContext,
          chakraContext,
          'nonexistent'
        )
      ).rejects.toThrow('No semantic migrator available');
    });
  });

  describe('Framework-specific Semantic Rules', () => {
    let migrator: BaseSemanticTokenMigrator;

    beforeEach(() => {
      migrator = new BaseSemanticTokenMigrator();
    });

    it('should recognize Tailwind color scale patterns', async () => {
      const tailwindTokens: DesignToken[] = [
        {
          name: 'colors.blue.100',
          value: '#dbeafe',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'colors.blue.500',
          value: '#3b82f6',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'colors.blue.900',
          value: '#1e3a8a',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ];

      const relationships = migrator.analyzeSemanticRelationships(tailwindTokens);

      expect(relationships.scales.length).toBeGreaterThan(0);
      const blueScale = relationships.scales.find(s => s.name.includes('blue'));
      expect(blueScale).toBeDefined();
      expect(blueScale?.scaleType).toBe('linear');
    });

    it('should recognize Chakra semantic tokens', async () => {
      const chakraTokens: DesignToken[] = [
        {
          name: 'colors.brand.50',
          value: '#e6f3ff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'colors.brand.500',
          value: '#0080ff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'space.xs',
          value: '0.5rem',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
        {
          name: 'space.md',
          value: '1rem',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
      ];

      const result = await migrator.migrate(
        chakraTokens,
        { framework: 'chakra', version: '2.8.0', sourceFramework: 'custom' },
        { framework: 'tailwind', version: '3.4.0', sourceFramework: 'chakra' }
      );

      expect(result.success).toBe(true);
      expect(result.tokens.length).toBe(chakraTokens.length);
    });

    it('should recognize Material-UI theme structure', async () => {
      const muiTokens: DesignToken[] = [
        {
          name: 'palette.primary.main',
          value: '#1976d2',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'palette.primary.light',
          value: '#42a5f5',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'typography.h1.fontSize',
          value: '6rem',
          type: TokenType.DIMENSION,
          category: TokenCategory.TYPOGRAPHY,
        },
        {
          name: 'spacing(2)',
          value: '16px',
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        },
      ];

      const relationships = migrator.analyzeSemanticRelationships(muiTokens);

      expect(relationships.variants.length).toBeGreaterThan(0);
      const paletteVariants = relationships.variants.find(v => 
        v.base.includes('palette.primary')
      );
      expect(paletteVariants).toBeDefined();
    });
  });

  describe('Performance and Caching', () => {
    let migrator: BaseSemanticTokenMigrator;

    beforeEach(() => {
      migrator = new BaseSemanticTokenMigrator();
    });

    it('should cache semantic mappings for performance', () => {
      const startTime = performance.now();
      const mappings1 = migrator.generateSemanticMappings('tailwind', 'chakra');
      const firstCallTime = performance.now() - startTime;

      const cachedStartTime = performance.now();
      const mappings2 = migrator.generateSemanticMappings('tailwind', 'chakra');
      const cachedCallTime = performance.now() - cachedStartTime;

      expect(mappings1).toBe(mappings2); // Same reference due to caching
      expect(cachedCallTime).toBeLessThan(firstCallTime); // Cached call should be faster
    });

    it('should handle large token sets efficiently', async () => {
      // Generate a large set of tokens
      const largeTokenSet: DesignToken[] = [];
      for (let i = 0; i < 1000; i++) {
        largeTokenSet.push({
          name: `colors.scale.${i}`,
          value: `#${i.toString(16).padStart(6, '0')}`,
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        });
      }

      const startTime = performance.now();
      const result = await migrator.migrate(largeTokenSet, tailwindContext, chakraContext);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.tokens.length).toBe(largeTokenSet.length);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    let migrator: BaseSemanticTokenMigrator;

    beforeEach(() => {
      migrator = new BaseSemanticTokenMigrator();
    });

    it('should handle malformed tokens gracefully', async () => {
      const malformedTokens: DesignToken[] = [
        {
          name: '', // Empty name
          value: null,
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
        {
          name: 'valid.token',
          value: 'valid-value',
          type: TokenType.RAW,
          category: TokenCategory.CUSTOM,
        },
      ];

      const result = await migrator.migrate(malformedTokens, tailwindContext, chakraContext);

      // Should handle malformed tokens without crashing
      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should provide detailed error information', async () => {
      const problematicTokens: DesignToken[] = [
        {
          name: 'circular.reference.a',
          value: { $ref: 'circular.reference.b' } as TokenReference,
          type: TokenType.REFERENCE,
          category: TokenCategory.CUSTOM,
        },
        {
          name: 'circular.reference.b',
          value: { $ref: 'circular.reference.a' } as TokenReference,
          type: TokenType.REFERENCE,
          category: TokenCategory.CUSTOM,
        },
      ];

      const result = await migrator.migrate(problematicTokens, tailwindContext, chakraContext);

      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('error');
      }
    });
  });
});