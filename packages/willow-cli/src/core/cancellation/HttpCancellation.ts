/**
 * HTTP Cancellation Integration
 * Integrates cancellation tokens with HTTP clients
 */

import { CancellationToken } from './CancellationToken.js';
import { HTTPClient } from '../network/HTTPClient.js';
import { EnhancedHTTPClient } from '../network/EnhancedHTTPClient.js';
import { NetworkError } from '../network/NetworkError.js';
import { HTTPRequestConfig } from '../network/types.js';

/**
 * Extend HTTPRequestConfig to include cancellation token
 */
export interface CancellableHTTPRequestConfig extends HTTPRequestConfig {
  /** Cancellation token for the request */
  cancellationToken?: CancellationToken;
}

/**
 * Create a cancellable HTTP client wrapper
 */
export class CancellableHTTPClient implements HTTPClient {
  constructor(private client: HTTPClient) {}

  async get<T = any>(
    url: string,
    config?: CancellableHTTPRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: CancellableHTTPRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: CancellableHTTPRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  async delete<T = any>(
    url: string,
    config?: CancellableHTTPRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: CancellableHTTPRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  async request<T = any>(
    config: CancellableHTTPRequestConfig
  ): Promise<T> {
    const { cancellationToken, ...httpConfig } = config;
    
    if (cancellationToken) {
      // Add abort signal to config
      const abortSignal = cancellationToken.abortSignal;
      const configWithSignal = {
        ...httpConfig,
        signal: abortSignal,
      };
      
      // Race the request against cancellation
      return cancellationToken.race(
        this.client.request<T>(configWithSignal)
      );
    }
    
    // No cancellation token, proceed normally
    return this.client.request<T>(httpConfig);
  }
}

/**
 * Create a cancellable enhanced HTTP client
 */
export class CancellableEnhancedHTTPClient extends EnhancedHTTPClient {
  /**
   * Override request method to support cancellation
   */
  async request<T = any>(
    config: CancellableHTTPRequestConfig
  ): Promise<T> {
    const { cancellationToken, ...httpConfig } = config;
    
    if (cancellationToken) {
      // Add abort signal to config
      const configWithSignal = {
        ...httpConfig,
        signal: cancellationToken.abortSignal,
      };
      
      // Execute with retry logic and cancellation
      return this.executeWithRetry(
        () => cancellationToken.race(super.request<T>(configWithSignal)),
        configWithSignal
      );
    }
    
    // No cancellation token, proceed normally
    return super.request<T>(httpConfig);
  }

  /**
   * Override executeWithRetry to check cancellation between retries
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: CancellableHTTPRequestConfig
  ): Promise<T> {
    const { cancellationToken } = config;
    
    // If no cancellation token, use parent implementation
    if (!cancellationToken) {
      return super.executeWithRetry(operation, config);
    }
    
    const maxRetries = this.getRetryConfig().maxRetries;
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check cancellation before each retry
        cancellationToken.throwIfCancelled();
        
        // Attempt the operation
        return await operation();
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on cancellation
        if (cancellationToken.isCancelled) {
          throw error;
        }
        
        // Check if we should retry
        if (attempt < maxRetries && this.shouldRetry(error as Error)) {
          const delay = this.getRetryDelay(attempt);
          
          // Wait with cancellation support
          await this.delayWithCancellation(delay, cancellationToken);
          
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError || new NetworkError('Max retries exceeded', 'MAX_RETRIES');
  }

  /**
   * Delay with cancellation support
   */
  private async delayWithCancellation(
    ms: number,
    token: CancellationToken
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      
      // Set up cancellation
      const unsubscribe = token.onCancelled((reason) => {
        clearTimeout(timeoutId);
        reject(new NetworkError(
          `Request cancelled during retry delay: ${reason.message}`,
          'CANCELLED'
        ));
      });
      
      // Set up timeout
      timeoutId = setTimeout(() => {
        unsubscribe();
        resolve();
      }, ms);
    });
  }
}

/**
 * Create a cancellable fetch wrapper
 */
export function createCancellableFetch(
  token?: CancellationToken
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const cancellationToken = token || CancellationToken.none;
    
    // Merge abort signals if both are provided
    let signal: AbortSignal | undefined;
    
    if (init?.signal && cancellationToken.abortSignal) {
      // Create a combined abort controller
      const controller = new AbortController();
      
      // Abort if either signal aborts
      init.signal.addEventListener('abort', () => controller.abort());
      cancellationToken.abortSignal.addEventListener('abort', () => controller.abort());
      
      signal = controller.signal;
    } else {
      signal = init?.signal || cancellationToken.abortSignal;
    }
    
    // Make the request with the combined signal
    return fetch(input, {
      ...init,
      signal,
    });
  };
}

/**
 * Batch HTTP requests with cancellation support
 */
export class CancellableBatchRequests<T> {
  private requests: Array<() => Promise<T>> = [];
  private results: T[] = [];
  private errors: Error[] = [];

  constructor(
    private client: CancellableHTTPClient,
    private options: {
      maxConcurrent?: number;
      stopOnError?: boolean;
    } = {}
  ) {}

  /**
   * Add a request to the batch
   */
  add(
    url: string,
    config?: CancellableHTTPRequestConfig
  ): this {
    this.requests.push(() => this.client.get<T>(url, config));
    return this;
  }

  /**
   * Add a custom request function
   */
  addCustom(request: () => Promise<T>): this {
    this.requests.push(request);
    return this;
  }

  /**
   * Execute all requests with cancellation support
   */
  async execute(token?: CancellationToken): Promise<{
    results: T[];
    errors: Error[];
    cancelled: boolean;
  }> {
    const cancellationToken = token || CancellationToken.none;
    const maxConcurrent = this.options.maxConcurrent || 5;
    let cancelled = false;
    
    try {
      // Execute requests in batches
      for (let i = 0; i < this.requests.length; i += maxConcurrent) {
        // Check cancellation before each batch
        cancellationToken.throwIfCancelled();
        
        const batch = this.requests.slice(i, i + maxConcurrent);
        const batchResults = await Promise.allSettled(
          batch.map(req => cancellationToken.race(req()))
        );
        
        // Process results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            this.results.push(result.value);
          } else {
            this.errors.push(result.reason);
            
            // Stop on error if configured
            if (this.options.stopOnError) {
              throw result.reason;
            }
          }
        }
      }
    } catch (error) {
      if (cancellationToken.isCancelled) {
        cancelled = true;
      } else {
        throw error;
      }
    }
    
    return {
      results: this.results,
      errors: this.errors,
      cancelled,
    };
  }

  /**
   * Clear the batch
   */
  clear(): void {
    this.requests = [];
    this.results = [];
    this.errors = [];
  }
}