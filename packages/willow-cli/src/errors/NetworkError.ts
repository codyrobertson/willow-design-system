/**
 * Network Error
 * For HTTP requests, API calls, and network-related failures
 */

import { BaseError } from './BaseError.js';
import { ErrorCode, ErrorContext } from '../types/errors.js';
import chalk from 'chalk';

export interface NetworkErrorDetails {
  url?: string;
  method?: string;
  statusCode?: number;
  statusText?: string;
  responseBody?: any;
  requestBody?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export class NetworkError extends BaseError {
  public readonly details: NetworkErrorDetails;

  constructor(
    message: string,
    details: NetworkErrorDetails = {},
    options?: {
      cause?: Error;
      context?: ErrorContext;
    }
  ) {
    const code = NetworkError.getErrorCode(details);

    super(message, code, {
      ...options,
      context: {
        ...options?.context,
        url: details.url,
        operation: details.method
      },
      metadata: { 
        httpStatus: details.statusCode,
        ...details 
      }
    });

    this.details = details;
  }

  private static getErrorCode(details: NetworkErrorDetails): ErrorCode {
    if (details.statusCode) {
      if (details.statusCode === 404) return ErrorCode.COMPONENT_NOT_FOUND;
      if (details.statusCode >= 500) return ErrorCode.REGISTRY_UNAVAILABLE;
    }
    
    if (details.timeout) return ErrorCode.TIMEOUT;
    
    return ErrorCode.NETWORK_ERROR;
  }

  toUserMessage(): string {
    const parts: string[] = [
      chalk.red('✖ Network Error:'),
      this.message
    ];

    if (this.details.url) {
      parts.push(chalk.gray(`  URL: ${this.details.url}`));
    }

    if (this.details.statusCode) {
      const statusColor = this.details.statusCode >= 500 ? chalk.red : chalk.yellow;
      parts.push(statusColor(`  Status: ${this.details.statusCode} ${this.details.statusText || ''}`));
    }

    if (this.details.timeout) {
      parts.push(chalk.gray(`  Timeout: ${this.details.timeout}ms`));
    }

    const suggestions = this.getSuggestedActions();
    if (suggestions.length > 0) {
      parts.push(chalk.cyan('\n  Suggestions:'));
      suggestions.forEach(suggestion => {
        parts.push(chalk.cyan(`    → ${suggestion}`));
      });
    }

    return parts.join('\n');
  }

  isRetryable(): boolean {
    // Network errors are generally retryable
    if (!this.details.statusCode) return true;
    
    // Don't retry client errors (except 429 Too Many Requests)
    if (this.details.statusCode >= 400 && this.details.statusCode < 500) {
      return this.details.statusCode === 429;
    }
    
    // Retry server errors and timeouts
    return true;
  }

  getSuggestedActions(): string[] {
    const suggestions: string[] = [];

    if (this.isRetryable()) {
      suggestions.push('Try running the command again');
    }

    if (this.details.statusCode === 404) {
      suggestions.push('Check that the component name is correct');
      suggestions.push('Run \'willow list\' to see available components');
    }

    if (this.details.statusCode === 401 || this.details.statusCode === 403) {
      suggestions.push('Check your authentication credentials');
      suggestions.push('Ensure you have access to the registry');
    }

    if (this.details.timeout) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try increasing the timeout with --timeout option');
    }

    if (this.code === ErrorCode.REGISTRY_UNAVAILABLE) {
      suggestions.push('The registry may be temporarily unavailable');
      suggestions.push('Check https://status.willow.design for service status');
    }

    if (this.details.url?.includes('localhost')) {
      suggestions.push('Ensure the local server is running');
    }

    return suggestions;
  }

  static fromFetchError(error: any, url: string, options?: RequestInit): NetworkError {
    if (error.name === 'AbortError') {
      return new NetworkError(
        'Request was cancelled',
        { url, method: options?.method || 'GET' },
        { cause: error }
      );
    }

    if (error.type === 'request-timeout') {
      return new NetworkError(
        'Request timed out',
        { 
          url, 
          method: options?.method || 'GET',
          timeout: 30000 // Default timeout
        },
        { cause: error }
      );
    }

    return new NetworkError(
      error.message || 'Network request failed',
      { url, method: options?.method || 'GET' },
      { cause: error }
    );
  }

  static fromResponse(response: Response, body?: any): NetworkError {
    return new NetworkError(
      `HTTP ${response.status}: ${response.statusText}`,
      {
        url: response.url,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: body
      }
    );
  }
}