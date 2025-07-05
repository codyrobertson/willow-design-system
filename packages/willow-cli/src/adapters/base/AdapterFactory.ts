import { AdapterRegistry, AdapterRegistration, AdapterInstantiationOptions } from './AdapterRegistry.js';
import { UIKitAdapter, AdapterConfig } from './UIKitAdapter.js';
import { AdapterLifecycleHooks } from './AdapterLifecycle.js';

/**
 * Factory configuration for adapter creation
 */
export interface AdapterFactoryConfig {
  defaultTimeout?: number;
  defaultRetryCount?: number;
  autoRegisterBuiltIns?: boolean;
  enableCaching?: boolean;
  cacheTTL?: number;
  fallbackStrategy?: 'error' | 'warn' | 'silent';
}

/**
 * Adapter creation request
 */
export interface AdapterCreationRequest {
  name: string;
  version?: string;
  config: AdapterConfig;
  hooks?: AdapterLifecycleHooks;
  options?: Partial<AdapterInstantiationOptions>;
}

/**
 * Adapter creation result
 */
export interface AdapterCreationResult {
  adapter: UIKitAdapter;
  registration: AdapterRegistration;
  created: boolean; // true if new instance, false if cached
  metadata: {
    creationTime: number;
    attempts: number;
    fallbackUsed: boolean;
    cachedInstance: boolean;
  };
}

/**
 * Factory for creating and managing UI Kit adapters
 */
export class AdapterFactory {
  private registry: AdapterRegistry;
  private config: Required<AdapterFactoryConfig>;
  private creationHistory: Map<string, AdapterCreationResult[]> = new Map();

  constructor(config: AdapterFactoryConfig = {}) {
    this.registry = AdapterRegistry.getInstance();
    this.config = {
      defaultTimeout: 10000,
      defaultRetryCount: 3,
      autoRegisterBuiltIns: true,
      enableCaching: true,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      fallbackStrategy: 'warn',
      ...config,
    };

    if (this.config.autoRegisterBuiltIns) {
      this.registerBuiltInAdapters();
    }
  }

  /**
   * Create a single adapter
   */
  async create(request: AdapterCreationRequest): Promise<AdapterCreationResult> {
    const startTime = Date.now();
    const {
      name,
      version = 'latest',
      config,
      hooks,
      options = {},
    } = request;

    // Merge with factory defaults
    const mergedOptions: AdapterInstantiationOptions = {
      config,
      hooks,
      autoInitialize: true,
      retryCount: this.config.defaultRetryCount,
      timeout: this.config.defaultTimeout,
      ...options,
    };

    let attempts = 0;
    let fallbackUsed = false;
    let cachedInstance = false;

    try {
      // Check if we already have a cached instance
      const instanceKey = this.getInstanceKey(name, config);
      const existingAdapter = await this.getCachedAdapter(instanceKey);
      
      if (existingAdapter) {
        cachedInstance = true;
        const registration = this.registry.get(name, version);
        
        return {
          adapter: existingAdapter,
          registration: registration!,
          created: false,
          metadata: {
            creationTime: Date.now() - startTime,
            attempts: 0,
            fallbackUsed: false,
            cachedInstance: true,
          },
        };
      }

      attempts = mergedOptions.retryCount || 1;
      const adapter = await this.registry.create(name, mergedOptions);
      const registration = this.registry.get(name, version);

      const result: AdapterCreationResult = {
        adapter,
        registration: registration!,
        created: true,
        metadata: {
          creationTime: Date.now() - startTime,
          attempts,
          fallbackUsed,
          cachedInstance,
        },
      };

      // Store in creation history
      this.recordCreation(name, result);

      return result;
    } catch (error) {
      const message = `Failed to create adapter '${name}': ${error.message}`;
      
      switch (this.config.fallbackStrategy) {
        case 'error':
          throw new Error(message);
        case 'warn':
          console.warn(message);
          throw error;
        case 'silent':
          break;
      }
      
      throw error;
    }
  }

  /**
   * Create multiple adapters concurrently
   */
  async createMany(requests: AdapterCreationRequest[]): Promise<AdapterCreationResult[]> {
    const promises = requests.map(request => this.create(request));
    return Promise.all(promises);
  }

  /**
   * Create adapter with automatic fallback chain
   */
  async createWithFallbacks(
    primaryRequest: AdapterCreationRequest,
    fallbacks: string[]
  ): Promise<AdapterCreationResult> {
    try {
      return await this.create(primaryRequest);
    } catch (error) {
      for (const fallbackName of fallbacks) {
        try {
          console.warn(`Primary adapter '${primaryRequest.name}' failed, trying fallback '${fallbackName}'`);
          
          const fallbackRequest: AdapterCreationRequest = {
            ...primaryRequest,
            name: fallbackName,
          };
          
          const result = await this.create(fallbackRequest);
          result.metadata.fallbackUsed = true;
          
          return result;
        } catch (fallbackError) {
          console.warn(`Fallback adapter '${fallbackName}' also failed:`, fallbackError.message);
        }
      }
      
      throw new Error(`All adapters failed. Primary: ${primaryRequest.name}, Fallbacks: ${fallbacks.join(', ')}`);
    }
  }

  /**
   * Get or create adapter (with caching)
   */
  async getOrCreate(request: AdapterCreationRequest): Promise<UIKitAdapter> {
    const result = await this.create(request);
    return result.adapter;
  }

  /**
   * Preload adapters for better performance
   */
  async preload(requests: AdapterCreationRequest[]): Promise<void> {
    console.log(`Preloading ${requests.length} adapters...`);
    
    const startTime = Date.now();
    const results = await this.createMany(requests);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.adapter).length;
    console.log(`Preloaded ${successful}/${requests.length} adapters in ${duration}ms`);
  }

  /**
   * Register a new adapter
   */
  register(registration: AdapterRegistration): void {
    this.registry.register(registration);
  }

  /**
   * Unregister an adapter
   */
  unregister(name: string, version?: string): boolean {
    return this.registry.unregister(name, version);
  }

  /**
   * List available adapters
   */
  listAdapters(options = {}) {
    return this.registry.list(options);
  }

  /**
   * Get adapter information
   */
  getAdapterInfo(name: string, version = 'latest'): AdapterRegistration | null {
    return this.registry.get(name, version);
  }

  /**
   * Check if adapter is available
   */
  hasAdapter(name: string, version = 'latest'): boolean {
    return this.registry.has(name, version);
  }

  /**
   * Get factory statistics
   */
  getStats() {
    const registryStats = this.registry.getStats();
    const totalCreations = Array.from(this.creationHistory.values()).reduce(
      (sum, history) => sum + history.length,
      0
    );
    
    return {
      ...registryStats,
      totalCreations,
      creationHistory: Object.fromEntries(this.creationHistory),
      config: this.config,
    };
  }

  /**
   * Clear all cached instances
   */
  clearCache(): void {
    this.registry.clearInstances();
    this.creationHistory.clear();
  }

  /**
   * Destroy specific adapter instance
   */
  destroy(name: string, config?: AdapterConfig): boolean {
    return this.registry.destroy(name, config);
  }

  /**
   * Health check for all registered adapters
   */
  async healthCheck(): Promise<Record<string, { status: 'healthy' | 'unhealthy'; error?: string }>> {
    const adapters = this.listAdapters();
    const results: Record<string, { status: 'healthy' | 'unhealthy'; error?: string }> = {};
    
    for (const adapter of adapters) {
      try {
        // Try to create a test instance
        const testConfig: AdapterConfig = {
          name: adapter.name,
          version: adapter.version,
          options: { healthCheck: true },
        };
        
        const instance = await this.registry.create(adapter.name, {
          config: testConfig,
          autoInitialize: false,
          timeout: 5000,
          retryCount: 1,
        });
        
        // Clean up test instance
        if (typeof instance.dispose === 'function') {
          instance.dispose();
        }
        
        results[adapter.name] = { status: 'healthy' };
      } catch (error) {
        results[adapter.name] = { 
          status: 'unhealthy', 
          error: error.message 
        };
      }
    }
    
    return results;
  }

  /**
   * Get cached adapter if available and not expired
   */
  private async getCachedAdapter(instanceKey: string): Promise<UIKitAdapter | null> {
    if (!this.config.enableCaching) return null;
    
    // This is a simplified implementation
    // In a real scenario, you'd implement TTL-based caching
    return null;
  }

  /**
   * Record adapter creation in history
   */
  private recordCreation(name: string, result: AdapterCreationResult): void {
    if (!this.creationHistory.has(name)) {
      this.creationHistory.set(name, []);
    }
    
    const history = this.creationHistory.get(name)!;
    history.push(result);
    
    // Limit history size
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Generate instance key for caching
   */
  private getInstanceKey(name: string, config: AdapterConfig): string {
    try {
      const configStr = JSON.stringify(config);
      const hash = btoa(configStr).substring(0, 8);
      return `${name}:${hash}`;
    } catch {
      return `${name}:${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  /**
   * Register built-in adapters
   */
  private registerBuiltInAdapters(): void {
    // Register built-in Willow adapters here
    // This would typically include adapters for popular UI libraries
    
    // Example built-in adapter registrations would go here
    console.log('Built-in adapters registered');
  }
}