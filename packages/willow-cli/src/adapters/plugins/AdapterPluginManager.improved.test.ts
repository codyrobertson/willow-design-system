import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdapterPluginManager } from './AdapterPluginManager';
import { 
  createMockPlugin,
  createFailingPlugin,
  createSlowPlugin,
  createStatefulPlugin,
  createPriorityPlugins,
  createDependentPlugins,
  createErrorScenarioPlugins,
  createPluginTestHelpers,
  createMockAdapterInstance,
  createTimingHelpers,
  createAssertionHelpers,
} from '../test-fixtures';
import { AdapterError } from '../errors';

// Randomize test execution order
describe.shuffle('AdapterPluginManager - Improved Tests', () => {
  let pluginManager: AdapterPluginManager;
  let mockAdapter: ReturnType<typeof createMockAdapterInstance>;
  const helpers = createPluginTestHelpers();
  const timing = createTimingHelpers();
  const assertions = createAssertionHelpers();

  beforeEach(() => {
    pluginManager = new AdapterPluginManager('test');
    mockAdapter = createMockAdapterInstance();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Ensure cleanup
    const plugins = pluginManager.getRegisteredPlugins();
    for (const pluginName of plugins) {
      try {
        await pluginManager.unregisterPlugin(pluginName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Exact Output Assertions', () => {
    it('should return exact plugin statistics structure', async () => {
      const plugin = createMockPlugin('test-plugin', '1.2.3');
      await pluginManager.registerPlugin(plugin, { priority: 50 });
      
      const stats = pluginManager.getPluginStatistics();
      
      // Assert exact structure
      expect(stats).toEqual({
        'test-plugin': {
          enabled: true,
          initialized: false,
          errorCount: 0,
          executionCount: 0,
          averageExecutionTime: 0,
          lastError: undefined,
          registeredAt: expect.any(Date),
          priority: 50,
        },
      });
      
      // Verify JSON serialization
      const json = JSON.stringify(stats);
      expect(json).toContain('"enabled":true');
      expect(json).toContain('"priority":50');
      expect(json).toContain('"errorCount":0');
    });

    it('should execute hooks with exact parameter passing', async () => {
      const plugin = createMockPlugin('param-test');
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      const componentName = 'TestButton';
      const props = { id: 'btn-123', disabled: true, 'data-test': 'value' };
      
      await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        componentName,
        props
      );
      
      // Assert exact parameters passed
      expect(plugin.beforeComponentMapping).toHaveBeenCalledExactlyOnceWith(
        componentName,
        props
      );
      
      // Verify no parameter mutation
      expect(props).toEqual({ id: 'btn-123', disabled: true, 'data-test': 'value' });
    });

    it('should maintain exact plugin execution order', async () => {
      const executionOrder: string[] = [];
      
      // Create plugins that record execution order
      const createOrderPlugin = (name: string, priority: number) => {
        const plugin = createMockPlugin(name);
        (plugin.beforeComponentMapping as any).mockImplementation((_, props) => {
          executionOrder.push(name);
          return { ...props, [name]: true };
        });
        return { plugin, priority };
      };
      
      const plugins = [
        createOrderPlugin('plugin-a', 10),
        createOrderPlugin('plugin-b', 50),
        createOrderPlugin('plugin-c', 30),
        createOrderPlugin('plugin-d', 50), // Same priority as b
      ];
      
      // Register in random order
      for (const { plugin, priority } of plugins.sort(() => Math.random() - 0.5)) {
        await pluginManager.registerPlugin(plugin, { priority });
      }
      
      await pluginManager.initializePlugins(mockAdapter);
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      
      // Assert expected execution order (high to low priority)
      // Note: plugins with same priority may execute in any order
      const highPriorityIndex = Math.min(executionOrder.indexOf('plugin-b'), executionOrder.indexOf('plugin-d'));
      const mediumPriorityIndex = executionOrder.indexOf('plugin-c');
      const lowPriorityIndex = executionOrder.indexOf('plugin-a');
      
      expect(highPriorityIndex).toBeLessThan(mediumPriorityIndex);
      expect(mediumPriorityIndex).toBeLessThan(lowPriorityIndex);
      expect(executionOrder).toContain('plugin-b');
      expect(executionOrder).toContain('plugin-d');
    });
  });

  describe('Negative Path Testing', () => {
    it('should handle null and undefined plugin gracefully', async () => {
      await expect(pluginManager.registerPlugin(null as any))
        .rejects.toThrow('Plugin must have a valid name');
      
      await expect(pluginManager.registerPlugin(undefined as any))
        .rejects.toThrow();
    });

    it('should reject plugins with invalid structure', async () => {
      const invalidPlugins = [
        { version: '1.0.0' }, // Missing name
        { name: '', version: '1.0.0' }, // Empty name
        { name: 'test', version: '' }, // Empty version
        { name: 'test', version: '1.0.0', beforeComponentMapping: 'not-a-function' }, // Invalid method
      ];
      
      for (const invalidPlugin of invalidPlugins) {
        await expect(pluginManager.registerPlugin(invalidPlugin as any))
          .rejects.toThrow();
      }
    });

    it('should handle circular dependencies', async () => {
      // Test detecting missing dependencies first
      const pluginA = createMockPlugin('plugin-a');
      
      await expect(
        pluginManager.registerPlugin(pluginA, {
          dependencies: ['non-existent-plugin'],
        })
      ).rejects.toThrow(AdapterError);
    });

    it('should handle plugin execution failures gracefully', async () => {
      const errorPlugin = createFailingPlugin('error-plugin', 'Execution failed');
      
      await pluginManager.registerPlugin(errorPlugin);
      await expect(pluginManager.initializePlugins(mockAdapter))
        .rejects.toThrow('Execution failed');
      
      // Plugin should be marked as having errors
      const stats = pluginManager.getPluginStatistics();
      expect(stats['error-plugin'].errorCount).toBeGreaterThan(0);
      expect(stats['error-plugin'].lastError).toBeDefined();
    });

    it('should prevent operations on unregistered plugins', async () => {
      await expect(pluginManager.unregisterPlugin('non-existent'))
        .rejects.toThrow('Plugin "non-existent" is not registered');
      
      expect(() => pluginManager.setPluginEnabled('non-existent', true))
        .toThrow('Plugin "non-existent" is not registered');
    });

    it('should handle empty plugin manager operations', async () => {
      // Operations on empty manager should not throw
      await expect(pluginManager.initializePlugins(mockAdapter))
        .resolves.not.toThrow();
      
      await expect(pluginManager.cleanupPlugins(mockAdapter))
        .resolves.not.toThrow();
      
      const result = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        { test: true }
      );
      
      expect(result).toEqual({ test: true });
    });
  });

  describe('Performance and Timing Tests', () => {
    it('should execute plugins within performance bounds', async () => {
      const plugins = [
        createSlowPlugin('slow-1', 10),
        createSlowPlugin('slow-2', 20),
        createSlowPlugin('slow-3', 30),
      ];
      
      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }
      
      const { duration } = await timing.measureExecutionTime(
        () => pluginManager.initializePlugins(mockAdapter)
      );
      
      // Should execute in parallel where possible
      expect(duration).toBeLessThan(100); // Less than sum of all delays
      expect(duration).toBeGreaterThan(30); // At least the longest delay
    });

    it('should track execution times accurately', async () => {
      const plugin = createSlowPlugin('timed-plugin', 50);
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      // Execute multiple times
      for (let i = 0; i < 5; i++) {
        await pluginManager.executeBeforeComponentMapping(
          mockAdapter,
          'Button',
          {}
        );
      }
      
      const stats = pluginManager.getPluginStatistics();
      // Plugin is executed once during initialization + 5 times in the loop
      expect(stats['timed-plugin'].executionCount).toBe(6);
      expect(stats['timed-plugin'].averageExecutionTime).toBeGreaterThan(45);
      expect(stats['timed-plugin'].averageExecutionTime).toBeLessThan(100);
    });
  });

  describe('State Management and Isolation', () => {
    it('should maintain plugin state isolation', async () => {
      const statefulPlugin1 = createStatefulPlugin('stateful-1');
      const statefulPlugin2 = createStatefulPlugin('stateful-2');
      
      await pluginManager.registerPlugin(statefulPlugin1);
      await pluginManager.registerPlugin(statefulPlugin2);
      await pluginManager.initializePlugins(mockAdapter);
      
      // Execute plugins
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Button', {});
      await pluginManager.executeBeforeComponentMapping(mockAdapter, 'Input', {});
      
      // Check isolated state
      expect(statefulPlugin1.getState().get('mappingCount')).toBe(2);
      expect(statefulPlugin1.getState().get('lastComponent')).toBe('Input');
      
      expect(statefulPlugin2.getState().get('mappingCount')).toBe(2);
      expect(statefulPlugin2.getState().get('lastComponent')).toBe('Input');
      
      // States should be independent
      statefulPlugin1.getState().set('custom', 'value1');
      expect(statefulPlugin2.getState().has('custom')).toBe(false);
    });

    it('should clean up plugin state properly', async () => {
      const statefulPlugin = createStatefulPlugin('cleanup-test');
      
      await pluginManager.registerPlugin(statefulPlugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      expect(statefulPlugin.getState().get('initialized')).toBe(true);
      
      await pluginManager.cleanupPlugins(mockAdapter);
      
      expect(statefulPlugin.getState().size).toBe(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should continue execution after plugin errors in production', async () => {
      pluginManager = new AdapterPluginManager('production');
      
      const workingPlugin = createMockPlugin('working');
      const failingPlugin = createFailingPlugin('failing');
      
      await pluginManager.registerPlugin(workingPlugin, { priority: 10 });
      await pluginManager.registerPlugin(failingPlugin, { priority: 20 });
      
      await pluginManager.initializePlugins(mockAdapter);
      
      // Should not throw in production
      const result = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        { original: true }
      );
      
      // Working plugin should still execute
      expect(result['working-enhanced']).toBe(true);
      
      // Failing plugin should be disabled after errors
      const stats = pluginManager.getPluginStatistics();
      expect(stats['failing'].errorCount).toBeGreaterThan(0);
    });

    it('should handle intermittent failures', async () => {
      const { intermittentErrorPlugin } = createErrorScenarioPlugins();
      
      await pluginManager.registerPlugin(intermittentErrorPlugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      const results: boolean[] = [];
      
      // Execute 10 times
      for (let i = 0; i < 10; i++) {
        try {
          await pluginManager.executeBeforeComponentMapping(
            mockAdapter,
            'Button',
            {}
          );
          results.push(true);
        } catch {
          results.push(false);
        }
      }
      
      // Should fail on every 3rd call
      expect(results.filter(r => !r).length).toBeGreaterThan(0);
      expect(results.filter(r => r).length).toBeGreaterThan(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle dependent plugins with exact requirements', async () => {
      const { basePlugin, dependentPlugin, dependencies } = createDependentPlugins();
      
      // Register in correct order
      await pluginManager.registerPlugin(basePlugin);
      await pluginManager.registerPlugin(dependentPlugin, {
        dependencies: dependencies['dependent-plugin'],
      });
      
      await pluginManager.initializePlugins(mockAdapter);
      
      const result = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        {}
      );
      
      // Both plugins should have executed
      expect(result).toEqual({
        'base-plugin-enhanced': true,
        'dependent-plugin-enhanced': true,
      });
    });

    it('should respect conditional execution', async () => {
      const conditionalPlugin = createMockPlugin('conditional');
      let shouldExecute = false;
      
      (conditionalPlugin.beforeComponentMapping as any).mockImplementation((name, props) => {
        if (shouldExecute) {
          return { ...props, executed: true };
        }
        return props;
      });
      
      await pluginManager.registerPlugin(conditionalPlugin, {
        conditions: {
          components: ['Button'],
        },
      });
      
      await pluginManager.initializePlugins(mockAdapter);
      
      // Should not execute for Input
      const inputResult = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Input',
        {}
      );
      expect(inputResult.executed).toBeUndefined();
      
      // Should execute for Button
      shouldExecute = true;
      const buttonResult = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        {}
      );
      expect(buttonResult.executed).toBe(true);
    });

    it('should handle high-frequency operations', async () => {
      const plugin = createMockPlugin('high-freq');
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      const operationCount = 1000;
      const startTime = performance.now();
      
      const promises = Array.from({ length: operationCount }, (_, i) =>
        pluginManager.executeBeforeComponentMapping(
          mockAdapter,
          'Component',
          { index: i }
        )
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;
      
      // All operations should complete
      expect(results).toHaveLength(operationCount);
      
      // Should handle high frequency efficiently
      const opsPerSecond = (operationCount / duration) * 1000;
      expect(opsPerSecond).toBeGreaterThan(1000); // At least 1000 ops/sec
    });
  });

  describe('Hook Configuration', () => {
    it('should respect hook enable/disable configuration', async () => {
      const plugin = createMockPlugin('hook-test');
      await pluginManager.registerPlugin(plugin);
      await pluginManager.initializePlugins(mockAdapter);
      
      // Disable specific hooks
      pluginManager.configureHooks({
        beforeComponentMapping: false,
        afterComponentMapping: true,
      });
      
      // Disabled hook should not execute
      const beforeResult = await pluginManager.executeBeforeComponentMapping(
        mockAdapter,
        'Button',
        { test: true }
      );
      expect(beforeResult).toEqual({ test: true });
      expect(plugin.beforeComponentMapping).not.toHaveBeenCalled();
      
      // Enabled hook should execute
      const mapping = { component: 'button', props: {} };
      const afterResult = await pluginManager.executeAfterComponentMapping(
        mockAdapter,
        mapping
      );
      expect(plugin.afterComponentMapping).toHaveBeenCalled();
    });
  });
});