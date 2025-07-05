/**
 * Network Error Types
 * Specialized error classes for network-related failures
 */

import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode, ErrorContext, ErrorMetadata } from '../../types/errors.js';

export interface NetworkErrorOptions {
  cause?: Error;
  context?: ErrorContext;
  metadata?: ErrorMetadata & {
    statusCode?: number;
    responseTime?: number;
    requestId?: string;
    retryCount?: number;
    endpoint?: string;
  };
}

export class NetworkError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    options?: NetworkErrorOptions
  ) {
    super(message, code, options);
  }

  toUserMessage(): string {
    return 'A network error occurred. Please check your internet connection and try again.';
  }

  isRetryable(): boolean {
    return true;
  }

  getSuggestedActions(): string[] {
    return [
      'Check your internet connection',
      'Verify the service is available',
      'Try again in a few moments',
      'Contact support if the problem persists'
    ];
  }
}

export class TimeoutError extends NetworkError {
  constructor(
    message: string,
    options?: NetworkErrorOptions
  ) {
    super(message, ErrorCode.TIMEOUT, options);
  }

  toUserMessage(): string {
    const timeout = this.metadata?.timeout;
    if (timeout) {
      return `The request timed out after ${Math.round(timeout / 1000)} seconds. The server might be slow or unresponsive.`;
    }
    return 'The request timed out. The server might be slow or unresponsive.';
  }
}

export class ConnectionRefusedError extends NetworkError {
  constructor(
    message: string,
    options?: NetworkErrorOptions
  ) {
    super(message, ErrorCode.CONNECTION_REFUSED, options);
  }

  toUserMessage(): string {
    return 'Unable to connect to the server. Please check if the service is running and accessible.';
  }

  getSuggestedActions(): string[] {
    return [
      'Verify the server URL is correct',
      'Check if the service is running',
      'Ensure firewall settings allow the connection',
      'Try using a different network'
    ];
  }
}

export class DNSLookupError extends NetworkError {
  constructor(
    message: string,
    options?: NetworkErrorOptions
  ) {
    super(message, ErrorCode.DNS_LOOKUP_FAILED, options);
  }

  toUserMessage(): string {
    const hostname = this.context?.url ? new URL(this.context.url).hostname : 'the server';
    return `Unable to resolve ${hostname}. Please check the URL and your DNS settings.`;
  }

  getSuggestedActions(): string[] {
    return [
      'Verify the URL is spelled correctly',
      'Check your DNS settings',
      'Try using a different DNS server',
      'Ensure you have internet connectivity'
    ];
  }
}

export class RegistryUnavailableError extends NetworkError {
  constructor(
    message: string,
    options?: NetworkErrorOptions
  ) {
    super(message, ErrorCode.REGISTRY_UNAVAILABLE, options);
  }

  toUserMessage(): string {
    return 'The component registry is currently unavailable. Please try again later.';
  }

  isRetryable(): boolean {
    // Registry errors might be temporary
    return true;
  }
}

export class HTTPError extends NetworkError {
  public readonly statusCode: number;
  public readonly statusText: string;
  public readonly responseBody?: any;

  constructor(
    statusCode: number,
    statusText: string,
    responseBody?: any,
    options?: NetworkErrorOptions
  ) {
    const message = `HTTP ${statusCode}: ${statusText}`;
    super(message, ErrorCode.NETWORK_ERROR, {
      ...options,
      metadata: {
        ...options?.metadata,
        statusCode,
        statusText,
        responseBody
      }
    });

    this.statusCode = statusCode;
    this.statusText = statusText;
    this.responseBody = responseBody;
  }

  toUserMessage(): string {
    switch (this.statusCode) {
      case 400:
        return 'The request was invalid. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please provide valid credentials.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
        return 'The server encountered an error. Please try again later.';
      case 502:
        return 'The server is temporarily unavailable. Please try again later.';
      case 503:
        return 'The service is currently unavailable. Please try again later.';
      default:
        return `Server returned an error (${this.statusCode}). Please try again later.`;
    }
  }

  isRetryable(): boolean {
    // Retry on server errors and specific client errors
    return this.statusCode >= 500 || this.statusCode === 429 || this.statusCode === 408;
  }

  getSuggestedActions(): string[] {
    const actions: string[] = [];

    switch (this.statusCode) {
      case 401:
        actions.push('Check your authentication credentials', 'Ensure your access token is valid');
        break;
      case 403:
        actions.push('Verify you have the necessary permissions', 'Contact your administrator');
        break;
      case 404:
        actions.push('Check the URL is correct', 'Verify the resource exists');
        break;
      case 429:
        actions.push('Wait before making more requests', 'Check rate limit documentation');
        break;
      case 500:
      case 502:
      case 503:
        actions.push('Wait a few minutes and try again', 'Check service status page', 'Contact support if the issue persists');
        break;
    }

    return actions;
  }
}