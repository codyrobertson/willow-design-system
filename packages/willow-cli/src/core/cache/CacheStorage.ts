/**
 * Cache Storage Interface
 * Provides abstraction for different cache storage backends
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode } from '../../types/errors.js';

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  /** Unique key for the cache entry */
  key: string;
  /** Creation timestamp */
  created: number;
  /** Last access timestamp */
  accessed: number;
  /** Expiration timestamp (null for no expiration) */
  expires: number | null;
  /** Size in bytes */
  size: number;
  /** Number of times accessed */
  hits: number;
  /** Custom tags for categorization */
  tags: string[];
  /** ETag for content validation */
  etag?: string;
  /** Content type */
  contentType?: string;
  /** Compression algorithm used */
  compression?: 'gzip' | 'brotli' | 'none';
}

/**
 * Cache entry with data and metadata
 */
export interface CacheEntry<T = any> {
  data: T;
  metadata: CacheEntryMetadata;
}

/**
 * Cache storage options
 */
export interface CacheStorageOptions {
  /** Maximum size in bytes (null for unlimited) */
  maxSize?: number | null;
  /** Maximum number of entries (null for unlimited) */
  maxEntries?: number | null;
  /** Default TTL in milliseconds (null for no expiration) */
  defaultTTL?: number | null;
  /** Enable compression for entries */
  compression?: boolean;
  /** Compression threshold in bytes */
  compressionThreshold?: number;
  /** Cache eviction policy */
  evictionPolicy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
  /** Enable persistent storage */
  persistent?: boolean;
  /** Storage directory for persistent cache */
  storageDir?: string;
  /** Cache namespace to prevent collisions */
  namespace?: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of entries */
  entries: number;
  /** Total size in bytes */
  size: number;
  /** Cache hit count */
  hits: number;
  /** Cache miss count */
  misses: number;
  /** Cache eviction count */
  evictions: number;
  /** Hit rate percentage */
  hitRate: number;
  /** Average entry size */
  avgEntrySize: number;
  /** Oldest entry timestamp */
  oldestEntry?: number;
  /** Newest entry timestamp */
  newestEntry?: number;
}

/**
 * Abstract base class for cache storage implementations
 */
export abstract class CacheStorage extends EventEmitter {
  protected options: Required<CacheStorageOptions>;
  protected stats: CacheStats = {
    entries: 0,
    size: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
    avgEntrySize: 0
  };

  constructor(options: CacheStorageOptions = {}) {
    super();
    
    this.options = {
      maxSize: options.maxSize ?? 100 * 1024 * 1024, // 100MB default
      maxEntries: options.maxEntries ?? 10000,
      defaultTTL: options.defaultTTL ?? 3600000, // 1 hour default
      compression: options.compression ?? true,
      compressionThreshold: options.compressionThreshold ?? 1024, // 1KB
      evictionPolicy: options.evictionPolicy ?? 'lru',
      persistent: options.persistent ?? false,
      storageDir: options.storageDir ?? '.willow-cache',
      namespace: options.namespace ?? 'default'
    };
  }

  /**
   * Get a value from cache
   */
  abstract get<T = any>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   */
  abstract set<T = any>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
      compress?: boolean;
    }
  ): Promise<void>;

  /**
   * Check if key exists in cache
   */
  abstract has(key: string): Promise<boolean>;

  /**
   * Delete a value from cache
   */
  abstract delete(key: string): Promise<boolean>;

  /**
   * Clear all cache entries
   */
  abstract clear(): Promise<void>;

  /**
   * Get all keys in cache
   */
  abstract keys(): Promise<string[]>;

  /**
   * Get cache entry metadata
   */
  abstract getMetadata(key: string): Promise<CacheEntryMetadata | null>;

  /**
   * Get entries by tag
   */
  abstract getByTag(tag: string): Promise<string[]>;

  /**
   * Delete entries by tag
   */
  abstract deleteByTag(tag: string): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Prune expired entries
   */
  abstract prune(): Promise<number>;

  /**
   * Generate cache key with namespace
   */
  protected generateKey(key: string): string {
    return `${this.options.namespace}:${key}`;
  }

  /**
   * Generate ETag for content
   */
  protected generateETag(content: any): string {
    const data = typeof content === 'string' ? content : JSON.stringify(content);
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Check if entry is expired
   */
  protected isExpired(metadata: CacheEntryMetadata): boolean {
    if (metadata.expires === null) return false;
    return Date.now() > metadata.expires;
  }

  /**
   * Update hit statistics
   */
  protected recordHit(): void {
    this.stats.hits++;
    this.updateHitRate();
  }

  /**
   * Update miss statistics
   */
  protected recordMiss(): void {
    this.stats.misses++;
    this.updateHitRate();
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Emit cache events
   */
  protected emitCacheEvent(
    event: 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'expire',
    key: string,
    metadata?: CacheEntryMetadata
  ): void {
    this.emit(event, { key, metadata, namespace: this.options.namespace });
  }
}

/**
 * In-memory cache storage implementation
 */
export class MemoryCacheStorage extends CacheStorage {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private accessCount = new Map<string, number>();

  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.generateKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.recordMiss();
      this.emitCacheEvent('miss', key);
      return null;
    }

    // Check expiration
    if (this.isExpired(entry.metadata)) {
      await this.delete(key);
      this.recordMiss();
      this.emitCacheEvent('expire', key, entry.metadata);
      return null;
    }

    // Update access metadata
    entry.metadata.accessed = Date.now();
    entry.metadata.hits++;
    
    // Update access tracking for eviction policies
    this.updateAccessTracking(fullKey);

    this.recordHit();
    this.emitCacheEvent('hit', key, entry.metadata);
    
    return entry.data as T;
  }

  async set<T = any>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
      compress?: boolean;
    }
  ): Promise<void> {
    const fullKey = this.generateKey(key);
    const now = Date.now();
    const ttl = options?.ttl ?? this.options.defaultTTL;
    
    // Calculate size
    const size = this.calculateSize(value);
    
    // Check if we need to evict entries
    await this.ensureCapacity(size);

    const metadata: CacheEntryMetadata = {
      key: fullKey,
      created: now,
      accessed: now,
      expires: ttl ? now + ttl : null,
      size,
      hits: 0,
      tags: options?.tags ?? [],
      etag: this.generateETag(value),
      contentType: typeof value
    };

    const entry: CacheEntry<T> = {
      data: value,
      metadata
    };

    // Update cache
    const isUpdate = this.cache.has(fullKey);
    const oldEntry = this.cache.get(fullKey);
    
    this.cache.set(fullKey, entry);
    this.updateAccessTracking(fullKey);

    // Update stats
    if (isUpdate && oldEntry) {
      this.stats.size -= oldEntry.metadata.size;
    } else {
      this.stats.entries++;
    }
    this.stats.size += size;
    this.stats.avgEntrySize = this.stats.size / this.stats.entries;

    this.emitCacheEvent('set', key, metadata);
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);
    const entry = this.cache.get(fullKey);
    
    if (!entry) return false;
    
    // Check expiration
    if (this.isExpired(entry.metadata)) {
      await this.delete(key);
      return false;
    }
    
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);
    const entry = this.cache.get(fullKey);
    
    if (!entry) return false;

    this.cache.delete(fullKey);
    this.removeAccessTracking(fullKey);

    // Update stats
    this.stats.entries--;
    this.stats.size -= entry.metadata.size;
    if (this.stats.entries > 0) {
      this.stats.avgEntrySize = this.stats.size / this.stats.entries;
    }

    this.emitCacheEvent('delete', key, entry.metadata);
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.accessCount.clear();
    
    this.stats = {
      entries: 0,
      size: 0,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: this.stats.hitRate,
      avgEntrySize: 0
    };
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    const prefix = `${this.options.namespace}:`;
    
    for (const [fullKey, entry] of this.cache.entries()) {
      if (!this.isExpired(entry.metadata)) {
        keys.push(fullKey.slice(prefix.length));
      }
    }
    
    return keys;
  }

  async getMetadata(key: string): Promise<CacheEntryMetadata | null> {
    const fullKey = this.generateKey(key);
    const entry = this.cache.get(fullKey);
    
    if (!entry || this.isExpired(entry.metadata)) {
      return null;
    }
    
    return { ...entry.metadata };
  }

  async getByTag(tag: string): Promise<string[]> {
    const keys: string[] = [];
    const prefix = `${this.options.namespace}:`;
    
    for (const [fullKey, entry] of this.cache.entries()) {
      if (entry.metadata.tags.includes(tag) && !this.isExpired(entry.metadata)) {
        keys.push(fullKey.slice(prefix.length));
      }
    }
    
    return keys;
  }

  async deleteByTag(tag: string): Promise<number> {
    const keys = await this.getByTag(tag);
    let deleted = 0;
    
    for (const key of keys) {
      if (await this.delete(key)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  async prune(): Promise<number> {
    let pruned = 0;
    
    for (const [fullKey, entry] of this.cache.entries()) {
      if (this.isExpired(entry.metadata)) {
        const key = fullKey.slice(`${this.options.namespace}:`.length);
        await this.delete(key);
        pruned++;
      }
    }
    
    return pruned;
  }

  /**
   * Calculate size of value in bytes
   */
  private calculateSize(value: any): number {
    if (typeof value === 'string') {
      return Buffer.byteLength(value);
    }
    return Buffer.byteLength(JSON.stringify(value));
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private async ensureCapacity(requiredSize: number): Promise<void> {
    // Check entry limit
    if (this.options.maxEntries && this.stats.entries >= this.options.maxEntries) {
      await this.evictEntry();
    }

    // Check size limit
    if (this.options.maxSize) {
      while (this.stats.size + requiredSize > this.options.maxSize && this.cache.size > 0) {
        await this.evictEntry();
      }
    }
  }

  /**
   * Evict entry based on policy
   */
  private async evictEntry(): Promise<void> {
    let keyToEvict: string | null = null;

    switch (this.options.evictionPolicy) {
      case 'lru':
        keyToEvict = this.accessOrder[0];
        break;
        
      case 'lfu':
        let minCount = Infinity;
        for (const [key, count] of this.accessCount.entries()) {
          if (count < minCount) {
            minCount = count;
            keyToEvict = key;
          }
        }
        break;
        
      case 'fifo':
        // Find oldest entry
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache.entries()) {
          if (entry.metadata.created < oldestTime) {
            oldestTime = entry.metadata.created;
            keyToEvict = key;
          }
        }
        break;
        
      case 'ttl':
        // Find entry closest to expiration
        let soonestExpiry = Infinity;
        for (const [key, entry] of this.cache.entries()) {
          if (entry.metadata.expires && entry.metadata.expires < soonestExpiry) {
            soonestExpiry = entry.metadata.expires;
            keyToEvict = key;
          }
        }
        break;
    }

    if (keyToEvict) {
      const key = keyToEvict.slice(`${this.options.namespace}:`.length);
      const entry = this.cache.get(keyToEvict);
      await this.delete(key);
      this.stats.evictions++;
      
      if (entry) {
        this.emitCacheEvent('evict', key, entry.metadata);
      }
    }
  }

  /**
   * Update access tracking for eviction policies
   */
  private updateAccessTracking(fullKey: string): void {
    // LRU tracking
    const index = this.accessOrder.indexOf(fullKey);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(fullKey);

    // LFU tracking
    this.accessCount.set(fullKey, (this.accessCount.get(fullKey) ?? 0) + 1);
  }

  /**
   * Remove access tracking
   */
  private removeAccessTracking(fullKey: string): void {
    const index = this.accessOrder.indexOf(fullKey);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessCount.delete(fullKey);
  }
}