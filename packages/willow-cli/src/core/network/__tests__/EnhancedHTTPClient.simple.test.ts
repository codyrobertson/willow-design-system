/**
 * Simple EnhancedHTTPClient Tests
 * Focused tests without complex async issues
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedHTTPClient } from '../EnhancedHTTPClient';
import { RetryPolicy } from '../RetryPolicy';
import { HTTPError } from '../NetworkError';

describe('EnhancedHTTPClient Simple Tests', () => {
  describe('Retry Policy Configuration', () => {
    it('should use conservative policy preset', () => {
      const client = new EnhancedHTTPClient({
        retryPolicy: 'conservative',
      });
      
      const policy = client.getRetryPolicy();
      const config = policy.getConfig();
      
      expect(config.maxAttempts).toBe(3);
      expect(config.backoffStrategy).toBe('exponential');
      expect(config.retryableStatusCodes).toContain(503);
    });

    it('should use aggressive policy preset', () => {
      const client = new EnhancedHTTPClient({
        retryPolicy: 'aggressive',
      });
      
      const policy = client.getRetryPolicy();
      const config = policy.getConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.backoffStrategy).toBe('exponential');
    });

    it('should use custom retry policy', () => {
      const customPolicy = new RetryPolicy({
        maxAttempts: 10,
        initialDelayMs: 200,
      });
      
      const client = new EnhancedHTTPClient({
        retryPolicy: customPolicy,
      });
      
      expect(client.getRetryPolicy()).toBe(customPolicy);
    });

    it('should update retry policy', () => {
      const client = new EnhancedHTTPClient();
      
      // Update with preset
      client.setRetryPolicy('fast');
      expect(client.getRetryPolicy().getConfig().maxAttempts).toBe(3);
      expect(client.getRetryPolicy().getConfig().backoffStrategy).toBe('linear');
      
      // Update with custom
      const custom = new RetryPolicy({ maxAttempts: 7 });
      client.setRetryPolicy(custom);
      expect(client.getRetryPolicy()).toBe(custom);
    });
  });

  describe('Network Status', () => {
    it('should allow manual network status updates', () => {
      const client = new EnhancedHTTPClient();
      
      // Should not throw
      expect(() => client.setNetworkStatus(false)).not.toThrow();
      expect(() => client.setNetworkStatus(true)).not.toThrow();
    });

    it('should check network status', async () => {
      const client = new EnhancedHTTPClient();
      
      // Mock the network detector
      const mockDetector = {
        isNetworkAvailable: vi.fn().mockResolvedValue(true),
        setOnline: vi.fn(),
      };
      (client as any).networkDetector = mockDetector;
      
      const isOnline = await client.checkNetworkStatus();
      expect(isOnline).toBe(true);
      expect(mockDetector.isNetworkAvailable).toHaveBeenCalled();
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      const client = new EnhancedHTTPClient({
        deduplication: true,
      });
      
      // Disable network checking to avoid interference with deduplication
      client.setNetworkStatus(true);
      
      // Create a delayed response to ensure deduplication has time to work
      const mockResponse = { status: 200, data: { id: 1 } };
      const mockRequest = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });
      (client as any).httpClient.request = mockRequest;
      
      // Make multiple identical requests with network check disabled
      const promises = [
        client.request('/test', { method: 'GET', checkNetwork: false }),
        client.request('/test', { method: 'GET', checkNetwork: false }),
        client.request('/test', { method: 'GET', checkNetwork: false }),
      ];
      
      const results = await Promise.all(promises);
      
      // All should get the same response
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
      
      // But only one actual request should be made
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should not deduplicate different requests', async () => {
      const client = new EnhancedHTTPClient({
        deduplication: true,
      });
      
      // Ensure network is online
      client.setNetworkStatus(true);
      
      // Mock the HTTP client - use different responses for different URLs
      const mockRequest = vi.fn().mockImplementation((url: string) => {
        if (url === '/test1') {
          return Promise.resolve({ status: 200, data: { id: 1 } });
        } else if (url === '/test2') {
          return Promise.resolve({ status: 200, data: { id: 2 } });
        } else if (url === '/test3') {
          return Promise.resolve({ status: 200, data: { id: 3 } });
        }
        return Promise.resolve({ status: 200, data: { id: 0 } });
      });
      (client as any).httpClient.request = mockRequest;
      
      // Make different requests with network check disabled to avoid interference
      const results = await Promise.all([
        client.request('/test1', { method: 'GET', checkNetwork: false }),
        client.request('/test2', { method: 'GET', checkNetwork: false }),
        client.request('/test3', { method: 'GET', checkNetwork: false }),
      ]);
      
      // Should make 3 separate requests
      expect(mockRequest).toHaveBeenCalledTimes(3);
      expect(results[0].data).toEqual({ id: 1 });
      expect(results[1].data).toEqual({ id: 2 });
      expect(results[2].data).toEqual({ id: 3 });
    });
  });

  describe('Telemetry', () => {
    it('should emit telemetry when enabled', async () => {
      const client = new EnhancedHTTPClient({
        telemetry: true,
      });
      
      const telemetryHandler = vi.fn();
      client.on('telemetry', telemetryHandler);
      
      // Mock successful request
      (client as any).httpClient.request = vi.fn().mockResolvedValue({
        status: 200,
        data: 'ok',
      });
      
      await client.get('/test');
      
      expect(telemetryHandler).toHaveBeenCalledWith(expect.objectContaining({
        url: '/test',
        method: 'GET',
        success: true,
        statusCode: 200,
      }));
    });

    it('should not emit telemetry when disabled', async () => {
      const client = new EnhancedHTTPClient({
        telemetry: false,
      });
      
      const telemetryHandler = vi.fn();
      client.on('telemetry', telemetryHandler);
      
      // Mock successful request
      (client as any).httpClient.request = vi.fn().mockResolvedValue({
        status: 200,
        data: 'ok',
      });
      
      await client.get('/test');
      
      expect(telemetryHandler).not.toHaveBeenCalled();
    });
  });

  describe('Event Forwarding', () => {
    it('should forward events from base HTTP client', () => {
      const client = new EnhancedHTTPClient();
      
      const requestHandler = vi.fn();
      const responseHandler = vi.fn();
      const errorHandler = vi.fn();
      
      client.on('request', requestHandler);
      client.on('response', responseHandler);
      client.on('error', errorHandler);
      
      // Emit events on the base client
      const baseClient = (client as any).httpClient;
      
      baseClient.emit('request', { url: '/test' });
      expect(requestHandler).toHaveBeenCalledWith({ url: '/test' });
      
      baseClient.emit('response', { status: 200 });
      expect(responseHandler).toHaveBeenCalledWith({ status: 200 });
      
      baseClient.emit('error', { message: 'Error' });
      expect(errorHandler).toHaveBeenCalledWith({ message: 'Error' });
    });
  });

  describe('HTTP Methods', () => {
    let client: EnhancedHTTPClient;
    let mockRequest: any;

    beforeEach(() => {
      client = new EnhancedHTTPClient();
      mockRequest = vi.fn().mockResolvedValue({ status: 200, data: 'ok' });
      (client as any).httpClient.request = mockRequest;
    });

    it('should support GET requests', async () => {
      await client.get('/test');
      expect(mockRequest).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('should support POST requests', async () => {
      const data = { test: true };
      await client.post('/test', data);
      expect(mockRequest).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'POST',
        body: data,
      }));
    });

    it('should support PUT requests', async () => {
      const data = { update: true };
      await client.put('/test', data);
      expect(mockRequest).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'PUT',
        body: data,
      }));
    });

    it('should support DELETE requests', async () => {
      await client.delete('/test');
      expect(mockRequest).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'DELETE',
      }));
    });

    it('should support PATCH requests', async () => {
      const data = { patch: true };
      await client.patch('/test', data);
      expect(mockRequest).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'PATCH',
        body: data,
      }));
    });
  });

  describe('Retry Behavior (Mocked)', () => {
    it('should retry on failure and emit events', async () => {
      const client = new EnhancedHTTPClient({
        retryPolicy: new RetryPolicy({
          maxAttempts: 3,
          initialDelayMs: 10,
          retryableStatusCodes: [503],
        }),
      });
      
      const retryHandler = vi.fn();
      client.on('retry', retryHandler);
      
      // Mock to fail twice then succeed
      let attemptCount = 0;
      const mockHttpRequest = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new HTTPError(503, 'Service Unavailable');
          return Promise.reject(error);
        }
        return Promise.resolve({ status: 200, data: 'success' });
      });
      (client as any).httpClient.request = mockHttpRequest;
      
      const response = await client.get('/test');
      
      expect(response.status).toBe(200);
      expect(retryHandler).toHaveBeenCalledTimes(2);
      expect(retryHandler).toHaveBeenCalledWith(expect.objectContaining({
        url: '/test',
        attempt: expect.any(Number),
        delay: expect.any(Number),
        reason: expect.any(String),
      }));
    });

    it('should fail after max retries', async () => {
      const client = new EnhancedHTTPClient({
        retryPolicy: new RetryPolicy({
          maxAttempts: 2,
          initialDelayMs: 10,
          retryableStatusCodes: [503],
        }),
      });
      
      // Mock to always fail
      (client as any).httpClient.request = vi.fn()
        .mockRejectedValue(new HTTPError(503, 'Service Unavailable'));
      
      await expect(client.get('/test')).rejects.toThrow(HTTPError);
    });

    it('should not retry on non-retryable errors', async () => {
      const client = new EnhancedHTTPClient({
        retryPolicy: 'conservative',
      });
      
      const retryHandler = vi.fn();
      client.on('retry', retryHandler);
      
      // Mock to fail with non-retryable error
      (client as any).httpClient.request = vi.fn()
        .mockRejectedValue(new HTTPError(400, 'Bad Request'));
      
      await expect(client.get('/test')).rejects.toThrow(HTTPError);
      expect(retryHandler).not.toHaveBeenCalled();
    });
  });
});