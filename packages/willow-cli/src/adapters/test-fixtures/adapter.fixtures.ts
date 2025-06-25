import { AdapterConfig, AdapterInstance, ComponentMapping, StyleConfig, TokenConfig, ValidationResult } from '../types';
import { AdapterError } from '../errors';
import { vi } from 'vitest';

/**
 * Test fixture factories for adapter testing
 */

// ============================================================================
// Adapter Configuration Fixtures
// ============================================================================

export const createValidAdapterConfig = (overrides: Partial<AdapterConfig> = {}): AdapterConfig => ({
  name: 'test-adapter',
  version: '1.0.0',
  displayName: 'Test UI Kit Adapter',
  description: 'A test adapter for unit testing',
  author: {
    name: 'Test Developer',
    email: 'test@example.com',
    url: 'https://example.com',
  },
  license: 'MIT',
  homepage: 'https://github.com/test/adapter',
  repository: {
    type: 'git',
    url: 'https://github.com/test/adapter.git',
  },
  keywords: ['test', 'adapter', 'ui-kit'],
  capabilities: ['component-mapping', 'style-translation', 'token-conversion'],
  framework: {
    name: 'react',
    version: '18.0.0',
    minVersion: '16.8.0',
    maxVersion: '19.0.0',
  },
  dependencies: {
    react: '>=16.8.0',
    typescript: '>=4.0.0',
  },
  peerDependencies: {
    'react-dom': '>=16.8.0',
  },
  optionalDependencies: {
    '@types/react': '>=16.8.0',
  },
  options: {
    theme: {
      mode: 'light',
      customThemes: {},
    },
    locale: {
      language: 'en',
      region: 'US',
      rtl: false,
    },
    accessibility: {
      enabled: true,
      level: 'AA',
      announcements: true,
      highContrast: false,
      reducedMotion: false,
    },
    performance: {
      mode: 'development',
      caching: true,
      cacheSize: 100,
      lazyLoading: true,
      debounceTime: 300,
      throttleTime: 100,
    },
    development: {
      hotReload: true,
      debugging: true,
      strictMode: true,
      deprecationWarnings: true,
      logLevel: 'info',
    },
    testing: {
      enabled: true,
      coverage: true,
      snapshots: true,
      accessibility: true,
    },
  },
  metadata: {
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  ...overrides,
});

export const createMinimalAdapterConfig = (overrides: Partial<AdapterConfig> = {}): AdapterConfig => ({
  name: 'minimal-adapter',
  version: '0.1.0',
  capabilities: [],
  framework: {
    name: 'vanilla',
    version: '1.0.0',
  },
  options: {},
  ...overrides,
});

export const createInvalidAdapterConfig = (): Partial<AdapterConfig> => ({
  // Missing required fields: name, version, framework
  capabilities: ['invalid-capability'],
  options: {
    // Invalid options
    theme: {
      mode: 'invalid' as any,
    },
  },
});

// ============================================================================
// Component Mapping Fixtures
// ============================================================================

export const createButtonMapping = (): ComponentMapping => ({
  component: 'button',
  props: {
    type: 'button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    children: 'Click me',
  },
  styles: {
    base: {
      padding: '10px 20px',
      borderRadius: '4px',
      fontSize: '16px',
    },
    variants: {
      primary: {
        backgroundColor: '#007bff',
        color: '#ffffff',
      },
      secondary: {
        backgroundColor: '#6c757d',
        color: '#ffffff',
      },
    },
  },
  variants: [
    {
      name: 'primary',
      props: { variant: 'primary' },
      isDefault: true,
    },
    {
      name: 'secondary',
      props: { variant: 'secondary' },
    },
  ],
  children: {
    allowed: true,
    transform: (children: unknown) => children,
  },
  displayName: 'Button',
  metadata: {
    category: 'form',
    tags: ['interactive', 'button'],
    accessibility: {
      role: 'button',
      keyboardSupport: true,
      screenReaderSupport: true,
    },
  },
});

export const createInputMapping = (): ComponentMapping => ({
  component: 'input',
  props: {
    type: 'text',
    placeholder: 'Enter text',
    disabled: false,
    required: false,
  },
  styles: {
    base: {
      padding: '8px 12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
    },
    states: {
      focus: {
        borderColor: '#007bff',
        outline: 'none',
      },
      disabled: {
        backgroundColor: '#f8f9fa',
        cursor: 'not-allowed',
      },
    },
  },
  children: {
    allowed: false,
  },
  displayName: 'Input',
  metadata: {
    category: 'form',
    tags: ['input', 'text'],
    accessibility: {
      role: 'textbox',
      keyboardSupport: true,
      screenReaderSupport: true,
    },
  },
});

// ============================================================================
// Style Configuration Fixtures
// ============================================================================

export const createCompleteStyleConfig = (): StyleConfig => ({
  base: {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  },
  variants: {
    primary: {
      backgroundColor: '#007bff',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: '#6c757d',
      color: '#ffffff',
    },
    danger: {
      backgroundColor: '#dc3545',
      color: '#ffffff',
    },
  },
  states: {
    hover: {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    },
    active: {
      opacity: 0.8,
      transform: 'translateY(0)',
    },
    focus: {
      outline: '2px solid #007bff',
      outlineOffset: '2px',
    },
    disabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  responsive: {
    sm: {
      padding: '8px 16px',
      fontSize: '14px',
    },
    md: {
      padding: '10px 20px',
      fontSize: '16px',
    },
    lg: {
      padding: '12px 24px',
      fontSize: '18px',
    },
  },
  dark: {
    backgroundColor: '#212529',
    color: '#ffffff',
    borderColor: '#495057',
  },
  layout: {
    display: 'inline-block',
    position: 'relative',
    width: 'auto',
    height: 'auto',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: 'normal',
    lineHeight: 1.5,
    letterSpacing: 'normal',
  },
  colors: {
    color: '#212529',
    backgroundColor: 'transparent',
    borderColor: '#dee2e6',
  },
  spacing: {
    margin: '0',
    padding: '10px 20px',
  },
  borders: {
    border: '1px solid #dee2e6',
    borderRadius: '4px',
  },
  effects: {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  },
  animations: {
    animation: 'none',
    transition: 'all 0.3s ease',
  },
  custom: {
    '--button-height': '40px',
    '--button-min-width': '80px',
  },
});

export const createMinimalStyleConfig = (): StyleConfig => ({
  base: {
    display: 'block',
  },
});

// ============================================================================
// Token Configuration Fixtures
// ============================================================================

export const createCompleteTokenConfig = (): TokenConfig => ({
  category: 'design-system',
  path: 'tokens',
  value: 'all',
  metadata: {
    version: '1.0.0',
    created: new Date().toISOString(),
  },
  tokens: {
    colors: {
      primary: {
        50: '#e3f2fd',
        100: '#bbdefb',
        200: '#90caf9',
        300: '#64b5f6',
        400: '#42a5f5',
        500: '#2196f3',
        600: '#1e88e5',
        700: '#1976d2',
        800: '#1565c0',
        900: '#0d47a1',
        950: '#063d7a',
      },
      secondary: {
        50: '#f8f9fa',
        100: '#f1f3f5',
        200: '#e9ecef',
        300: '#dee2e6',
        400: '#ced4da',
        500: '#adb5bd',
        600: '#6c757d',
        700: '#495057',
        800: '#343a40',
        900: '#212529',
      },
      neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
      },
      success: {
        500: '#4caf50',
        600: '#43a047',
        700: '#388e3c',
      },
      warning: {
        500: '#ff9800',
        600: '#fb8c00',
        700: '#f57c00',
      },
      error: {
        500: '#f44336',
        600: '#e53935',
        700: '#d32f2f',
      },
      info: {
        500: '#2196f3',
        600: '#1e88e5',
        700: '#1976d2',
      },
    },
    typography: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '64px',
      },
      fontWeight: {
        thin: 100,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      },
      lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
    },
    spacing: {
      0: '0',
      px: '1px',
      0.5: '2px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
      20: '80px',
      24: '96px',
      32: '128px',
    },
    sizing: {
      xs: '320px',
      sm: '384px',
      md: '448px',
      lg: '512px',
      xl: '576px',
      '2xl': '672px',
      '3xl': '768px',
      '4xl': '896px',
      '5xl': '1024px',
      '6xl': '1152px',
      full: '100%',
    },
    borders: {
      width: {
        0: '0',
        1: '1px',
        2: '2px',
        4: '4px',
        8: '8px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
        double: 'double',
        none: 'none',
      },
      radius: {
        none: '0',
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },
    },
    shadows: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none',
    },
    animations: {
      duration: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
      ease: {
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        ping: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        pulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '.5',
          },
        },
      },
    },
    breakpoints: {
      xs: '0',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
});

export const createMinimalTokenConfig = (): TokenConfig => ({
  category: 'basic',
  path: 'tokens',
  value: 'minimal',
  tokens: {
    colors: {
      primary: {
        500: '#007bff',
      },
    },
  },
});

// ============================================================================
// Validation Result Fixtures
// ============================================================================

export const createSuccessfulValidation = (): ValidationResult => ({
  valid: true,
  errors: [],
  warnings: [],
  context: {
    validatedAt: new Date().toISOString(),
    validatorVersion: '1.0.0',
  },
});

export const createFailedValidation = (): ValidationResult => ({
  valid: false,
  errors: [
    {
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Required field "name" is missing',
      path: 'name',
      expected: 'string',
      actual: undefined,
      severity: 'critical',
      suggestion: 'Add a valid name field to the configuration',
    },
    {
      code: 'INVALID_VERSION_FORMAT',
      message: 'Version must follow semantic versioning (e.g., 1.0.0)',
      path: 'version',
      expected: 'semver',
      actual: '1.0',
      severity: 'high',
      suggestion: 'Use format: major.minor.patch (e.g., 1.0.0)',
    },
  ],
  warnings: [
    {
      code: 'DEPRECATED_OPTION',
      message: 'Option "legacyMode" is deprecated',
      path: 'options.legacyMode',
      category: 'deprecation',
      suggestion: 'Remove this option or migrate to the new format',
    },
  ],
  context: {
    validatedAt: new Date().toISOString(),
    validatorVersion: '1.0.0',
  },
});

// ============================================================================
// Mock Adapter Instance Fixtures
// ============================================================================

export const createMockAdapterInstance = (
  config: AdapterConfig = createValidAdapterConfig()
): AdapterInstance => ({
  id: `${config.name}-${Date.now()}`,
  config,
  initialized: false,
  initialize: vi.fn().mockResolvedValue(undefined),
  mapComponent: vi.fn().mockImplementation((name: string, props: Record<string, unknown>) => ({
    component: name.toLowerCase(),
    props,
  })),
  translateStyles: vi.fn().mockImplementation((styles: StyleConfig) => ({ ...styles.base, ...styles.colors })),
  convertTokens: vi.fn().mockImplementation((tokens: TokenConfig) => tokens.tokens || {}),
  validateConfig: vi.fn().mockReturnValue(createSuccessfulValidation()),
  cleanup: vi.fn().mockResolvedValue(undefined),
});

export const createFailingAdapterInstance = (
  config: AdapterConfig = createValidAdapterConfig()
): AdapterInstance => ({
  id: `${config.name}-failing-${Date.now()}`,
  config,
  initialized: false,
  initialize: vi.fn().mockRejectedValue(new AdapterError('Initialization failed', 'INIT_FAILED')),
  mapComponent: vi.fn().mockImplementation(() => {
    throw new AdapterError('Component mapping failed', 'MAPPING_FAILED');
  }),
  translateStyles: vi.fn().mockImplementation(() => {
    throw new AdapterError('Style translation failed', 'TRANSLATION_FAILED');
  }),
  convertTokens: vi.fn().mockImplementation(() => {
    throw new AdapterError('Token conversion failed', 'CONVERSION_FAILED');
  }),
  validateConfig: vi.fn().mockReturnValue(createFailedValidation()),
  cleanup: vi.fn().mockRejectedValue(new AdapterError('Cleanup failed', 'CLEANUP_FAILED')),
});

// ============================================================================
// Error Fixtures
// ============================================================================

export const createAdapterErrors = () => ({
  initializationError: new AdapterError(
    'Failed to initialize adapter',
    'INITIALIZATION_ERROR',
    {
      context: { phase: 'initialization', adapter: 'test-adapter' },
      severity: 'critical',
      recoverable: false,
    }
  ),
  
  validationError: new AdapterError(
    'Configuration validation failed',
    'VALIDATION_ERROR',
    {
      context: { errors: ['missing name', 'invalid version'] },
      severity: 'high',
      recoverable: false,
    }
  ),
  
  mappingError: new AdapterError(
    'Component mapping failed',
    'MAPPING_ERROR',
    {
      context: { component: 'Button', reason: 'unsupported props' },
      severity: 'medium',
      recoverable: true,
    }
  ),
  
  networkError: new AdapterError(
    'Network request failed',
    'NETWORK_ERROR',
    {
      context: { url: 'https://api.example.com', statusCode: 500 },
      severity: 'low',
      recoverable: true,
      cause: new Error('Internal Server Error'),
    }
  ),
});

// ============================================================================
// Performance Test Fixtures
// ============================================================================

export const createLargeDatasets = () => ({
  largeComponentList: Array.from({ length: 1000 }, (_, i) => ({
    name: `Component${i}`,
    props: { id: i, data: `data-${i}` },
  })),
  
  largeStyleConfig: {
    base: Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`property${i}`, `value${i}`])
    ),
    variants: Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [
        `variant${i}`,
        Object.fromEntries(
          Array.from({ length: 20 }, (_, j) => [`prop${j}`, `val${j}`])
        ),
      ])
    ),
  },
  
  largeTokenConfig: {
    category: 'large-dataset',
    path: 'tokens',
    value: 'all',
    tokens: {
      colors: Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [
          `color${i}`,
          Object.fromEntries(
            Array.from({ length: 10 }, (_, j) => [`${j * 100}`, `#${((i * 10 + j) * 100000).toString(16).padStart(6, '0')}`])
          ),
        ])
      ),
    },
  },
});

// ============================================================================
// Random Data Generators
// ============================================================================

export const generateRandomProps = (seed = Math.random()): Record<string, unknown> => {
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const propCount = Math.floor(random() * 10) + 1;
  const props: Record<string, unknown> = {};

  for (let i = 0; i < propCount; i++) {
    const key = `prop${i}`;
    const type = Math.floor(random() * 5);
    
    switch (type) {
      case 0:
        props[key] = random() > 0.5;
        break;
      case 1:
        props[key] = Math.floor(random() * 100);
        break;
      case 2:
        props[key] = `value-${Math.floor(random() * 1000)}`;
        break;
      case 3:
        props[key] = ['option1', 'option2', 'option3'][Math.floor(random() * 3)];
        break;
      case 4:
        props[key] = { nested: `nested-${Math.floor(random() * 100)}` };
        break;
    }
  }

  return props;
};

export const generateRandomComponentName = (): string => {
  const components = [
    'Button', 'Input', 'Select', 'Checkbox', 'Radio',
    'Modal', 'Tooltip', 'Card', 'Table', 'Form',
    'Tabs', 'Accordion', 'Alert', 'Badge', 'Avatar',
  ];
  return components[Math.floor(Math.random() * components.length)];
};

// ============================================================================
// Timing Helpers
// ============================================================================

export const createTimingHelpers = () => {
  const performanceNow = typeof performance !== 'undefined' 
    ? () => performance.now()
    : () => Date.now();

  return {
    measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
      const start = performanceNow();
      const result = await fn();
      const duration = performanceNow() - start;
      return { result, duration };
    },

    waitForCondition: async (
      condition: () => boolean,
      options: { timeout?: number; interval?: number } = {}
    ): Promise<void> => {
      const { timeout = 5000, interval = 50 } = options;
      const start = performanceNow();

      while (!condition()) {
        if (performanceNow() - start > timeout) {
          throw new Error('Timeout waiting for condition');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    },

    createDynamicTimeout: (baseTimeout: number) => {
      const isCi = process.env.CI === 'true';
      const isDebug = process.env.DEBUG === 'true';
      
      let multiplier = 1;
      if (isCi) multiplier *= 2;
      if (isDebug) multiplier *= 3;
      
      return baseTimeout * multiplier;
    },
  };
};

// ============================================================================
// State Management Fixtures
// ============================================================================

export const createStateFixtures = () => {
  const state = new Map<string, unknown>();
  
  return {
    setState: (key: string, value: unknown) => state.set(key, value),
    getState: (key: string) => state.get(key),
    clearState: () => state.clear(),
    hasState: (key: string) => state.has(key),
    getAllState: () => Object.fromEntries(state),
  };
};

// ============================================================================
// Assertion Helpers
// ============================================================================

export const createAssertionHelpers = () => ({
  assertExactMapping: (actual: ComponentMapping, expected: ComponentMapping) => {
    expect(actual).toEqual(expected);
    expect(Object.keys(actual)).toEqual(Object.keys(expected));
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  },

  assertExactStyles: (actual: StyleConfig, expected: StyleConfig) => {
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  },

  assertExactTokens: (actual: TokenConfig, expected: TokenConfig) => {
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  },

  assertExactValidation: (actual: ValidationResult, expected: ValidationResult) => {
    expect(actual.valid).toBe(expected.valid);
    expect(actual.errors).toEqual(expected.errors);
    expect(actual.warnings).toEqual(expected.warnings);
    expect(actual.context).toEqual(expected.context);
  },

  assertExactError: (actual: Error, expected: AdapterError) => {
    expect(actual).toBeInstanceOf(AdapterError);
    const adapterError = actual as AdapterError;
    expect(adapterError.message).toBe(expected.message);
    expect(adapterError.code).toBe(expected.code);
    expect(adapterError.context).toEqual(expected.context);
    expect(adapterError.severity).toBe(expected.severity);
    expect(adapterError.recoverable).toBe(expected.recoverable);
  },
});