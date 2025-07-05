/**
 * HTTP Client with Retry Logic
 * Robust HTTP client with exponential backoff, circuit breaker, and progress tracking
 */

import { EventEmitter } from 'events';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { ErrorRecovery, RetryOptions } from '../../errors/ErrorRecovery.js';
import { CircuitBreaker, CircuitBreakerOptions } from './CircuitBreaker.js';
import { 
  NetworkError, 
  TimeoutError, 
  ConnectionRefusedError, 
  DNSLookupError,
  HTTPError 
} from './NetworkError.js';
import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode } from '../../types/errors.js';

export interface HTTPClientConfig {
  /** Base URL for all requests */
  baseURL?: string;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Default retry options */
  retry?: Partial<RetryOptions>;
  /** Circuit breaker options (false to disable) */
  circuitBreaker?: Partial<CircuitBreakerOptions> | false;
  /** Default headers */
  headers?: Record<string, string>;
  /** User agent string */
  userAgent?: string;
  /** Enable request/response logging */
  debug?: boolean;
  /** Maximum response size in bytes */
  maxContentLength?: number;
  /** Follow redirects */
  followRedirects?: boolean;
  /** Maximum number of redirects to follow */
  maxRedirects?: number;
}

export interface RequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Request timeout override */
  timeout?: number;
  /** Retry options override */
  retry?: Partial<RetryOptions> | false;
  /** Use circuit breaker */
  useCircuitBreaker?: boolean;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Progress callback */
  onProgress?: (progress: RequestProgress) => void;
  /** Response type */
  responseType?: 'json' | 'text' | 'buffer';
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
}

export interface RequestProgress {
  /** Current phase of request */
  phase: 'connecting' | 'sending' | 'waiting' | 'receiving' | 'retrying';
  /** Bytes sent */
  sent?: number;
  /** Bytes received */
  received?: number;
  /** Total bytes expected */
  total?: number;
  /** Percentage complete */
  percentage?: number;
  /** Current retry attempt */
  retryAttempt?: number;
  /** Total retry attempts */
  maxRetries?: number;
  /** Time elapsed in milliseconds */
  elapsed?: number;
}

export interface HTTPResponse<T = any> {
  /** Response data */
  data: T;
  /** Response status code */
  status: number;
  /** Response status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string | string[]>;
  /** Request configuration */
  config: RequestOptions;
  /** Request duration in milliseconds */
  duration: number;
}

export class HTTPClient extends EventEmitter {
  private config: Required<HTTPClientConfig>;
  private circuitBreaker?: CircuitBreaker;

  constructor(config: HTTPClientConfig = {}) {
    super();
    
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      retry: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000,
        ...config.retry
      },
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        resetTimeout: 60000,
        ...config.circuitBreaker
      },
      headers: {
        'User-Agent': config.userAgent || 'Willow-CLI/1.0.0',
        ...config.headers
      },
      userAgent: config.userAgent || 'Willow-CLI/1.0.0',
      debug: config.debug || false,
      maxContentLength: config.maxContentLength || 50 * 1024 * 1024, // 50MB
      followRedirects: config.followRedirects !== false,
      maxRedirects: config.maxRedirects || 5
    };

    // Initialize circuit breaker if enabled
    if (config.circuitBreaker !== false) {
      this.circuitBreaker = new CircuitBreaker({
        ...this.config.circuitBreaker,
        name: `http-client-${this.config.baseURL || 'default'}`
      });

      // Forward circuit breaker events
      this.circuitBreaker.on('open', (stats) => 
        this.emit('circuitOpen', stats)
      );
      this.circuitBreaker.on('close', (stats) => 
        this.emit('circuitClose', stats)
      );
    }
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<HTTPResponse<T>> {
    const fullUrl = this.buildURL(url, options.params);
    const startTime = Date.now();

    // Prepare request options
    const requestOptions: RequestOptions = {
      method: 'GET',
      responseType: 'json',
      useCircuitBreaker: true,
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers
      }
    };

    // Execute with circuit breaker if enabled
    if (this.circuitBreaker && requestOptions.useCircuitBreaker) {
      return this.circuitBreaker.execute(() => 
        this.executeRequest(fullUrl, requestOptions, startTime)
      );
    }

    return this.executeRequest(fullUrl, requestOptions, startTime);
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
    data?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body: data });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body: data });
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
    data?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: data });
  }

  /**
   * HEAD request
   */
  async head(
    url: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HTTPResponse<void>> {
    return this.request<void>(url, { ...options, method: 'HEAD' });
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    options: RequestOptions,
    startTime: number
  ): Promise<HTTPResponse<T>> {
    const timeout = options.timeout || this.config.timeout;

    // Prepare retry options
    const retryOptions: RetryOptions = options.retry === false
      ? { maxAttempts: 1, backoff: 'linear', initialDelay: 0 }
      : {
          ...this.config.retry,
          ...options.retry
        };
    
    // Add callback handlers
    const originalOnRetry = retryOptions.onRetry;
    retryOptions.onRetry = (attempt, error) => {
      if (options.onProgress) {
        options.onProgress({
          phase: 'retrying',
          retryAttempt: attempt,
          maxRetries: retryOptions.maxAttempts,
          elapsed: Date.now() - startTime
        });
      }
      this.emit('retry', { attempt, error, url });
      if (originalOnRetry) {
        originalOnRetry(attempt, error);
      }
    };
    
    retryOptions.shouldRetry = (error: BaseError) => {
      // Don't retry on client errors (except 429)
      if (error instanceof HTTPError) {
        return error.isRetryable();
      }
      // Retry on network errors
      return error.isRetryable();
    };

    // Execute with retry
    return ErrorRecovery.withRetry(
      () => ErrorRecovery.withTimeout(
        () => this.performRequest<T>(url, options, startTime),
        timeout,
        new TimeoutError(`Request to ${url} timed out after ${timeout}ms`, {
          context: { url, timeout },
          metadata: { timeout }
        })
      ),
      retryOptions
    );
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest<T>(
    url: string,
    options: RequestOptions,
    startTime: number,
    redirectCount: number = 0
  ): Promise<HTTPResponse<T>> {
    return new Promise((resolve, reject) => {
      try {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        // Prepare request body
        let body: Buffer | undefined;
        if (options.body) {
          if (Buffer.isBuffer(options.body)) {
            body = options.body;
          } else if (typeof options.body === 'string') {
            body = Buffer.from(options.body);
          } else {
            body = Buffer.from(JSON.stringify(options.body));
            options.headers = {
              'Content-Type': 'application/json',
              ...options.headers
            };
          }
          
          if (body) {
            options.headers = {
              ...options.headers,
              'Content-Length': body.length.toString()
            };
          }
        }

        // Create request options
        const requestOpts: https.RequestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method,
          headers: options.headers,
          agent: isHttps ? https.globalAgent : http.globalAgent,
          rejectUnauthorized: true
        };

        if (this.config.debug) {
          this.emit('request', { url, options: requestOpts });
        }

        // Report progress
        if (options.onProgress) {
          options.onProgress({
            phase: 'connecting',
            elapsed: Date.now() - startTime
          });
        }

        // Create request
        const req = httpModule.request(requestOpts, (res) => {
          const chunks: Buffer[] = [];
          let received = 0;

          // Handle redirects
          if (this.config.followRedirects && res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirectCount >= this.config.maxRedirects) {
              reject(new NetworkError(
                `Too many redirects (${redirectCount + 1})`,
                ErrorCode.NETWORK_ERROR,
                { context: { url, redirectCount: redirectCount + 1 } }
              ));
              return;
            }

            const redirectUrl = new URL(res.headers.location, url).toString();
            
            if (this.config.debug) {
              this.emit('redirect', { from: url, to: redirectUrl });
            }

            // Follow redirect
            this.performRequest<T>(redirectUrl, options, startTime, redirectCount + 1)
              .then(resolve)
              .catch(reject);
            
            req.abort();
            return;
          }

          // Check content length
          const contentLength = parseInt(res.headers['content-length'] as string || '0', 10);
          if (contentLength > this.config.maxContentLength) {
            reject(new NetworkError(
              `Response too large: ${contentLength} bytes exceeds maximum of ${this.config.maxContentLength} bytes`,
              ErrorCode.NETWORK_ERROR,
              { 
                context: { url },
                metadata: { contentLength, maxContentLength: this.config.maxContentLength }
              }
            ));
            req.abort();
            return;
          }

          // Report progress
          if (options.onProgress) {
            options.onProgress({
              phase: 'receiving',
              received: 0,
              total: contentLength || undefined,
              percentage: contentLength ? 0 : undefined,
              elapsed: Date.now() - startTime
            });
          }

          res.on('data', (chunk: Buffer) => {
            received += chunk.length;
            chunks.push(chunk);

            // Check size during download
            if (received > this.config.maxContentLength) {
              reject(new NetworkError(
                `Response too large: received ${received} bytes exceeds maximum of ${this.config.maxContentLength} bytes`,
                ErrorCode.NETWORK_ERROR,
                {
                  context: { url },
                  metadata: { received, maxContentLength: this.config.maxContentLength }
                }
              ));
              req.abort();
              return;
            }

            // Report progress
            if (options.onProgress && contentLength) {
              options.onProgress({
                phase: 'receiving',
                received,
                total: contentLength,
                percentage: Math.round((received / contentLength) * 100),
                elapsed: Date.now() - startTime
              });
            }
          });

          res.on('end', () => {
            const duration = Date.now() - startTime;
            const responseData = Buffer.concat(chunks);

            if (this.config.debug) {
              this.emit('response', { 
                url, 
                status: res.statusCode, 
                headers: res.headers,
                duration 
              });
            }

            // Check for HTTP errors
            if (res.statusCode && res.statusCode >= 400) {
              let errorBody: any;
              try {
                errorBody = JSON.parse(responseData.toString());
              } catch {
                errorBody = responseData.toString();
              }

              reject(new HTTPError(
                res.statusCode,
                res.statusMessage || 'Unknown error',
                errorBody,
                {
                  context: { url },
                  metadata: { 
                    statusCode: res.statusCode,
                    responseTime: duration,
                    endpoint: url
                  }
                }
              ));
              return;
            }

            // Parse response
            let data: T;
            try {
              if (options.responseType === 'buffer') {
                data = responseData as any;
              } else if (options.responseType === 'text') {
                data = responseData.toString() as any;
              } else {
                // Default to JSON
                const text = responseData.toString();
                // If content-type is not JSON, treat as text
                const contentType = res.headers['content-type'] || '';
                if (contentType.includes('application/json')) {
                  data = text ? JSON.parse(text) : null;
                } else {
                  // For non-JSON responses, return as text
                  data = text as any;
                }
              }
            } catch (error) {
              reject(new NetworkError(
                `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
                ErrorCode.NETWORK_ERROR,
                {
                  cause: error instanceof Error ? error : undefined,
                  context: { url },
                  metadata: { responseSize: responseData.length }
                }
              ));
              return;
            }

            resolve({
              data,
              status: res.statusCode || 0,
              statusText: res.statusMessage || '',
              headers: res.headers,
              config: options,
              duration
            });
          });
        });

        // Handle request errors
        req.on('error', (error: NodeJS.ErrnoException) => {
          if (this.config.debug) {
            this.emit('error', { url, error });
          }

          // Map Node.js errors to our error types
          if (error.code === 'ECONNREFUSED') {
            reject(new ConnectionRefusedError(
              `Connection refused: ${error.message}`,
              {
                cause: error,
                context: { url },
                metadata: { code: error.code }
              }
            ));
          } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
            reject(new DNSLookupError(
              `DNS lookup failed: ${error.message}`,
              {
                cause: error,
                context: { url },
                metadata: { code: error.code }
              }
            ));
          } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            reject(new TimeoutError(
              `Request timed out: ${error.message}`,
              {
                cause: error,
                context: { url },
                metadata: { code: error.code }
              }
            ));
          } else {
            reject(new NetworkError(
              `Network error: ${error.message}`,
              ErrorCode.NETWORK_ERROR,
              {
                cause: error,
                context: { url },
                metadata: { code: error.code }
              }
            ));
          }
        });

        // Handle timeout
        req.setTimeout(options.timeout || this.config.timeout, () => {
          req.abort();
          reject(new TimeoutError(
            `Request timed out after ${options.timeout || this.config.timeout}ms`,
            {
              context: { url },
              metadata: { timeout: options.timeout || this.config.timeout }
            }
          ));
        });

        // Handle abort signal
        if (options.signal) {
          // Check if already aborted
          if (options.signal.aborted) {
            req.abort();
            reject(new NetworkError(
              'Request was cancelled',
              ErrorCode.OPERATION_CANCELLED,
              { context: { url } }
            ));
            return;
          }
          
          options.signal.addEventListener('abort', () => {
            req.abort();
            reject(new NetworkError(
              'Request was cancelled',
              ErrorCode.OPERATION_CANCELLED,
              { context: { url } }
            ));
          });
        }

        // Send request body
        if (body) {
          if (options.onProgress) {
            options.onProgress({
              phase: 'sending',
              sent: 0,
              total: body.length,
              percentage: 0,
              elapsed: Date.now() - startTime
            });
          }

          req.write(body, () => {
            if (options.onProgress) {
              options.onProgress({
                phase: 'waiting',
                sent: body.length,
                total: body.length,
                percentage: 100,
                elapsed: Date.now() - startTime
              });
            }
          });
        }

        req.end();
      } catch (error) {
        reject(NetworkError.wrap(
          error,
          ErrorCode.NETWORK_ERROR,
          `Failed to make request to ${url}`,
          { url }
        ));
      }
    });
  }

  /**
   * Build full URL with query parameters
   */
  private buildURL(url: string, params?: Record<string, string | number | boolean>): string {
    // Handle relative URLs
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const parsedUrl = new URL(fullUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        parsedUrl.searchParams.set(key, String(value));
      }
    });

    return parsedUrl.toString();
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker?.getStats();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }
}