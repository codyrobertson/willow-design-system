import { describe, it, expect, beforeEach } from 'vitest';
import { PropNameTransformer } from '../prop-name-transformer';
import type { PropertyMapping } from '../../schemas/component-mapping.schema';

describe('PropNameTransformer', () => {
  let transformer: PropNameTransformer;

  beforeEach(() => {
    transformer = new PropNameTransformer();
  });

  describe('transform', () => {
    it('should transform property name based on mapping', () => {
      const mapping: PropertyMapping = {
        source: 'color',
        target: 'variant',
      };
      
      const result = transformer.transform('color', mapping);
      expect(result).toBe('variant');
    });

    it('should apply default transformations without mapping', () => {
      expect(transformer.transform('className')).toBe('class');
      expect(transformer.transform('onClick')).toBe('onPress');
      expect(transformer.transform('htmlFor')).toBe('for');
    });

    it('should cache transformation results', () => {
      const mapping: PropertyMapping = {
        source: 'size',
        target: 'dimensions',
      };
      
      // First call
      transformer.transform('size', mapping);
      
      // Check cache
      const stats = transformer.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain('size:dimensions');
    });
  });

  describe('camelToKebab', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(transformer.camelToKebab('backgroundColor')).toBe('background-color');
      expect(transformer.camelToKebab('marginTop')).toBe('margin-top');
      expect(transformer.camelToKebab('zIndex')).toBe('z-index');
    });

    it('should handle single word', () => {
      expect(transformer.camelToKebab('color')).toBe('color');
    });

    it('should handle PascalCase', () => {
      expect(transformer.camelToKebab('PrimaryButton')).toBe('primary-button');
    });
  });

  describe('kebabToCamel', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(transformer.kebabToCamel('background-color')).toBe('backgroundColor');
      expect(transformer.kebabToCamel('margin-top')).toBe('marginTop');
      expect(transformer.kebabToCamel('z-index')).toBe('zIndex');
    });

    it('should handle single word', () => {
      expect(transformer.kebabToCamel('color')).toBe('color');
    });
  });

  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(transformer.snakeToCamel('background_color')).toBe('backgroundColor');
      expect(transformer.snakeToCamel('margin_top')).toBe('marginTop');
      expect(transformer.snakeToCamel('is_active')).toBe('isActive');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(transformer.camelToSnake('backgroundColor')).toBe('background_color');
      expect(transformer.camelToSnake('marginTop')).toBe('margin_top');
      expect(transformer.camelToSnake('isActive')).toBe('is_active');
    });
  });

  describe('addPrefix', () => {
    it('should add prefix to camelCase', () => {
      expect(transformer.addPrefix('button', 'primary')).toBe('primaryButton');
      expect(transformer.addPrefix('Component', 'Base')).toBe('BaseComponent');
    });

    it('should add prefix to kebab-case', () => {
      expect(transformer.addPrefix('button-text', 'primary')).toBe('primary-button-text');
    });

    it('should add prefix to snake_case', () => {
      expect(transformer.addPrefix('button_text', 'primary')).toBe('primary_button_text');
    });
  });

  describe('addSuffix', () => {
    it('should add suffix to camelCase', () => {
      expect(transformer.addSuffix('button', 'Primary')).toBe('buttonPrimary');
      expect(transformer.addSuffix('icon', 'Small')).toBe('iconSmall');
    });

    it('should add suffix to kebab-case', () => {
      expect(transformer.addSuffix('button-text', 'primary')).toBe('button-text-primary');
    });

    it('should add suffix to snake_case', () => {
      expect(transformer.addSuffix('button_text', 'primary')).toBe('button_text_primary');
    });
  });

  describe('removePrefix', () => {
    it('should remove prefix from camelCase', () => {
      expect(transformer.removePrefix('primaryButton', 'primary')).toBe('button');
      expect(transformer.removePrefix('BaseComponent', 'Base')).toBe('component');
    });

    it('should remove prefix from kebab-case', () => {
      expect(transformer.removePrefix('primary-button-text', 'primary')).toBe('button-text');
    });

    it('should remove prefix from snake_case', () => {
      expect(transformer.removePrefix('primary_button_text', 'primary')).toBe('button_text');
    });

    it('should return original if prefix not found', () => {
      expect(transformer.removePrefix('button', 'primary')).toBe('button');
    });
  });

  describe('removeSuffix', () => {
    it('should remove suffix from camelCase', () => {
      expect(transformer.removeSuffix('buttonPrimary', 'Primary')).toBe('button');
      expect(transformer.removeSuffix('iconSmall', 'Small')).toBe('icon');
    });

    it('should remove suffix from kebab-case', () => {
      expect(transformer.removeSuffix('button-text-primary', 'primary')).toBe('button-text');
    });

    it('should remove suffix from snake_case', () => {
      expect(transformer.removeSuffix('button_text_primary', 'primary')).toBe('button_text');
    });

    it('should return original if suffix not found', () => {
      expect(transformer.removeSuffix('button', 'primary')).toBe('button');
    });
  });

  describe('applyCustomTransform', () => {
    it('should apply custom transformation function', () => {
      const customFn = (name: string) => name.toUpperCase();
      expect(transformer.applyCustomTransform('button', customFn)).toBe('BUTTON');
    });

    it('should handle errors in custom function', () => {
      const errorFn = () => {
        throw new Error('Transform failed');
      };
      expect(transformer.applyCustomTransform('button', errorFn)).toBe('button');
    });
  });

  describe('transformNestedPath', () => {
    it('should transform nested property paths', () => {
      const mapping: PropertyMapping = {
        source: 'style',
        target: 'sx',
      };
      
      expect(transformer.transformNestedPath('style.color', mapping)).toBe('sx.color');
      expect(transformer.transformNestedPath('style.margin.top', mapping)).toBe('sx.margin.top');
    });

    it('should handle single-level paths', () => {
      const mapping: PropertyMapping = {
        source: 'className',
        target: 'class',
      };
      
      expect(transformer.transformNestedPath('className', mapping)).toBe('class');
    });

    it('should transform without mapping', () => {
      expect(transformer.transformNestedPath('data.value')).toBe('data.value');
    });
  });

  describe('transformSpreadProp', () => {
    it('should handle spread operator properties', () => {
      expect(transformer.transformSpreadProp('...rest')).toBe('...rest');
      expect(transformer.transformSpreadProp('...otherProps')).toBe('...otherProps');
    });

    it('should transform spread properties with defaults', () => {
      expect(transformer.transformSpreadProp('...className')).toBe('...class');
    });

    it('should handle non-spread properties', () => {
      expect(transformer.transformSpreadProp('normalProp')).toBe('normalProp');
    });
  });

  describe('transformBatch', () => {
    it('should transform multiple properties', () => {
      const mappings: Record<string, PropertyMapping> = {
        color: {
          source: 'color',
          target: 'variant',
        },
        size: {
          source: 'size',
          target: 'dimensions',
        },
      };
      
      const result = transformer.transformBatch(['color', 'size', 'className'], mappings);
      
      expect(result).toEqual({
        color: 'variant',
        size: 'dimensions',
        className: 'class',
      });
    });

    it('should handle empty batch', () => {
      const result = transformer.transformBatch([]);
      expect(result).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in prop names', () => {
      expect(transformer.transform('data-testid')).toBe('data-testid');
      expect(transformer.transform('aria-label')).toBe('aria-label');
    });

    it('should handle numeric characters', () => {
      expect(transformer.camelToKebab('margin2x')).toBe('margin2x');
      expect(transformer.camelToKebab('h1Style')).toBe('h1-style');
    });

    it('should handle empty strings', () => {
      expect(transformer.transform('')).toBe('');
      expect(transformer.camelToKebab('')).toBe('');
    });

    it('should handle very long property names', () => {
      const longName = 'thisIsAVeryLongPropertyNameThatShouldStillWork';
      const expected = 'this-is-a-very-long-property-name-that-should-still-work';
      expect(transformer.camelToKebab(longName)).toBe(expected);
    });
  });

  describe('performance', () => {
    it('should handle bulk transformations efficiently', () => {
      const propNames = Array.from({ length: 1000 }, (_, i) => `prop${i}`);
      const start = performance.now();
      
      transformer.transformBatch(propNames);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should benefit from caching', () => {
      const mapping: PropertyMapping = {
        source: 'test',
        target: 'result',
      };
      
      // Warm up cache
      transformer.transform('test', mapping);
      
      // Measure cached performance
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        transformer.transform('test', mapping);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10); // Should be very fast with cache
    });
  });

  describe('clearCache', () => {
    it('should clear transformation cache', () => {
      transformer.transform('test');
      expect(transformer.getCacheStats().size).toBe(1);
      
      transformer.clearCache();
      expect(transformer.getCacheStats().size).toBe(0);
    });
  });
});