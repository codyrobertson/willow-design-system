/**
 * Network Error Tests
 */

import { describe, it, expect } from 'vitest';
import {
  NetworkError,
  TimeoutError,
  ConnectionRefusedError,
  DNSLookupError,
  RegistryUnavailableError,
  HTTPError
} from '../NetworkError.js';
import { ErrorCode } from '../../../types/errors.js';

describe('NetworkError', () => {
  describe('NetworkError', () => {
    it('should create network error with default code', () => {
      const error = new NetworkError('Network failed');
      
      expect(error.message).toBe('Network failed');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.isRetryable()).toBe(true);
      expect(error.toUserMessage()).toContain('network error occurred');
    });

    it('should include metadata and context', () => {
      const error = new NetworkError('Connection failed', ErrorCode.NETWORK_ERROR, {
        context: { url: 'https://api.example.com' },
        metadata: { statusCode: 500, responseTime: 1234 }
      });
      
      expect(error.context?.url).toBe('https://api.example.com');
      expect(error.metadata?.statusCode).toBe(500);
      expect(error.metadata?.responseTime).toBe(1234);
    });

    it('should provide suggested actions', () => {
      const error = new NetworkError('Network error');
      const actions = error.getSuggestedActions();
      
      expect(actions).toContain('Check your internet connection');
      expect(actions).toContain('Verify the service is available');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Request timed out');
      
      expect(error.code).toBe(ErrorCode.TIMEOUT);
      expect(error.isRetryable()).toBe(true);
    });

    it('should include timeout duration in user message', () => {
      const error = new TimeoutError('Timed out', {
        metadata: { timeout: 30000 }
      });
      
      expect(error.toUserMessage()).toContain('30 seconds');
    });
  });

  describe('ConnectionRefusedError', () => {
    it('should create connection refused error', () => {
      const error = new ConnectionRefusedError('Connection refused');
      
      expect(error.code).toBe(ErrorCode.CONNECTION_REFUSED);
      expect(error.isRetryable()).toBe(true);
      expect(error.toUserMessage()).toContain('Unable to connect');
    });

    it('should provide connection-specific suggestions', () => {
      const error = new ConnectionRefusedError('ECONNREFUSED');
      const actions = error.getSuggestedActions();
      
      expect(actions).toContain('Verify the server URL is correct');
      expect(actions).toContain('Check if the service is running');
    });
  });

  describe('DNSLookupError', () => {
    it('should create DNS lookup error', () => {
      const error = new DNSLookupError('DNS resolution failed');
      
      expect(error.code).toBe(ErrorCode.DNS_LOOKUP_FAILED);
      expect(error.isRetryable()).toBe(true);
    });

    it('should include hostname in user message', () => {
      const error = new DNSLookupError('ENOTFOUND', {
        context: { url: 'https://invalid.example.com/api' }
      });
      
      expect(error.toUserMessage()).toContain('invalid.example.com');
    });

    it('should provide DNS-specific suggestions', () => {
      const error = new DNSLookupError('DNS error');
      const actions = error.getSuggestedActions();
      
      expect(actions).toContain('Verify the URL is spelled correctly');
      expect(actions).toContain('Check your DNS settings');
    });
  });

  describe('RegistryUnavailableError', () => {
    it('should create registry unavailable error', () => {
      const error = new RegistryUnavailableError('Registry is down');
      
      expect(error.code).toBe(ErrorCode.REGISTRY_UNAVAILABLE);
      expect(error.isRetryable()).toBe(true);
      expect(error.toUserMessage()).toContain('registry is currently unavailable');
    });
  });

  describe('HTTPError', () => {
    it('should create HTTP error with status code', () => {
      const error = new HTTPError(404, 'Not Found', { error: 'Resource not found' });
      
      expect(error.message).toBe('HTTP 404: Not Found');
      expect(error.statusCode).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.responseBody).toEqual({ error: 'Resource not found' });
    });

    it('should determine retryability based on status code', () => {
      const error500 = new HTTPError(500, 'Internal Server Error');
      const error404 = new HTTPError(404, 'Not Found');
      const error429 = new HTTPError(429, 'Too Many Requests');
      const error408 = new HTTPError(408, 'Request Timeout');
      
      expect(error500.isRetryable()).toBe(true);
      expect(error404.isRetryable()).toBe(false);
      expect(error429.isRetryable()).toBe(true);
      expect(error408.isRetryable()).toBe(true);
    });

    it('should provide appropriate user messages', () => {
      const testCases = [
        { code: 400, expected: 'invalid' },
        { code: 401, expected: 'Authentication' },
        { code: 403, expected: 'Access denied' },
        { code: 404, expected: 'not found' },
        { code: 429, expected: 'Too many requests' },
        { code: 500, expected: 'server encountered an error' },
        { code: 502, expected: 'temporarily unavailable' },
        { code: 503, expected: 'currently unavailable' }
      ];

      testCases.forEach(({ code, expected }) => {
        const error = new HTTPError(code, 'Error');
        expect(error.toUserMessage()).toContain(expected);
      });
    });

    it('should provide status-specific suggestions', () => {
      const error401 = new HTTPError(401, 'Unauthorized');
      const error403 = new HTTPError(403, 'Forbidden');
      const error404 = new HTTPError(404, 'Not Found');
      const error429 = new HTTPError(429, 'Too Many Requests');
      const error500 = new HTTPError(500, 'Internal Server Error');

      expect(error401.getSuggestedActions()).toContain('Check your authentication credentials');
      expect(error403.getSuggestedActions()).toContain('Verify you have the necessary permissions');
      expect(error404.getSuggestedActions()).toContain('Check the URL is correct');
      expect(error429.getSuggestedActions()).toContain('Wait before making more requests');
      expect(error500.getSuggestedActions()).toContain('Wait a few minutes and try again');
    });

    it('should include metadata in error', () => {
      const error = new HTTPError(503, 'Service Unavailable', null, {
        metadata: {
          requestId: 'abc123',
          retryCount: 2
        }
      });
      
      expect(error.metadata?.statusCode).toBe(503);
      expect(error.metadata?.requestId).toBe('abc123');
      expect(error.metadata?.retryCount).toBe(2);
    });
  });
});