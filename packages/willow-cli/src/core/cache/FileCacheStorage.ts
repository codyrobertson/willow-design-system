/**
 * File-based Cache Storage
 * Persistent cache storage using the file system
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { 
  CacheStorage, 
  CacheEntry, 
  CacheEntryMetadata, 
  CacheStorageOptions 
} from './CacheStorage.js';
import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode } from '../../types/errors.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

/**
 * File cache index entry
 */
interface IndexEntry {
  key: string;
  filename: string;
  metadata: CacheEntryMetadata;
}

/**
 * File-based cache storage implementation
 */
export class FileCacheStorage extends CacheStorage {
  private indexPath: string;
  private dataDir: string;
  private index = new Map<string, IndexEntry>();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(options: CacheStorageOptions = {}) {
    super({ ...options, persistent: true });
    
    this.dataDir = path.join(this.options.storageDir, this.options.namespace);
    this.indexPath = path.join(this.dataDir, '.index.json');
  }

  /**
   * Initialize file cache
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.doInitialize();
    await this.initPromise;
    this.initPromise = null;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Create cache directory
      await fs.mkdir(this.dataDir, { recursive: true });

      // Load index
      await this.loadIndex();

      // Prune expired entries on startup
      await this.prune();

      this.initialized = true;
    } catch (error) {
      throw new BaseError(
        'Failed to initialize file cache',
        ErrorCode.SYSTEM_ERROR,
        {
          cause: error instanceof Error ? error : undefined,
          context: { dataDir: this.dataDir }
        }
      );
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    await this.initialize();
    
    const fullKey = this.generateKey(key);
    const indexEntry = this.index.get(fullKey);

    if (!indexEntry) {
      this.recordMiss();
      this.emitCacheEvent('miss', key);
      return null;
    }

    // Check expiration
    if (this.isExpired(indexEntry.metadata)) {
      await this.delete(key);
      this.recordMiss();
      this.emitCacheEvent('expire', key, indexEntry.metadata);
      return null;
    }

    try {
      // Read file
      const filePath = path.join(this.dataDir, indexEntry.filename);
      const compressed = await fs.readFile(filePath);

      // Decompress if needed
      let data: Buffer;
      if (indexEntry.metadata.compression === 'gzip') {
        data = await gunzip(compressed);
      } else if (indexEntry.metadata.compression === 'brotli') {
        data = await brotliDecompress(compressed);
      } else {
        data = compressed;
      }

      // Parse data
      const value = JSON.parse(data.toString());

      // Update access metadata
      indexEntry.metadata.accessed = Date.now();
      indexEntry.metadata.hits++;
      await this.saveIndex();

      this.recordHit();
      this.emitCacheEvent('hit', key, indexEntry.metadata);

      return value as T;
    } catch (error) {
      // Handle corrupted cache entry
      await this.delete(key);
      this.recordMiss();
      return null;
    }
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
    await this.initialize();
    
    const fullKey = this.generateKey(key);
    const now = Date.now();
    const ttl = options?.ttl ?? this.options.defaultTTL;
    
    // Serialize value
    const serialized = JSON.stringify(value);
    const size = Buffer.byteLength(serialized);
    
    // Check if we need to evict entries
    await this.ensureCapacity(size);

    // Determine compression
    const shouldCompress = options?.compress ?? 
      (this.options.compression && size >= this.options.compressionThreshold);
    
    let data: Buffer = Buffer.from(serialized);
    let compression: 'gzip' | 'brotli' | 'none' = 'none';
    
    if (shouldCompress) {
      // Use brotli for better compression ratio
      const compressed = await brotliCompress(data);
      if (compressed.length < data.length) {
        data = compressed;
        compression = 'brotli';
      }
    }

    const metadata: CacheEntryMetadata = {
      key: fullKey,
      created: now,
      accessed: now,
      expires: ttl ? now + ttl : null,
      size: data.length,
      hits: 0,
      tags: options?.tags ?? [],
      etag: this.generateETag(value),
      contentType: typeof value,
      compression
    };

    // Generate filename
    const filename = this.generateFilename(key);
    const filePath = path.join(this.dataDir, filename);

    // Write file
    await fs.writeFile(filePath, data);

    // Update index
    const oldEntry = this.index.get(fullKey);
    if (oldEntry) {
      // Delete old file if filename changed
      if (oldEntry.filename !== filename) {
        try {
          await fs.unlink(path.join(this.dataDir, oldEntry.filename));
        } catch {}
      }
      this.stats.size -= oldEntry.metadata.size;
    } else {
      this.stats.entries++;
    }

    this.index.set(fullKey, {
      key: fullKey,
      filename,
      metadata
    });

    this.stats.size += data.length;
    this.stats.avgEntrySize = this.stats.size / this.stats.entries;

    await this.saveIndex();
    this.emitCacheEvent('set', key, metadata);
  }

  async has(key: string): Promise<boolean> {
    await this.initialize();
    
    const fullKey = this.generateKey(key);
    const entry = this.index.get(fullKey);
    
    if (!entry) return false;
    
    // Check expiration
    if (this.isExpired(entry.metadata)) {
      await this.delete(key);
      return false;
    }
    
    // Check if file exists
    try {
      await fs.access(path.join(this.dataDir, entry.filename));
      return true;
    } catch {
      // File doesn't exist, clean up index
      await this.delete(key);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.initialize();
    
    const fullKey = this.generateKey(key);
    const entry = this.index.get(fullKey);
    
    if (!entry) return false;

    // Delete file
    try {
      await fs.unlink(path.join(this.dataDir, entry.filename));
    } catch {}

    // Update index
    this.index.delete(fullKey);
    
    // Update stats
    this.stats.entries--;
    this.stats.size -= entry.metadata.size;
    if (this.stats.entries > 0) {
      this.stats.avgEntrySize = this.stats.size / this.stats.entries;
    }

    await this.saveIndex();
    this.emitCacheEvent('delete', key, entry.metadata);
    
    return true;
  }

  async clear(): Promise<void> {
    await this.initialize();
    
    // Delete all cache files
    const files = await fs.readdir(this.dataDir);
    await Promise.all(
      files
        .filter(f => f !== '.index.json')
        .map(f => fs.unlink(path.join(this.dataDir, f)).catch(() => {}))
    );

    // Clear index
    this.index.clear();
    
    this.stats = {
      entries: 0,
      size: 0,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: this.stats.hitRate,
      avgEntrySize: 0
    };

    await this.saveIndex();
  }

  async keys(): Promise<string[]> {
    await this.initialize();
    
    const keys: string[] = [];
    const prefix = `${this.options.namespace}:`;
    
    for (const [fullKey, entry] of this.index.entries()) {
      if (!this.isExpired(entry.metadata)) {
        keys.push(fullKey.slice(prefix.length));
      }
    }
    
    return keys;
  }

  async getMetadata(key: string): Promise<CacheEntryMetadata | null> {
    await this.initialize();
    
    const fullKey = this.generateKey(key);
    const entry = this.index.get(fullKey);
    
    if (!entry || this.isExpired(entry.metadata)) {
      return null;
    }
    
    return { ...entry.metadata };
  }

  async getByTag(tag: string): Promise<string[]> {
    await this.initialize();
    
    const keys: string[] = [];
    const prefix = `${this.options.namespace}:`;
    
    for (const [fullKey, entry] of this.index.entries()) {
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
    await this.initialize();
    
    let pruned = 0;
    const toDelete: string[] = [];
    
    for (const [fullKey, entry] of this.index.entries()) {
      if (this.isExpired(entry.metadata)) {
        toDelete.push(fullKey);
      }
    }
    
    for (const fullKey of toDelete) {
      const key = fullKey.slice(`${this.options.namespace}:`.length);
      if (await this.delete(key)) {
        pruned++;
      }
    }
    
    return pruned;
  }

  /**
   * Load index from disk
   */
  private async loadIndex(): Promise<void> {
    try {
      const data = await fs.readFile(this.indexPath, 'utf-8');
      const saved = JSON.parse(data);
      
      // Rebuild index
      this.index.clear();
      for (const entry of saved.entries) {
        this.index.set(entry.key, entry);
      }
      
      // Restore stats
      if (saved.stats) {
        this.stats = { ...this.stats, ...saved.stats };
      }
      
      // Recalculate stats
      this.stats.entries = this.index.size;
      this.stats.size = Array.from(this.index.values())
        .reduce((sum, entry) => sum + entry.metadata.size, 0);
      
      if (this.stats.entries > 0) {
        this.stats.avgEntrySize = this.stats.size / this.stats.entries;
      }
    } catch (error) {
      // Index doesn't exist or is corrupted, start fresh
      this.index.clear();
    }
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    const data = {
      version: 1,
      namespace: this.options.namespace,
      entries: Array.from(this.index.values()),
      stats: this.stats,
      updated: Date.now()
    };
    
    await fs.writeFile(this.indexPath, JSON.stringify(data, null, 2));
  }

  /**
   * Generate filename for cache entry
   */
  private generateFilename(key: string): string {
    // Create safe filename from key
    const hash = this.generateETag(key);
    const timestamp = Date.now();
    return `${hash}-${timestamp}.cache`;
  }

  /**
   * Ensure cache has capacity
   */
  private async ensureCapacity(requiredSize: number): Promise<void> {
    // Check entry limit
    if (this.options.maxEntries && this.stats.entries >= this.options.maxEntries) {
      await this.evictOldest();
    }

    // Check size limit
    if (this.options.maxSize) {
      while (this.stats.size + requiredSize > this.options.maxSize && this.index.size > 0) {
        await this.evictOldest();
      }
    }
  }

  /**
   * Evict oldest entry
   */
  private async evictOldest(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    // Find oldest entry based on eviction policy
    for (const [key, entry] of this.index.entries()) {
      let time: number;
      
      switch (this.options.evictionPolicy) {
        case 'lru':
          time = entry.metadata.accessed;
          break;
        case 'lfu':
          // For LFU, we use hits inversely
          time = -entry.metadata.hits;
          break;
        case 'fifo':
          time = entry.metadata.created;
          break;
        case 'ttl':
          time = entry.metadata.expires ?? Infinity;
          break;
        default:
          time = entry.metadata.accessed;
      }
      
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const key = oldestKey.slice(`${this.options.namespace}:`.length);
      const entry = this.index.get(oldestKey);
      await this.delete(key);
      this.stats.evictions++;
      
      if (entry) {
        this.emitCacheEvent('evict', key, entry.metadata);
      }
    }
  }
}