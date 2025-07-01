import { describe, it, expect, beforeEach } from 'vitest';
import { 
  PropValueConverter, 
  type ValueConverter, 
  type ConverterConfig,
  type ConversionResult 
} from '../prop-value-converter';
import type { ValueTransformation } from '../../schemas/component-mapping.schema';
import type { ComponentMappingContext } from '../../types/component-mapping.types';

describe('PropValueConverter', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    converter = new PropValueConverter();
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  describe('direct transformations', () => {
    it('should perform direct value transformations', async () => {
      const transformation: ValueTransformation = {
        type: 'direct',
        from: 'primary',
        to: 'main',
      };

      const result = await converter.convert('primary', transformation, context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('main');
      expect(result.converter).toBe('direct');
    });

    it('should return original value if direct match not found', async () => {
      const transformation: ValueTransformation = {
        type: 'direct',
        from: 'primary',
        to: 'main',
      };

      const result = await converter.convert('secondary', transformation, context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('secondary');
    });
  });

  describe('map transformations', () => {
    it('should perform map-based transformations', async () => {
      const transformation: ValueTransformation = {
        type: 'map',
        map: {
          'primary': 'main',
          'secondary': 'accent',
          'error': 'danger',
        },
      };

      const result = await converter.convert('error', transformation, context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('danger');
      expect(result.converter).toBe('map');
    });

    it('should return original value for unmapped values', async () => {
      const transformation: ValueTransformation = {
        type: 'map',
        map: {
          'primary': 'main',
        },
      };

      const result = await converter.convert('unknown', transformation, context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('unknown');
    });
  });

  describe('function transformations', () => {
    it('should apply custom function transformations', async () => {
      // Register a custom converter
      const customConverter: ValueConverter = {
        name: 'uppercase',
        convert: (value: any) => String(value).toUpperCase(),
        supports: (type: string) => type === 'string',
      };
      
      converter.registerConverter(customConverter);

      const transformation: ValueTransformation = {
        type: 'function',
        transform: 'uppercase',
      };

      const result = await converter.convert('hello', transformation, context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('HELLO');
      expect(result.converter).toBe('uppercase');
    });

    it('should handle unknown function transformations', async () => {
      const transformation: ValueTransformation = {
        type: 'function',
        transform: 'unknown-function',
      };

      const result = await converter.convert('hello', transformation, context);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Conversion failed: Unknown converter: unknown-function');
    });
  });

  describe('conditional transformations', () => {
    it('should perform conditional transformations', async () => {
      const transformation: ValueTransformation = {
        type: 'conditional',
        condition: {
          prop: 'variant',
          operator: 'equals',
          value: 'icon',
        },
        to: 'icon-size',
      };

      context.props = { variant: 'icon' };
      const result = await converter.convert('small', transformation, context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('icon-size');
      expect(result.converter).toBe('conditional');
    });
  });

  describe('error handling', () => {
    it('should handle conversion errors gracefully', async () => {
      const errorConverter: ValueConverter = {
        name: 'error-converter',
        convert: () => {
          throw new Error('Conversion failed');
        },
        supports: () => true,
      };
      
      converter.registerConverter(errorConverter);

      const transformation: ValueTransformation = {
        type: 'function',
        transform: 'error-converter',
      };

      const result = await converter.convert('test', transformation, context);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Conversion failed: Conversion failed');
    });

    it('should warn about unknown transformation types', async () => {
      const transformation = {
        type: 'unknown-type',
      } as ValueTransformation;

      const result = await converter.convert('test', transformation, context);
      
      expect(result.warnings).toContain('Unknown transformation type: unknown-type');
    });
  });
});

describe('BooleanConverter', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    const config: ConverterConfig = {
      booleanToString: {
        trueValue: 'enabled',
        falseValue: 'disabled',
      },
    };
    converter = new PropValueConverter(config);
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  describe('boolean to string conversion', () => {
    it('should convert true to custom string', async () => {
      const result = await converter.convertByType(true, 'boolean', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('enabled');
    });

    it('should convert false to custom string', async () => {
      const result = await converter.convertByType(false, 'boolean', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('disabled');
    });

    it('should convert string to boolean', async () => {
      const result = await converter.convertByType('true', 'boolean', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should handle various truthy string values', async () => {
      const truthyValues = ['true', 'TRUE', '1', 'yes', 'YES', 'on', 'ON'];
      
      for (const value of truthyValues) {
        const result = await converter.convertByType(value, 'boolean', context);
        expect(result.value).toBe(true);
      }
    });

    it('should handle various falsy string values', async () => {
      const falsyValues = ['false', 'FALSE', '0', 'no', 'NO', 'off', 'OFF'];
      
      for (const value of falsyValues) {
        const result = await converter.convertByType(value, 'boolean', context);
        expect(result.value).toBe(false);
      }
    });
  });
});

describe('UnitConverter', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    const config: ConverterConfig = {
      unitConversions: {
        baseFontSize: 16,
      },
    };
    converter = new PropValueConverter(config);
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  describe('pixel to rem conversion', () => {
    it('should convert pixels to rem', async () => {
      const result = await converter.convertByType('32px', 'px', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('2.000rem');
    });

    it('should handle decimal pixels', async () => {
      const result = await converter.convertByType('24px', 'px', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('1.500rem');
    });

    it('should handle edge case of 0px', async () => {
      const result = await converter.convertByType('0px', 'px', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('0.000rem');
    });
  });

  describe('rem to pixel conversion', () => {
    it('should convert rem to pixels', async () => {
      const result = await converter.convertByType('2rem', 'rem', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('32px');
    });

    it('should handle decimal rem values', async () => {
      const result = await converter.convertByType('1.5rem', 'rem', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('24px');
    });
  });

  describe('points to pixels conversion', () => {
    it('should convert points to pixels', async () => {
      const result = await converter.convertByType('12pt', 'pt', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('16.0px'); // 12 * 1.333
    });
  });

  describe('edge cases', () => {
    it('should handle invalid unit values', async () => {
      const result = await converter.convertByType('invalidpx', 'px', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('invalidpx'); // Should return original
    });

    it('should handle numeric values without units', async () => {
      const result = await converter.convertByType(16, 'px', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(16); // Should return original
    });
  });
});

describe('ColorConverter', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    const config: ConverterConfig = {
      colorFormats: {
        preferredFormat: 'hex',
        allowAlpha: true,
      },
    };
    converter = new PropValueConverter(config);
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  describe('hex color conversion', () => {
    it('should parse and maintain hex colors', async () => {
      const result = await converter.convertByType('#ff0000', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('#ff0000');
    });

    it('should handle hex colors with alpha', async () => {
      const result = await converter.convertByType('#ff000080', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('#ff000080');
    });
  });

  describe('rgb to hex conversion', () => {
    it('should convert rgb to hex', async () => {
      const result = await converter.convertByType('rgb(255, 0, 0)', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('#ff0000');
    });

    it('should convert rgba to hex with alpha', async () => {
      const result = await converter.convertByType('rgba(255, 0, 0, 0.5)', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('#ff000080'); // 0.5 * 255 = 127.5 ≈ 128 = 0x80
    });
  });

  describe('hsl to hex conversion', () => {
    it('should convert hsl to hex', async () => {
      const result = await converter.convertByType('hsl(0, 100%, 50%)', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('#ff0000');
    });

    it('should convert hsla to hex with alpha', async () => {
      const result = await converter.convertByType('hsla(0, 100%, 50%, 0.5)', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('#ff000080');
    });
  });

  describe('different output formats', () => {
    it('should convert to rgb format when configured', async () => {
      const config: ConverterConfig = {
        colorFormats: { preferredFormat: 'rgb' },
      };
      const rgbConverter = new PropValueConverter(config);
      
      const result = await rgbConverter.convertByType('#ff0000', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('rgb(255, 0, 0)');
    });

    it('should convert to hsl format when configured', async () => {
      const config: ConverterConfig = {
        colorFormats: { preferredFormat: 'hsl' },
      };
      const hslConverter = new PropValueConverter(config);
      
      const result = await hslConverter.convertByType('#ff0000', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid color formats', async () => {
      const result = await converter.convertByType('invalid-color', 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('invalid-color'); // Should return original
    });

    it('should handle non-string values', async () => {
      const result = await converter.convertByType(12345, 'color', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(12345); // Should return original
    });
  });
});

describe('EnumConverter', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    converter = new PropValueConverter();
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  describe('enum value conversion', () => {
    it('should convert kebab-case to camelCase', async () => {
      const result = await converter.convertByType('primary-button', 'enum', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('primaryButton');
    });

    it('should handle single words', async () => {
      const result = await converter.convertByType('primary', 'enum', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('primary');
    });

    it('should handle multiple hyphens', async () => {
      const result = await converter.convertByType('large-primary-button', 'enum', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('largePrimaryButton');
    });
  });
});

describe('StringConverter', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    converter = new PropValueConverter();
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  describe('string conversion', () => {
    it('should convert numbers to strings', async () => {
      const result = await converter.convertByType(123, 'string', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('123');
    });

    it('should convert booleans to strings', async () => {
      const result = await converter.convertByType(true, 'string', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('true');
    });

    it('should maintain existing strings', async () => {
      const result = await converter.convertByType('hello', 'string', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });
  });
});

describe('NumberConverter', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    converter = new PropValueConverter();
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  describe('number conversion', () => {
    it('should convert string numbers to numbers', async () => {
      const result = await converter.convertByType('123', 'number', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should convert decimal strings to numbers', async () => {
      const result = await converter.convertByType('123.45', 'number', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(123.45);
    });

    it('should maintain existing numbers', async () => {
      const result = await converter.convertByType(456, 'number', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(456);
    });

    it('should convert invalid strings to 0', async () => {
      const result = await converter.convertByType('invalid', 'number', context);
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });
  });
});

describe('converter management', () => {
  let converter: PropValueConverter;

  beforeEach(() => {
    converter = new PropValueConverter();
  });

  describe('custom converter registration', () => {
    it('should register custom converters', () => {
      const customConverter: ValueConverter = {
        name: 'custom',
        convert: (value: any) => `custom-${value}`,
        supports: (type: string) => type === 'custom',
      };

      converter.registerConverter(customConverter);
      
      expect(converter.hasConverter('custom')).toBe(true);
      expect(converter.getConverters()).toContain('custom');
    });

    it('should list all registered converters', () => {
      const converters = converter.getConverters();
      
      expect(converters).toContain('boolean');
      expect(converters).toContain('unit');
      expect(converters).toContain('color');
      expect(converters).toContain('enum');
      expect(converters).toContain('string');
      expect(converters).toContain('number');
    });

    it('should check converter existence', () => {
      expect(converter.hasConverter('boolean')).toBe(true);
      expect(converter.hasConverter('nonexistent')).toBe(false);
    });
  });
});

describe('performance tests', () => {
  let converter: PropValueConverter;
  let context: ComponentMappingContext;

  beforeEach(() => {
    converter = new PropValueConverter();
    context = {
      sourceFile: 'test.tsx',
      targetFile: 'test.tsx',
      componentName: 'Button',
      props: {},
    };
  });

  it('should handle bulk conversions efficiently', async () => {
    const transformation: ValueTransformation = {
      type: 'map',
      map: Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`value${i}`, `converted${i}`])
      ),
    };

    const start = performance.now();
    
    const promises = Array.from({ length: 100 }, (_, i) =>
      converter.convert(`value${i}`, transformation, context)
    );
    
    await Promise.all(promises);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete quickly
  });

  it('should handle complex color conversions efficiently', async () => {
    const colors = [
      '#ff0000', '#00ff00', '#0000ff',
      'rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)',
      'hsl(0, 100%, 50%)', 'hsl(120, 100%, 50%)', 'hsl(240, 100%, 50%)',
    ];

    const start = performance.now();
    
    const promises = colors.map(color =>
      converter.convertByType(color, 'color', context)
    );
    
    await Promise.all(promises);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // Should complete quickly
  });
});