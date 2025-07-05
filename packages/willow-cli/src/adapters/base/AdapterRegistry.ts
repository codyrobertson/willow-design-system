import { UIKitAdapter, AdapterConfig } from './UIKitAdapter.js';
import { AdapterLifecycleHooks } from './AdapterLifecycle.js';

/**
 * Adapter registration information
 */
export interface AdapterRegistration {
  name: string;
  version: string;
  constructor: new (config: AdapterConfig, hooks?: AdapterLifecycleHooks) => UIKitAdapter;
  description?: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
  supportedVersions?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Adapter discovery options
 */
export interface AdapterDiscoveryOptions {
  includeBuiltIn?: boolean;
  includeThirdParty?: boolean;
  filterByKeywords?: string[];
  filterByVersion?: string;
  sortBy?: 'name' | 'version' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Adapter instantiation options
 */
export interface AdapterInstantiationOptions {
  config: AdapterConfig;
  hooks?: AdapterLifecycleHooks;
  autoInitialize?: boolean;
  fallbackAdapter?: string;
  retryCount?: number;
  timeout?: number;
}

/**
 * Registry for managing UI Kit adapters
 */
export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters = new Map<string, AdapterRegistration>();
  private instances = new Map<string, UIKitAdapter>();
  private aliases = new Map<string, string>();

  private constructor() {
    this.registerBuiltInAdapters();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  /**
   * Register a new adapter
   */
  register(registration: AdapterRegistration): void {
    const key = this.getAdapterKey(registration.name, registration.version);
    
    // Validate registration
    this.validateRegistration(registration);
    
    this.adapters.set(key, registration);
    
    // Register latest version alias
    const latestKey = this.getAdapterKey(registration.name, 'latest');
    if (!this.adapters.has(latestKey) || this.isNewerVersion(registration.version, this.adapters.get(latestKey)!.version)) {
      this.aliases.set(latestKey, key);
    }
  }

  /**
   * Unregister an adapter
   */
  unregister(name: string, version?: string): boolean {
    const key = version ? this.getAdapterKey(name, version) : this.findLatestVersion(name);
    if (!key) return false;
    
    // Remove instance if exists
    this.instances.delete(key);
    
    // Remove registration
    const result = this.adapters.delete(key);
    
    // Clean up aliases
    for (const [alias, target] of this.aliases.entries()) {
      if (target === key) {
        this.aliases.delete(alias);
      }
    }
    
    return result;
  }

  /**
   * Get adapter registration by name and version
   */
  get(name: string, version = 'latest'): AdapterRegistration | null {
    const key = this.getAdapterKey(name, version);
    
    // Check aliases first
    const aliasTarget = this.aliases.get(key);
    if (aliasTarget) {
      return this.adapters.get(aliasTarget) || null;
    }
    
    return this.adapters.get(key) || null;
  }

  /**
   * Check if adapter exists
   */
  has(name: string, version = 'latest'): boolean {
    return this.get(name, version) !== null;
  }

  /**
   * List all registered adapters
   */
  list(options: AdapterDiscoveryOptions = {}): AdapterRegistration[] {
    const {
      includeBuiltIn = true,
      includeThirdParty = true,
      filterByKeywords = [],
      filterByVersion,
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    let results = Array.from(this.adapters.values());

    // Apply filters
    if (!includeBuiltIn) {
      results = results.filter(adapter => !this.isBuiltInAdapter(adapter.name));
    }

    if (!includeThirdParty) {
      results = results.filter(adapter => this.isBuiltInAdapter(adapter.name));
    }

    if (filterByKeywords.length > 0) {
      results = results.filter(adapter => 
        adapter.keywords?.some(keyword => 
          filterByKeywords.some(filter => keyword.toLowerCase().includes(filter.toLowerCase()))
        )
      );
    }

    if (filterByVersion) {
      results = results.filter(adapter => adapter.version === filterByVersion);
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'version':
          comparison = this.compareVersions(a.version, b.version);
          break;
        case 'popularity':
          // Could implement popularity scoring based on usage metrics
          comparison = 0;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return results;
  }

  /**
   * Create adapter instance
   */
  async create(
    name: string, 
    options: AdapterInstantiationOptions
  ): Promise<UIKitAdapter> {
    const { 
      config, 
      hooks, 
      autoInitialize = true, 
      fallbackAdapter,
      retryCount = 3,
      timeout = 10000
    } = options;

    const registration = this.get(name);
    if (!registration) {
      if (fallbackAdapter && fallbackAdapter !== name) {
        console.warn(`Adapter '${name}' not found, falling back to '${fallbackAdapter}'`);
        return this.create(fallbackAdapter, { ...options, fallbackAdapter: undefined });
      }
      throw new Error(`Adapter '${name}' not found in registry`);
    }

    const instanceKey = this.getInstanceKey(name, config);
    
    // Return existing instance if available
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    // Create new instance with retries
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const adapter = await this.createWithTimeout(registration, config, hooks, timeout);
        
        if (autoInitialize) {
          await adapter.initialize();
        }
        
        // Cache instance
        this.instances.set(instanceKey, adapter);
        
        return adapter;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Adapter creation attempt ${attempt}/${retryCount} failed:`, error.message);
        
        if (attempt < retryCount) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    // All retries failed, try fallback
    if (fallbackAdapter && fallbackAdapter !== name) {
      console.error(`All attempts to create '${name}' failed, falling back to '${fallbackAdapter}'`);
      return this.create(fallbackAdapter, { ...options, fallbackAdapter: undefined });
    }

    throw new Error(`Failed to create adapter '${name}' after ${retryCount} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Get or create adapter instance (cached)
   */
  async getOrCreate(
    name: string,
    options: AdapterInstantiationOptions
  ): Promise<UIKitAdapter> {
    const instanceKey = this.getInstanceKey(name, options.config);
    
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }
    
    return this.create(name, options);
  }

  /**
   * Destroy adapter instance
   */
  destroy(name: string, config?: AdapterConfig): boolean {
    const instanceKey = config ? this.getInstanceKey(name, config) : name;
    
    // Find instance to destroy
    let targetKey: string | null = null;
    if (this.instances.has(instanceKey)) {
      targetKey = instanceKey;
    } else {
      // Find by name prefix
      for (const key of this.instances.keys()) {
        if (key.startsWith(`${name}:`)) {
          targetKey = key;
          break;
        }
      }
    }
    
    if (!targetKey) return false;
    
    const instance = this.instances.get(targetKey);
    if (instance && typeof instance.dispose === 'function') {
      instance.dispose();
    }
    
    return this.instances.delete(targetKey);
  }

  /**
   * Clear all cached instances
   */
  clearInstances(): void {
    for (const instance of this.instances.values()) {
      if (typeof instance.dispose === 'function') {
        instance.dispose();
      }
    }
    this.instances.clear();
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const totalAdapters = this.adapters.size;
    const totalInstances = this.instances.size;
    const builtInCount = Array.from(this.adapters.values()).filter(a => this.isBuiltInAdapter(a.name)).length;
    const thirdPartyCount = totalAdapters - builtInCount;
    
    return {
      totalAdapters,
      totalInstances,
      builtInCount,
      thirdPartyCount,
      adapters: this.list(),
    };
  }

  /**
   * Validate adapter registration
   */
  private validateRegistration(registration: AdapterRegistration): void {
    if (!registration.name || typeof registration.name !== 'string') {
      throw new Error('Adapter name is required and must be a string');
    }

    if (!registration.version || typeof registration.version !== 'string') {
      throw new Error('Adapter version is required and must be a string');
    }

    if (!registration.constructor || typeof registration.constructor !== 'function') {
      throw new Error('Adapter constructor is required and must be a function');
    }

    // Validate version format (basic semver check)
    if (!/^\d+\.\d+\.\d+/.test(registration.version)) {
      throw new Error('Adapter version must follow semantic versioning (e.g., 1.0.0)');
    }
  }

  /**
   * Create adapter with timeout
   */
  private async createWithTimeout(
    registration: AdapterRegistration,
    config: AdapterConfig,
    hooks?: AdapterLifecycleHooks,
    timeout = 10000
  ): Promise<UIKitAdapter> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Adapter creation timed out after ${timeout}ms`));
      }, timeout);

      try {
        const adapter = new registration.constructor(config, hooks);
        clearTimeout(timeoutId);
        resolve(adapter);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Register built-in adapters
   */
  private registerBuiltInAdapters(): void {
    // Built-in adapters would be registered here
    // For now, this is a placeholder for the mock adapter
  }

  /**
   * Check if adapter is built-in
   */
  private isBuiltInAdapter(name: string): boolean {
    return name.startsWith('@willow/') || name.startsWith('willow-');
  }

  /**
   * Generate adapter key
   */
  private getAdapterKey(name: string, version: string): string {
    return `${name}@${version}`;
  }

  /**
   * Generate instance key
   */
  private getInstanceKey(name: string, config: AdapterConfig): string {
    const configHash = this.hashConfig(config);
    return `${name}:${configHash}`;
  }

  /**
   * Hash configuration for instance caching
   */
  private hashConfig(config: AdapterConfig): string {
    try {
      return btoa(JSON.stringify(config)).substring(0, 8);
    } catch {
      return Math.random().toString(36).substring(2, 10);
    }
  }

  /**
   * Find latest version of adapter
   */
  private findLatestVersion(name: string): string | null {
    let latestVersion = '';
    let latestKey = '';
    
    for (const [key, registration] of this.adapters.entries()) {
      if (registration.name === name) {
        if (!latestVersion || this.isNewerVersion(registration.version, latestVersion)) {
          latestVersion = registration.version;
          latestKey = key;
        }
      }
    }
    
    return latestKey || null;
  }

  /**
   * Compare versions (basic semver comparison)
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      
      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }
    
    return 0;
  }

  /**
   * Check if version A is newer than version B
   */
  private isNewerVersion(a: string, b: string): boolean {
    return this.compareVersions(a, b) > 0;
  }
}