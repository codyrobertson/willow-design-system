/**
 * HTTP Client Factory
 * Creates pre-configured HTTP clients for different use cases
 */

import { HTTPClient, HTTPClientConfig } from './HTTPClient.js';
import { CircuitBreakerFactory } from './CircuitBreaker.js';

export type ClientType = 'default' | 'registry' | 'api' | 'download' | 'upload';

export interface FactoryConfig {
  /** Default configurations for different client types */
  defaults?: Partial<Record<ClientType, HTTPClientConfig>>;
  /** Global default configuration */
  globalDefaults?: HTTPClientConfig;
}

export class HTTPClientFactory {
  private static instances = new Map<string, HTTPClient>();
  private static config: FactoryConfig = {
    defaults: {
      default: {
        timeout: 30000,
        retry: {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 1000,
          maxDelay: 10000
        }
      },
      registry: {
        baseURL: process.env.WILLOW_REGISTRY_URL || 'https://registry.willow.dev',
        timeout: 60000,
        retry: {
          maxAttempts: 5,
          backoff: 'exponential',
          initialDelay: 2000,
          maxDelay: 20000
        },
        circuitBreaker: {
          failureThreshold: 3,
          successThreshold: 2,
          resetTimeout: 60000
        }
      },
      api: {
        timeout: 30000,
        retry: {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 1000,
          maxDelay: 5000
        },
        circuitBreaker: {
          failureThreshold: 5,
          successThreshold: 2,
          resetTimeout: 30000
        }
      },
      download: {
        timeout: 300000, // 5 minutes for downloads
        maxContentLength: 500 * 1024 * 1024, // 500MB
        retry: {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 5000,
          maxDelay: 30000
        },
        circuitBreaker: false as any // Disable circuit breaker for downloads
      },
      upload: {
        timeout: 600000, // 10 minutes for uploads
        retry: {
          maxAttempts: 2, // Fewer retries for uploads
          backoff: 'exponential',
          initialDelay: 5000,
          maxDelay: 15000
        },
        circuitBreaker: false // Disable circuit breaker for uploads
      }
    }
  };

  /**
   * Configure factory defaults
   */
  static configure(config: FactoryConfig): void {
    this.config = {
      ...this.config,
      ...config,
      defaults: {
        ...this.config.defaults,
        ...config.defaults
      }
    };
  }

  /**
   * Create a new HTTP client
   */
  static create(type: ClientType = 'default', config?: HTTPClientConfig): HTTPClient {
    const baseConfig = this.config.defaults?.[type] || {};
    const globalConfig = this.config.globalDefaults || {};
    
    const finalConfig: HTTPClientConfig = {
      ...globalConfig,
      ...baseConfig,
      ...config,
      headers: {
        ...globalConfig.headers,
        ...baseConfig.headers,
        ...config?.headers
      },
      retry: {
        ...globalConfig.retry,
        ...baseConfig.retry,
        ...config?.retry
      },
      circuitBreaker: config?.circuitBreaker === false 
        ? false
        : {
            ...globalConfig.circuitBreaker,
            ...baseConfig.circuitBreaker,
            ...config?.circuitBreaker
          }
    };

    return new HTTPClient(finalConfig);
  }

  /**
   * Get or create a singleton client instance
   */
  static getInstance(
    name: string,
    type: ClientType = 'default',
    config?: HTTPClientConfig
  ): HTTPClient {
    let instance = this.instances.get(name);
    
    if (!instance) {
      instance = this.create(type, config);
      this.instances.set(name, instance);
    }
    
    return instance;
  }

  /**
   * Remove a client instance
   */
  static removeInstance(name: string): void {
    const instance = this.instances.get(name);
    if (instance) {
      instance.removeAllListeners();
      this.instances.delete(name);
    }
  }

  /**
   * Create a registry client
   */
  static createRegistryClient(config?: HTTPClientConfig): HTTPClient {
    return this.create('registry', config);
  }

  /**
   * Create an API client
   */
  static createAPIClient(baseURL: string, config?: HTTPClientConfig): HTTPClient {
    return this.create('api', {
      baseURL,
      ...config
    });
  }

  /**
   * Create a download client
   */
  static createDownloadClient(config?: HTTPClientConfig): HTTPClient {
    return this.create('download', config);
  }

  /**
   * Create an upload client
   */
  static createUploadClient(config?: HTTPClientConfig): HTTPClient {
    return this.create('upload', config);
  }

  /**
   * Get all client instances
   */
  static getAllInstances(): Map<string, HTTPClient> {
    return new Map(this.instances);
  }

  /**
   * Reset all circuit breakers
   */
  static resetAllCircuitBreakers(): void {
    CircuitBreakerFactory.resetAll();
  }

  /**
   * Create a client with custom retry logic
   */
  static createWithCustomRetry(
    retryPredicate: (error: any) => boolean,
    config?: HTTPClientConfig
  ): HTTPClient {
    return this.create('default', {
      ...config,
      retry: {
        ...config?.retry,
        shouldRetry: retryPredicate
      } as any
    });
  }

  /**
   * Create a client for testing (no retries, no circuit breaker)
   */
  static createTestClient(config?: HTTPClientConfig): HTTPClient {
    return new HTTPClient({
      ...config,
      retry: {
        maxAttempts: 1,
        backoff: 'linear',
        initialDelay: 0
      },
      circuitBreaker: false as any,
      timeout: 5000
    });
  }
}