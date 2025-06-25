#!/usr/bin/env tsx

// Test framework implementation
interface TestContext {
  name: string;
  tests: TestFunction[];
  beforeEachFn?: () => void | Promise<void>;
}

type TestFunction = () => void | Promise<void>;

const testContexts: TestContext[] = [];
let currentContext: TestContext | null = null;

function describe(name: string, fn: () => void) {
  const context: TestContext = { name, tests: [] };
  testContexts.push(context);
  const previousContext = currentContext;
  currentContext = context;
  fn();
  currentContext = previousContext;
}

function it(name: string, fn: TestFunction) {
  if (!currentContext) {
    throw new Error('it() must be called within describe()');
  }
  currentContext.tests.push(async () => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  });
}

function beforeEach(fn: () => void | Promise<void>) {
  if (!currentContext) {
    throw new Error('beforeEach() must be called within describe()');
  }
  currentContext.beforeEachFn = fn;
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: any) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected array to contain ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeLessThan(expected: number) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but got undefined`);
      }
    },
    toHaveLength(expected: number) {
      if (!actual || actual.length !== expected) {
        throw new Error(`Expected length ${expected}, but got ${actual ? actual.length : 'undefined'}`);
      }
    },
  };
}

// Mock vitest exports
const vitest = { describe, it, expect, beforeEach };

// Import test file content
import { 
  PropValueConverter, 
  type ValueConverter, 
  type ConverterConfig,
  type ConversionResult 
} from './src/converters/prop-value-converter.js';
import type { ValueTransformation } from './src/schemas/component-mapping.schema.js';
import type { ComponentMappingContext } from './src/types/component-mapping.types.js';

// PropValueConverter Tests
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

    it('should convert decimal pixels', async () => {
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

// Run tests
async function runTests() {
  console.log('🧪 Running PropValueConverter tests...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const context of testContexts) {
    console.log(`📦 ${context.name}`);
    
    for (const test of context.tests) {
      totalTests++;
      try {
        if (context.beforeEachFn) {
          await context.beforeEachFn();
        }
        await test();
        passedTests++;
      } catch (error) {
        // Error already logged in test function
      }
    }
    console.log('');
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    process.exit(1);
  }
}

runTests();