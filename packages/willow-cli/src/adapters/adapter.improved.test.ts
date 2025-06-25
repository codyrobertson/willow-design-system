import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createValidAdapterConfig,
  createMinimalAdapterConfig,
  createButtonMapping,
  createCompleteStyleConfig,
  createCompleteTokenConfig,
  createSuccessfulValidation,
  createFailedValidation,
  createAdapterErrors,
  createTimingHelpers,
  createAssertionHelpers,
  generateRandomProps,
  generateRandomComponentName,
  createMockPlugin,
  createPluginChain,
} from './test-fixtures';
import { AdapterConfig, AdapterInstance, ComponentMapping, StyleConfig, TokenConfig, ValidationResult } from './types';
import { AdapterError } from './errors';
import { AdapterPluginManager } from './plugins/AdapterPluginManager';
import { AccessibilityPlugin } from './plugins/builtin/AccessibilityPlugin';

// Test adapter implementation using fixtures
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

    await this.pluginManager.initializePlugins(this);
    this.initialized = true;
  }

  mapComponent(name: string, props: Record<string, unknown>): ComponentMapping {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Return exact mapping structure
    return {
      component: name.toLowerCase(),
      props: { ...props },
      styles: undefined,
      variants: undefined,
      children: undefined,
      displayName: undefined,
      metadata: undefined,
    };
  }

  translateStyles(styles: StyleConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Handle null/undefined gracefully
    if (!styles) {
      return {};
    }

    // Exact translation logic
    const result: Record<string, unknown> = {};
    
    if (styles.base) {
      Object.assign(result, styles.base);
    }
    
    if (styles.colors) {
      Object.assign(result, styles.colors);
    }
    
    if (styles.typography) {
      Object.assign(result, styles.typography);
    }
    
    return result;
  }

  convertTokens(tokens: TokenConfig): Record<string, unknown> {
    if (!this.initialized) {
      throw new AdapterError('Adapter not initialized', 'NOT_INITIALIZED');
    }

    // Exact token conversion
    return tokens.tokens || {};
  }

  validateConfig(): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

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

  getPluginManager(): AdapterPluginManager {
    return this.pluginManager;
  }
}

// Randomize test order by default
describe.shuffle('Adapter Integration Tests with Fixtures', () => {
  let adapter: TestAdapter;
  let config: AdapterConfig;
  const helpers = createAssertionHelpers();
  const timing = createTimingHelpers();

  beforeEach(() => {
    config = createValidAdapterConfig();
    adapter = new TestAdapter(config);
  });

  afterEach(async () => {
    if (adapter.initialized) {
      await adapter.cleanup();
    }
  });

  describe('Exact Output Assertions', () => {
    it('should map component with exact output structure', async () => {
      await adapter.initialize();
      
      const props = { variant: 'primary', size: 'medium', disabled: false };
      const result = adapter.mapComponent('Button', props);
      
      // Assert exact output
      expect(result).toEqual({
        component: 'button',
        props: { variant: 'primary', size: 'medium', disabled: false },
        styles: undefined,
        variants: undefined,
        children: undefined,
        displayName: undefined,
        metadata: undefined,
      });
      
      // Verify exact property order
      expect(Object.keys(result)).toEqual([
        'component',
        'props',
        'styles',
        'variants',
        'children',
        'displayName',
        'metadata',
      ]);
    });

    it('should translate styles with exact output', async () => {
      await adapter.initialize();
      
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
      
      const result = adapter.translateStyles(styles);
      
      // Assert exact output
      expect(result).toEqual({
        padding: '10px',
        margin: '5px',
        color: '#333333',
        backgroundColor: '#ffffff',
        fontSize: '16px',
        fontWeight: 'bold',
      });
      
      // Verify exact JSON representation
      expect(JSON.stringify(result)).toBe(
        JSON.stringify({
          padding: '10px',
          margin: '5px',
          color: '#333333',
          backgroundColor: '#ffffff',
          fontSize: '16px',
          fontWeight: 'bold',
        })
      );
    });

    it('should convert tokens with exact output', async () => {
      await adapter.initialize();
      
      const tokens = createCompleteTokenConfig();
      const result = adapter.convertTokens(tokens);
      
      // Assert exact token structure
      helpers.assertExactTokens(
        { ...tokens, tokens: result as any },
        tokens
      );
    });

    it('should validate config with exact error structure', () => {
      const invalidAdapter = new TestAdapter({ ...config, name: '', version: '' });
      const result = invalidAdapter.validateConfig();
      
      // Assert exact validation result
      expect(result).toEqual({
        valid: false,
        errors: [
          {
            code: 'MISSING_NAME',
            message: 'Adapter name is required',
            path: 'name',
            severity: 'critical',
          },
          {
            code: 'MISSING_VERSION',
            message: 'Adapter version is required',
            path: 'version',
            severity: 'critical',
          },
        ],
        warnings: [],
      });
    });
  });

  describe('Timing Heuristics', () => {
    it('should initialize within acceptable time bounds', async () => {
      const dynamicTimeout = timing.createDynamicTimeout(100);
      
      const { duration } = await timing.measureExecutionTime(
        () => adapter.initialize()
      );
      
      expect(duration).toBeLessThan(dynamicTimeout);
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle concurrent operations efficiently', async () => {
      await adapter.initialize();
      
      const operationCount = 50;
      const { duration } = await timing.measureExecutionTime(async () => {
        const promises = Array.from({ length: operationCount }, (_, i) => 
          adapter.mapComponent(`Component${i}`, { index: i })
        );
        
        await Promise.all(promises);
      });
      
      // Should complete in reasonable time (not linear with operation count)
      const avgTimePerOperation = duration / operationCount;
      expect(avgTimePerOperation).toBeLessThan(5); // Less than 5ms per operation
    });

    it('should wait for initialization using condition', async () => {
      // Start initialization in background
      const initPromise = adapter.initialize();
      
      // Wait for initialized condition
      await timing.waitForCondition(
        () => adapter.initialized,
        { timeout: 1000, interval: 10 }
      );
      
      expect(adapter.initialized).toBe(true);
      await initPromise;
    });
  });

  describe('Randomized Property Testing', () => {
    it('should handle random component names and props', async () => {
      await adapter.initialize();
      
      // Test with 100 random combinations
      for (let i = 0; i < 100; i++) {
        const componentName = generateRandomComponentName();
        const props = generateRandomProps(i); // Use index as seed for reproducibility
        
        const result = adapter.mapComponent(componentName, props);
        
        expect(result.component).toBe(componentName.toLowerCase());
        expect(result.props).toEqual(props);
      }
    });

    it('should maintain consistency with random data', async () => {
      await adapter.initialize();
      
      // Same seed should produce same results
      const seed = 12345;
      const props1 = generateRandomProps(seed);
      const props2 = generateRandomProps(seed);
      
      expect(props1).toEqual(props2);
      
      const result1 = adapter.mapComponent('Button', props1);
      const result2 = adapter.mapComponent('Button', props2);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('Negative Path Testing', () => {
    it('should throw specific error when not initialized', () => {
      expect(() => adapter.mapComponent('Button', {}))
        .toThrow(AdapterError);
      
      try {
        adapter.mapComponent('Button', {});
      } catch (error) {
        helpers.assertExactError(error as Error, new AdapterError(
          'Adapter not initialized',
          'NOT_INITIALIZED'
        ));
      }
    });

    it('should handle null and undefined values gracefully', async () => {
      await adapter.initialize();
      
      // Test with null props
      expect(() => adapter.mapComponent('Button', null as any))
        .not.toThrow();
      
      // Test with undefined styles
      expect(() => adapter.translateStyles(undefined as any))
        .not.toThrow();
      
      // Test with empty tokens
      const result = adapter.convertTokens({} as any);
      expect(result).toEqual({});
    });

    it('should reject invalid operations', async () => {
      await adapter.initialize();
      
      // Double initialization should fail
      await expect(adapter.initialize())
        .rejects.toThrow('Adapter already initialized');
      
      // Invalid component names should still work but lowercase
      const result = adapter.mapComponent('', {});
      expect(result.component).toBe('');
      
      const specialChars = adapter.mapComponent('!@#$%', {});
      expect(specialChars.component).toBe('!@#$%');
    });

    it('should handle error propagation correctly', async () => {
      const pluginManager = adapter.getPluginManager();
      const failingPlugin = createMockPlugin('error-plugin');
      
      (failingPlugin.initialize as any).mockRejectedValue(
        new Error('Plugin initialization failed')
      );
      
      await pluginManager.registerPlugin(failingPlugin);
      
      await expect(adapter.initialize())
        .rejects.toThrow('Plugin initialization failed');
    });
  });

  describe('Plugin Integration with Exact Outputs', () => {
    it('should apply plugin transformations in exact order', async () => {
      const pluginManager = adapter.getPluginManager();
      const plugins = createPluginChain(3);
      
      // Register in specific order with priorities
      await pluginManager.registerPlugin(plugins[0], { priority: 30 });
      await pluginManager.registerPlugin(plugins[1], { priority: 20 });
      await pluginManager.registerPlugin(plugins[2], { priority: 10 });
      
      await adapter.initialize();
      
      const result = await pluginManager.executeBeforeComponentMapping(
        adapter,
        'Button',
        { original: true }
      );
      
      // Assert exact transformation order
      expect(result).toEqual({
        original: true,
        plugin0: true,
        chainOrder: [0, 1, 2],
        plugin1: true,
        plugin2: true,
      });
      
      // Verify order was priority-based (high to low)
      expect(result.chainOrder).toEqual([0, 1, 2]);
    });

    it('should produce exact accessibility enhancements', async () => {
      const pluginManager = adapter.getPluginManager();
      const a11yPlugin = new AccessibilityPlugin({
        enableAriaLabels: true,
        enableKeyboardNavigation: true,
        enableFocusManagement: false,
        enableColorContrast: false,
        enableScreenReaderSupport: false,
      });
      
      await pluginManager.registerPlugin(a11yPlugin);
      await adapter.initialize();
      
      const result = await pluginManager.executeBeforeComponentMapping(
        adapter,
        'Button',
        { children: 'Submit Form' }
      );
      
      // Assert exact accessibility props
      expect(result).toEqual({
        children: 'Submit Form',
        'aria-label': 'Submit Form',
        tabIndex: 0,
        onKeyDown: expect.any(Function),
      });
      
      // Test keyboard handler
      const mockEvent = {
        key: 'Enter',
        target: { click: vi.fn() },
        preventDefault: vi.fn(),
      };
      
      result.onKeyDown(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.target.click).toHaveBeenCalled();
    });
  });

  describe('State Isolation', () => {
    it('should not leak state between instances', async () => {
      const adapter1 = new TestAdapter(createValidAdapterConfig({ name: 'adapter-1' }));
      const adapter2 = new TestAdapter(createValidAdapterConfig({ name: 'adapter-2' }));
      
      await adapter1.initialize();
      expect(adapter1.initialized).toBe(true);
      expect(adapter2.initialized).toBe(false);
      
      const result1 = adapter1.mapComponent('Button', { adapter: 1 });
      
      await adapter2.initialize();
      const result2 = adapter2.mapComponent('Button', { adapter: 2 });
      
      expect(result1.props).toEqual({ adapter: 1 });
      expect(result2.props).toEqual({ adapter: 2 });
      
      await adapter1.cleanup();
      expect(adapter1.initialized).toBe(false);
      expect(adapter2.initialized).toBe(true);
      
      await adapter2.cleanup();
    });

    it('should isolate plugin state between adapters', async () => {
      const adapter1 = new TestAdapter(createValidAdapterConfig());
      const adapter2 = new TestAdapter(createValidAdapterConfig());
      
      const plugin1 = createMockPlugin('shared-plugin');
      const plugin2 = createMockPlugin('shared-plugin');
      
      await adapter1.getPluginManager().registerPlugin(plugin1);
      await adapter2.getPluginManager().registerPlugin(plugin2);
      
      await adapter1.initialize();
      await adapter2.initialize();
      
      expect(plugin1.initialize).toHaveBeenCalledWith(adapter1);
      expect(plugin2.initialize).toHaveBeenCalledWith(adapter2);
      
      await adapter1.cleanup();
      await adapter2.cleanup();
    });
  });
});