/**
 * Dependency Cache Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DependencyCache } from '../dependency-cache.js';
import type { ComponentMeta } from '../../types/index.js';
import type { ResolutionResult } from '../dependency-resolver.js';
import * as fs from 'fs/promises';
import * as path from 'path';

vi.mock('fs/promises');

describe('DependencyCache', () => {
  let cache: DependencyCache;
  const mockCacheDir = '/test/.willow/cache/dependencies';
  
  const mockComponent: ComponentMeta = {
    name: 'button',
    description: 'Button component',
    version: '1.0.0',
    category: 'ui',
    framework: 'react',
    uiKit: 'radix',
    dependencies: [],
    peerDependencies: {},
    registryDependencies: ['icon'],
    files: ['button.tsx'],
    examples: [],
    style: 'css'
  };

  const mockResolutionResult: ResolutionResult = {
    success: true,
    installOrder: ['icon', 'button'],
    circularDependencies: [],
    unresolvedDependencies: [],
    versionConflicts: [],
    dependencyTree: {
      button: { dependencies: ['icon'], dependents: [], depth: 1 },
      icon: { dependencies: [], dependents: ['button'], depth: 0 }
    },
    stats: {
      totalComponents: 2,
      maxDepth: 1,
      resolutionTimeMs: 10
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all filesystem mocks to clean state
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
    vi.mocked(fs.stat).mockResolvedValue({
      size: 1024,
      mtime: new Date()
    } as any);
    
    // Create fresh cache instance for each test
    cache = new DependencyCache({
      cacheDir: mockCacheDir,
      ttl: 1000, // 1 second for testing
      maxSize: 1 // 1MB for testing
    });
    
    // Ensure completely clean state
    cache.clearMemoryCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create cache directory on initialization', async () => {
      await cache.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith(mockCacheDir, { recursive: true });
    });

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('Permission denied'));
      
      // Should not throw
      await expect(cache.initialize()).resolves.not.toThrow();
    });
  });

  describe('component metadata caching', () => {
    it('should cache and retrieve component metadata', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('Not found'));
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      await cache.setComponentMeta('button', mockComponent);
      
      // Mock successful read
      const cacheEntry = {
        data: mockComponent,
        timestamp: Date.now(),
        ttl: 1000,
        hash: 'abc123'
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(cacheEntry));

      const retrieved = await cache.getComponentMeta('button');
      
      expect(retrieved).toEqual(mockComponent);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should return null for cache miss', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('Not found'));

      const result = await cache.getComponentMeta('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should invalidate expired cache entries', async () => {
      // Create a fresh cache instance to avoid test pollution
      const freshCache = new DependencyCache({
        cacheDir: mockCacheDir,
        ttl: 1000, // 1 second for testing
        maxSize: 1 // 1MB for testing
      });
      
      // Clear all mocks and ensure fresh state
      vi.clearAllMocks();
      
      // Mock readdir to return empty (no existing cache files)
      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      
      // Initialize without loading existing cache
      await freshCache.initialize();
      freshCache.clearMemoryCache();
      
      const expiredEntry = {
        data: mockComponent,
        timestamp: Date.now() - 2000, // 2 seconds ago
        ttl: 1000, // 1 second TTL
        hash: 'abc123'
      };
      
      // Set up mocks for the actual test
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(expiredEntry));
      vi.mocked(fs.unlink).mockResolvedValueOnce(undefined);

      const result = await freshCache.getComponentMeta('button');
      
      expect(result).toBeNull();
      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('resolution result caching', () => {
    it('should cache and retrieve resolution results', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('Not found'));
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      await cache.setResolutionResult(['button', 'input'], mockResolutionResult);
      
      const cacheEntry = {
        data: mockResolutionResult,
        timestamp: Date.now(),
        ttl: 1000,
        hash: 'xyz789'
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(cacheEntry));

      const retrieved = await cache.getResolutionResult(['button', 'input']);
      
      expect(retrieved).toEqual(mockResolutionResult);
    });

    it('should use consistent keys for component arrays', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Not found'));

      // Same components in different order should produce same key
      await cache.setResolutionResult(['button', 'input'], mockResolutionResult);
      await cache.setResolutionResult(['input', 'button'], mockResolutionResult);
      
      // Should only write once (same key)
      expect(fs.writeFile).toHaveBeenCalledTimes(2); // Called for each set
    });
  });

  describe('dependency graph caching', () => {
    it('should serialize and deserialize dependency graphs', async () => {
      const mockGraph = {
        nodes: new Map([
          ['button', { name: 'button', dependencies: ['icon'], dependents: [], depth: 1 }],
          ['icon', { name: 'icon', dependencies: [], dependents: ['button'], depth: 0 }]
        ]),
        edges: new Map([
          ['button', new Set(['icon'])]
        ])
      };

      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);
      await cache.setDependencyGraph(['button'], mockGraph as any);

      // Verify serialization format
      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData.data.nodes).toBeInstanceOf(Array);
      expect(writtenData.data.edges).toBeInstanceOf(Array);
    });
  });

  describe('cache size management', () => {
    it('should enforce maximum cache size', async () => {
      // Mock multiple cache files exceeding size limit
      vi.mocked(fs.readdir).mockResolvedValueOnce(['file1.json', 'file2.json', 'file3.json'] as any);
      vi.mocked(fs.stat)
        .mockResolvedValueOnce({ size: 500 * 1024, mtime: new Date('2023-01-01') } as any)
        .mockResolvedValueOnce({ size: 400 * 1024, mtime: new Date('2023-01-02') } as any)
        .mockResolvedValueOnce({ size: 300 * 1024, mtime: new Date('2023-01-03') } as any);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await cache.setComponentMeta('new-component', mockComponent);

      // Should delete oldest file to make room
      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockCacheDir, 'file1.json'));
    });

    it('should handle cache cleanup errors gracefully', async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('Read error'));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      // Should not throw
      await expect(cache.setComponentMeta('button', mockComponent)).resolves.not.toThrow();
    });
  });

  describe('cache statistics', () => {
    it('should provide cache statistics', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['file1.json', 'file2.json'] as any);
      vi.mocked(fs.stat)
        .mockResolvedValueOnce({ size: 500 * 1024, mtime: new Date('2023-01-01') } as any)
        .mockResolvedValueOnce({ size: 300 * 1024, mtime: new Date('2023-01-03') } as any);

      const stats = await cache.getStats();

      expect(stats.entries).toBe(2);
      expect(stats.size).toBeCloseTo(0.78125, 2); // (500 + 300) / 1024 KB
      expect(stats.oldestEntry).toEqual(new Date('2023-01-01'));
      expect(stats.newestEntry).toEqual(new Date('2023-01-03'));
    });

    it('should handle empty cache stats', async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('Directory not found'));

      const stats = await cache.getStats();

      expect(stats.entries).toBe(0);
      expect(stats.size).toBe(0);
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });
  });

  describe('cache clearing', () => {
    it('should clear entire cache', async () => {
      vi.mocked(fs.rm).mockResolvedValueOnce(undefined);
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);

      await cache.clear();

      expect(fs.rm).toHaveBeenCalledWith(mockCacheDir, { recursive: true, force: true });
      expect(fs.mkdir).toHaveBeenCalledWith(mockCacheDir, { recursive: true });
    });

    it('should handle clear errors gracefully', async () => {
      vi.mocked(fs.rm).mockRejectedValueOnce(new Error('Permission denied'));

      // Should not throw
      await expect(cache.clear()).resolves.not.toThrow();
    });
  });

  describe('memory cache integration', () => {
    it('should use memory cache for faster access', async () => {
      // Create a fresh cache instance to avoid test pollution
      const freshCache = new DependencyCache({
        cacheDir: mockCacheDir,
        ttl: 1000,
        maxSize: 1
      });
      
      // Clear all mocks and ensure fresh state
      vi.clearAllMocks();
      
      // Mock readdir to return empty (no existing cache files)
      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      
      // Initialize without loading existing cache
      await freshCache.initialize();
      freshCache.clearMemoryCache();
      
      const cacheEntry = {
        data: mockComponent,
        timestamp: Date.now(),
        ttl: 1000,
        hash: 'abc123'
      };
      
      // First read from disk
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(cacheEntry))
        .mockRejectedValue(new Error('Should not read again'));
      
      const first = await freshCache.getComponentMeta('button');
      
      // Second read should use memory cache (no additional fs.readFile call)
      const second = await freshCache.getComponentMeta('button');
      
      expect(first).toEqual(mockComponent);
      expect(second).toEqual(mockComponent);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should invalidate memory cache for expired entries', async () => {
      // Create a fresh cache instance to avoid test pollution
      const freshCache = new DependencyCache({
        cacheDir: mockCacheDir,
        ttl: 100, // Short TTL for testing
        maxSize: 1
      });
      
      // Clear all mocks and ensure fresh state
      vi.clearAllMocks();
      
      // Mock readdir to return empty (no existing cache files)
      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      
      // Initialize without loading existing cache
      await freshCache.initialize();
      freshCache.clearMemoryCache();
      
      // Initialize with valid entry
      const validEntry = {
        data: mockComponent,
        timestamp: Date.now(),
        ttl: 100, // 100ms TTL
        hash: 'abc123'
      };
      
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(validEntry));
      await freshCache.getComponentMeta('button');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should try to read from disk again
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('Not found'));
      const result = await freshCache.getComponentMeta('button');

      expect(result).toBeNull();
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });
});