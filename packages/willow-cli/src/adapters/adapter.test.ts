import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdapterConfig, AdapterInstance, ComponentMapping, StyleConfig, TokenConfig, ValidationResult } from './types';
import { AdapterError } from './errors';
import { AdapterPluginManager } from './plugins/AdapterPluginManager';
import { AccessibilityPlugin } from './plugins/builtin/AccessibilityPlugin';

// Mock console methods
const consoleSpy = {
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Test adapter implementation
class TestAdapter implements AdapterInstance {
  public id: string;
  public config: AdapterConfig;
  public initialized: boolean = false;
  private pluginManager: AdapterPluginManager;

  constructor(config: AdapterConfig) {
    this.id = `${config.name}-${Date.now()}`;
    this.config = config;
    this.pluginManager = new AdapterPluginManager();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new AdapterError('Adapter already initialized', 'ALREADY_INITIALIZED');
    }

    // Initialize plugins
    await this.pluginManager.initializePlugins(this);
    
    this.initialized = true;
  }

  mapComponent(name: string, props: Record<string, unknown>): ComponentMapping {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Basic component mapping
    const mapping: ComponentMapping = {
      component: name.toLowerCase(),
      props: { ...props },
    };

    return mapping;
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Basic style translation
    const translated: Record<string, unknown> = {};

    if (styles.base) {
      Object.assign(translated, styles.base);
    }

    if (styles.colors) {
      Object.assign(translated, styles.colors);
    }

    if (styles.typography) {
      Object.assign(translated, styles.typography);
    }

    return translated;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Basic token conversion
    const converted: Record<string, unknown> = {};

    if (tokens.tokens?.colors) {
      converted.colors = tokens.tokens.colors;
    }

    if (tokens.tokens?.typography) {
      converted.typography = tokens.tokens.typography;
    }

    if (tokens.tokens?.spacing) {
      converted.spacing = tokens.tokens.spacing;
    }

    return converted;
  }

  validateConfig(): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Validate required fields
    if (!this.config.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Adapter name is required',
        path: 'name',
        severity: 'critical',
      });
    }

    if (!this.config.version) {
      errors.push({
        code: 'MISSING_VERSION',
        message: 'Adapter version is required',
        path: 'version',
        severity: 'critical',
      });
    }

    if (!this.config.capabilities || this.config.capabilities.length === 0) {
      warnings.push({
        code: 'NO_CAPABILITIES',
        message: 'No capabilities defined',
        path: 'capabilities',
        category: 'configuration',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async cleanup(): Promise<void> {
    await this.pluginManager.cleanupPlugins(this);
    this.initialized = false;
  }

  // Test-specific methods
  getPluginManager(): AdapterPluginManager {
    return this.pluginManager;
  }
}

// Helper to create test adapter config
const createTestConfig = (overrides: Partial<AdapterConfig> = {}): AdapterConfig => ({
  name: 'test-adapter',
  version: '1.0.0',
  capabilities: ['component-mapping', 'style-translation'],
  framework: {
    name: 'react',
    version: '18.0.0',
  },
  options: {},
  ...overrides,
});

describe('Adapter Integration Tests', () => {
  let adapter: TestAdapter;
  let config: AdapterConfig;

  beforeEach(() => {
    config = createTestConfig();
    adapter = new TestAdapter(config);
    
    // Clear console spies
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  afterEach(async () => {
    if (adapter.initialized) {
      await adapter.cleanup();
    }
  });

  describe('Adapter Lifecycle', () => {
    it('should initialize successfully with valid config', async () => {
      expect(adapter.initialized).toBe(false);
      
      await adapter.initialize();
      
      expect(adapter.initialized).toBe(true);
      expect(adapter.id).toBeDefined();
      expect(adapter.id).toContain('test-adapter');
    });

    it('should prevent double initialization', async () => {
      await adapter.initialize();
      
      await expect(adapter.initialize()).rejects.toThrow('Adapter already initialized');
    });

    it('should cleanup successfully', async () => {
      await adapter.initialize();
      expect(adapter.initialized).toBe(true);
      
      await adapter.cleanup();
      expect(adapter.initialized).toBe(false);
    });

    it('should handle cleanup when not initialized', async () => {
      expect(adapter.initialized).toBe(false);
      
      await expect(adapter.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate successful configuration', () => {
      const result = adapter.validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidAdapter = new TestAdapter({
        ...config,
        name: '',
        version: '',
      });
      
      const result = invalidAdapter.validateConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe('MISSING_NAME');
      expect(result.errors[1].code).toBe('MISSING_VERSION');
    });

    it('should warn about missing capabilities', () => {
      const warningAdapter = new TestAdapter({
        ...config,
        capabilities: [],
      });
      
      const result = warningAdapter.validateConfig();
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('NO_CAPABILITIES');
    });

    it('should validate complex configuration', () => {
      const complexConfig = createTestConfig({
        displayName: 'Test UI Kit Adapter',
        description: 'A comprehensive test adapter',
        author: {
          name: 'Test Developer',
          email: 'test@example.com',
        },
        capabilities: ['component-mapping', 'style-translation', 'token-conversion'],
        dependencies: {
          react: '>=18.0.0',
          typescript: '>=4.0.0',
        },
        options: {
          theme: {
            mode: 'light',
          },
          accessibility: {
            enabled: true,
            level: 'AA',
          },
          performance: {
            mode: 'development',
            caching: true,
          },
        },
      });

      const complexAdapter = new TestAdapter(complexConfig);
      const result = complexAdapter.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Component Mapping', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should map basic components', () => {
      const props = { variant: 'primary', children: 'Click me' };
      const mapping = adapter.mapComponent('Button', props);
      
      expect(mapping.component).toBe('button');
      expect(mapping.props).toEqual(props);
    });

    it('should handle complex component props', () => {
      const complexProps = {
        size: 'large',
        disabled: false,
        onClick: vi.fn(),
        style: { margin: '10px' },
        children: ['Text', { type: 'span', props: { children: 'Span' } }],
        'data-testid': 'complex-button',
      };
      
      const mapping = adapter.mapComponent('Button', complexProps);
      
      expect(mapping.component).toBe('button');
      expect(mapping.props).toEqual(complexProps);
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new TestAdapter(config);
      
      expect(() => uninitializedAdapter.mapComponent('Button', {}))
        .toThrow(new AdapterError('Adapter not initialized', 'NOT_INITIALIZED'));
    });

    it('should handle various component types', () => {
      const components = ['Button', 'Input', 'Select', 'Modal', 'Card'];
      
      components.forEach(componentName => {
        const mapping = adapter.mapComponent(componentName, { test: true });
        expect(mapping.component).toBe(componentName.toLowerCase());
        expect(mapping.props.test).toBe(true);
      });
    });
  });

  describe('Style Translation', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should translate basic styles', () => {
      const styles: StyleConfig = {
        base: {
          padding: '10px',
          margin: '5px',
        },
        colors: {
          color: '#333333',
          backgroundColor: '#ffffff',
        },
        typography: {
          fontSize: '16px',
          fontWeight: 'bold',
        },
      };
      
      const translated = adapter.translateStyles(styles);
      
      expect(translated).toEqual({
        padding: '10px',
        margin: '5px',
        color: '#333333',
        backgroundColor: '#ffffff',
        fontSize: '16px',
        fontWeight: 'bold',
      });
    });

    it('should handle empty styles', () => {
      const translated = adapter.translateStyles({});
      expect(translated).toEqual({});
    });

    it('should handle partial style configs', () => {
      const styles: StyleConfig = {
        colors: {
          color: 'blue',
        },
      };
      
      const translated = adapter.translateStyles(styles);
      expect(translated).toEqual({ color: 'blue' });
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new TestAdapter(config);
      
      expect(() => uninitializedAdapter.translateStyles({}))
        .toThrow(new AdapterError('Adapter not initialized', 'NOT_INITIALIZED'));
    });
  });

  describe('Token Conversion', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should convert design tokens', () => {
      const tokens: TokenConfig = {
        category: 'design-system',
        path: 'tokens',
        value: 'all',
        tokens: {
          colors: {
            primary: {
              500: '#007bff',
              600: '#0056b3',
            },
            secondary: {
              500: '#6c757d',
            },
          },
          typography: {
            fontSize: {
              sm: '14px',
              base: '16px',
              lg: '18px',
            },
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
            },
          },
          spacing: {
            1: '4px',
            2: '8px',
            4: '16px',
          },
        },
      };
      
      const converted = adapter.convertTokens(tokens);
      
      expect(converted).toEqual({
        colors: tokens.tokens?.colors,
        typography: tokens.tokens?.typography,
        spacing: tokens.tokens?.spacing,
      });
    });

    it('should handle empty token config', () => {
      const tokens: TokenConfig = {
        category: 'test',
        path: 'empty',
        value: null,
      };
      
      const converted = adapter.convertTokens(tokens);
      expect(converted).toEqual({});
    });

    it('should throw error when not initialized', () => {
      const uninitializedAdapter = new TestAdapter(config);
      const tokens: TokenConfig = { category: 'test', path: 'test', value: 'test' };
      
      expect(() => uninitializedAdapter.convertTokens(tokens))
        .toThrow(new AdapterError('Adapter not initialized', 'NOT_INITIALIZED'));
    });
  });

  describe('Plugin Integration', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should integrate with accessibility plugin', async () => {
      const pluginManager = adapter.getPluginManager();
      const accessibilityPlugin = new AccessibilityPlugin();
      
      await pluginManager.registerPlugin(accessibilityPlugin);
      
      // Test component mapping with plugin enhancement
      const enhancedProps = await pluginManager.executeBeforeComponentMapping(
        adapter,
        'Button',
        { children: 'Click me' }
      );
      
      expect(enhancedProps['aria-label']).toBe('Click me');
      expect(enhancedProps.tabIndex).toBe(0);
      expect(enhancedProps.onKeyDown).toBeDefined();
    });

    it('should handle plugin errors gracefully', async () => {
      const pluginManager = adapter.getPluginManager();
      
      // Create a faulty plugin
      const faultyPlugin = {
        name: 'faulty-plugin',
        version: '1.0.0',
        beforeComponentMapping: () => {
          throw new Error('Plugin error');
        },
      };
      
      await pluginManager.registerPlugin(faultyPlugin);
      
      // Should not crash the adapter
      await expect(
        pluginManager.executeBeforeComponentMapping(adapter, 'Button', {})
      ).rejects.toThrow('Plugin "faulty-plugin" execution failed');
    });

    it('should support multiple plugins working together', async () => {
      const pluginManager = adapter.getPluginManager();
      
      // Add accessibility plugin
      const accessibilityPlugin = new AccessibilityPlugin();
      await pluginManager.registerPlugin(accessibilityPlugin, { priority: 10 });
      
      // Add a test plugin
      const testPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        beforeComponentMapping: (name: string, props: Record<string, unknown>) => ({
          ...props,
          enhanced: true,
          pluginName: 'test-plugin',
        }),
      };
      await pluginManager.registerPlugin(testPlugin, { priority: 5 });
      
      const result = await pluginManager.executeBeforeComponentMapping(
        adapter,
        'Button',
        { children: 'Test' }
      );
      
      // Should have enhancements from both plugins
      expect(result['aria-label']).toBe('Test');
      expect(result.enhanced).toBe(true);
      expect(result.pluginName).toBe('test-plugin');
    });
  });

  describe('Error Handling', () => {
    it('should handle adapter errors with context', () => {
      const error = new AdapterError(
        'Test error message',
        'TEST_ERROR',
        { 
          context: { component: 'Button', context: 'testing' },
          severity: 'medium',
          recoverable: true
        }
      );
      
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context.component).toBe('Button');
      expect(error.context.context).toBe('testing');
      expect(error.severity).toBe('medium');
      expect(error.recoverable).toBe(true);
    });

    it('should serialize errors properly', () => {
      const error = new AdapterError('Serialization test', 'SERIALIZE_ERROR');
      const serialized = error.toJSON();
      
      expect(serialized).toMatchObject({
        name: 'AdapterError',
        message: 'Serialization test',
        code: 'SERIALIZE_ERROR',
        severity: 'medium',
        recoverable: true,
        timestamp: expect.any(String),
      });
    });

    it('should handle operational errors vs programming errors', () => {
      const operationalError = new AdapterError(
        'Network timeout',
        'NETWORK_TIMEOUT',
        {
          severity: 'low',
          recoverable: true
        }
      );
      
      const programmingError = new AdapterError(
        'Invalid configuration',
        'INVALID_CONFIG',
        {
          severity: 'critical',
          recoverable: false
        }
      );
      
      expect(operationalError.recoverable).toBe(true);
      expect(operationalError.severity).toBe('low');
      
      expect(programmingError.recoverable).toBe(false);
      expect(programmingError.severity).toBe('critical');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle multiple initializations and cleanups', async () => {
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        await adapter.initialize();
        expect(adapter.initialized).toBe(true);
        
        // Perform some operations
        adapter.mapComponent('Button', { test: i });
        adapter.translateStyles({ base: { test: i } });
        
        await adapter.cleanup();
        expect(adapter.initialized).toBe(false);
      }
    });

    it('should handle large configuration objects', () => {
      const largeConfig = createTestConfig({
        capabilities: Array(100).fill(0).map((_, i) => `capability-${i}` as any),
        dependencies: Object.fromEntries(
          Array(50).fill(0).map((_, i) => [`package-${i}`, '1.0.0'])
        ),
        options: {
          custom: Object.fromEntries(
            Array(200).fill(0).map((_, i) => [`option-${i}`, `value-${i}`])
          ),
        },
      });
      
      const largeAdapter = new TestAdapter(largeConfig);
      const result = largeAdapter.validateConfig();
      
      expect(result.valid).toBe(true);
      expect(largeAdapter.config.capabilities).toHaveLength(100);
    });

    it('should handle concurrent operations', async () => {
      await adapter.initialize();
      
      const promises = Array(50).fill(0).map(async (_, i) => {
        const mapping = adapter.mapComponent(`Component${i}`, { index: i });
        const styles = adapter.translateStyles({
          base: { property: `value${i}` },
        });
        return { mapping, styles };
      });
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(50);
      results.forEach((result, i) => {
        expect(result.mapping.component).toBe(`component${i}`);
        expect(result.styles.property).toBe(`value${i}`);
      });
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should support full adapter workflow', async () => {
      // 1. Initialize adapter
      await adapter.initialize();
      
      // 2. Add plugins
      const pluginManager = adapter.getPluginManager();
      await pluginManager.registerPlugin(new AccessibilityPlugin());
      
      // 3. Validate configuration
      const validation = adapter.validateConfig();
      expect(validation.valid).toBe(true);
      
      // 4. Map components with plugin enhancements
      const buttonProps = await pluginManager.executeBeforeComponentMapping(
        adapter,
        'Button',
        { children: 'Submit', type: 'submit' }
      );
      const buttonMapping = adapter.mapComponent('Button', buttonProps);
      
      // 5. Translate styles with plugin enhancements
      const styles: StyleConfig = {
        base: { padding: '10px' },
        colors: { color: '#cccccc', backgroundColor: '#ffffff' },
      };
      const enhancedStyles = await pluginManager.executeBeforeStyleTranslation(adapter, styles);
      const translatedStyles = adapter.translateStyles(enhancedStyles);
      
      // 6. Convert design tokens
      const tokens: TokenConfig = {
        category: 'button',
        path: 'primary',
        value: 'blue',
        tokens: {
          colors: { primary: { 500: '#007bff' } },
        },
      };
      const convertedTokens = adapter.convertTokens(tokens);
      
      // 7. Verify results
      expect(buttonMapping.component).toBe('button');
      expect(buttonMapping.props['aria-label']).toBe('Submit');
      expect(translatedStyles.color).toMatch(/rgb\(\d+, \d+, \d+\)/); // Should be adjusted by accessibility plugin
      expect(convertedTokens.colors).toBeDefined();
      
      // 8. Cleanup
      await adapter.cleanup();
      expect(adapter.initialized).toBe(false);
    });

    it('should handle theme switching workflow', async () => {
      const themeAdapter = new TestAdapter(createTestConfig({
        options: {
          theme: {
            mode: 'light',
            customThemes: {
              dark: {
                id: 'dark',
                name: 'Dark Theme',
                colors: {
                  primary: { 500: '#ffffff' },
                  background: { primary: '#000000' },
                },
              },
            },
          },
        },
      }));
      
      await themeAdapter.initialize();
      
      // Simulate theme switching by updating adapter config
      themeAdapter.config.options.theme!.mode = 'dark';
      
      const styles = themeAdapter.translateStyles({
        colors: {
          color: 'primary.500',
          backgroundColor: 'background.primary',
        },
      });
      
      expect(styles.color).toBe('primary.500');
      expect(styles.backgroundColor).toBe('background.primary');
      
      await themeAdapter.cleanup();
    });

    it('should support responsive design workflow', async () => {
      await adapter.initialize();
      
      const responsiveStyles: StyleConfig = {
        base: { padding: '8px' },
        responsive: {
          sm: { padding: '12px' },
          md: { padding: '16px' },
          lg: { padding: '20px' },
        },
      };
      
      const translated = adapter.translateStyles(responsiveStyles);
      
      expect(translated.padding).toBe('8px');
      // Responsive styles would be handled by the specific adapter implementation
    });
  });
});