/**
 * Enhanced HTTP Client with Advanced Retry Logic
 * Integrates RetryPolicy, Circuit Breaker, and Network Status Detection
 */

import { EventEmitter } from 'events';
import { HTTPClient, HTTPClientConfig, RequestOptions, HTTPResponse } from './HTTPClient.js';
import { RetryPolicy, RetryContext, NetworkStatusDetector } from './RetryPolicy.js';
import { CircuitBreaker, CircuitBreakerFactory } from './CircuitBreaker.js';
import { NetworkError, TimeoutError } from './NetworkError.js';
import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode } from '../../types/errors.js';

/**
 * Enhanced HTTP client configuration
 */
export interface EnhancedHTTPClientConfig extends HTTPClientConfig {
  /** Retry policy preset or custom policy */
  retryPolicy?: 'conservative' | 'aggressive' | 'fast' | 'none' | RetryPolicy;
  /** Enable network status detection */
  networkStatusDetection?: boolean;
  /** Enable request deduplication */
  deduplication?: boolean;
  /** Request queue configuration */
  requestQueue?: {
    maxConcurrent: number;
    maxQueued: number;
    timeout: number;
  };
  /** Enable detailed telemetry */
  telemetry?: boolean;
}

/**
 * Request telemetry data
 */
export interface RequestTelemetry {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  attempts: number;
  errors: any[];
  circuitBreakerState?: string;
  networkStatus?: boolean;
  success: boolean;
  statusCode?: number;
  retryDelays: number[];
}

/**
 * Enhanced HTTP client with advanced retry capabilities
 */
export class EnhancedHTTPClient extends EventEmitter {
  private httpClient: HTTPClient;
  private retryPolicy: RetryPolicy;
  private networkDetector: NetworkStatusDetector;
  private inflightRequests = new Map<string, Promise<any>>();
  private requestQueue: Array<{
    execute: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  private activeRequests = 0;
  private telemetryEnabled: boolean;
  private deduplicationEnabled: boolean;
  
  constructor(config: EnhancedHTTPClientConfig = {}) {
    super();
    
    // Initialize base HTTP client
    this.httpClient = new HTTPClient({
      ...config,
      // Disable built-in retry as we'll handle it here
      retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 }
    });
    
    // Initialize retry policy
    if (typeof config.retryPolicy === 'string') {
      this.retryPolicy = RetryPolicy.fromPreset(config.retryPolicy);
    } else if (config.retryPolicy instanceof RetryPolicy) {
      this.retryPolicy = config.retryPolicy;
    } else {
      this.retryPolicy = RetryPolicy.fromPreset('conservative');
    }
    
    // Initialize network detector
    this.networkDetector = new NetworkStatusDetector();
    
    // Enable telemetry
    this.telemetryEnabled = config.telemetry || false;
    
    // Enable deduplication
    this.deduplicationEnabled = config.deduplication || false;
    
    // Forward events from base client
    this.httpClient.on('request', (data) => this.emit('request', data));
    this.httpClient.on('response', (data) => this.emit('response', data));
    this.httpClient.on('error', (data) => this.emit('error', data));
  }
  
  /**
   * Make an HTTP request with enhanced retry logic
   */
  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<HTTPResponse<T>> {
    const requestKey = this.getRequestKey(url, options);
    
    // Check for deduplication
    const shouldDeduplicate = options.deduplicate !== false && 
                             (options.deduplicate === true || this.deduplicationEnabled);
    
    if (shouldDeduplicate && this.inflightRequests.has(requestKey)) {
      this.emit('deduplicated', { url, method: options.method || 'GET' });
      return this.inflightRequests.get(requestKey)!;
    }
    
    // Create telemetry record
    const telemetry: RequestTelemetry = {
      url,
      method: options.method || 'GET',
      startTime: Date.now(),
      attempts: 0,
      errors: [],
      success: false,
      retryDelays: [],
    };
    
    // Check network status if enabled
    if (options.checkNetwork !== false) {
      const isOnline = await this.networkDetector.isNetworkAvailable();
      telemetry.networkStatus = isOnline;
      
      if (!isOnline) {
        const error = new NetworkError('Network is offline', {
          context: { url, offline: true }
        });
        this.emitTelemetry(telemetry, false);
        throw error;
      }
    }
    
    // Execute request with retry
    const promise = this.executeWithRetry<T>(url, options, telemetry);
    
    // Store for deduplication
    if (shouldDeduplicate) {
      this.inflightRequests.set(requestKey, promise);
      promise.finally(() => {
        this.inflightRequests.delete(requestKey);
      });
    }
    
    return promise;
  }
  
  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestOptions,
    telemetry: RequestTelemetry
  ): Promise<HTTPResponse<T>> {
    const retryContext = new RetryContext(this.retryPolicy, `${options.method || 'GET'} ${url}`);
    let lastError: any;
    
    while (true) {
      try {
        telemetry.attempts++;
        
        // Check circuit breaker state
        const circuitBreaker = this.getCircuitBreaker(url);
        if (circuitBreaker) {
          telemetry.circuitBreakerState = circuitBreaker.getState();
        }
        
        // Make the request
        const response = await this.httpClient.request<T>(url, options);
        
        // Success!
        telemetry.success = true;
        telemetry.statusCode = response.status;
        telemetry.endTime = Date.now();
        telemetry.duration = telemetry.endTime - telemetry.startTime;
        
        this.emitTelemetry(telemetry, true);
        return response;
        
      } catch (error) {
        lastError = error;
        telemetry.errors.push({
          attempt: telemetry.attempts,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        });
        
        retryContext.recordAttempt(error);
        
        // Check if we should retry
        const decision = retryContext.shouldRetry(error);
        if (!decision.shouldRetry) {
          telemetry.endTime = Date.now();
          telemetry.duration = telemetry.endTime - telemetry.startTime;
          this.emitTelemetry(telemetry, false);
          
          throw this.enhanceError(error, retryContext);
        }
        
        // Wait before retry
        if (decision.delayMs && decision.delayMs > 0) {
          telemetry.retryDelays.push(decision.delayMs);
          this.emit('retry', {
            url,
            attempt: telemetry.attempts,
            delay: decision.delayMs,
            reason: decision.reason,
            error,
          });
          
          await this.delay(decision.delayMs);
        }
      }
    }
  }
  
  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }
  
  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }
  
  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }
  
  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
  
  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }
  
  /**
   * Get or create circuit breaker for URL
   */
  private getCircuitBreaker(url: string): CircuitBreaker | null {
    const baseClient = this.httpClient as any;
    return baseClient.circuitBreaker || null;
  }
  
  /**
   * Get request key for deduplication
   */
  private getRequestKey(url: string, options: RequestOptions): string {
    const method = options.method || 'GET';
    const params = options.params ? JSON.stringify(options.params) : '';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${params}:${body}`;
  }
  
  /**
   * Enhance error with retry context
   */
  private enhanceError(error: any, context: RetryContext): Error {
    const stats = context.getStats();
    const enhancedError = error instanceof BaseError
      ? error
      : new NetworkError(error instanceof Error ? error.message : String(error), {
          cause: error instanceof Error ? error : undefined,
        });
    
    // Add retry context to error
    if (enhancedError instanceof BaseError) {
      enhancedError.context = {
        ...enhancedError.context,
        retryStats: stats,
      };
    }
    
    return enhancedError;
  }
  
  /**
   * Emit telemetry event
   */
  private emitTelemetry(telemetry: RequestTelemetry, success: boolean): void {
    if (!this.telemetryEnabled) return;
    
    this.emit('telemetry', {
      ...telemetry,
      success,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Update retry policy
   */
  setRetryPolicy(policy: RetryPolicy | keyof typeof RetryPolicy): void {
    if (typeof policy === 'string') {
      this.retryPolicy = RetryPolicy.fromPreset(policy as any);
    } else {
      this.retryPolicy = policy;
    }
  }
  
  /**
   * Get current retry policy
   */
  getRetryPolicy(): RetryPolicy {
    return this.retryPolicy;
  }
  
  /**
   * Force update network status
   */
  setNetworkStatus(online: boolean): void {
    this.networkDetector.setOnline(online);
  }
  
  /**
   * Check network status
   */
  async checkNetworkStatus(): Promise<boolean> {
    return this.networkDetector.isNetworkAvailable();
  }
}