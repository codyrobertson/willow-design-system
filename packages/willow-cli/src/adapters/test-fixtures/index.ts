/**
 * Centralized test fixtures for adapter testing
 */

export * from './adapter.fixtures.js';
export * from './plugin.fixtures.js';

// Re-export commonly used fixtures for convenience
export {
  // Adapter configurations
  createValidAdapterConfig,
  createMinimalAdapterConfig,
  createInvalidAdapterConfig,
  
  // Component mappings
  createButtonMapping,
  createInputMapping,
  
  // Style configurations
  createCompleteStyleConfig,
  createMinimalStyleConfig,
  
  // Token configurations
  createCompleteTokenConfig,
  createMinimalTokenConfig,
  
  // Validation results
  createSuccessfulValidation,
  createFailedValidation,
  
  // Mock instances
  createMockAdapterInstance,
  createFailingAdapterInstance,
  
  // Error fixtures
  createAdapterErrors,
  
  // Performance fixtures
  createLargeDatasets,
  
  // Generators
  generateRandomProps,
  generateRandomComponentName,
  
  // Helpers
  createTimingHelpers,
  createStateFixtures,
  createAssertionHelpers,
} from './adapter.fixtures.js';

export {
  // Plugin fixtures
  createMockPlugin,
  createFailingPlugin,
  createSlowPlugin,
  createConditionalPlugin,
  createStatefulPlugin,
  
  // Plugin chains and scenarios
  createPluginChain,
  createPriorityPlugins,
  createDependentPlugins,
  createConditionalPlugins,
  createPerformancePlugins,
  createErrorScenarioPlugins,
  
  // Plugin helpers
  createPluginTestHelpers,
  createPluginExecutionContext,
} from './plugin.fixtures.js';