import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';

export interface CacheOptions {
  /**
   * Cache directory
   */
  cacheDir?: string;
  
  /**
   * Time to live in milliseconds
   */
  ttl?: number;
  
  /**
   * Whether to compress cached data
   */
  compress?: boolean;
  
  /**
   * Maximum cache size in bytes
   */
  maxSize?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl?: number;
  hash?: string;
}

export class ConfigCache {
  private memoryCache: Map<string, CacheEntry>;
  private cacheDir?: string;
  
  constructor(private options: CacheOptions = {}) {
    this.memoryCache = new Map();
    this.cacheDir = options.cacheDir;
  }
  
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data as T;
    }
    
    // Check disk cache if configured
    if (this.cacheDir) {
      const diskEntry = await this.readFromDisk<T>(key);
      if (diskEntry && this.isValid(diskEntry)) {
        // Update memory cache
        this.memoryCache.set(key, diskEntry);
        return diskEntry.data;
      }
    }
    
    return undefined;
  }
  
  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      hash: this.hash(value),
    };
    
    // Set in memory cache
    this.memoryCache.set(key, entry);
    
    // Write to disk if configured
    if (this.cacheDir) {
      await this.writeToDisk(key, entry);
    }
    
    // Check cache size
    await this.enforceMaxSize();
  }
  
  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }
  
  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (this.cacheDir) {
      const filepath = this.getFilePath(key);
      try {
        await fs.unlink(filepath);
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.cacheDir) {
      try {
        await fs.rm(this.cacheDir, { recursive: true, force: true });
        await fs.mkdir(this.cacheDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const memorySize = this.getMemorySize();
    const diskSize = await this.getDiskSize();
    
    return {
      memoryEntries: this.memoryCache.size,
      memorySize,
      diskSize,
      totalSize: memorySize + diskSize,
    };
  }
  
  /**
   * Warm cache with preloaded data
   */
  async warm(entries: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value);
    }
  }
  
  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    if (!entry.ttl) return true;
    
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }
  
  /**
   * Read from disk cache
   */
  private async readFromDisk<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const filepath = this.getFilePath(key);
    
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const entry = JSON.parse(content) as CacheEntry<T>;
      return entry;
    } catch {
      return undefined;
    }
  }
  
  /**
   * Write to disk cache
   */
  private async writeToDisk(key: string, entry: CacheEntry): Promise<void> {
    if (!this.cacheDir) return;
    
    const filepath = this.getFilePath(key);
    const dir = dirname(filepath);
    
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(entry, null, 2));
    } catch (error) {
      // Log error but don't throw
      console.warn(`Failed to write cache to disk: ${error}`);
    }
  }
  
  /**
   * Get file path for cache key
   */
  private getFilePath(key: string): string {
    if (!this.cacheDir) throw new Error('Cache directory not configured');
    
    // Create safe filename from key
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    const hash = crypto.createHash('md5').update(key).digest('hex').slice(0, 8);
    
    return join(this.cacheDir, `${safeKey}-${hash}.json`);
  }
  
  /**
   * Calculate hash of value
   */
  private hash(value: any): string {
    const str = JSON.stringify(value);
    return crypto.createHash('md5').update(str).digest('hex');
  }
  
  /**
   * Get memory cache size
   */
  private getMemorySize(): number {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length;
    }
    return size;
  }
  
  /**
   * Get disk cache size
   */
  private async getDiskSize(): Promise<number> {
    if (!this.cacheDir) return 0;
    
    try {
      const files = await fs.readdir(this.cacheDir);
      let size = 0;
      
      for (const file of files) {
        const stats = await fs.stat(join(this.cacheDir, file));
        size += stats.size;
      }
      
      return size;
    } catch {
      return 0;
    }
  }
  
  /**
   * Enforce maximum cache size
   */
  private async enforceMaxSize(): Promise<void> {
    if (!this.options.maxSize) return;
    
    const stats = await this.getStats();
    if (stats.totalSize <= this.options.maxSize) return;
    
    // Remove oldest entries until under size limit
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
    while (stats.totalSize > this.options.maxSize && entries.length > 0) {
      const [key] = entries.shift()!;
      await this.delete(key);
      
      // Recalculate size
      const newStats = await this.getStats();
      stats.totalSize = newStats.totalSize;
    }
  }
}

export interface CacheStats {
  memoryEntries: number;
  memorySize: number;
  diskSize: number;
  totalSize: number;
}