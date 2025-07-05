/**
 * HTTP Client Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { HTTPClient, HTTPClientConfig } from '../HTTPClient.js';
import { NetworkError, TimeoutError, HTTPError } from '../NetworkError.js';
import { CircuitState } from '../CircuitBreaker.js';

describe('HTTPClient', () => {
  let server: Server;
  let serverUrl: string;
  let client: HTTPClient;

  beforeEach(async () => {
    // Create test server
    server = createServer((req, res) => {
      const { method, url, headers } = req;
      
      // Parse URL to separate path from query
      const parsedUrl = new URL(url || '/', `http://localhost`);
      const pathname = parsedUrl.pathname;
      
      // Collect request body
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        // Route handling
        if (pathname === '/success') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Success' }));
        } else if (pathname === '/delay') {
          setTimeout(() => {
            res.writeHead(200);
            res.end('Delayed response');
          }, 10);
        } else if (pathname === '/error/400') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Bad Request' }));
        } else if (pathname === '/error/500') {
          res.writeHead(500);
          res.end('Internal Server Error');
        } else if (pathname === '/error/503') {
          res.writeHead(503);
          res.end('Service Unavailable');
        } else if (pathname === '/redirect') {
          res.writeHead(302, { 'Location': '/success' });
          res.end();
        } else if (pathname === '/redirect-loop') {
          res.writeHead(302, { 'Location': '/redirect-loop' });
          res.end();
        } else if (pathname === '/large-response') {
          res.writeHead(200, { 
            'Content-Type': 'text/plain',
            'Content-Length': '1000000'
          });
          const chunk = 'x'.repeat(1000);
          for (let i = 0; i < 1000; i++) {
            res.write(chunk);
          }
          res.end();
        } else if (pathname === '/stream') {
          res.writeHead(200, { 
            'Content-Type': 'text/plain',
            'Content-Length': '100'
          });
          // Send data in chunks
          let sent = 0;
          const interval = setInterval(() => {
            if (sent >= 100) {
              clearInterval(interval);
              res.end();
            } else {
              res.write('x');
              sent++;
            }
          }, 10);
        } else if (pathname === '/echo') {
          res.writeHead(200, { 
            'Content-Type': headers['content-type'] || 'text/plain',
            'X-Echo-Method': method || '',
            'X-Echo-Headers': JSON.stringify(headers)
          });
          res.end(body || 'No body');
        } else if (pathname === '/headers') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(headers));
        } else if (pathname?.startsWith('/status/')) {
          const status = parseInt(pathname.split('/')[2]);
          res.writeHead(status);
          res.end(`Status ${status}`);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
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
    client?.removeAllListeners();
    // Reset circuit breaker
    client?.resetCircuitBreaker();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Basic Requests', () => {
    beforeEach(() => {
      client = new HTTPClient({ 
        baseURL: serverUrl,
        circuitBreaker: false 
      });
    });

    it('should make successful GET request', async () => {
      const response = await client.get('/success');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Success' });
      expect(response.duration).toBeGreaterThan(0);
    });

    it('should make POST request with data', async () => {
      const data = { test: 'data' };
      const response = await client.post('/echo', data, {
        responseType: 'text'
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toBe(JSON.stringify(data));
      expect(response.headers['x-echo-method']).toBe('POST');
    });

    it('should make PUT request', async () => {
      const data = { update: true };
      const response = await client.put('/echo', data);
      
      expect(response.status).toBe(200);
      expect(response.headers['x-echo-method']).toBe('PUT');
    });

    it('should make DELETE request', async () => {
      const response = await client.delete('/echo');
      
      expect(response.status).toBe(200);
      expect(response.headers['x-echo-method']).toBe('DELETE');
    });

    it('should make PATCH request', async () => {
      const data = { patch: true };
      const response = await client.patch('/echo', data);
      
      expect(response.status).toBe(200);
      expect(response.headers['x-echo-method']).toBe('PATCH');
    });

    it('should make HEAD request', async () => {
      const response = await client.head('/success');
      
      expect(response.status).toBe(200);
      expect(response.data).toBeFalsy(); // Could be null or undefined
    });

    it('should handle query parameters', async () => {
      const response = await client.get('/echo', {
        params: { foo: 'bar', num: 123, bool: true }
      });
      
      expect(response.config.params).toEqual({ foo: 'bar', num: 123, bool: true });
    });

    it('should handle custom headers', async () => {
      const response = await client.get('/headers', {
        headers: { 'X-Custom-Header': 'test-value' }
      });
      
      expect(response.data['x-custom-header']).toBe('test-value');
    });

    it('should handle text response type', async () => {
      const response = await client.get('/success', {
        responseType: 'text'
      });
      
      expect(typeof response.data).toBe('string');
      expect(response.data).toContain('Success');
    });

    it('should handle buffer response type', async () => {
      const response = await client.get('/success', {
        responseType: 'buffer'
      });
      
      expect(Buffer.isBuffer(response.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      client = new HTTPClient({ 
        baseURL: serverUrl,
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 },
        circuitBreaker: false
      });
    });

    it('should handle 4xx errors', async () => {
      await expect(client.get('/error/400')).rejects.toThrow(HTTPError);
      
      try {
        await client.get('/error/400');
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPError);
        if (error instanceof HTTPError) {
          expect(error.statusCode).toBe(400);
          expect(error.responseBody).toEqual({ error: 'Bad Request' });
          expect(error.isRetryable()).toBe(false);
        }
      }
    });

    it('should handle 5xx errors', async () => {
      await expect(client.get('/error/500')).rejects.toThrow(HTTPError);
      
      try {
        await client.get('/error/500');
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPError);
        if (error instanceof HTTPError) {
          expect(error.statusCode).toBe(500);
          expect(error.isRetryable()).toBe(true);
        }
      }
    });

    it('should handle connection errors', async () => {
      const badClient = new HTTPClient({ 
        baseURL: 'http://localhost:1',
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 },
        circuitBreaker: false
      });
      
      await expect(badClient.get('/')).rejects.toThrow(NetworkError);
    });

    it('should handle timeout errors', async () => {
      const timeoutClient = new HTTPClient({ 
        baseURL: serverUrl,
        timeout: 5, // Shorter than the 10ms delay
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 },
        circuitBreaker: false
      });
      
      await expect(timeoutClient.get('/delay')).rejects.toThrow(TimeoutError);
    });

    it('should handle DNS errors', async () => {
      const dnsClient = new HTTPClient({ 
        baseURL: 'http://invalid.domain.that.does.not.exist',
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 },
        circuitBreaker: false
      });
      
      await expect(dnsClient.get('/')).rejects.toThrow(NetworkError);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on server errors', async () => {
      let attempts = 0;
      const retryServer = createServer((req, res) => {
        attempts++;
        if (attempts < 3) {
          res.writeHead(503);
          res.end('Service Unavailable');
        } else {
          res.writeHead(200);
          res.end('Success after retries');
        }
      });

      await new Promise<void>(resolve => {
        retryServer.listen(0, () => resolve());
      });

      const port = (retryServer.address() as AddressInfo).port;
      const retryClient = new HTTPClient({
        baseURL: `http://localhost:${port}`,
        retry: {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 1,
          maxDelay: 100
        },
        circuitBreaker: false
      });

      const response = await retryClient.get('/');
      expect(response.status).toBe(200);
      expect(attempts).toBe(3);

      await new Promise<void>(resolve => {
        retryServer.close(() => resolve());
      });
    });

    it('should respect retry configuration', async () => {
      const retryClient = new HTTPClient({
        baseURL: serverUrl,
        retry: {
          maxAttempts: 2,
          backoff: 'linear',
          initialDelay: 5
        },
        circuitBreaker: false
      });

      const startTime = Date.now();
      
      await expect(retryClient.get('/error/503')).rejects.toThrow(HTTPError);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThan(50); // At least one retry delay
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      
      const retryClient = new HTTPClient({
        baseURL: serverUrl,
        retry: {
          maxAttempts: 2,
          backoff: 'linear',
          initialDelay: 1,
          onRetry
        },
        circuitBreaker: false
      });

      await expect(retryClient.get('/error/503')).rejects.toThrow();
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should not retry when disabled', async () => {
      let attempts = 0;
      const countServer = createServer((req, res) => {
        attempts++;
        res.writeHead(503);
        res.end();
      });

      await new Promise<void>(resolve => {
        countServer.listen(0, () => resolve());
      });

      const port = (countServer.address() as AddressInfo).port;
      const noRetryClient = new HTTPClient({
        baseURL: `http://localhost:${port}`,
        circuitBreaker: false
      });

      await expect(noRetryClient.get('/', { retry: false })).rejects.toThrow();
      
      expect(attempts).toBe(1);

      await new Promise<void>(resolve => {
        countServer.close(() => resolve());
      });
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after failures', async () => {
      const breakerClient = new HTTPClient({
        baseURL: serverUrl,
        circuitBreaker: {
          failureThreshold: 2,
          successThreshold: 1,
          resetTimeout: 50
        },
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 }
      });

      // Fail twice to open circuit
      await expect(breakerClient.get('/error/503')).rejects.toThrow();
      await expect(breakerClient.get('/error/503')).rejects.toThrow();

      // Circuit should be open
      const stats = breakerClient.getCircuitBreakerStats();
      expect(stats?.state).toBe(CircuitState.OPEN);

      // Next request should fail fast
      await expect(breakerClient.get('/success')).rejects.toThrow();
    });

    it('should disable circuit breaker when requested', async () => {
      const noCircuitClient = new HTTPClient({
        baseURL: serverUrl,
        circuitBreaker: false
      });

      expect(noCircuitClient.getCircuitBreakerStats()).toBeUndefined();
    });

    it('should emit circuit breaker events', async () => {
      const breakerClient = new HTTPClient({
        baseURL: serverUrl,
        circuitBreaker: {
          failureThreshold: 1,
          successThreshold: 1,
          resetTimeout: 50
        },
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 }
      });

      const openHandler = vi.fn();
      breakerClient.on('circuitOpen', openHandler);

      await expect(breakerClient.get('/error/503')).rejects.toThrow();

      expect(openHandler).toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(() => {
      client = new HTTPClient({ 
        baseURL: serverUrl,
        circuitBreaker: false 
      });
    });

    it('should report progress for downloads', async () => {
      const progressUpdates: any[] = [];
      
      const response = await client.get('/stream', {
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        }
      });

      expect(response.status).toBe(200);
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      const phases = progressUpdates.map(p => p.phase);
      expect(phases).toContain('connecting');
      expect(phases).toContain('receiving');
      
      const receivingUpdates = progressUpdates.filter(p => p.phase === 'receiving');
      expect(receivingUpdates.some(p => p.percentage === 100)).toBe(true);
    });

    it('should report progress for uploads', async () => {
      const progressUpdates: any[] = [];
      const data = 'x'.repeat(1000);
      
      await client.post('/echo', data, {
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        }
      });

      const phases = progressUpdates.map(p => p.phase);
      expect(phases).toContain('connecting');
      expect(phases).toContain('sending');
      expect(phases).toContain('waiting');
    });

    it('should report retry progress', async () => {
      const progressUpdates: any[] = [];
      
      const retryClient = new HTTPClient({
        baseURL: serverUrl,
        retry: {
          maxAttempts: 2,
          backoff: 'linear',
          initialDelay: 1
        },
        circuitBreaker: false
      });

      await expect(retryClient.get('/error/503', {
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        }
      })).rejects.toThrow();

      const retryUpdates = progressUpdates.filter(p => p.phase === 'retrying');
      expect(retryUpdates.length).toBeGreaterThan(0);
      expect(retryUpdates[0].retryAttempt).toBe(1);
      expect(retryUpdates[0].maxRetries).toBe(2);
    });
  });

  describe('Redirects', () => {
    beforeEach(() => {
      client = new HTTPClient({ 
        baseURL: serverUrl,
        circuitBreaker: false 
      });
    });

    it('should follow redirects by default', async () => {
      const response = await client.get('/redirect');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Success' });
    });

    it('should limit redirect count', async () => {
      await expect(client.get('/redirect-loop')).rejects.toThrow(NetworkError);
    });

    it('should emit redirect events when debugging', async () => {
      const debugClient = new HTTPClient({
        baseURL: serverUrl,
        debug: true,
        circuitBreaker: false
      });

      const redirectHandler = vi.fn();
      debugClient.on('redirect', redirectHandler);

      await debugClient.get('/redirect');

      expect(redirectHandler).toHaveBeenCalledWith({
        from: expect.stringContaining('/redirect'),
        to: expect.stringContaining('/success')
      });
    });
  });

  describe('Request Cancellation', () => {
    beforeEach(() => {
      client = new HTTPClient({ 
        baseURL: serverUrl,
        circuitBreaker: false 
      });
    });

    it('should support abort signal', async () => {
      const controller = new AbortController();
      
      const promise = client.get('/delay', {
        signal: controller.signal
      });

      // Cancel immediately to ensure cancellation happens before request completes
      controller.abort();

      await expect(promise).rejects.toThrow();
      
      try {
        await promise;
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        if (error instanceof NetworkError) {
          expect(error.code).toBe('E7003'); // OPERATION_CANCELLED
        }
      }
    });
  });

  describe('Content Size Limits', () => {
    it('should reject responses exceeding size limit', async () => {
      const limitedClient = new HTTPClient({
        baseURL: serverUrl,
        maxContentLength: 1000, // 1KB limit
        circuitBreaker: false
      });

      await expect(limitedClient.get('/large-response')).rejects.toThrow(NetworkError);
    });

    it('should check content-length header', async () => {
      const limitedClient = new HTTPClient({
        baseURL: serverUrl,
        maxContentLength: 100000, // 100KB limit
        circuitBreaker: false
      });

      await expect(limitedClient.get('/large-response')).rejects.toThrow(NetworkError);
    });
  });

  describe('Debug Mode', () => {
    it('should emit debug events', async () => {
      const debugClient = new HTTPClient({
        baseURL: serverUrl,
        debug: true,
        circuitBreaker: false
      });

      const requestHandler = vi.fn();
      const responseHandler = vi.fn();
      const errorHandler = vi.fn();

      debugClient.on('request', requestHandler);
      debugClient.on('response', responseHandler);
      debugClient.on('error', errorHandler);

      await debugClient.get('/success');

      expect(requestHandler).toHaveBeenCalledWith({
        url: expect.stringContaining('/success'),
        options: expect.objectContaining({
          method: 'GET'
        })
      });

      expect(responseHandler).toHaveBeenCalledWith({
        url: expect.stringContaining('/success'),
        status: 200,
        headers: expect.any(Object),
        duration: expect.any(Number)
      });

      // Make error request
      await expect(debugClient.get('/error/500', {
        retry: { maxAttempts: 1, backoff: 'linear', initialDelay: 0 }
      })).rejects.toThrow();
    });
  });

  describe('URL Building', () => {
    beforeEach(() => {
      client = new HTTPClient({ 
        baseURL: serverUrl,
        circuitBreaker: false 
      });
    });

    it('should handle relative URLs with base URL', async () => {
      const response = await client.get('/success');
      expect(response.status).toBe(200);
    });

    it('should handle absolute URLs', async () => {
      const response = await client.get(`${serverUrl}/success`);
      expect(response.status).toBe(200);
    });

    it('should merge query parameters', async () => {
      const response = await client.get('/echo?existing=param', {
        params: { new: 'param' }
      });
      
      expect(response.status).toBe(200);
    });

    it('should handle undefined and null params', async () => {
      const response = await client.get('/echo', {
        params: { 
          defined: 'value',
          undefined: undefined,
          null: null,
          zero: 0,
          false: false
        }
      });
      
      expect(response.status).toBe(200);
    });
  });
});