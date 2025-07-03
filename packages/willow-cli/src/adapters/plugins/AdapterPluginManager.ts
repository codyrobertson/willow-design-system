import { AdapterPlugin, AdapterInstance, ComponentName, ComponentMapping, StyleConfig, TokenConfig, AdapterConfig, ValidationResult } from '../types';
import { AdapterError } from '../errors';

/**
 * Plugin registration options
 */
export interface PluginRegistrationOptions {
  /** Plugin priority (higher numbers execute first) */
  priority?: number;
  
  /** Plugin enabled state */
  enabled?: boolean;
  
  /** Plugin configuration */
  config?: Record<string, unknown>;
  
  /** Plugin dependencies */
  dependencies?: string[];
  
  /** Plugin execution conditions */
  conditions?: {
    /** Only run for specific adapters */
    adapters?: string[];
    
    /** Only run for specific components */
    components?: string[];
    
    /** Only run in specific environments */
    environments?: ('development' | 'production' | 'test')[];
  };
}

/**
 * Plugin execution context
 */
export interface PluginExecutionContext {
  /** Current adapter instance */
  adapter: AdapterInstance;
  
  /** Plugin manager instance */
  pluginManager: AdapterPluginManager;
  
  /** Current environment */
  environment: 'development' | 'production' | 'test';
  
  /** Execution metadata */
  metadata: {
    /** Execution start time */
    startTime: number;
    
    /** Current operation name */
    operation: string;
    
    /** Execution ID for tracking */
    executionId: string;
    
    /** Previous plugin results */
    previousResults?: unknown[];
  };
}

/**
 * Plugin registration entry
 */
export interface PluginRegistryEntry {
  /** Plugin instance */
  plugin: AdapterPlugin;
  
  /** Registration options */
  options: Required<PluginRegistrationOptions>;
  
  /** Registration timestamp */
  registeredAt: Date;
  
  /** Plugin state */
  state: {
    initialized: boolean;
    enabled: boolean;
    errorCount: number;
    lastError?: Error;
    executionCount: number;
    averageExecutionTime: number;
  };
}

/**
 * Plugin execution result
 */
export interface PluginExecutionResult<T = unknown> {
  /** Execution success */
  success: boolean;
  
  /** Result value */
  result?: T;
  
  /** Execution error */
  error?: Error;
  
  /** Execution duration in milliseconds */
  duration: number;
  
  /** Plugin that produced this result */
  pluginName: string;
  
  /** Whether execution was skipped */
  skipped?: boolean;
  
  /** Skip reason */
  skipReason?: string;
}

/**
 * Plugin manager for extending adapter functionality
 */
export class AdapterPluginManager {
  private readonly plugins: Map<string, PluginRegistryEntry> = new Map();
  private readonly environment: 'development' | 'production' | 'test';
  private readonly enabledHooks: Set<string> = new Set();
  private executionIdCounter = 0;

  constructor(environment: 'development' | 'production' | 'test' = 'development') {
    this.environment = environment;
    
    // Enable all hooks by default
    this.enabledHooks.add('initialize');
    this.enabledHooks.add('beforeComponentMapping');
    this.enabledHooks.add('afterComponentMapping');
    this.enabledHooks.add('beforeStyleTranslation');
    this.enabledHooks.add('afterStyleTranslation');
    this.enabledHooks.add('beforeTokenConversion');
    this.enabledHooks.add('afterTokenConversion');
    this.enabledHooks.add('beforeValidation');
    this.enabledHooks.add('afterValidation');
    this.enabledHooks.add('onError');
    this.enabledHooks.add('cleanup');
  }

  /**
   * Register a plugin
   */
  async registerPlugin(
    plugin: AdapterPlugin,
    options: PluginRegistrationOptions = {}
  ): Promise<void> {
    // Check for null/undefined plugin first
    if (!plugin) {
      throw new AdapterError(
        'Plugin must have a valid name',
        'INVALID_PLUGIN_NAME'
      );
    }

    const fullOptions: Required<PluginRegistrationOptions> = {
      priority: 0,
      enabled: true,
      config: {},
      dependencies: [],
      conditions: {},
      ...options,
    };

    // Validate plugin
    this.validatePlugin(plugin);

    // Check dependencies
    await this.checkDependencies(plugin.name, fullOptions.dependencies);

    // Create registry entry
    const entry: PluginRegistryEntry = {
      plugin,
      options: fullOptions,
      registeredAt: new Date(),
      state: {
        initialized: false,
        enabled: fullOptions.enabled,
        errorCount: 0,
        executionCount: 0,
        averageExecutionTime: 0,
      },
    };

    // Register plugin
    this.plugins.set(plugin.name, entry);

    console.debug(`Plugin "${plugin.name}" registered successfully`);
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new AdapterError(
        `Plugin "${pluginName}" is not registered`,
        'PLUGIN_NOT_FOUND'
      );
    }

    // Cleanup plugin if it has cleanup method
    if (entry.plugin.cleanup && entry.state.initialized) {
      try {
        await entry.plugin.cleanup();
      } catch (error) {
        entry.state.lastError = error as Error;
        entry.state.errorCount++;
        console.warn(`Plugin "${pluginName}" cleanup failed:`, error);
      }
    }

    this.plugins.delete(pluginName);
    console.debug(`Plugin "${pluginName}" unregistered successfully`);
  }

  /**
   * Initialize all plugins for an adapter
   */
  async initializePlugins(adapter: AdapterInstance): Promise<void> {
    const context = this.createExecutionContext(adapter, 'initialize');
    const sortedPlugins = this.getSortedPlugins('initialize', adapter);

    for (const entry of sortedPlugins) {
      if (!entry.state.enabled || entry.state.initialized) {
        continue;
      }

      try {
        if (entry.plugin.initialize) {
          await this.executeWithTiming(
            entry,
            () => entry.plugin.initialize!(adapter),
            context
          );
        }
        entry.state.initialized = true;
        console.debug(`Plugin "${entry.plugin.name}" initialized`);
      } catch (error) {
        entry.state.errorCount++;
        entry.state.lastError = error as Error;
        console.error(`Plugin "${entry.plugin.name}" initialization failed:`, error);
        
        if (this.environment === 'production') {
          // In production, disable failed plugins
          entry.state.enabled = false;
        } else {
          // In development, re-throw for debugging
          throw new AdapterError(
            `Plugin "${entry.plugin.name}" initialization failed: ${(error as Error).message}`,
            'PLUGIN_INITIALIZATION_ERROR',
            { cause: error as Error }
          );
        }
      }
    }
  }

  /**
   * Execute beforeComponentMapping hooks
   */
  async executeBeforeComponentMapping(
    adapter: AdapterInstance,
    componentName: ComponentName,
    props: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.enabledHooks.has('beforeComponentMapping')) {
      return props;
    }

    const context = this.createExecutionContext(adapter, 'beforeComponentMapping');
    const sortedPlugins = this.getSortedPlugins('beforeComponentMapping', adapter, componentName);

    let currentProps = { ...props };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter, componentName)) {
        continue;
      }

      if (entry.plugin.beforeComponentMapping) {
        try {
          const result = await this.executeWithTiming(
            entry,
            () => entry.plugin.beforeComponentMapping!(componentName, currentProps),
            context
          );
          currentProps = { ...currentProps, ...result };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentProps;
  }

  /**
   * Execute afterComponentMapping hooks
   */
  async executeAfterComponentMapping(
    adapter: AdapterInstance,
    mapping: ComponentMapping
  ): Promise<ComponentMapping> {
    if (!this.enabledHooks.has('afterComponentMapping')) {
      return mapping;
    }

    const context = this.createExecutionContext(adapter, 'afterComponentMapping');
    const sortedPlugins = this.getSortedPlugins('afterComponentMapping', adapter);

    let currentMapping = { ...mapping };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.afterComponentMapping) {
        try {
          const result = await this.executeWithTiming(
            entry,
            () => entry.plugin.afterComponentMapping!(currentMapping),
            context
          );
          currentMapping = { ...currentMapping, ...result };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentMapping;
  }

  /**
   * Execute beforeStyleTranslation hooks
   */
  async executeBeforeStyleTranslation(
    adapter: AdapterInstance,
    styles: StyleConfig
  ): Promise<StyleConfig> {
    if (!this.enabledHooks.has('beforeStyleTranslation')) {
      return styles;
    }

    const context = this.createExecutionContext(adapter, 'beforeStyleTranslation');
    const sortedPlugins = this.getSortedPlugins('beforeStyleTranslation', adapter);

    let currentStyles = { ...styles };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.beforeStyleTranslation) {
        try {
          const result = await this.executeWithTiming(
            entry,
            () => entry.plugin.beforeStyleTranslation!(currentStyles),
            context
          );
          currentStyles = { ...currentStyles, ...result };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentStyles;
  }

  /**
   * Execute afterStyleTranslation hooks
   */
  async executeAfterStyleTranslation(
    adapter: AdapterInstance,
    styles: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.enabledHooks.has('afterStyleTranslation')) {
      return styles;
    }

    const context = this.createExecutionContext(adapter, 'afterStyleTranslation');
    const sortedPlugins = this.getSortedPlugins('afterStyleTranslation', adapter);

    let currentStyles = { ...styles };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.afterStyleTranslation) {
        try {
          const result = await this.executeWithTiming(
            entry,
            () => entry.plugin.afterStyleTranslation!(currentStyles),
            context
          );
          currentStyles = { ...currentStyles, ...result };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentStyles;
  }

  /**
   * Execute beforeTokenConversion hooks
   */
  async executeBeforeTokenConversion(
    adapter: AdapterInstance,
    tokens: TokenConfig
  ): Promise<TokenConfig> {
    if (!this.enabledHooks.has('beforeTokenConversion')) {
      return tokens;
    }

    const context = this.createExecutionContext(adapter, 'beforeTokenConversion');
    const sortedPlugins = this.getSortedPlugins('beforeTokenConversion', adapter);

    let currentTokens = { ...tokens };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.beforeTokenConversion) {
        try {
          const result = await this.executeWithTiming(
            entry,
            () => entry.plugin.beforeTokenConversion!(currentTokens),
            context
          );
          currentTokens = { ...currentTokens, ...result };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentTokens;
  }

  /**
   * Execute afterTokenConversion hooks
   */
  async executeAfterTokenConversion(
    adapter: AdapterInstance,
    tokens: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.enabledHooks.has('afterTokenConversion')) {
      return tokens;
    }

    const context = this.createExecutionContext(adapter, 'afterTokenConversion');
    const sortedPlugins = this.getSortedPlugins('afterTokenConversion', adapter);

    let currentTokens = { ...tokens };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.afterTokenConversion) {
        try {
          const result = await this.executeWithTiming(
            entry,
            () => entry.plugin.afterTokenConversion!(currentTokens),
            context
          );
          currentTokens = { ...currentTokens, ...result };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentTokens;
  }

  /**
   * Execute beforeValidation hooks
   */
  async executeBeforeValidation(
    adapter: AdapterInstance,
    config: AdapterConfig
  ): Promise<AdapterConfig> {
    if (!this.enabledHooks.has('beforeValidation')) {
      return config;
    }

    const context = this.createExecutionContext(adapter, 'beforeValidation');
    const sortedPlugins = this.getSortedPlugins('beforeValidation', adapter);

    let currentConfig = { ...config };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.beforeValidation) {
        try {
          const result = await this.executeWithTiming(
            entry,
            () => entry.plugin.beforeValidation!(currentConfig),
            context
          );
          currentConfig = { ...currentConfig, ...result };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentConfig;
  }

  /**
   * Execute afterValidation hooks
   */
  async executeAfterValidation(
    adapter: AdapterInstance,
    result: ValidationResult
  ): Promise<ValidationResult> {
    if (!this.enabledHooks.has('afterValidation')) {
      return result;
    }

    const context = this.createExecutionContext(adapter, 'afterValidation');
    const sortedPlugins = this.getSortedPlugins('afterValidation', adapter);

    let currentResult = { ...result };

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.afterValidation) {
        try {
          const processedResult = await this.executeWithTiming(
            entry,
            () => entry.plugin.afterValidation!(currentResult),
            context
          );
          currentResult = { ...currentResult, ...processedResult };
        } catch (error) {
          this.handlePluginError(entry, error as Error, context);
        }
      }
    }

    return currentResult;
  }

  /**
   * Execute onError hooks
   */
  async executeOnError(
    adapter: AdapterInstance,
    error: Error,
    errorContext: Record<string, unknown>
  ): Promise<void> {
    if (!this.enabledHooks.has('onError')) {
      return;
    }

    const context = this.createExecutionContext(adapter, 'onError');
    const sortedPlugins = this.getSortedPlugins('onError', adapter);

    for (const entry of sortedPlugins) {
      if (!this.shouldExecutePlugin(entry, adapter)) {
        continue;
      }

      if (entry.plugin.onError) {
        try {
          await this.executeWithTiming(
            entry,
            () => entry.plugin.onError!(error, errorContext),
            context
          );
        } catch (pluginError) {
          // Don't let error handlers throw errors that could cause infinite loops
          console.error(`Plugin "${entry.plugin.name}" error handler failed:`, pluginError);
        }
      }
    }
  }

  /**
   * Cleanup all plugins
   */
  async cleanupPlugins(adapter: AdapterInstance): Promise<void> {
    const context = this.createExecutionContext(adapter, 'cleanup');
    const sortedPlugins = this.getSortedPlugins('cleanup', adapter);

    for (const entry of sortedPlugins) {
      if (!entry.state.initialized) {
        continue;
      }

      try {
        if (entry.plugin.cleanup) {
          await this.executeWithTiming(
            entry,
            () => entry.plugin.cleanup!(),
            context
          );
        }
        entry.state.initialized = false;
        console.debug(`Plugin "${entry.plugin.name}" cleaned up`);
      } catch (error) {
        // executeWithTiming already handled error tracking, just log the warning
        console.warn(`Plugin "${entry.plugin.name}" cleanup failed:`, error);
      }
    }
  }

  /**
   * Enable or disable specific hooks
   */
  configureHooks(hooks: Record<string, boolean>): void {
    for (const [hook, enabled] of Object.entries(hooks)) {
      if (enabled) {
        this.enabledHooks.add(hook);
      } else {
        this.enabledHooks.delete(hook);
      }
    }
  }

  /**
   * Get plugin statistics
   */
  getPluginStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [name, entry] of this.plugins.entries()) {
      stats[name] = {
        enabled: entry.state.enabled,
        initialized: entry.state.initialized,
        errorCount: entry.state.errorCount,
        executionCount: entry.state.executionCount,
        averageExecutionTime: entry.state.averageExecutionTime,
        lastError: entry.state.lastError?.message,
        registeredAt: entry.registeredAt,
        priority: entry.options.priority,
      };
    }

    return stats;
  }

  /**
   * Get registered plugin names
   */
  getRegisteredPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is registered
   */
  isPluginRegistered(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Enable or disable a plugin
   */
  setPluginEnabled(pluginName: string, enabled: boolean): void {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new AdapterError(
        `Plugin "${pluginName}" is not registered`,
        'PLUGIN_NOT_FOUND'
      );
    }

    entry.state.enabled = enabled;
    console.debug(`Plugin "${pluginName}" ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: AdapterPlugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new AdapterError(
        'Plugin must have a valid name',
        'INVALID_PLUGIN_NAME'
      );
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new AdapterError(
        'Plugin must have a valid version',
        'INVALID_PLUGIN_VERSION'
      );
    }

    // Check for duplicate plugin names
    if (this.plugins.has(plugin.name)) {
      throw new AdapterError(
        `Plugin "${plugin.name}" is already registered`,
        'DUPLICATE_PLUGIN_NAME'
      );
    }

    // Validate plugin methods
    const hookMethods = [
      'initialize',
      'beforeComponentMapping',
      'afterComponentMapping',
      'beforeStyleTranslation',
      'afterStyleTranslation',
      'beforeTokenConversion',
      'afterTokenConversion',
      'beforeValidation',
      'afterValidation',
      'onError',
      'cleanup',
    ];

    for (const method of hookMethods) {
      if (plugin[method as keyof AdapterPlugin] && typeof plugin[method as keyof AdapterPlugin] !== 'function') {
        throw new AdapterError(
          `Plugin method "${method}" must be a function`,
          'INVALID_PLUGIN_METHOD'
        );
      }
    }
  }

  /**
   * Check plugin dependencies
   */
  private async checkDependencies(pluginName: string, dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      if (!this.plugins.has(dependency)) {
        throw new AdapterError(
          `Plugin "${pluginName}" depends on "${dependency}" which is not registered`,
          'MISSING_PLUGIN_DEPENDENCY'
        );
      }
    }
  }

  /**
   * Get sorted plugins by priority
   */
  private getSortedPlugins(
    operation: string,
    adapter: AdapterInstance,
    componentName?: ComponentName
  ): PluginRegistryEntry[] {
    return Array.from(this.plugins.values())
      .filter(entry => 
        entry.state.enabled && 
        this.shouldExecutePlugin(entry, adapter, componentName)
      )
      .sort((a, b) => b.options.priority - a.options.priority);
  }

  /**
   * Check if plugin should execute based on conditions
   */
  private shouldExecutePlugin(
    entry: PluginRegistryEntry,
    adapter: AdapterInstance,
    componentName?: ComponentName
  ): boolean {
    const { conditions } = entry.options;

    // Check adapter conditions
    if (conditions.adapters && conditions.adapters.length > 0) {
      if (!conditions.adapters.includes(adapter.config.name)) {
        return false;
      }
    }

    // Check component conditions
    if (componentName && conditions.components && conditions.components.length > 0) {
      if (!conditions.components.includes(componentName)) {
        return false;
      }
    }

    // Check environment conditions
    if (conditions.environments && conditions.environments.length > 0) {
      if (!conditions.environments.includes(this.environment)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create execution context
   */
  private createExecutionContext(adapter: AdapterInstance, operation: string): PluginExecutionContext {
    return {
      adapter,
      pluginManager: this,
      environment: this.environment,
      metadata: {
        startTime: Date.now(),
        operation,
        executionId: `exec_${++this.executionIdCounter}`,
      },
    };
  }

  /**
   * Execute plugin method with timing and error handling
   */
  private async executeWithTiming<T>(
    entry: PluginRegistryEntry,
    operation: () => T | Promise<T>,
    context: PluginExecutionContext
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      // Update statistics
      entry.state.executionCount++;
      entry.state.averageExecutionTime = 
        (entry.state.averageExecutionTime * (entry.state.executionCount - 1) + duration) / 
        entry.state.executionCount;
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      entry.state.errorCount++;
      entry.state.lastError = error as Error;
      throw error;
    }
  }

  /**
   * Handle plugin execution errors
   */
  private handlePluginError(
    entry: PluginRegistryEntry,
    error: Error,
    context: PluginExecutionContext
  ): void {
    entry.state.errorCount++;
    entry.state.lastError = error;

    console.error(`Plugin "${entry.plugin.name}" execution failed in ${context.metadata.operation}:`, error);

    if (this.environment === 'production') {
      // In production, disable plugins that error too frequently
      if (entry.state.errorCount >= 5) {
        entry.state.enabled = false;
        console.warn(`Plugin "${entry.plugin.name}" disabled due to frequent errors`);
      }
    } else {
      // In development, re-throw for debugging
      throw new AdapterError(
        `Plugin "${entry.plugin.name}" execution failed: ${error.message}`,
        'PLUGIN_EXECUTION_ERROR',
        { cause: error }
      );
    }
  }
}