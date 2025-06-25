import { describe, it, expect, beforeEach } from 'vitest';
import { 
  BaseStyleValidator, 
  createStyleValidator,
  CSS_PROPERTIES,
  CSS_UNITS,
  COLOR_PATTERNS,
} from '../src/styles/validation/style-validator';
import { 
  BaseStyleOptimizer,
  createStyleOptimizer,
} from '../src/styles/optimization/style-optimizer';
import { 
  StyleType,
  ValidationSeverity,
  OptimizationLevel,
} from '../src/types/style-transformation.types';

describe('Style Validation', () => {
  let validator: BaseStyleValidator;

  beforeEach(() => {
    validator = new BaseStyleValidator();
  });

  describe('Property Validation', () => {
    it('should validate known CSS properties', () => {
      const styles = {
        display: 'flex',
        color: 'red',
        backgroundColor: '#fff',
        'margin-top': '10px',
      };

      const result = validator.validate(styles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unknown CSS properties', () => {
      const styles = {
        display: 'flex',
        invalidProperty: 'value',
        anotherBadProp: 'test',
      };

      const result = validator.validate(styles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toContain('Unknown CSS property');
    });

    it('should allow custom properties', () => {
      const styles = {
        '--custom-color': '#007bff',
        '--spacing-unit': '8px',
        color: 'var(--custom-color)',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow data and aria attributes', () => {
      const styles = {
        'data-testid': 'button',
        'aria-label': 'Submit',
        color: 'blue',
      };

      const result = validator.validate(styles, {
        framework: 'react',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Value Validation', () => {
    it('should detect invalid display values', () => {
      const styles = {
        display: 'invalid-display',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.some(w => w.message.includes('Invalid display value'))).toBe(true);
    });

    it('should detect null or undefined values', () => {
      const styles = {
        color: undefined,
        backgroundColor: null,
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings).toHaveLength(2);
    });
  });

  describe('Color Validation', () => {
    it('should validate hex colors', () => {
      const styles = {
        color: '#fff',
        borderColor: '#12345678', // 8-digit with alpha
        outlineColor: '#007bff',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings).toHaveLength(0);
    });

    it('should validate rgb/rgba colors', () => {
      const styles = {
        borderColor: 'rgb(255, 0, 0)',
        outlineColor: 'rgba(0, 0, 0, 0.5)',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings).toHaveLength(0);
    });

    it('should validate named colors', () => {
      const styles = {
        borderColor: 'red',
        outlineColor: 'transparent',
        textDecorationColor: 'currentColor',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings).toHaveLength(0);
    });

    it('should detect invalid color values', () => {
      const styles = {
        color: 'not-a-color',
        backgroundColor: '#gggggg',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.filter(w => w.message.includes('Invalid color'))).toHaveLength(2);
    });
  });

  describe('Unit Validation', () => {
    it('should validate CSS units', () => {
      const styles = {
        width: '100px',
        height: '50%',
        margin: '1rem',
        padding: '2em',
        fontSize: '16px',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings).toHaveLength(0);
    });

    it('should allow unitless zero', () => {
      const styles = {
        margin: '0',
        padding: '0',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing units', () => {
      const styles = {
        width: '100',
        height: '50',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.filter(w => w.message.includes('Missing or invalid unit'))).toHaveLength(2);
    });
  });

  describe('Best Practices', () => {
    it('should warn about !important usage', () => {
      const styles = {
        color: 'red !important',
        display: 'flex !important',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.filter(w => w.message.includes('!important'))).toHaveLength(2);
    });

    it('should detect magic numbers', () => {
      const styles = {
        width: '137px',
        height: '89px',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.filter(w => w.message.includes('Magic number'))).toHaveLength(2);
    });

    it('should warn about high z-index', () => {
      const styles = {
        zIndex: 9999,
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.some(w => w.message.includes('High z-index'))).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should warn about outline removal without alternative', () => {
      const styles = {
        outline: 'none',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.some(w => w.message.includes('focus indicator'))).toBe(true);
    });

    it('should allow outline removal with box-shadow alternative', () => {
      const styles = {
        outline: 'none',
        boxShadow: '0 0 0 2px blue',
      };

      const result = validator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.warnings.filter(w => w.message.includes('focus indicator'))).toHaveLength(0);
    });
  });

  describe('Custom Validators', () => {
    it('should allow custom validation rules', () => {
      const customValidator = createStyleValidator({
        rules: [{
          name: 'no-red',
          description: 'Disallow red color',
          severity: ValidationSeverity.ERROR,
          validate: (styles) => {
            const violations = [];
            if (styles.color === 'red') {
              violations.push({
                rule: 'no-red',
                message: 'Red color is not allowed',
                severity: ValidationSeverity.ERROR,
              });
            }
            return { violations, severity: ValidationSeverity.ERROR };
          },
        }],
      });

      const styles = { color: 'red' };
      const result = customValidator.validate(styles, {
        framework: 'css',
        styleType: StyleType.CSS_IN_JS,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Red color is not allowed'))).toBe(true);
    });
  });
});

describe('Style Optimization', () => {
  let optimizer: BaseStyleOptimizer;

  beforeEach(() => {
    optimizer = new BaseStyleOptimizer();
  });

  describe('Basic Optimizations', () => {
    it('should remove duplicate properties', () => {
      const styles = {
        '.button': {
          color: 'red',
          backgroundColor: 'blue',
          color: 'green', // duplicate
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.BASIC,
      });

      expect(result.optimized['.button'].color).toBe('green');
      expect(Object.keys(result.optimized['.button'])).toHaveLength(2);
    });

    it('should sort properties', () => {
      const styles = {
        '.button': {
          color: 'red',
          position: 'absolute',
          display: 'flex',
          margin: '10px',
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.BASIC,
      });

      const props = Object.keys(result.optimized['.button']);
      expect(props.indexOf('position')).toBeLessThan(props.indexOf('display'));
      expect(props.indexOf('display')).toBeLessThan(props.indexOf('margin'));
    });
  });

  describe('Standard Optimizations', () => {
    it('should convert to shorthand properties', () => {
      const styles = {
        '.box': {
          'margin-top': '10px',
          'margin-right': '10px',
          'margin-bottom': '10px',
          'margin-left': '10px',
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.STANDARD,
      });

      expect(result.optimized['.box'].margin).toBe('10px');
      expect(result.optimized['.box']['margin-top']).toBeUndefined();
    });

    it('should optimize colors', () => {
      const styles = {
        '.text': {
          color: '#ffffff',
          backgroundColor: '#000000',
          borderColor: 'rgb(255, 0, 0)',
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.STANDARD,
      });

      expect(result.optimized['.text'].color).toBe('#fff');
      expect(result.optimized['.text'].backgroundColor).toBe('#000');
    });

    it('should optimize units', () => {
      const styles = {
        '.box': {
          margin: '0px',
          padding: '0.5rem',
          width: '100.0px',
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.STANDARD,
      });

      expect(result.optimized['.box'].margin).toBe('0');
      expect(result.optimized['.box'].width).toBe('100px');
    });
  });

  describe('Aggressive Optimizations', () => {
    it('should remove default values', () => {
      const styles = {
        '.element': {
          display: 'inline',
          position: 'static',
          float: 'none',
          color: 'red',
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.AGGRESSIVE,
      });

      expect(result.optimized['.element'].display).toBeUndefined();
      expect(result.optimized['.element'].position).toBeUndefined();
      expect(result.optimized['.element'].float).toBeUndefined();
      expect(result.optimized['.element'].color).toBe('red');
    });

    it('should merge media queries', () => {
      const styles = {
        '@media (min-width: 768px)': {
          '.box': { width: '100%' },
        },
        '.text': { color: 'red' },
        '@media (min-width: 768px)': {
          '.text': { fontSize: '18px' },
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.AGGRESSIVE,
      });

      const mediaQuery = result.optimized['@media (min-width: 768px)'];
      expect(mediaQuery).toBeDefined();
    });
  });

  describe('Optimization Metrics', () => {
    it('should calculate size savings', () => {
      const styles = {
        '.verbose': {
          'margin-top': '10px',
          'margin-right': '10px',
          'margin-bottom': '10px',
          'margin-left': '10px',
          'color': '#ffffff',
        },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.STANDARD,
      });

      expect(result.savings.originalSize).toBeGreaterThan(result.savings.optimizedSize);
      expect(result.savings.reduction).toBeGreaterThan(0);
      expect(result.savings.percentage).toBeGreaterThan(0);
    });

    it('should track processing time', () => {
      const styles = {
        '.test': { color: 'red' },
      };

      const result = optimizer.optimize(styles, {
        level: OptimizationLevel.STANDARD,
      });

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Custom Optimizers', () => {
    it('should allow custom optimization strategies', () => {
      const customOptimizer = createStyleOptimizer({
        level: OptimizationLevel.STANDARD,
        strategies: [{
          name: 'remove-red',
          description: 'Remove red colors',
          level: OptimizationLevel.STANDARD,
          optimize: (styles) => {
            const optimized = { ...styles };
            for (const selector in optimized) {
              if (optimized[selector].color === 'red') {
                delete optimized[selector].color;
              }
            }
            return optimized;
          },
        }],
      });

      const styles = {
        '.text': { color: 'red', fontSize: '16px' },
      };

      const result = customOptimizer.optimize(styles, {
        level: OptimizationLevel.STANDARD,
      });

      expect(result.optimized['.text'].color).toBeUndefined();
      expect(result.optimized['.text'].fontSize).toBe('16px');
    });
  });
});