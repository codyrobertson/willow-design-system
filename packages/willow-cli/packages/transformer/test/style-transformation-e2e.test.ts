import { describe, it, expect } from 'vitest';
import {
  CSSInJSTransformer,
  TailwindClassTransformer,
  StyledComponentsParser,
  EmotionStyleParser,
  CSSModulesTransformer,
  ThemeTokenMigrationEngine,
  PropertyRenamer,
  BaseStyleValidator,
  BaseStyleOptimizer,
  StyleType,
} from '../src';

describe('Style Transformation End-to-End Tests', () => {
  describe('Style Validation and Optimization Pipeline', () => {
    it('should validate and optimize CSS-in-JS styles', () => {
      const inputStyles = {
        container: {
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        header: {
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '16px',
        },
      };

      // Step 1: Validate styles
      const validator = new BaseStyleValidator();
      const validationResult = validator.validate(inputStyles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });
      
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      
      // Step 2: Optimize styles
      const optimizer = new BaseStyleOptimizer();
      const optimizedStyles = optimizer.optimize(inputStyles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
        level: 'standard',
      });
      
      expect(optimizedStyles).toBeDefined();
      expect(optimizedStyles.container).toBeDefined();
    });

    it('should handle styles with warnings', () => {
      const stylesWithIssues = {
        problematic: {
          color: 'red !important',
          width: '137px', // Magic number
          zIndex: '9999', // High z-index
        },
      };

      const validator = new BaseStyleValidator();
      const result = validator.validate(stylesWithIssues, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.isValid).toBe(true); // Valid but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('!important'))).toBe(true);
    });
  });

  describe('Theme Token Migration', () => {
    it('should migrate theme tokens correctly', () => {
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
      expect(newTheme.colors.brand).toBeDefined();
      expect(newTheme.colors.brand.primary).toBe('#007bff');
      expect(newTheme.space).toBeDefined();
    });

    it('should handle circular references in themes', () => {
      const theme: any = {
        colors: {
          primary: '#007bff',
        },
      };
      // Create circular reference
      theme.colors.theme = theme;

      const migrationEngine = new ThemeTokenMigrationEngine();
      const config = {
        colorMapping: {
          primary: 'brand.primary',
        },
      };

      // Should not throw
      expect(() => {
        const result = migrationEngine.migrate(theme, config);
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('CSS-in-JS Transformation', () => {
    it('should handle nested selectors and media queries', () => {
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

  describe('Property Renaming', () => {
    it('should rename vendor prefixed properties', () => {
      const renamer = new PropertyRenamer();
      
      const styles = {
        container: {
          webkitTransform: 'translateX(10px)',
          mozBorderRadius: '4px',
          display: 'flex',
        },
      };

      const rules = {
        webkitTransform: 'transform',
        mozBorderRadius: 'borderRadius',
      };

      const renamed = renamer.rename(styles, { propertyMappings: rules });
      
      expect(renamed.container.transform).toBe('translateX(10px)');
      expect(renamed.container.borderRadius).toBe('4px');
      expect(renamed.container.display).toBe('flex');
      expect(renamed.container.webkitTransform).toBeUndefined();
    });
  });

  describe('Complete Integration', () => {
    it('should handle a complete transformation workflow', () => {
      const inputStyles = {
        container: {
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          webkitBoxSizing: 'border-box',
          boxSizing: 'border-box',
        },
      };

      // Step 1: Property renaming
      const renamer = new PropertyRenamer();
      const renamed = renamer.rename(inputStyles, {
        propertyMappings: {
          webkitBoxSizing: 'boxSizing',
        },
      });

      // Step 2: Validate
      const validator = new BaseStyleValidator();
      const validation = validator.validate(renamed, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(validation.isValid).toBe(true);

      // Step 3: Optimize
      const optimizer = new BaseStyleOptimizer();
      const optimized = optimizer.optimize(renamed, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
        level: 'aggressive',
      });

      // Verify final output
      expect(optimized.container).toBeDefined();
      expect(optimized.container.boxSizing).toBe('border-box');
      expect(optimized.container.webkitBoxSizing).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should handle large style objects efficiently', () => {
      // Generate large style object
      const largeStyleObject: any = {};
      for (let i = 0; i < 100; i++) {
        largeStyleObject[`component${i}`] = {
          display: 'flex',
          padding: `${i}px`,
          margin: `${i * 2}px`,
          backgroundColor: `hsl(${i}, 50%, 50%)`,
        };
      }

      const startTime = Date.now();
      
      const validator = new BaseStyleValidator();
      validator.validate(largeStyleObject, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });
      
      const optimizer = new BaseStyleOptimizer();
      optimizer.optimize(largeStyleObject, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
        level: 'standard',
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (< 500ms for 100 components)
      expect(duration).toBeLessThan(500);
    });
  });
});