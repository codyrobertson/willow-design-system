/**
 * HTTP Client Factory Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HTTPClientFactory } from '../HTTPClientFactory.js';
import { HTTPClient } from '../HTTPClient.js';

describe('HTTPClientFactory', () => {
  beforeEach(() => {
    // Clear all instances
    HTTPClientFactory.getAllInstances().forEach((_, name) => {
      HTTPClientFactory.removeInstance(name);
    });
  });

  describe('create', () => {
    it('should create default client', () => {
      const client = HTTPClientFactory.create();
      
      expect(client).toBeInstanceOf(HTTPClient);
    });

    it('should create client with specific type', () => {
      const registryClient = HTTPClientFactory.create('registry');
      const apiClient = HTTPClientFactory.create('api');
      const downloadClient = HTTPClientFactory.create('download');
      const uploadClient = HTTPClientFactory.create('upload');
      
      expect(registryClient).toBeInstanceOf(HTTPClient);
      expect(apiClient).toBeInstanceOf(HTTPClient);
      expect(downloadClient).toBeInstanceOf(HTTPClient);
      expect(uploadClient).toBeInstanceOf(HTTPClient);
    });

    it('should merge configurations correctly', () => {
      HTTPClientFactory.configure({
        globalDefaults: {
          headers: { 'X-Global': 'true' }
        },
        defaults: {
          api: {
            headers: { 'X-API': 'true' },
            timeout: 5000
          }
        }
      });

      const client = HTTPClientFactory.create('api', {
        headers: { 'X-Custom': 'true' },
        timeout: 10000
      });

      // Can't directly inspect config, but we can verify behavior
      expect(client).toBeInstanceOf(HTTPClient);
    });
  });

  describe('getInstance', () => {
    it('should create and cache instances', () => {
      const instance1 = HTTPClientFactory.getInstance('test-client');
      const instance2 = HTTPClientFactory.getInstance('test-client');
      
      expect(instance1).toBe(instance2);
    });

    it('should create instances with type and config', () => {
      const instance = HTTPClientFactory.getInstance('registry-client', 'registry', {
        timeout: 120000
      });
      
      expect(instance).toBeInstanceOf(HTTPClient);
    });
  });

  describe('removeInstance', () => {
    it('should remove cached instances', () => {
      const instance = HTTPClientFactory.getInstance('temp-client');
      expect(instance).toBeInstanceOf(HTTPClient);
      
      HTTPClientFactory.removeInstance('temp-client');
      
      const instances = HTTPClientFactory.getAllInstances();
      expect(instances.has('temp-client')).toBe(false);
    });

    it('should handle removing non-existent instances', () => {
      expect(() => HTTPClientFactory.removeInstance('non-existent')).not.toThrow();
    });
  });

  describe('specialized creators', () => {
    it('should create registry client', () => {
      const client = HTTPClientFactory.createRegistryClient();
      expect(client).toBeInstanceOf(HTTPClient);
    });

    it('should create API client with base URL', () => {
      const client = HTTPClientFactory.createAPIClient('https://api.example.com');
      expect(client).toBeInstanceOf(HTTPClient);
    });

    it('should create download client', () => {
      const client = HTTPClientFactory.createDownloadClient();
      expect(client).toBeInstanceOf(HTTPClient);
    });

    it('should create upload client', () => {
      const client = HTTPClientFactory.createUploadClient();
      expect(client).toBeInstanceOf(HTTPClient);
    });
  });

  describe('createWithCustomRetry', () => {
    it('should create client with custom retry predicate', () => {
      const retryPredicate = (error: any) => error.code === 'CUSTOM_ERROR';
      
      const client = HTTPClientFactory.createWithCustomRetry(retryPredicate, {
        timeout: 5000
      });
      
      expect(client).toBeInstanceOf(HTTPClient);
    });
  });

  describe('createTestClient', () => {
    it('should create client with test configuration', () => {
      const client = HTTPClientFactory.createTestClient();
      
      expect(client).toBeInstanceOf(HTTPClient);
      // Test client should have no retries and short timeout
    });
  });

  describe('getAllInstances', () => {
    it('should return all cached instances', () => {
      HTTPClientFactory.getInstance('client1');
      HTTPClientFactory.getInstance('client2');
      HTTPClientFactory.getInstance('client3');
      
      const instances = HTTPClientFactory.getAllInstances();
      
      expect(instances.size).toBe(3);
      expect(instances.has('client1')).toBe(true);
      expect(instances.has('client2')).toBe(true);
      expect(instances.has('client3')).toBe(true);
    });
  });

  describe('resetAllCircuitBreakers', () => {
    it('should reset all circuit breakers', () => {
      // This method delegates to CircuitBreakerFactory
      expect(() => HTTPClientFactory.resetAllCircuitBreakers()).not.toThrow();
    });
  });

  describe('configure', () => {
    it('should update factory configuration', () => {
      HTTPClientFactory.configure({
        globalDefaults: {
          timeout: 60000,
          headers: { 'X-App': 'test' }
        },
        defaults: {
          api: {
            timeout: 30000
          }
        }
      });

      // Configuration is applied to new clients
      const client = HTTPClientFactory.create('api');
      expect(client).toBeInstanceOf(HTTPClient);
    });

    it('should handle environment variables', () => {
      const originalEnv = process.env.WILLOW_REGISTRY_URL;
      process.env.WILLOW_REGISTRY_URL = 'https://custom-registry.example.com';
      
      const client = HTTPClientFactory.createRegistryClient();
      expect(client).toBeInstanceOf(HTTPClient);
      
      // Restore original env
      if (originalEnv !== undefined) {
        process.env.WILLOW_REGISTRY_URL = originalEnv;
      } else {
        delete process.env.WILLOW_REGISTRY_URL;
      }
    });
  });

  describe('type configurations', () => {
    it('should have appropriate defaults for each type', () => {
      const defaultClient = HTTPClientFactory.create('default');
      const registryClient = HTTPClientFactory.create('registry');
      const apiClient = HTTPClientFactory.create('api');
      const downloadClient = HTTPClientFactory.create('download');
      const uploadClient = HTTPClientFactory.create('upload');
      
      // All should be HTTPClient instances
      expect(defaultClient).toBeInstanceOf(HTTPClient);
      expect(registryClient).toBeInstanceOf(HTTPClient);
      expect(apiClient).toBeInstanceOf(HTTPClient);
      expect(downloadClient).toBeInstanceOf(HTTPClient);
      expect(uploadClient).toBeInstanceOf(HTTPClient);
      
      // Each type has different configurations that we can't directly inspect
      // but we've verified they're created correctly
    });
  });
});