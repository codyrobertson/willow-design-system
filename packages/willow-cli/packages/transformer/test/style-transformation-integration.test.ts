import { describe, it, expect } from 'vitest';
import { BaseStyleValidator } from '../src/styles/validation/style-validator';
import { BaseStyleOptimizer } from '../src/styles/optimization/style-optimizer';
import { CSSInJSTransformer } from '../src/styles/css-in-js/css-in-js-transformer';
import { ThemeTokenMigrationEngine } from '../src/styles/theme/theme-token-migration-engine';
import { PropertyRenamer } from '../src/styles/property-renaming/property-renamer';
import { StyleType } from '../src/types/style-transformation.types';

describe('Style Transformation Integration Tests', () => {
  describe('End-to-End Style Pipeline', () => {
    it('should validate, transform, and optimize styles', () => {
      // For CSS-in-JS validation, we validate individual style objects, not class names
      const containerStyles = {
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      };
      
      const headerStyles = {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '16px',
      };

      // Step 1: Validate container styles
      const validator = new BaseStyleValidator();
      const containerValidation = validator.validate(containerStyles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });
      
      expect(containerValidation.valid).toBe(true);
      expect(containerValidation.errors).toHaveLength(0);
      
      // Validate header styles
      const headerValidation = validator.validate(headerStyles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });
      
      expect(headerValidation.valid).toBe(true);
      expect(headerValidation.errors).toHaveLength(0);
      
      // Step 2: Transform with CSS-in-JS transformer
      const transformer = new CSSInJSTransformer();
      const inputStyles = { container: containerStyles, header: headerStyles };
      const transformed = transformer.transform(inputStyles);
      expect(transformed).toBeDefined();
      
      // Step 3: Optimize styles
      const optimizer = new BaseStyleOptimizer();
      const optimizationResult = optimizer.optimize(transformed, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
        level: 'standard',
      });
      
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.optimized).toBeDefined();
      expect(optimizationResult.optimized.container).toBeDefined();
      expect(optimizationResult.optimized.header).toBeDefined();
    });

    it('should handle complex nested styles', () => {
      const complexStyles = {
        root: {
          color: 'blue',
          '&:hover': {
            color: 'red',
          },
          '@media (min-width: 768px)': {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
          },
        },
      };

      const transformer = new CSSInJSTransformer();
      const result = transformer.transform(complexStyles);
      
      expect(result).toBeDefined();
      expect(result.root).toBeDefined();
      expect(result.root['&:hover']).toBeDefined();
      expect(result.root['@media (min-width: 768px)']).toBeDefined();
    });
  });

  describe('Theme Token Migration', () => {
    it('should migrate theme tokens with proper mapping', () => {
      const oldTheme = {
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
        },
        spacing: {
          sm: '8px',
          md: '16px',
          lg: '24px',
        },
      };

      const config = {
        colorMapping: {
          primary: 'brand.primary',
          secondary: 'brand.secondary',
        },
        spacingScale: 4,
      };

      const migrationEngine = new ThemeTokenMigrationEngine();
      const newTheme = migrationEngine.migrate(oldTheme, config);
      
      expect(newTheme).toBeDefined();
      expect(newTheme.colors).toBeDefined();
      expect(newTheme.colors.brand).toBeDefined();
      expect(newTheme.colors.brand.primary).toBe('#007bff');
      expect(newTheme.space).toBeDefined();
      expect(newTheme.space.space.sm).toBe('2rem'); // 8px / 4 = 2rem
    });
  });

  describe('Property Renaming', () => {
    it('should rename vendor-prefixed properties', () => {
      const renamer = new PropertyRenamer();
      
      const styles = {
        container: {
          webkitTransform: 'translateX(10px)',
          mozBorderRadius: '4px',
          display: 'flex',
        },
      };

      const renamed = renamer.rename(styles, { 
        propertyMappings: {
          webkitTransform: 'transform',
          mozBorderRadius: 'borderRadius',
        }
      });
      
      expect(renamed.container.transform).toBe('translateX(10px)');
      expect(renamed.container.borderRadius).toBe('4px');
      expect(renamed.container.display).toBe('flex');
      expect(renamed.container.webkitTransform).toBeUndefined();
    });
  });

  describe('Complete Workflow', () => {
    it('should handle vendor prefix removal, validation, and optimization', () => {
      const inputStyles = {
        button: {
          webkitAppearance: 'none',
          mozAppearance: 'none',
          appearance: 'none',
          webkitTransform: 'scale(1)',
          transform: 'scale(1)',
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        },
      };

      // Step 1: Remove vendor prefixes
      const renamer = new PropertyRenamer();
      const renamed = renamer.rename(inputStyles, {
        propertyMappings: {
          webkitAppearance: 'appearance',
          mozAppearance: 'appearance',
          webkitTransform: 'transform',
        },
      });

      // Step 2: Validate the button styles
      const validator = new BaseStyleValidator();
      const validation = validator.validate(renamed.button, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(validation.valid).toBe(true);

      // Step 3: Optimize (should remove duplicates)
      const optimizer = new BaseStyleOptimizer();
      const optimizationResult = optimizer.optimize(renamed, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
        level: 'aggressive',
      });

      expect(optimizationResult.optimized.button.appearance).toBe('none');
      expect(optimizationResult.optimized.button.transform).toBe('scale(1)');
      expect(optimizationResult.optimized.button.webkitAppearance).toBeUndefined();
      expect(optimizationResult.optimized.button.mozAppearance).toBeUndefined();
      expect(optimizationResult.optimized.button.webkitTransform).toBeUndefined();
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle styles with warnings gracefully', () => {
      const stylesWithWarnings = {
        color: 'red !important',
        width: '137px', // Magic number
        zIndex: 9999, // High z-index
      };

      const validator = new BaseStyleValidator();
      const result = validator.validate(stylesWithWarnings, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.valid).toBe(true); // Valid but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('!important'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Magic number'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('z-index'))).toBe(true);
    });

    it('should handle invalid styles with errors', () => {
      const invalidStyles = {
        width: null,
        height: undefined,
        display: 'invalid-display-value',
        invalidProperty: 'value', // This will trigger an error
      };

      const validator = new BaseStyleValidator();
      const result = validator.validate(invalidStyles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle moderate-sized style objects efficiently', () => {
      const styles: any = {};
      for (let i = 0; i < 50; i++) {
        styles[`component${i}`] = {
          display: 'flex',
          padding: `${i}px`,
          margin: `${i * 2}px`,
          backgroundColor: `hsl(${i * 7}, 50%, 50%)`,
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        };
      }

      const startTime = Date.now();
      
      // Validate each component's styles individually
      const validator = new BaseStyleValidator();
      let allValid = true;
      
      Object.values(styles).forEach((componentStyles) => {
        const validation = validator.validate(componentStyles, {
          framework: 'react',
          styleType: StyleType.CSS_IN_JS,
        });
        if (!validation.valid) {
          allValid = false;
        }
      });
      
      // Transform
      const transformer = new CSSInJSTransformer();
      const transformed = transformer.transform(styles);
      
      // Optimize
      const optimizer = new BaseStyleOptimizer();
      const optimizationResult = optimizer.optimize(transformed, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
        level: 'standard',
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(allValid).toBe(true);
      expect(optimizationResult.optimized).toBeDefined();
      expect(duration).toBeLessThan(300); // Should complete in under 300ms
    });
  });
});