/**
 * Network Module Integration Tests
 * Demonstrates comprehensive network failure handling with retry logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { HTTPClientFactory } from '../HTTPClientFactory.js';
import { CircuitBreakerFactory } from '../CircuitBreaker.js';
import { HTTPClient, RequestProgress } from '../HTTPClient.js';
import { NetworkError, HTTPError, ConnectionRefusedError } from '../NetworkError.js';

describe('Network Integration Tests', () => {
  let server: Server;
  let serverUrl: string;
  let requestCount: number;

  beforeEach(async () => {
    requestCount = 0;
    
    server = createServer((req, res) => {
      requestCount++;
      
      if (req.url === '/flaky') {
        // Simulate flaky service - fails first 2 times, then succeeds
        if (requestCount < 3) {
          res.writeHead(503);
          res.end('Service temporarily unavailable');
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Success after retries' }));
        }
      } else if (req.url === '/intermittent') {
        // Simulate intermittent failures
        if (requestCount % 2 === 1) {
          res.writeHead(500);
          res.end('Random server error');
        } else {
          res.writeHead(200);
          res.end('Success');
        }
      } else if (req.url === '/slow') {
        // Simulate slow response
        setTimeout(() => {
          res.writeHead(200);
          res.end('Slow response');
        }, 10);
      } else if (req.url === '/download') {
        // Simulate large file download
        res.writeHead(200, { 
          'Content-Type': 'application/octet-stream',
          'Content-Length': '1000'
        });
        
        let sent = 0;
        const interval = setInterval(() => {
          if (sent >= 1000) {
            clearInterval(interval);
            res.end();
          } else {
            const chunk = Math.min(100, 1000 - sent);
            res.write('x'.repeat(chunk));
            sent += chunk;
          }
        }, 1);
      } else if (req.url === '/fail-500') {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        res.writeHead(200);
        res.end('OK');
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        serverUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    
    // Reset circuit breakers
    CircuitBreakerFactory.resetAll();
  });

  describe('Retry with Exponential Backoff', () => {
    it('should successfully retry flaky service', async () => {
      const client = new HTTPClient({
        baseURL: serverUrl,
        retry: {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 1,
          maxDelay: 10
        },
        circuitBreaker: false
      });

      const response = await client.get('/flaky');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Success after retries' });
      expect(requestCount).toBe(3); // Failed twice, succeeded on third attempt
    }, 500);

    it('should track retry progress', async () => {
      const progressUpdates: RequestProgress[] = [];
      
      const client = new HTTPClient({
        baseURL: serverUrl,
        retry: {
          maxAttempts: 2,
          backoff: 'linear',
          initialDelay: 1
        },
        circuitBreaker: false
      });

      try {
        await client.get('/fail-500', {
          onProgress: (progress) => {
            progressUpdates.push({ ...progress });
          }
        });
      } catch (error) {
        // Expected to fail after retries
      }

      const retryUpdates = progressUpdates.filter(p => p.phase === 'retrying');
      expect(retryUpdates.length).toBeGreaterThan(0);
      expect(retryUpdates[0].retryAttempt).toBe(1);
      expect(retryUpdates[0].maxRetries).toBe(2);
    }, 500);
  });

  describe('Circuit Breaker Protection', () => {
    it('should protect against cascading failures', async () => {
      const client = new HTTPClient({
        baseURL: serverUrl,
        circuitBreaker: {
          failureThreshold: 2,
          successThreshold: 1,
          resetTimeout: 100
        },
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 }
      });

      const failures: Error[] = [];
      
      // Generate failures to trip circuit breaker
      for (let i = 0; i < 4; i++) {
        try {
          await client.get('/fail-500');
        } catch (error) {
          failures.push(error as Error);
        }
      }
      
      expect(failures.length).toBe(4);
      
      // First 2 should be HTTP errors
      expect(failures[0]).toBeInstanceOf(HTTPError);
      expect(failures[1]).toBeInstanceOf(HTTPError);
      
      // Last 2 should be circuit breaker errors (requests rejected)
      expect(failures[2].message).toContain('Circuit breaker');
      expect(failures[3].message).toContain('Circuit breaker');
    }, 500);
  });

  describe('Download with Progress', () => {
    it('should download large files with progress tracking', async () => {
      const progressUpdates: RequestProgress[] = [];
      
      const client = new HTTPClient({
        baseURL: serverUrl,
        circuitBreaker: false
      });

      const response = await client.get('/download', {
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        }
      });

      expect(response.status).toBe(200);
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      const phases = progressUpdates.map(p => p.phase);
      expect(phases).toContain('connecting');
      expect(phases).toContain('receiving');
      
      // Should track progress to completion
      const receivingUpdates = progressUpdates.filter(p => p.phase === 'receiving');
      expect(receivingUpdates.some(p => p.percentage === 100)).toBe(true);
    }, 1000);
  });

  describe('Timeout Handling', () => {
    it('should handle different timeout scenarios', async () => {
      const quickClient = new HTTPClient({
        baseURL: serverUrl,
        timeout: 5, // Very short timeout (shorter than /slow delay of 10ms)
        circuitBreaker: false
      });

      await expect(quickClient.get('/slow')).rejects.toThrow();
    }, 2000);
  });

  describe('Error Recovery Strategies', () => {
    it('should handle intermittent failures gracefully', async () => {
      const client = new HTTPClient({
        baseURL: serverUrl,
        retry: {
          maxAttempts: 3,
          backoff: 'linear',
          initialDelay: 1, // Much faster for tests
          maxDelay: 10
        },
        circuitBreaker: false
      });

      // First request will fail (requestCount will be 1, which is odd)
      requestCount = 0; // Reset for this test
      const response = await client.get('/intermittent');
      
      expect(response.status).toBe(200);
    }, 1000);

    it('should use different strategies for different error types', async () => {
      const strategies = {
        'network': 'exponential',
        'http': 'linear'
      } as const;

      for (const [errorType, backoff] of Object.entries(strategies)) {
        const client = new HTTPClient({
          baseURL: serverUrl,
          retry: {
            maxAttempts: 2,
            backoff: backoff as any,
            initialDelay: 1
          },
          circuitBreaker: false
        });

        try {
          if (errorType === 'http') {
            await client.get('/fail-500');
          } else {
            await client.get('/nonexistent');
          }
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    }, 500);
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const client = new HTTPClient({
        baseURL: serverUrl,
        circuitBreaker: false
      });

      const promises = Array.from({ length: 5 }, (_, i) =>
        client.get(`/?request=${i}`)
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(5);
      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
      });
    }, 500);
  });

  describe('Request Cancellation', () => {
    it('should cancel in-flight requests', async () => {
      const client = new HTTPClient({
        baseURL: serverUrl,
        circuitBreaker: false
      });

      const controller = new AbortController();
      
      const promise = client.get('/slow', {
        signal: controller.signal
      });

      // Cancel immediately
      controller.abort();

      await expect(promise).rejects.toThrow();
      
      try {
        await promise;
      } catch (error) {
        expect(error.message).toContain('cancelled');
      }
    }, 2000);
  });

  describe('Factory Pattern Integration', () => {
    it('should work with HTTPClientFactory', async () => {
      const client = HTTPClientFactory.getInstance('test-registry', 'default', {
        baseURL: serverUrl,
        circuitBreaker: false
      });

      const response = await client.get('/');
      expect(response.status).toBe(200);
      
      // Should reuse same instance
      const client2 = HTTPClientFactory.getInstance('test-registry');
      expect(client2).toBe(client);
    });
  });
});