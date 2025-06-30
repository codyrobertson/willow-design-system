import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createValidAdapterConfig,
  createLargeDatasets,
  createTimingHelpers,
  createMockPlugin,
  createSlowPlugin,
} from '../test-fixtures';
import { AdapterConfig, AdapterInstance } from '../types';
import { AdapterError } from '../errors';
import { AdapterPluginManager } from '../plugins/AdapterPluginManager';

// Mark as integration test for CI
describe('Adapter Integration Tests', { timeout: 30000, tag: 'integration' }, () => {
  const timing = createTimingHelpers();

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', { timeout: 10000 }, async () => {
      // Create test adapter
      class TestAdapter implements AdapterInstance {
        id = 'perf-test';
        config: AdapterConfig;
        initialized = true;
        
        constructor(config: AdapterConfig) {
          this.config = config;
        }
        
        async initialize() {}
        
        mapComponent(name: string, props: Record<string, unknown>) {
          // Simulate processing
          return { component: name, props };
        }
        
        translateStyles(styles: any) {
          // Simulate complex style processing
          const result: any = {};
          Object.entries(styles).forEach(([key, value]) => {
            if (typeof value === 'object') {
              result[key] = this.translateStyles(value);
            } else {
              result[key] = value;
            }
          });
          return result;
        }
        
        convertTokens(tokens: any) {
          return tokens;
        }
        
        validateConfig() {
          return { valid: true, errors: [], warnings: [] };
        }
        
        async cleanup() {}
      }

      const adapter = new TestAdapter(createValidAdapterConfig());
      const { largeComponentList, largeStyleConfig, largeTokenConfig } = createLargeDatasets();

      // Test component mapping performance
      const { duration: mappingDuration } = await timing.measureExecutionTime(async () => {
        const results = largeComponentList.map(({ name, props }) => 
          adapter.mapComponent(name, props)
        );
        expect(results).toHaveLength(1000);
      });

      expect(mappingDuration).toBeLessThan(1000); // Should process 1000 components in under 1s

      // Test style translation performance
      const { duration: styleDuration } = await timing.measureExecutionTime(async () => {
        const result = adapter.translateStyles(largeStyleConfig);
        expect(Object.keys(result.base || {}).length).toBeGreaterThan(50);
      });

      expect(styleDuration).toBeLessThan(500); // Should process large styles in under 500ms

      // Test token conversion performance
      const { duration: tokenDuration } = await timing.measureExecutionTime(async () => {
        const result = adapter.convertTokens(largeTokenConfig);
        expect(Object.keys(result.tokens?.colors || {}).length).toBeGreaterThan(10);
      });

      expect(tokenDuration).toBeLessThan(200); // Should process tokens quickly
    });

    it('should handle concurrent plugin operations', { timeout: 15000 }, async () => {
      const pluginManager = new AdapterPluginManager('test');
      const mockAdapter = {
        id: 'concurrent-test',
        config: createValidAdapterConfig(),
        initialized: true,
      } as AdapterInstance;

      // Register multiple slow plugins
      const pluginCount = 10;
      const plugins = Array.from({ length: pluginCount }, (_, i) => 
        createSlowPlugin(`slow-plugin-${i}`, 50 + i * 10) // Varying delays
      );

      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      // Initialize all plugins concurrently
      const { duration: initDuration } = await timing.measureExecutionTime(
        () => pluginManager.initializePlugins(mockAdapter)
      );

      // Should be faster than sequential execution
      const maxDelay = 50 + (pluginCount - 1) * 10;
      expect(initDuration).toBeLessThan(maxDelay * pluginCount); // Should be faster than fully sequential

      // Test concurrent hook execution
      const operations = 100;
      const { duration: hookDuration } = await timing.measureExecutionTime(async () => {
        const promises = Array.from({ length: operations }, (_, i) =>
          pluginManager.executeBeforeComponentMapping(
            mockAdapter,
            `Component${i}`,
            { index: i }
          )
        );
        
        const results = await Promise.all(promises);
        expect(results).toHaveLength(operations);
      });

      const avgTimePerOp = hookDuration / operations;
      expect(avgTimePerOp).toBeLessThan(3000); // Should handle many operations efficiently
    });
  });

  describe('Memory Stress Tests', () => {
    it('should not leak memory during repeated operations', { timeout: 20000 }, async () => {
      const pluginManager = new AdapterPluginManager('test');
      const mockAdapter = {
        id: 'memory-test',
        config: createValidAdapterConfig(),
        initialized: true,
      } as AdapterInstance;

      // Create a plugin that holds some data
      const memoryPlugin = createMockPlugin('memory-test');
      const dataCache = new Map<string, any>();

      (memoryPlugin.beforeComponentMapping as any).mockImplementation((name: string, props: any) => {
        // Simulate caching behavior
        const key = `${name}-${JSON.stringify(props)}`;
        if (!dataCache.has(key)) {
          dataCache.set(key, { ...props, processed: new Array(100).fill('data') });
        }
        return dataCache.get(key);
      });

      await pluginManager.registerPlugin(memoryPlugin);
      await pluginManager.initializePlugins(mockAdapter);

      // Perform many operations
      const iterations = 1000;
      
      if (global.gc) {
        global.gc(); // Force GC if available
      }

      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        await pluginManager.executeBeforeComponentMapping(
          mockAdapter,
          `Component${i % 10}`, // Reuse some component names
          { iteration: i, data: `test-${i}` }
        );

        // Periodically clear old cache entries
        if (i % 100 === 0 && dataCache.size > 50) {
          const entriesToDelete = Array.from(dataCache.keys()).slice(0, 25);
          entriesToDelete.forEach(key => dataCache.delete(key));
        }
      }

      if (global.gc) {
        global.gc(); // Force GC if available
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseInMB = memoryIncrease / 1024 / 1024;

      // Should not increase memory usage by more than 50MB
      expect(memoryIncreaseInMB).toBeLessThan(50);
    });
  });

  describe('Error Recovery Under Load', () => {
    it('should maintain stability with intermittent failures', { timeout: 10000 }, async () => {
      const pluginManager = new AdapterPluginManager('production'); // Production mode for error recovery
      const mockAdapter = {
        id: 'error-recovery-test',
        config: createValidAdapterConfig(),
        initialized: true,
      } as AdapterInstance;

      // Mix of working and failing plugins
      const plugins = [
        createMockPlugin('stable-1'),
        createMockPlugin('stable-2'),
        {
          ...createMockPlugin('intermittent'),
          beforeComponentMapping: vi.fn().mockImplementation(() => {
            if (Math.random() > 0.7) { // 30% failure rate
              throw new Error('Random failure');
            }
            return { processed: true };
          }),
        },
        createMockPlugin('stable-3'),
      ];

      for (const plugin of plugins) {
        await pluginManager.registerPlugin(plugin);
      }

      await pluginManager.initializePlugins(mockAdapter);

      // Run many operations
      const operations = 500;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < operations; i++) {
        try {
          await pluginManager.executeBeforeComponentMapping(
            mockAdapter,
            'TestComponent',
            { operation: i }
          );
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      // System should remain stable despite errors
      expect(successCount).toBeGreaterThan(operations * 0.6); // At least 60% success
      expect(errorCount).toBeLessThan(operations * 0.4); // Less than 40% errors

      // Verify other plugins continued working
      const stats = pluginManager.getPluginStatistics();
      expect(stats['stable-1'].errorCount).toBe(0);
      expect(stats['stable-2'].errorCount).toBe(0);
      expect(stats['stable-3'].errorCount).toBe(0);
    });
  });

  describe('Real-world Workflow Simulation', () => {
    it('should handle complex multi-adapter scenario', { timeout: 20000 }, async () => {
      // Simulate a real app with multiple UI framework adapters
      const adapters = ['react', 'vue', 'angular'].map(framework => {
        const manager = new AdapterPluginManager('production');
        return {
          framework,
          manager,
          config: createValidAdapterConfig({ 
            name: `${framework}-adapter`,
            framework: { name: framework, version: '1.0.0' },
          }),
        };
      });

      // Each adapter gets different plugins
      const commonPlugin = createMockPlugin('common-plugin');
      const reactPlugin = createMockPlugin('react-specific');
      const vuePlugin = createMockPlugin('vue-specific');

      // Register plugins
      for (const { framework, manager } of adapters) {
        await manager.registerPlugin(commonPlugin);
        
        if (framework === 'react') {
          await manager.registerPlugin(reactPlugin);
        } else if (framework === 'vue') {
          await manager.registerPlugin(vuePlugin);
        }
      }

      // Simulate concurrent operations across adapters
      const componentsPerAdapter = 100;
      const operations = adapters.flatMap(({ manager, config }) =>
        Array.from({ length: componentsPerAdapter }, (_, i) => ({
          manager,
          adapter: { id: config.name, config, initialized: true } as AdapterInstance,
          component: `Component${i}`,
          props: { framework: config.framework.name, index: i },
        }))
      );

      // Shuffle operations to simulate random access pattern
      const shuffled = operations.sort(() => Math.random() - 0.5);

      const { duration } = await timing.measureExecutionTime(async () => {
        const results = await Promise.all(
          shuffled.map(({ manager, adapter, component, props }) =>
            manager.executeBeforeComponentMapping(adapter, component, props)
          )
        );

        expect(results).toHaveLength(adapters.length * componentsPerAdapter);
      });

      // Should handle all operations efficiently
      const avgTimePerOp = duration / (adapters.length * componentsPerAdapter);
      expect(avgTimePerOp).toBeLessThan(5); // Less than 5ms per operation average
    });
  });
});