/**
 * Persistent caching system for dependency resolution
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import type { ComponentMeta } from '../types/index.js';
import type { ResolutionResult, DependencyGraph } from './dependency-resolver.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hash: string;
}

export interface DependencyCacheOptions {
  cacheDir?: string;
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in MB
}

export class DependencyCache {
  private cacheDir: string;
  private ttl: number;
  private maxSize: number;
  private memoryCache: Map<string, CacheEntry<any>>;

  constructor(options: DependencyCacheOptions = {}) {
    this.cacheDir = options.cacheDir || path.join(process.cwd(), '.willow', 'cache', 'dependencies');
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 hours default
    this.maxSize = options.maxSize || 50; // 50MB default
    this.memoryCache = new Map();
  }

  /**
   * Initialize cache directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      await this.loadMemoryCache();
    } catch (error) {
      console.warn('Failed to initialize cache:', error);
    }
  }

  /**
   * Get cached component metadata
   */
  async getComponentMeta(componentName: string): Promise<ComponentMeta | null> {
    return this.get<ComponentMeta>(`component:${componentName}`);
  }

  /**
   * Cache component metadata
   */
  async setComponentMeta(componentName: string, meta: ComponentMeta): Promise<void> {
    await this.set(`component:${componentName}`, meta);
  }

  /**
   * Get cached resolution result
   */
  async getResolutionResult(components: string[]): Promise<ResolutionResult | null> {
    const key = this.getResolutionKey(components);
    return this.get<ResolutionResult>(key);
  }

  /**
   * Cache resolution result
   */
  async setResolutionResult(components: string[], result: ResolutionResult): Promise<void> {
    const key = this.getResolutionKey(components);
    await this.set(key, result);
  }

  /**
   * Get cached dependency graph
   */
  async getDependencyGraph(components: string[]): Promise<DependencyGraph | null> {
    const key = `graph:${this.hashArray(components)}`;
    return this.get<DependencyGraph>(key);
  }

  /**
   * Cache dependency graph
   */
  async setDependencyGraph(components: string[], graph: DependencyGraph): Promise<void> {
    const key = `graph:${this.hashArray(components)}`;
    // Convert Map to serializable format
    const serializable = {
      nodes: Array.from(graph.nodes.entries()),
      edges: Array.from(graph.edges.entries()).map(([key, value]) => [key, Array.from(value)])
    };
    await this.set(key, serializable);
  }

  /**
   * Get generic cached value
   */
  private async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (this.isValid(memEntry)) {
        return memEntry.data as T;
      } else {
        // Invalid entry in memory cache, remove it
        this.memoryCache.delete(key);
        // Continue to check disk cache (don't return null yet)
      }
    }

    // Check disk cache
    try {
      const filePath = this.getFilePath(key);
      const content = await fs.readFile(filePath, 'utf-8');
      const entry = JSON.parse(content) as CacheEntry<T>;
      
      if (this.isValid(entry)) {
        // Store in memory cache for faster access
        this.memoryCache.set(key, entry);
        return entry.data;
      }
      
      // Invalid entry, remove it
      await this.delete(key);
      return null;
    } catch {
      // Cache miss or error
    }
    
    return null;
  }

  /**
   * Set generic cached value
   */
  private async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: this.ttl,
      hash: this.hashData(data)
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store on disk
    try {
      const filePath = this.getFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
    } catch (error) {
      console.warn(`Failed to write cache for ${key}:`, error);
    }

    // Check cache size
    await this.enforceMaxSize();
  }

  /**
   * Delete cached value
   */
  private async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear memory cache only (for testing)
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Check if cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Get file path for cache key
   */
  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  /**
   * Generate resolution cache key
   */
  private getResolutionKey(components: string[]): string {
    return `resolution:${this.hashArray(components)}`;
  }

  /**
   * Hash array of strings
   */
  private hashArray(arr: string[]): string {
    const sorted = [...arr].sort();
    return createHash('sha256').update(sorted.join(',')).digest('hex').substring(0, 16);
  }

  /**
   * Hash data for integrity checking
   */
  private hashData(data: any): string {
    const str = JSON.stringify(data);
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Load memory cache from disk
   */
  private async loadMemoryCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const loadPromises = files.map(async (file) => {
        if (!file.endsWith('.json')) return;
        
        try {
          const filePath = path.join(this.cacheDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const entry = JSON.parse(content);
          const key = file.replace('.json', '').replace(/_/g, ':');
          
          if (this.isValid(entry)) {
            this.memoryCache.set(key, entry);
          }
        } catch {
          // Ignore invalid files
        }
      });
      
      await Promise.all(loadPromises);
    } catch {
      // Cache directory might not exist yet
    }
  }

  /**
   * Enforce maximum cache size
   */
  private async enforceMaxSize(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      const fileStats: Array<{ file: string; size: number; mtime: Date }> = [];

      // Get size and modification time for all files
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileStats.push({
          file,
          size: stats.size,
          mtime: stats.mtime
        });
      }

      // Convert to MB
      const totalSizeMB = totalSize / (1024 * 1024);

      // Remove oldest files if over limit
      if (totalSizeMB > this.maxSize) {
        fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        
        let currentSize = totalSizeMB;
        for (const { file, size } of fileStats) {
          if (currentSize <= this.maxSize * 0.8) break; // Keep 80% of max size
          
          const filePath = path.join(this.cacheDir, file);
          await fs.unlink(filePath);
          currentSize -= size / (1024 * 1024);
          
          // Remove from memory cache
          const key = file.replace('.json', '').replace(/_/g, ':');
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.warn('Failed to enforce cache size limit:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entries: number;
    size: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      let oldest: Date | null = null;
      let newest: Date | null = null;

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        if (!oldest || stats.mtime < oldest) oldest = stats.mtime;
        if (!newest || stats.mtime > newest) newest = stats.mtime;
      }

      return {
        entries: files.length,
        size: totalSize / (1024 * 1024), // MB
        oldestEntry: oldest,
        newestEntry: newest
      };
    } catch {
      return {
        entries: 0,
        size: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
  }
}