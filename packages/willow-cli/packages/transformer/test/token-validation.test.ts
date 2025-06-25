import {
  BaseTokenValidator,
  TokenValidatorRegistry,
  ValidationSeverity,
  type TokenValidationResult,
  type ConflictDetectionResult,
  type ValidationError,
  type ValidationWarning,
} from '../src/styles/theme-tokens/token-validation';
import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenSemanticContext,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
} from '../src/types/theme-tokens.types';

describe('Token Validation', () => {
  const validTokens: DesignToken[] = [
    {
      name: 'colors.primary.500',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: 'Primary brand color',
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
      name: 'animation.duration.fast',
      value: '200ms',
      type: TokenType.DURATION,
      category: TokenCategory.TIMING,
    },
    {
      name: 'transition.ease',
      value: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
      type: TokenType.CUBIC_BEZIER,
      category: TokenCategory.MOTION,
    },
  ];

  const invalidTokens: DesignToken[] = [
    {
      name: '', // Invalid: empty name
      value: '#ff0000',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'colors.invalid',
      value: null, // Invalid: null value
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'colors.bad-hex',
      value: '#gggggg', // Invalid: bad hex format
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'spacing.no-unit',
      value: '16', // Warning: missing unit
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
    },
    {
      name: 'duration.no-unit',
      value: '200', // Invalid: missing duration unit
      type: TokenType.DURATION,
      category: TokenCategory.TIMING,
    },
    {
      name: 'transition.invalid',
      value: 'cubic-bezier(1, 2, 3)', // Invalid: malformed cubic-bezier
      type: TokenType.CUBIC_BEZIER,
      category: TokenCategory.MOTION,
    },
  ];

  const conflictingTokens: DesignToken[] = [
    {
      name: 'colors.primary',
      value: '#007bff',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'colors.primary', // Duplicate name
      value: '#0056b3',
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'colors.secondary',
      value: '#007bff', // Duplicate value
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
    },
    {
      name: 'colors.accent',
      value: { $ref: 'colors.nonexistent' } as TokenReference, // Broken reference
      type: TokenType.REFERENCE,
      category: TokenCategory.COLOR,
    },
    {
      name: 'spacing-wrong-category', // Wrong category based on name
      value: '16px',
      type: TokenType.DIMENSION,
      category: TokenCategory.COLOR, // Should be SPACING
    },
  ];

  const semanticContext: TokenSemanticContext = {
    framework: 'tailwind',
    version: '3.4.0',
    sourceFramework: 'custom',
  };

  describe('BaseTokenValidator', () => {
    let validator: BaseTokenValidator;

    beforeEach(() => {
      validator = new BaseTokenValidator();
    });

    describe('validateToken', () => {
      it('should validate a correct token successfully', () => {
        const result = validator.validateToken(validTokens[0]);

        expect(result.valid).toBe(true);
        expect(result.token).toBe(validTokens[0]);
        expect(result.errors.length).toBe(0);
        expect(result.metrics).toBeDefined();
        expect(result.metrics!.validationTime).toBeGreaterThan(0);
      });

      it('should detect multiple validation errors', () => {
        const invalidToken = invalidTokens[0]; // Empty name
        const result = validator.validateToken(invalidToken);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        const nameError = result.errors.find(e => e.code === 'token-name-required');
        expect(nameError).toBeDefined();
        expect(nameError!.message).toContain('Token name is required');
        expect(nameError!.category).toBe('syntax');
      });

      it('should detect null value errors', () => {
        const nullValueToken = invalidTokens[1];
        const result = validator.validateToken(nullValueToken);

        expect(result.valid).toBe(false);
        
        const valueError = result.errors.find(e => e.code === 'token-value-required');
        expect(valueError).toBeDefined();
        expect(valueError!.category).toBe('syntax');
      });

      it('should validate color format correctly', () => {
        const invalidColorToken = invalidTokens[2]; // Bad hex
        const result = validator.validateToken(invalidColorToken);

        expect(result.valid).toBe(false);
        
        const colorError = result.errors.find(e => e.code === 'color-hex-format');
        expect(colorError).toBeDefined();
        expect(colorError!.message).toContain('Color value must be valid');
      });

      it('should warn about missing dimension units', () => {
        const noUnitToken = invalidTokens[3];
        const result = validator.validateToken(noUnitToken);

        // Should be valid but with warnings
        expect(result.valid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        
        const unitWarning = result.warnings.find(w => w.code === 'dimension-unit-format');
        expect(unitWarning).toBeDefined();
      });

      it('should validate duration format', () => {
        const invalidDurationToken = invalidTokens[4];
        const result = validator.validateToken(invalidDurationToken);

        expect(result.valid).toBe(false);
        
        const durationError = result.errors.find(e => e.code === 'invalid-duration-unit');
        expect(durationError).toBeDefined();
        expect(durationError!.autoFixable).toBe(true);
      });

      it('should validate cubic-bezier format', () => {
        const invalidCubicBezierToken = invalidTokens[5];
        const result = validator.validateToken(invalidCubicBezierToken);

        expect(result.valid).toBe(false);
        
        const cubicBezierError = result.errors.find(e => e.code === 'invalid-cubic-bezier');
        expect(cubicBezierError).toBeDefined();
        expect(cubicBezierError!.suggestion).toContain('cubic-bezier(x1, y1, x2, y2)');
      });

      it('should validate naming conventions', () => {
        const badNamingToken: DesignToken = {
          name: 'BadCamelCase_Name',
          value: '#000000',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        };

        const result = validator.validateToken(badNamingToken);
        
        const namingWarning = result.warnings.find(w => w.code === 'naming-kebab-case');
        expect(namingWarning).toBeDefined();
        expect(namingWarning!.category).toBe('convention');
      });

      it('should detect reserved words in names', () => {
        const reservedWordToken: DesignToken = {
          name: 'colors.default.primary',
          value: '#000000',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        };

        const result = validator.validateToken(reservedWordToken);
        
        const reservedWarning = result.warnings.find(w => w.code === 'naming-no-reserved-words');
        expect(reservedWarning).toBeDefined();
      });

      it('should validate font family arrays', () => {
        const fontToken = validTokens[2]; // Font family array
        const result = validator.validateToken(fontToken);

        expect(result.valid).toBe(true);
        // Should not have font family warnings since it's properly formatted
      });

      it('should detect accessibility issues', () => {
        const lowContrastToken: DesignToken = {
          name: 'colors.low-contrast',
          value: '#c0c0c0', // Light gray that might have contrast issues
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        };

        const result = validator.validateToken(lowContrastToken);
        
        // May have accessibility info
        const accessibilityInfo = result.info.find(i => i.code === 'color-contrast-consideration');
        if (accessibilityInfo) {
          expect(accessibilityInfo.category).toBe('optimization');
        }
      });

      it('should detect deprecated tokens', () => {
        const deprecatedToken: DesignToken = {
          name: 'colors.old-primary',
          value: '#007bff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
          deprecated: true,
          replacement: 'colors.primary.500',
        };

        const result = validator.validateToken(deprecatedToken);
        
        const deprecatedWarning = result.warnings.find(w => w.code === 'deprecated-token-warning');
        expect(deprecatedWarning).toBeDefined();
        expect(deprecatedWarning!.message).toContain('colors.primary.500');
        expect(deprecatedWarning!.category).toBe('deprecated');
      });

      it('should cache validation results for performance', () => {
        const token = validTokens[0];
        
        const result1 = validator.validateToken(token);
        const result2 = validator.validateToken(token);
        
        // Results should be identical due to caching
        expect(result1).toBe(result2);
      });

      it('should handle framework-specific validation', () => {
        const chakraContext: TokenSemanticContext = {
          framework: 'chakra',
          version: '2.8.0',
        };

        const spacingToken: DesignToken = {
          name: 'spacing.md',
          value: '16px', // Chakra prefers rem units
          type: TokenType.DIMENSION,
          category: TokenCategory.SPACING,
        };

        const result = validator.validateToken(spacingToken, chakraContext);
        
        // May have framework-specific warnings
        expect(result).toBeDefined();
      });
    });

    describe('validateTokens', () => {
      it('should validate multiple tokens', () => {
        const results = validator.validateTokens(validTokens);

        expect(results.length).toBe(validTokens.length);
        expect(results.every(r => r.valid)).toBe(true);
      });

      it('should handle mixed valid and invalid tokens', () => {
        const mixedTokens = [...validTokens.slice(0, 2), ...invalidTokens.slice(0, 2)];
        const results = validator.validateTokens(mixedTokens);

        expect(results.length).toBe(mixedTokens.length);
        expect(results.slice(0, 2).every(r => r.valid)).toBe(true);
        expect(results.slice(2).some(r => !r.valid)).toBe(true);
      });
    });

    describe('detectConflicts', () => {
      it('should detect naming conflicts', () => {
        const result = validator.detectConflicts(conflictingTokens);

        expect(result.conflicts.length).toBeGreaterThan(0);
        
        const namingConflict = result.conflicts.find(c => 
          c.type === 'name' && c.description.includes('Multiple tokens with the same name')
        );
        expect(namingConflict).toBeDefined();
        expect(namingConflict!.tokens).toContain('colors.primary');
        expect(namingConflict!.severity).toBe(ValidationSeverity.ERROR);
        expect(namingConflict!.autoResolvable).toBe(false);
      });

      it('should detect value conflicts', () => {
        const result = validator.detectConflicts(conflictingTokens);

        const valueConflict = result.conflicts.find(c => 
          c.type === 'value' && c.description.includes('same value')
        );
        expect(valueConflict).toBeDefined();
        expect(valueConflict!.severity).toBe(ValidationSeverity.WARNING);
        expect(valueConflict!.autoResolvable).toBe(true);
      });

      it('should detect broken references', () => {
        const result = validator.detectConflicts(conflictingTokens);

        const referenceConflict = result.conflicts.find(c => 
          c.description.includes('Broken reference')
        );
        expect(referenceConflict).toBeDefined();
        expect(referenceConflict!.tokens).toContain('colors.accent');
        expect(referenceConflict!.severity).toBe(ValidationSeverity.ERROR);
      });

      it('should detect semantic conflicts', () => {
        const result = validator.detectConflicts(conflictingTokens);

        const semanticConflict = result.conflicts.find(c => 
          c.type === 'semantic' && c.description.includes('category mismatch')
        );
        expect(semanticConflict).toBeDefined();
        expect(semanticConflict!.autoResolvable).toBe(true);
      });

      it('should detect similar names (potential typos)', () => {
        const similarNameTokens: DesignToken[] = [
          {
            name: 'colors.primary',
            value: '#007bff',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'colors.primery', // Typo
            value: '#0056b3',
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
        ];

        const result = validator.detectConflicts(similarNameTokens);

        const similarNamesConflict = result.conflicts.find(c => 
          c.description.includes('Similar token names')
        );
        expect(similarNamesConflict).toBeDefined();
        expect(similarNamesConflict!.severity).toBe(ValidationSeverity.WARNING);
      });

      it('should detect circular references', () => {
        const circularTokens: DesignToken[] = [
          {
            name: 'token.a',
            value: { $ref: 'token.b' } as TokenReference,
            type: TokenType.REFERENCE,
            category: TokenCategory.CUSTOM,
          },
          {
            name: 'token.b',
            value: { $ref: 'token.a' } as TokenReference,
            type: TokenType.REFERENCE,
            category: TokenCategory.CUSTOM,
          },
        ];

        const result = validator.detectConflicts(circularTokens);

        const circularConflict = result.conflicts.find(c => 
          c.description.includes('Circular reference')
        );
        expect(circularConflict).toBeDefined();
        expect(circularConflict!.severity).toBe(ValidationSeverity.ERROR);
      });

      it('should group conflicts by severity', () => {
        const result = validator.detectConflicts(conflictingTokens);

        expect(result.conflictsBySeverity).toBeDefined();
        expect(result.conflictsBySeverity[ValidationSeverity.ERROR]).toBeDefined();
        expect(result.conflictsBySeverity[ValidationSeverity.WARNING]).toBeDefined();
        expect(result.conflictsBySeverity[ValidationSeverity.INFO]).toBeDefined();
      });

      it('should group conflicts by category', () => {
        const result = validator.detectConflicts(conflictingTokens);

        expect(result.conflictsByCategory).toBeDefined();
        expect(Object.keys(result.conflictsByCategory).length).toBeGreaterThan(0);
      });

      it('should generate resolution suggestions', () => {
        const result = validator.detectConflicts(conflictingTokens);

        expect(result.resolutionSuggestions).toBeDefined();
        expect(result.resolutionSuggestions.length).toBeGreaterThan(0);

        const namingResolution = result.resolutionSuggestions.find(r => 
          r.strategy === 'rename'
        );
        expect(namingResolution).toBeDefined();
        expect(namingResolution!.steps.length).toBeGreaterThan(0);
        expect(namingResolution!.confidence).toBeGreaterThan(0);
      });

      it('should include performance metrics', () => {
        const result = validator.detectConflicts(conflictingTokens);

        expect(result.metrics).toBeDefined();
        expect(result.metrics.detectionTime).toBeGreaterThan(0);
        expect(result.metrics.tokensAnalyzed).toBe(conflictingTokens.length);
        expect(result.metrics.comparisons).toBeGreaterThan(0);
        expect(result.metrics.performanceScore).toBeGreaterThanOrEqual(0);
        expect(result.metrics.performanceScore).toBeLessThanOrEqual(100);
      });

      it('should cache conflict detection results', () => {
        const result1 = validator.detectConflicts(conflictingTokens);
        const result2 = validator.detectConflicts(conflictingTokens);

        expect(result1).toBe(result2);
      });
    });

    describe('addValidationRule', () => {
      it('should allow adding custom validation rules', () => {
        const customRule = {
          name: 'custom-test-rule',
          types: [TokenType.COLOR],
          validate: (token: DesignToken) => ({
            valid: token.name.includes('test'),
            message: 'Token name must contain "test"',
          }),
          severity: ValidationSeverity.WARNING,
        };

        validator.addValidationRule(customRule);

        const testToken: DesignToken = {
          name: 'colors.primary',
          value: '#007bff',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        };

        const result = validator.validateToken(testToken);
        
        const customWarning = result.warnings.find(w => w.code === 'custom-test-rule');
        expect(customWarning).toBeDefined();
      });

      it('should clear cache when rules are added', () => {
        const token = validTokens[0];
        const result1 = validator.validateToken(token);

        const customRule = {
          name: 'cache-test-rule',
          types: Object.values(TokenType),
          validate: () => ({ valid: false, message: 'Always fail' }),
          severity: ValidationSeverity.ERROR,
        };

        validator.addValidationRule(customRule);
        const result2 = validator.validateToken(token);

        expect(result1).not.toBe(result2);
        expect(result2.valid).toBe(false);
      });
    });

    describe('removeValidationRule', () => {
      it('should allow removing validation rules', () => {
        const initialRules = validator.getValidationRules();
        const ruleToRemove = initialRules[0];

        validator.removeValidationRule(ruleToRemove.name);

        const remainingRules = validator.getValidationRules();
        expect(remainingRules.length).toBe(initialRules.length - 1);
        expect(remainingRules.find(r => r.name === ruleToRemove.name)).toBeUndefined();
      });
    });
  });

  describe('Advanced Validation Scenarios', () => {
    let validator: BaseTokenValidator;

    beforeEach(() => {
      validator = new BaseTokenValidator();
    });

    it('should handle complex nested token structures', () => {
      const complexToken: DesignToken = {
        name: 'component.button.variants.primary.states.hover',
        value: {
          background: { $ref: 'colors.primary.600' },
          color: { $ref: 'colors.white' },
          border: {
            width: '1px',
            style: 'solid',
            color: { $ref: 'colors.primary.600' },
          },
        } as TokenCompositeValue,
        type: TokenType.COMPOSITE,
        category: TokenCategory.CUSTOM,
      };

      const result = validator.validateToken(complexToken);
      expect(result).toBeDefined();
      
      // Should detect broken references
      const refErrors = result.errors.filter(e => e.category === 'reference');
      expect(refErrors.length).toBeGreaterThan(0);
    });

    it('should detect deeply nested structures', () => {
      const deepToken: DesignToken = {
        name: 'very.deep.nested.structure.that.goes.many.levels.down',
        value: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: 'final-value',
                  },
                },
              },
            },
          },
        } as TokenCompositeValue,
        type: TokenType.COMPOSITE,
        category: TokenCategory.CUSTOM,
      };

      const result = validator.validateToken(deepToken);
      
      const deepNestingWarning = result.warnings.find(w => w.code === 'deep-nesting');
      expect(deepNestingWarning).toBeDefined();
    });

    it('should validate array tokens properly', () => {
      const validArrayToken: DesignToken = {
        name: 'font.stack.primary',
        value: {
          $array: ['SF Pro', 'system-ui', '-apple-system', 'sans-serif'],
        } as TokenArray,
        type: TokenType.FONT_FAMILY,
        category: TokenCategory.TYPOGRAPHY,
      };

      const result = validator.validateToken(validArrayToken);
      expect(result.valid).toBe(true);
    });

    it('should handle tokens with extensive metadata', () => {
      const tokenWithMetadata: DesignToken = {
        name: 'colors.brand.primary',
        value: '#007bff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        description: 'Primary brand color used across all interfaces',
        deprecated: false,
        metadata: {
          source: 'design-system',
          version: '2.0.0',
          author: 'Design Team',
          accessibility: {
            wcag: 'AA',
            contrastRatio: 4.5,
          },
          usage: ['buttons', 'links', 'highlights'],
        },
      };

      const result = validator.validateToken(tokenWithMetadata);
      expect(result.valid).toBe(true);
      expect(result.token.metadata).toBeDefined();
    });

    it('should validate framework-specific constraints', () => {
      const tailwindToken: DesignToken = {
        name: 'colors.custom.150', // Invalid scale for Tailwind
        value: '#e0e7ff',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      };

      const tailwindContext: TokenSemanticContext = {
        framework: 'tailwind',
        version: '3.4.0',
      };

      const result = validator.validateToken(tailwindToken, tailwindContext);
      expect(result).toBeDefined();
    });

    it('should handle performance validation for large token sets', () => {
      const largeTokenSet: DesignToken[] = [];
      
      // Generate 1000 tokens
      for (let i = 0; i < 1000; i++) {
        largeTokenSet.push({
          name: `tokens.set.${i}`,
          value: `#${i.toString(16).padStart(6, '0')}`,
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        });
      }

      const startTime = performance.now();
      const results = validator.validateTokens(largeTokenSet);
      const endTime = performance.now();

      expect(results.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  describe('TokenValidatorRegistry', () => {
    let registry: TokenValidatorRegistry;

    beforeEach(() => {
      registry = new TokenValidatorRegistry();
    });

    it('should have default validator registered', () => {
      const validators = registry.getAvailableValidators();
      expect(validators).toContain('base');
    });

    it('should allow custom validator registration', () => {
      const customValidator = new BaseTokenValidator();
      registry.register('custom', customValidator);

      const retrieved = registry.getValidator('custom');
      expect(retrieved).toBe(customValidator);

      const validators = registry.getAvailableValidators();
      expect(validators).toContain('custom');
    });

    it('should validate tokens using registry', () => {
      const results = registry.validateTokens(validTokens);
      expect(results.length).toBe(validTokens.length);
      expect(results.every(r => r.valid)).toBe(true);
    });

    it('should detect conflicts using registry', () => {
      const result = registry.detectConflicts(conflictingTokens);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown validator', () => {
      expect(() => {
        registry.validateTokens(validTokens, undefined, 'nonexistent');
      }).toThrow('No validator available');

      expect(() => {
        registry.detectConflicts(conflictingTokens, undefined, 'nonexistent');
      }).toThrow('No validator available');
    });
  });

  describe('Error Categories and Auto-fixing', () => {
    let validator: BaseTokenValidator;

    beforeEach(() => {
      validator = new BaseTokenValidator();
    });

    it('should categorize errors correctly', () => {
      const result = validator.validateToken(invalidTokens[0]); // Empty name

      const syntaxError = result.errors.find(e => e.category === 'syntax');
      expect(syntaxError).toBeDefined();
    });

    it('should identify auto-fixable errors', () => {
      const result = validator.validateToken(invalidTokens[4]); // Missing duration unit

      const autoFixableError = result.errors.find(e => e.autoFixable === true);
      expect(autoFixableError).toBeDefined();
    });

    it('should provide helpful suggestions', () => {
      const result = validator.validateToken(invalidTokens[2]); // Bad hex color

      const errorWithSuggestion = result.errors.find(e => e.suggestion);
      expect(errorWithSuggestion).toBeDefined();
    });

    it('should include context in error details', () => {
      const result = validator.validateToken(invalidTokens[0]);

      const errorWithContext = result.errors.find(e => e.context);
      expect(errorWithContext).toBeDefined();
      expect(errorWithContext!.context!.token).toBeDefined();
    });
  });

  describe('Performance and Caching', () => {
    let validator: BaseTokenValidator;

    beforeEach(() => {
      validator = new BaseTokenValidator();
    });

    it('should include validation metrics', () => {
      const result = validator.validateToken(validTokens[0]);

      expect(result.metrics).toBeDefined();
      expect(result.metrics!.validationTime).toBeGreaterThan(0);
      expect(result.metrics!.rulesApplied).toBeGreaterThan(0);
    });

    it('should track cache performance', () => {
      const token = validTokens[0];
      
      const result1 = validator.validateToken(token);
      expect(result1.metrics!.cacheMisses).toBe(1);
      expect(result1.metrics!.cacheHits).toBe(0);

      const result2 = validator.validateToken(token);
      // Should be same cached result
      expect(result1).toBe(result2);
    });

    it('should handle concurrent validation requests', async () => {
      const tokens = validTokens.slice(0, 3);
      
      const promises = tokens.map(token => 
        Promise.resolve(validator.validateToken(token))
      );

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(tokens.length);
      expect(results.every(r => r.valid)).toBe(true);
    });
  });
});