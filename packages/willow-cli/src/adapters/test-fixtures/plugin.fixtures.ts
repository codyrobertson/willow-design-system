import { AdapterPlugin, AdapterInstance, ComponentMapping, StyleConfig, TokenConfig, ValidationResult, AdapterConfig } from '../types';
import { vi, MockedFunction } from 'vitest';

/**
 * Test fixture factories for plugin testing
 */

// ============================================================================
// Plugin Fixtures
// ============================================================================

export const createMockPlugin = (
  name: string = 'test-plugin',
  version: string = '1.0.0'
): AdapterPlugin => ({
  name,
  version,
  description: `Mock plugin ${name} for testing`,
  
  initialize: vi.fn().mockResolvedValue(undefined),
  
  beforeComponentMapping: vi.fn().mockImplementation((componentName, props) => ({
    ...props,
    [`${name}-enhanced`]: true,
  })),
  
  afterComponentMapping: vi.fn().mockImplementation((mapping) => ({
    ...mapping,
    metadata: {
      ...mapping.metadata,
      [`${name}-processed`]: true,
    },
  })),
  
  beforeStyleTranslation: vi.fn().mockImplementation((styles) => ({
    ...styles,
    custom: {
      ...styles.custom,
      [`--${name}-variable`]: 'value',
    },
  })),
  
  afterStyleTranslation: vi.fn().mockImplementation((styles) => ({
    ...styles,
    [`${name}Styles`]: { processed: true },
  })),
  
  beforeTokenConversion: vi.fn().mockImplementation((tokens) => ({
    ...tokens,
    metadata: {
      ...tokens.metadata,
      [`${name}Processed`]: true,
    },
  })),
  
  afterTokenConversion: vi.fn().mockImplementation((tokens) => ({
    ...tokens,
    [`${name}Tokens`]: { converted: true },
  })),
  
  beforeValidation: vi.fn().mockImplementation((config) => ({
    ...config,
    metadata: {
      ...config.metadata,
      [`${name}Validated`]: true,
    },
  })),
  
  afterValidation: vi.fn().mockImplementation((result) => ({
    ...result,
    context: {
      ...result.context,
      [`${name}ValidationComplete`]: true,
    },
  })),
  
  onError: vi.fn(),
  
  cleanup: vi.fn().mockResolvedValue(undefined),
});

export const createFailingPlugin = (
  name: string = 'failing-plugin',
  errorMessage: string = 'Plugin operation failed'
): AdapterPlugin => {
  const error = new Error(errorMessage);
  
  return {
    name,
    version: '1.0.0',
    description: `Failing plugin ${name} for testing error handling`,
    
    initialize: vi.fn().mockRejectedValue(error),
    beforeComponentMapping: vi.fn().mockImplementation(() => { throw error; }),
    afterComponentMapping: vi.fn().mockImplementation(() => { throw error; }),
    beforeStyleTranslation: vi.fn().mockImplementation(() => { throw error; }),
    afterStyleTranslation: vi.fn().mockImplementation(() => { throw error; }),
    beforeTokenConversion: vi.fn().mockImplementation(() => { throw error; }),
    afterTokenConversion: vi.fn().mockImplementation(() => { throw error; }),
    beforeValidation: vi.fn().mockImplementation(() => { throw error; }),
    afterValidation: vi.fn().mockImplementation(() => { throw error; }),
    onError: vi.fn().mockImplementation(() => { throw error; }),
    cleanup: vi.fn().mockRejectedValue(error),
  };
};

export const createSlowPlugin = (
  name: string = 'slow-plugin',
  delay: number = 100
): AdapterPlugin => ({
  name,
  version: '1.0.0',
  description: `Slow plugin ${name} for testing performance`,
  
  initialize: vi.fn().mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, delay));
  }),
  
  beforeComponentMapping: vi.fn().mockImplementation(async (componentName, props) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return props;
  }),
  
  cleanup: vi.fn().mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, delay));
  }),
});

export const createConditionalPlugin = (
  name: string = 'conditional-plugin',
  condition: (context: any) => boolean
): AdapterPlugin => ({
  name,
  version: '1.0.0',
  description: `Conditional plugin ${name} for testing conditional execution`,
  
  beforeComponentMapping: vi.fn().mockImplementation((componentName, props) => {
    if (condition({ componentName, props })) {
      return { ...props, conditionMet: true };
    }
    return props;
  }),
});

export const createStatefulPlugin = (
  name: string = 'stateful-plugin'
): AdapterPlugin & { state: Map<string, unknown>; getState: () => Map<string, unknown> } => {
  const state = new Map<string, unknown>();
  
  return {
    name,
    version: '1.0.0',
    description: `Stateful plugin ${name} for testing state management`,
    state,
    getState: () => state,
    
    initialize: vi.fn().mockImplementation(async () => {
      state.set('initialized', true);
      state.set('initTime', Date.now());
    }),
    
    beforeComponentMapping: vi.fn().mockImplementation((componentName, props) => {
      const count = (state.get('mappingCount') as number || 0) + 1;
      state.set('mappingCount', count);
      state.set(`lastComponent`, componentName);
      return { ...props, mappingCount: count };
    }),
    
    cleanup: vi.fn().mockImplementation(async () => {
      state.clear();
    }),
  };
};

// ============================================================================
// Plugin Execution Context Fixtures
// ============================================================================

export const createPluginExecutionContext = (
  adapter: AdapterInstance,
  operation: string = 'test-operation'
) => ({
  adapter,
  pluginManager: {
    getPluginStatistics: vi.fn().mockReturnValue({}),
    isPluginRegistered: vi.fn().mockReturnValue(true),
    setPluginEnabled: vi.fn(),
  },
  environment: 'test' as const,
  metadata: {
    startTime: Date.now(),
    operation,
    executionId: `exec_${Math.random().toString(36).substr(2, 9)}`,
    previousResults: [],
  },
});

// ============================================================================
// Plugin Chain Fixtures
// ============================================================================

export const createPluginChain = (count: number = 3) => {
  const plugins: AdapterPlugin[] = [];
  
  for (let i = 0; i < count; i++) {
    const plugin = createMockPlugin(`chain-plugin-${i}`, '1.0.0');
    
    // Each plugin adds its number to the props
    (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation((name, props) => ({
      ...props,
      [`plugin${i}`]: true,
      chainOrder: [...(props.chainOrder || []), i],
    }));
    
    plugins.push(plugin);
  }
  
  return plugins;
};

// ============================================================================
// Plugin Priority Fixtures
// ============================================================================

export const createPriorityPlugins = () => [
  {
    plugin: createMockPlugin('high-priority', '1.0.0'),
    priority: 100,
  },
  {
    plugin: createMockPlugin('medium-priority', '1.0.0'),
    priority: 50,
  },
  {
    plugin: createMockPlugin('low-priority', '1.0.0'),
    priority: 10,
  },
  {
    plugin: createMockPlugin('default-priority', '1.0.0'),
    priority: 0,
  },
];

// ============================================================================
// Plugin Dependency Fixtures
// ============================================================================

export const createDependentPlugins = () => {
  const basePlugin = createMockPlugin('base-plugin', '1.0.0');
  const dependentPlugin = createMockPlugin('dependent-plugin', '1.0.0');
  
  // Dependent plugin expects base plugin to have run first
  (dependentPlugin.beforeComponentMapping as MockedFunction<any>).mockImplementation((name, props) => {
    if (!props['base-plugin-enhanced']) {
      throw new Error('Base plugin must run before dependent plugin');
    }
    return { ...props, 'dependent-plugin-enhanced': true };
  });
  
  return {
    basePlugin,
    dependentPlugin,
    dependencies: {
      'dependent-plugin': ['base-plugin'],
    },
  };
};

// ============================================================================
// Plugin Condition Fixtures
// ============================================================================

export const createConditionalPlugins = () => ({
  componentSpecificPlugin: createConditionalPlugin(
    'button-only-plugin',
    ({ componentName }) => componentName.toLowerCase() === 'button'
  ),
  
  propBasedPlugin: createConditionalPlugin(
    'disabled-enhancer',
    ({ props }) => props.disabled === true
  ),
  
  environmentPlugin: createConditionalPlugin(
    'production-only',
    ({ environment }) => environment === 'production'
  ),
  
  adapterSpecificPlugin: createConditionalPlugin(
    'react-only',
    ({ adapter }) => adapter?.config.framework.name === 'react'
  ),
});

// ============================================================================
// Plugin Performance Fixtures
// ============================================================================

export const createPerformancePlugins = () => {
  const metrics: Record<string, number[]> = {};
  
  const createMetricPlugin = (name: string, baseDelay: number) => {
    const plugin = createMockPlugin(name, '1.0.0');
    
    (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation(async (componentName, props) => {
      const start = performance.now();
      const delay = baseDelay + Math.random() * 50; // Add some variance
      await new Promise(resolve => setTimeout(resolve, delay));
      const duration = performance.now() - start;
      
      if (!metrics[name]) metrics[name] = [];
      metrics[name].push(duration);
      
      return { ...props, [`${name}ProcessTime`]: duration };
    });
    
    return plugin;
  };
  
  return {
    fastPlugin: createMetricPlugin('fast-plugin', 10),
    mediumPlugin: createMetricPlugin('medium-plugin', 50),
    slowPlugin: createMetricPlugin('slow-plugin', 100),
    getMetrics: () => metrics,
    getAverages: () => Object.entries(metrics).reduce((acc, [name, durations]) => {
      acc[name] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      return acc;
    }, {} as Record<string, number>),
  };
};

// ============================================================================
// Plugin Error Scenarios
// ============================================================================

export const createErrorScenarioPlugins = () => ({
  initErrorPlugin: (() => {
    const plugin = createMockPlugin('init-error', '1.0.0');
    (plugin.initialize as MockedFunction<any>).mockRejectedValue(
      new Error('Initialization failed: Missing required configuration')
    );
    return plugin;
  })(),
  
  intermittentErrorPlugin: (() => {
    const plugin = createMockPlugin('intermittent-error', '1.0.0');
    let callCount = 0;
    
    (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation((name, props) => {
      callCount++;
      if (callCount % 3 === 0) {
        throw new Error('Intermittent failure');
      }
      return props;
    });
    
    return plugin;
  })(),
  
  memoryLeakPlugin: (() => {
    const plugin = createMockPlugin('memory-leak', '1.0.0');
    const leakedData: any[] = [];
    
    (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation((name, props) => {
      // Simulate memory leak by holding references
      leakedData.push({ ...props, largeData: new Array(1000).fill('data') });
      return props;
    });
    
    return plugin;
  })(),
  
  infiniteLoopPlugin: (() => {
    const plugin = createMockPlugin('infinite-loop', '1.0.0');
    
    (plugin.beforeComponentMapping as MockedFunction<any>).mockImplementation(async (name, props) => {
      // Simulate infinite loop with timeout protection
      const timeout = setTimeout(() => {
        throw new Error('Operation timed out');
      }, 5000);
      
      try {
        // This would be an infinite loop in a real scenario
        await new Promise(() => {}); // Never resolves
      } finally {
        clearTimeout(timeout);
      }
      
      return props;
    });
    
    return plugin;
  })(),
});

// ============================================================================
// Plugin Test Helpers
// ============================================================================

export const createPluginTestHelpers = () => ({
  verifyPluginCalled: (plugin: AdapterPlugin, method: keyof AdapterPlugin, times: number = 1) => {
    const fn = plugin[method] as MockedFunction<any>;
    expect(fn).toHaveBeenCalledTimes(times);
  },
  
  verifyPluginNotCalled: (plugin: AdapterPlugin, method: keyof AdapterPlugin) => {
    const fn = plugin[method] as MockedFunction<any>;
    expect(fn).not.toHaveBeenCalled();
  },
  
  verifyPluginCalledWith: (
    plugin: AdapterPlugin,
    method: keyof AdapterPlugin,
    ...args: any[]
  ) => {
    const fn = plugin[method] as MockedFunction<any>;
    expect(fn).toHaveBeenCalledWith(...args);
  },
  
  resetPlugin: (plugin: AdapterPlugin) => {
    Object.keys(plugin).forEach(key => {
      const value = plugin[key as keyof AdapterPlugin];
      if (typeof value === 'function' && 'mockReset' in value) {
        (value as MockedFunction<any>).mockReset();
      }
    });
  },
  
  resetAllPlugins: (plugins: AdapterPlugin[]) => {
    plugins.forEach(plugin => {
      Object.keys(plugin).forEach(key => {
        const value = plugin[key as keyof AdapterPlugin];
        if (typeof value === 'function' && 'mockReset' in value) {
          (value as MockedFunction<any>).mockReset();
        }
      });
    });
  },
});