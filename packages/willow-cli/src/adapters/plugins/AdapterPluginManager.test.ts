import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { AdapterPluginManager, PluginRegistrationOptions } from './AdapterPluginManager';
import { AccessibilityPlugin } from './builtin/AccessibilityPlugin';
import { AdapterError } from '../errors';
import { AdapterPlugin, AdapterInstance, ComponentMapping, StyleConfig, TokenConfig, ValidationResult, AdapterConfig } from '../types';

// Mock console methods
const consoleSpy = {
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Mock adapter instance
const createMockAdapter = (): AdapterInstance => ({
  id: 'test-adapter',
  config: {
    name: 'test-adapter',
    version: '1.0.0',
    capabilities: ['component-mapping'],
    framework: { name: 'react', version: '18.0.0' },
    options: {},
  },
  initialized: false,
  initialize: vi.fn().mockResolvedValue(undefined),
  mapComponent: vi.fn(),
  translateStyles: vi.fn(),
  convertTokens: vi.fn(),
  validateConfig: vi.fn(),
  cleanup: vi.fn().mockResolvedValue(undefined),
});

// Mock plugin
const createMockPlugin = (name: string = 'test-plugin'): AdapterPlugin => ({
  name,
  version: '1.0.0',
  description: 'Test plugin',
  initialize: vi.fn().mockResolvedValue(undefined),
  beforeComponentMapping: vi.fn((name, props) => ({ ...props, testProp: 'added' })),
  afterComponentMapping: vi.fn((mapping) => ({ ...mapping, enhanced: true })),
  beforeStyleTranslation: vi.fn((styles) => ({ ...styles, enhanced: true })),
  afterStyleTranslation: vi.fn((styles) => ({ ...styles, processed: true })),
  beforeTokenConversion: vi.fn((tokens) => ({ ...tokens, enhanced: true })),
  afterTokenConversion: vi.fn((tokens) => ({ ...tokens, processed: true })),
  beforeValidation: vi.fn((config) => ({ ...config, validated: true })),
  afterValidation: vi.fn((result) => ({ ...result, processed: true })),
  onError: vi.fn(),
  cleanup: vi.fn().mockResolvedValue(undefined),
});

describe('AdapterPluginManager', () => {
  let pluginManager: AdapterPluginManager;
  let mockAdapter: AdapterInstance;

  beforeEach(() => {
    pluginManager = new AdapterPluginManager('development');
    mockAdapter = createMockAdapter();
    
    // Clear console spies
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  describe('Plugin Registration', () => {
    it('should register a plugin successfully', async () => {
      const plugin = createMockPlugin();
      
      await pluginManager.registerPlugin(plugin);
      
      expect(pluginManager.isPluginRegistered('test-plugin')).toBe(true);
      expect(pluginManager.getRegisteredPlugins()).toContain('test-plugin');
    });

    it('should register plugin with custom options', async () => {
      const plugin = createMockPlugin();
      const options: PluginRegistrationOptions = {
        priority: 10,
        enabled: false,
        config: { customSetting: true },
        dependencies: [],
        conditions: {
          adapters: ['specific-adapter'],
          environments: ['development'],
        },
      };
      
      await pluginManager.registerPlugin(plugin, options);
      
      const stats = pluginManager.getPluginStatistics();
      expect(stats['test-plugin'].priority).toBe(10);
      expect(stats['test-plugin'].enabled).toBe(false);
    });

    it('should prevent duplicate plugin registration', async () => {
      const plugin = createMockPlugin();
      
      await pluginManager.registerPlugin(plugin);
      
      await expect(pluginManager.registerPlugin(plugin))
        .rejects.toThrow(AdapterError);
    });

    it('should validate plugin structure', async () => {
      const invalidPlugin = { name: '', version: '1.0.0' } as AdapterPlugin;
      
      await expect(pluginManager.registerPlugin(invalidPlugin))
        .rejects.toThrow('Plugin must have a valid name');
    });

    it('should check plugin dependencies', async () => {
      const dependentPlugin = createMockPlugin('dependent-plugin');
      const options: PluginRegistrationOptions = {
        dependencies: ['missing-plugin'],
      };
      
      await expect(pluginManager.registerPlugin(dependentPlugin, options))
        .rejects.toThrow('depends on "missing-plugin" which is not registered');
    });
  });

  describe('Plugin Unregistration', () => {
    it('should unregister a plugin successfully', async () => {
      const plugin = createMockPlugin();
      
      await pluginManager.registerPlugin(plugin);
      await pluginManager.unregisterPlugin('test-plugin');
      
      expect(pluginManager.isPluginRegistered('test-plugin')).toBe(false);
    });

    it('should handle unregistering non-existent plugin', async () => {
      await expect(pluginManager.unregisterPlugin('non-existent'))
        .rejects.toThrow('Plugin "non-existent" is not registered');
    });

    it('should call cleanup when unregistering initialized plugin', async () => {
      const plugin = createMockPlugin();
      
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      await pluginManager.unregisterPlugin('test-plugin');
      
      expect(plugin.cleanup).toHaveBeenCalled();
    });
  });

  describe('Plugin Initialization', () => {
    it('should initialize all enabled plugins', async () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      
      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);
      
      await pluginManager.initializePlugins(mockAdapter);
      
      expect(plugin1.initialize).toHaveBeenCalledWith(mockAdapter);
      expect(plugin2.initialize).toHaveBeenCalledWith(mockAdapter);
    });

    it('should skip disabled plugins during initialization', async () => {
      const plugin = createMockPlugin();
      
      await pluginManager.registerPlugin(plugin, { enabled: false });
      await pluginManager.initializePlugins(mockAdapter);
      
      expect(plugin.initialize).not.toHaveBeenCalled();
    });

    it('should handle plugin initialization errors in development', async () => {
      const plugin = createMockPlugin();
      (plugin.initialize as MockedFunction<any>).mockRejectedValue(new Error('Init failed'));
      
      await pluginManager.registerPlugin(plugin);
      
      await expect(pluginManager.initializePlugins(mockAdapter))
        .rejects.toThrow('Plugin "test-plugin" initialization failed');
    });

    it('should disable failed plugins in production', async () => {
      pluginManager = new AdapterPluginManager('production');
      const plugin = createMockPlugin();
      (plugin.initialize as MockedFunction<any>).mockRejectedValue(new Error('Init failed'));
      
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      const stats = pluginManager.getPluginStatistics();
      expect(stats['test-plugin'].enabled).toBe(false);
    });
  });

  describe('Hook Execution', () => {
    let plugin: AdapterPlugin;

    beforeEach(async () => {
      plugin = createMockPlugin();
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
    });

    it('should execute beforeComponentMapping hooks', async () => {
      const result = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        { originalProp: 'value' }
      );
      
      expect(plugin.beforeComponentMapping).toHaveBeenCalledWith('Button', { originalProp: 'value' });
      expect(result).toEqual({ originalProp: 'value', testProp: 'added' });
    });

    it('should execute afterComponentMapping hooks', async () => {
      const mapping: ComponentMapping = {
        component: 'button',
        props: { type: 'button' },
      };
      
      const result = await pluginManager.executeAfterComponentMapping(mockAdapter, mapping);
      
      expect(plugin.afterComponentMapping).toHaveBeenCalledWith(mapping);
      expect(result).toEqual({ ...mapping, enhanced: true });
    });

    it('should execute beforeStyleTranslation hooks', async () => {
      const styles: StyleConfig = { base: { color: 'blue' } };
      
      const result = await pluginManager.executeBeforeStyleTranslation(mockAdapter, styles);
      
      expect(plugin.beforeStyleTranslation).toHaveBeenCalledWith(styles);
      expect(result).toEqual({ ...styles, enhanced: true });
    });

    it('should execute afterStyleTranslation hooks', async () => {
      const styles = { color: 'blue' };
      
      const result = await pluginManager.executeAfterStyleTranslation(mockAdapter, styles);
      
      expect(plugin.afterStyleTranslation).toHaveBeenCalledWith(styles);
      expect(result).toEqual({ ...styles, processed: true });
    });

    it('should execute beforeTokenConversion hooks', async () => {
      const tokens: TokenConfig = { category: 'color', path: 'primary', value: '#007bff' };
      
      const result = await pluginManager.executeBeforeTokenConversion(mockAdapter, tokens);
      
      expect(plugin.beforeTokenConversion).toHaveBeenCalledWith(tokens);
      expect(result).toEqual({ ...tokens, enhanced: true });
    });

    it('should execute afterTokenConversion hooks', async () => {
      const tokens = { primary: '#007bff' };
      
      const result = await pluginManager.executeAfterTokenConversion(mockAdapter, tokens);
      
      expect(plugin.afterTokenConversion).toHaveBeenCalledWith(tokens);
      expect(result).toEqual({ ...tokens, processed: true });
    });

    it('should execute beforeValidation hooks', async () => {
      const config: AdapterConfig = mockAdapter.config;
      
      const result = await pluginManager.executeBeforeValidation(mockAdapter, config);
      
      expect(plugin.beforeValidation).toHaveBeenCalledWith(config);
      expect(result).toEqual({ ...config, validated: true });
    });

    it('should execute afterValidation hooks', async () => {
      const validation: ValidationResult = { valid: true, errors: [], warnings: [] };
      
      const result = await pluginManager.executeAfterValidation(mockAdapter, validation);
      
      expect(plugin.afterValidation).toHaveBeenCalledWith(validation);
      expect(result).toEqual({ ...validation, processed: true });
    });

    it('should execute onError hooks', async () => {
      const error = new Error('Test error');
      const context = { component: 'Button' };
      
      await pluginManager.executeOnError(mockAdapter, error, context);
      
      expect(plugin.onError).toHaveBeenCalledWith(error, context);
    });

    it('should handle plugin execution errors gracefully', async () => {
      (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation(() => {
        throw new Error('Plugin error');
      });
      
      // In development mode, should throw
      await expect(
        pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {})
      ).rejects.toThrow('Plugin "test-plugin" execution failed');
    });
  });

  describe('Plugin Priority and Conditions', () => {
    it('should execute plugins in priority order', async () => {
      const execOrder: string[] = [];
      
      const highPriorityPlugin = createMockPlugin('high-priority');
      (highPriorityPlugin.beforeComponentMapping as MockedFunction<any>).mockImplementation(() => {
        execOrder.push('high');
        return {};
      });
      
      const lowPriorityPlugin = createMockPlugin('low-priority');
      (lowPriorityPlugin.beforeComponentMapping as MockedFunction<any>).mockImplementation(() => {
        execOrder.push('low');
        return {};
      });
      
      await pluginManager.registerPlugin(lowPriorityPlugin, { priority: 1 });
      await pluginManager.registerPlugin(highPriorityPlugin, { priority: 10 });
      await pluginManager.initializePlugins(mockAdapter);
      
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      
      expect(execOrder).toEqual(['high', 'low']);
    });

    it('should respect adapter conditions', async () => {
      const plugin = createMockPlugin();
      await pluginManager.registerPlugin(plugin, {
        conditions: { adapters: ['other-adapter'] }
      });
      await pluginManager.initializePlugins(mockAdapter);
      
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      
      expect(plugin.beforeComponentMapping).not.toHaveBeenCalled();
    });

    it('should respect component conditions', async () => {
      const plugin = createMockPlugin();
      await pluginManager.registerPlugin(plugin, {
        conditions: { components: ['Input'] }
      });
      await pluginManager.initializePlugins(mockAdapter);
      
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      
      expect(plugin.beforeComponentMapping).not.toHaveBeenCalled();
    });

    it('should respect environment conditions', async () => {
      const plugin = createMockPlugin();
      await pluginManager.registerPlugin(plugin, {
        conditions: { environments: ['production'] }
      });
      await pluginManager.initializePlugins(mockAdapter);
      
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      
      expect(plugin.beforeComponentMapping).not.toHaveBeenCalled();
    });
  });

  describe('Plugin Management', () => {
    it('should enable and disable plugins', async () => {
      const plugin = createMockPlugin();
      await pluginManager.registerPlugin(plugin);
      
      pluginManager.setPluginEnabled('test-plugin', false);
      expect(pluginManager.getPluginStatistics()['test-plugin'].enabled).toBe(false);
      
      pluginManager.setPluginEnabled('test-plugin', true);
      expect(pluginManager.getPluginStatistics()['test-plugin'].enabled).toBe(true);
    });

    it('should configure hooks', () => {
      pluginManager.configureHooks({
        beforeComponentMapping: false,
        afterComponentMapping: true,
      });
      
      // Hooks configuration is internal, test through behavior
      expect(() => pluginManager.configureHooks({})).not.toThrow();
    });

    it('should provide plugin statistics', async () => {
      const plugin = createMockPlugin();
      await pluginManager.registerPlugin(plugin, { priority: 5 });
      
      const stats = pluginManager.getPluginStatistics();
      
      expect(stats['test-plugin']).toMatchObject({
        enabled: true,
        initialized: false,
        errorCount: 0,
        executionCount: 0,
        averageExecutionTime: 0,
        priority: 5,
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all initialized plugins', async () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      
      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);
      await pluginManager.initializePlugins(mockAdapter);
      
      await pluginManager.cleanupPlugins(mockAdapter);
      
      expect(plugin1.cleanup).toHaveBeenCalled();
      expect(plugin2.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const plugin = createMockPlugin();
      (plugin.cleanup as MockedFunction<any>).mockRejectedValue(new Error('Cleanup failed'));
      
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      await expect(pluginManager.cleanupPlugins(mockAdapter)).resolves.not.toThrow();
      
      // The warning is logged but console.warn spy might not catch it due to async timing
      // Check that the plugin state reflects the error instead
      const stats = pluginManager.getPluginStatistics();
      expect(stats['test-plugin'].errorCount).toBeGreaterThan(0);
      expect(stats['test-plugin'].lastError).toBeDefined();
      expect(stats['test-plugin'].lastError).toBe('Cleanup failed');
    });
  });

  describe('Performance Tracking', () => {
    it('should track plugin execution timing', async () => {
      const plugin = createMockPlugin();
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      
      const stats = pluginManager.getPluginStatistics();
      expect(stats['test-plugin'].executionCount).toBeGreaterThanOrEqual(1);
      expect(stats['test-plugin'].averageExecutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should track plugin error counts', async () => {
      pluginManager = new AdapterPluginManager('production');
      const plugin = createMockPlugin();
      (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation(() => {
        throw new Error('Plugin error');
      });
      
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      // Execute multiple times to trigger error counting
      for (let i = 0; i < 3; i++) {
        await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      }
      
      const stats = pluginManager.getPluginStatistics();
      expect(stats['test-plugin'].errorCount).toBeGreaterThanOrEqual(3);
    });

    it('should disable plugins with frequent errors in production', async () => {
      pluginManager = new AdapterPluginManager('production');
      const plugin = createMockPlugin();
      (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation(() => {
        throw new Error('Plugin error');
      });
      
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      // Execute enough times to trigger auto-disable (5+ errors)
      for (let i = 0; i < 6; i++) {
        await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      }
      
      const stats = pluginManager.getPluginStatistics();
      expect(stats['test-plugin'].enabled).toBe(false);
    });
  });

  describe('Real Plugin Integration', () => {
    it('should work with AccessibilityPlugin', async () => {
      const accessibilityPlugin = new AccessibilityPlugin();
      
      await pluginManager.registerPlugin(accessibilityPlugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      const result = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        { children: 'Click me' }
      );
      
      expect(result).toHaveProperty('aria-label');
      expect(result).toHaveProperty('tabIndex');
    });

    it('should handle multiple real plugins working together', async () => {
      const accessibilityPlugin = new AccessibilityPlugin();
      const testPlugin = createMockPlugin('test-enhancement');
      
      await pluginManager.registerPlugin(accessibilityPlugin, { priority: 10 });
      await pluginManager.registerPlugin(testPlugin, { priority: 5 });
      await pluginManager.initializePlugins(mockAdapter);
      
      const result = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        { children: 'Click me' }
      );
      
      // Should have both accessibility enhancements and test plugin modifications
      expect(result).toHaveProperty('aria-label');
      expect(result).toHaveProperty('testProp', 'added');
    });
  });
});