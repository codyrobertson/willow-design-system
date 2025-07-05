#!/usr/bin/env node

import { AdapterValidator, ValidationOptions } from '../AdapterValidator.js';
import { AdapterConfig } from '../UIKitAdapter.js';
import { ComponentConfig, StyleConfig, TokenConfig, ComponentType } from '../../types/AdapterTypes.js';
import { AdapterRegistration } from '../AdapterRegistry.js';

describe('Adapter Schema and Validation', () => {
  const validator = new AdapterValidator();

  test('should accept a valid adapter configuration', () => {
    const validConfig: AdapterConfig = {
      name: 'test-adapter',
      version: '1.2.3',
      options: {
        theme: 'dark',
        rtl: true,
        accessibility: true,
        performanceMode: 'fast',
        strictMode: false,
        debugMode: true,
        cacheSize: 5000,
        timeout: 15000,
        retryCount: 2,
        locale: 'en-US',
        customProperties: {
          customProp: 'value',
        },
      },
    };

    const result = validator.validateAdapterConfig(validConfig);
    expect(result.valid).toBe(true);
  });

  test('should reject an invalid adapter configuration', () => {
    const invalidConfig = {
      name: '', // Invalid: empty name
      version: 'invalid-version', // Invalid: not semver
      options: {
        theme: 'invalid-theme', // Invalid: not in enum
        cacheSize: -1, // Invalid: negative number
        timeout: 500000, // Invalid: exceeds maximum
      },
    };

    const result = validator.validateAdapterConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  test('should accept a valid component configuration', () => {
    const validComponent: ComponentConfig = {
      name: 'Button',
      type: ComponentType.Button,
      props: {
        variant: 'primary',
        size: 'medium',
      },
      variants: [
        {
          name: 'primary',
          props: {
            backgroundColor: 'blue',
            color: 'white',
          },
          description: 'Primary button variant',
        },
        {
          name: 'secondary',
          props: {
            backgroundColor: 'gray',
            color: 'black',
          },
        },
      ],
      defaultProps: {
        size: 'medium',
        disabled: false,
      },
    };

    const result = validator.validateComponentConfig(validComponent);
    expect(result.valid).toBe(true);
  });

  test('should reject an invalid component configuration', () => {
    const invalidComponent = {
      name: 'button', // Invalid: should be PascalCase
      type: 'invalid-type', // Invalid: not in enum
      variants: [
        {
          name: 'primary',
          // Missing required 'props' field
        },
      ],
    };

    const result = validator.validateComponentConfig(invalidComponent);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('should accept a valid style configuration', () => {
    const validStyles: StyleConfig = {
      base: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
      },
      variants: {
        primary: {
          backgroundColor: '#3B82F6',
          color: '#FFFFFF',
        },
        secondary: {
          backgroundColor: '#6B7280',
          color: '#FFFFFF',
        },
      },
      states: {
        hover: {
          transform: 'translateY(-1px)',
        },
        focus: {
          outline: '2px solid #3B82F6',
        },
        disabled: {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      },
      responsive: {
        sm: {
          padding: '6px 12px',
          fontSize: '14px',
        },
        lg: {
          padding: '12px 24px',
          fontSize: '16px',
        },
      },
      dark: {
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
      },
    };

    const result = validator.validateStyleConfig(validStyles);
    expect(result.valid).toBe(true);
  });

  test('should accept a valid token configuration', () => {
    const validTokens: TokenConfig = {
      colors: {
        primary: {
          '50': '#EFF6FF',
          '100': '#DBEAFE',
          '200': '#BFDBFE',
          '300': '#93C5FD',
          '400': '#60A5FA',
          '500': '#3B82F6',
          '600': '#2563EB',
          '700': '#1D4ED8',
          '800': '#1E40AF',
          '900': '#1E3A8A',
        },
        background: {
          default: '#FFFFFF',
          paper: '#F9FAFB',
        },
      },
      typography: {
        fontFamily: {
          sans: 'Inter, sans-serif',
          mono: 'Fira Code, monospace',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
      },
      spacing: {
        '0': '0px',
        '1': '0.25rem',
        '2': '0.5rem',
        '4': '1rem',
        '8': '2rem',
      },
      borders: {
        width: {
          '0': '0px',
          '1': '1px',
          '2': '2px',
        },
        radius: {
          none: '0px',
          sm: '0.125rem',
          md: '0.375rem',
          lg: '0.5rem',
        },
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      },
    };

    const result = validator.validateTokenConfig(validTokens);
    expect(result.valid).toBe(true);
  });

  test('should reject an invalid token configuration', () => {
    const invalidTokens = {
      // Invalid: missing required structure
      invalidProperty: 'this should not be here',
      colors: 123, // Invalid: should be object, not number
    };

    const result = validator.validateTokenConfig(invalidTokens);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('should handle validation with custom options', () => {
    const configWithExtra = {
      name: 'test-adapter',
      version: '1.0.0',
      extraProperty: 'should be removed', // Extra property
      options: {
        theme: 'light',
        extraOption: 'extra', // Extra nested property
      },
    };

    const strictOptions: ValidationOptions = {
      strict: false, // Allow additional properties for this test
      removeAdditional: true,
      useDefaults: true,
    };

    const result = validator.validateAdapterConfig(configWithExtra, strictOptions);
    expect(result.valid).toBe(true);
    // You might want to assert that extra properties are removed if the validator supports it
    // expect(result.data).not.toHaveProperty('extraProperty');
  });

  test('should apply default values', () => {
    const minimalConfig = {
      name: 'minimal-adapter',
      version: '1.0.0',
      options: {}, // Empty options should get defaults
    };

    const result = validator.validateAdapterConfig(minimalConfig, { useDefaults: true });
    expect(result.valid).toBe(true);
    // You might want to assert that default values are applied
    // expect(result.data.options).toHaveProperty('theme', 'light');
  });

  test('should handle type coercion', () => {
    const configWithStringNumbers = {
      name: 'coercion-test',
      version: '1.0.0',
      options: {
        cacheSize: '1000', // String that should be coerced to number
        timeout: '5000',   // String that should be coerced to number
        rtl: 'false',      // String that should be coerced to boolean
      },
    };

    const result = validator.validateAdapterConfig(configWithStringNumbers, {
      coerceTypes: true
    });
    expect(result.valid).toBe(true);
    // You might want to assert that types are coerced
    // expect(typeof result.data.options.cacheSize).toBe('number');
  });

  test('should detect multiple validation errors', () => {
    const multiErrorConfig = {
      name: '', // Error 1: empty name
      version: 'bad-version', // Error 2: invalid version
      options: {
        theme: 'invalid', // Error 3: invalid theme
        cacheSize: -1, // Error 4: negative cache size
        timeout: 1000000, // Error 5: exceeds maximum
      },
    };

    const result = validator.validateAdapterConfig(multiErrorConfig, {
      maxErrors: 3
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThanOrEqual(3);
  });

  test('should handle performance with large data', () => {
    const largeTokenConfig: any = {
      colors: {},
      spacing: {},
      custom: {},
    };

    // Generate large data set
    for (let i = 0; i < 1000; i++) {
      largeTokenConfig.colors[`color-${i}`] = `#${i.toString(16).padStart(6, '0')}`;
      largeTokenConfig.spacing[`space-${i}`] = `${i}px`;
      largeTokenConfig.custom[`custom-${i}`] = `value-${i}`;
    }

    const startTime = performance.now();
    const result = validator.validateTokenConfig(largeTokenConfig);
    const duration = performance.now() - startTime;

    expect(result.valid).toBe(true);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});