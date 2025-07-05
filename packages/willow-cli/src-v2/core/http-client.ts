/**
 * Simplified HTTP Client for Willow CLI
 * Uses native fetch with exponential backoff retry
 */

import { WillowError } from '../types';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface RetryOptions {
  attempts: number;
  delay: number;
  maxDelay: number;
  factor: number;
}

export class HTTPClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(options: {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
  } = {}) {
    this.baseURL = options.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Willow-CLI/2.0',
      ...options.headers
    };
    this.defaultTimeout = options.timeout || 30000;
    this.defaultRetries = options.retries || 3;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryOptions: RetryOptions
  ): Promise<Response> {
    let lastError: Error | null = null;
    let delay = retryOptions.delay;

    for (let attempt = 0; attempt < retryOptions.attempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.defaultTimeout
        );

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Don't retry on client errors (except 429)
        if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
          return response;
        }

        // For server errors or 429, throw to trigger retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt < retryOptions.attempts - 1) {
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * retryOptions.factor, retryOptions.maxDelay);
        }
      }
    }

    throw new WillowError(
      `Request failed after ${retryOptions.attempts} attempts: ${lastError?.message}`,
      'NETWORK_ERROR',
      { url, lastError }
    );
  }

  private buildURL(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return this.baseURL ? `${this.baseURL}${path}` : path;
  }

  private prepareBody(body: any): string | FormData | undefined {
    if (!body) return undefined;
    if (body instanceof FormData) return body;
    if (typeof body === 'string') return body;
    return JSON.stringify(body);
  }

  async request<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildURL(path);
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = 1000
    } = options;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers
      }
    };

    // Add body if present
    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = this.prepareBody(body);
    }

    const retryOptions: RetryOptions = {
      attempts: retries,
      delay: retryDelay,
      maxDelay: 10000,
      factor: 2
    };

    try {
      const response = await this.fetchWithRetry(url, fetchOptions, retryOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new WillowError(
          `HTTP ${response.status}: ${errorText}`,
          'HTTP_ERROR',
          { status: response.status, response: errorText }
        );
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        return await response.text() as any;
      } else {
        return await response.blob() as any;
      }
    } catch (error) {
      if (error instanceof WillowError) {
        throw error;
      }
      throw new WillowError(
        `Network request failed: ${(error as Error).message}`,
        'NETWORK_ERROR',
        { url, error }
      );
    }
  }

  // Convenience methods
  get<T = any>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  put<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  delete<T = any>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  patch<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }
}