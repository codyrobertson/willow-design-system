import * as ts from 'typescript';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import type { ParseResult } from '@willow-cli/types';
import type { ParserOptions } from './types';

export interface ParserCache {
  get(key: string): ParseResult | undefined;
  set(key: string, value: ParseResult): void;
  clear(): void;
  has(key: string): boolean;
  size: number;
}

export interface ProgressReporter {
  onStart(total: number): void;
  onProgress(current: number, message?: string): void;
  onComplete(): void;
  onError(error: Error): void;
}

export interface OptimizationOptions {
  enableCache?: boolean;
  cacheSize?: number;
  enableIncrementalParsing?: boolean;
  enableParallelProcessing?: boolean;
  maxWorkers?: number;
  memoryLimit?: number;
  progressReporter?: ProgressReporter;
  earlyTermination?: boolean;
}

export class ParserOptimizer extends EventEmitter {
  private cache: Map<string, ParseResult>;
  private fileHashes: Map<string, string>;
  private parseHistory: Map<string, ParseMetrics>;
  private memoryMonitor?: NodeJS.Timer;
  
  constructor(private options: OptimizationOptions = {}) {
    super();
    this.cache = new Map();
    this.fileHashes = new Map();
    this.parseHistory = new Map();
    
    if (options.memoryLimit) {
      this.startMemoryMonitor();
    }
  }
  
  /**
   * Create cache key from parser options
   */
  createCacheKey(options: ParserOptions): string {
    const content = options.content || '';
    const hash = createHash('sha256')
      .update(options.filename)
      .update(content)
      .update(JSON.stringify({
        includeTypes: options.includeTypes,
        jsx: options.jsx,
        analyzeImports: options.analyzeImports,
        detectComponents: options.detectComponents,
        analyzeExports: options.analyzeExports,
        includeEdgeCases: options.includeEdgeCases,
      }))
      .digest('hex');
    
    return hash;
  }
  
  /**
   * Get cached parse result
   */
  getCached(options: ParserOptions): ParseResult | undefined {
    if (!this.options.enableCache) {
      return undefined;
    }
    
    const key = this.createCacheKey(options);
    const cached = this.cache.get(key);
    
    if (cached) {
      this.emit('cache:hit', { key, filename: options.filename });
      this.updateMetrics(options.filename, { cacheHit: true });
      return cached;
    }
    
    this.emit('cache:miss', { key, filename: options.filename });
    return undefined;
  }
  
  /**
   * Set cached parse result
   */
  setCached(options: ParserOptions, result: ParseResult): void {
    if (!this.options.enableCache) {
      return;
    }
    
    const key = this.createCacheKey(options);
    
    // Check cache size limit
    if (this.options.cacheSize && this.cache.size >= this.options.cacheSize) {
      this.evictOldestEntry();
    }
    
    this.cache.set(key, result);
    this.emit('cache:set', { key, filename: options.filename });
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.fileHashes.clear();
    this.emit('cache:clear');
  }
  
  /**
   * Check if incremental parsing is possible
   */
  canUseIncrementalParsing(
    oldResult: ParseResult, 
    newContent: string, 
    filename: string
  ): boolean {
    if (!this.options.enableIncrementalParsing) {
      return false;
    }
    
    // Check if file structure changed significantly
    const oldHash = this.fileHashes.get(filename);
    const newHash = createHash('sha256').update(newContent).digest('hex');
    
    if (!oldHash || oldHash === newHash) {
      return false;
    }
    
    // Simple heuristic: check if file size changed significantly
    const oldSize = oldResult.sourceFile.end;
    const newSize = newContent.length;
    const sizeDiff = Math.abs(newSize - oldSize) / oldSize;
    
    return sizeDiff < 0.1; // Less than 10% change
  }
  
  /**
   * Perform incremental parsing
   */
  incrementalParse(
    oldResult: ParseResult,
    newContent: string,
    filename: string,
    parseFunc: () => ParseResult
  ): ParseResult {
    try {
      // For now, fall back to full parse
      // In a real implementation, this would use TypeScript's incremental API
      return parseFunc();
    } catch (error) {
      this.emit('incremental:error', { filename, error });
      return parseFunc();
    }
  }
  
  /**
   * Start memory monitor
   */
  private startMemoryMonitor(): void {
    this.memoryMonitor = setInterval(() => {
      const usage = process.memoryUsage();
      const limitBytes = (this.options.memoryLimit || 500) * 1024 * 1024; // MB to bytes
      
      if (usage.heapUsed > limitBytes) {
        this.emit('memory:high', { used: usage.heapUsed, limit: limitBytes });
        this.performMemoryCleanup();
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Perform memory cleanup
   */
  private performMemoryCleanup(): void {
    // Clear oldest cache entries
    const entriesToRemove = Math.floor(this.cache.size * 0.3); // Remove 30%
    const entries = Array.from(this.cache.entries());
    
    for (let i = 0; i < entriesToRemove; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    this.emit('memory:cleanup', { removed: entriesToRemove });
  }
  
  /**
   * Evict oldest cache entry
   */
  private evictOldestEntry(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.emit('cache:evict', { key: firstKey });
    }
  }
  
  /**
   * Report progress
   */
  reportProgress(current: number, total: number, message?: string): void {
    if (this.options.progressReporter) {
      this.options.progressReporter.onProgress(current, message);
    }
    
    this.emit('progress', { current, total, message });
  }
  
  /**
   * Check for early termination
   */
  shouldTerminateEarly(errors: number, threshold: number = 100): boolean {
    if (!this.options.earlyTermination) {
      return false;
    }
    
    return errors > threshold;
  }
  
  /**
   * Update parsing metrics
   */
  private updateMetrics(filename: string, metrics: Partial<ParseMetrics>): void {
    const existing = this.parseHistory.get(filename) || {
      parseCount: 0,
      totalTime: 0,
      averageTime: 0,
      cacheHits: 0,
      errors: 0,
    };
    
    this.parseHistory.set(filename, {
      ...existing,
      parseCount: existing.parseCount + 1,
      cacheHits: existing.cacheHits + (metrics.cacheHit ? 1 : 0),
      totalTime: existing.totalTime + (metrics.parseTime || 0),
      averageTime: (existing.totalTime + (metrics.parseTime || 0)) / (existing.parseCount + 1),
      errors: existing.errors + (metrics.errors || 0),
    });
  }
  
  /**
   * Get parsing metrics
   */
  getMetrics(): Map<string, ParseMetrics> {
    return new Map(this.parseHistory);
  }
  
  /**
   * Optimize parser options
   */
  optimizeParserOptions(options: ParserOptions): ParserOptions {
    const optimized = { ...options };
    
    // Disable features not needed based on usage patterns
    const metrics = this.parseHistory.get(options.filename);
    if (metrics && metrics.parseCount > 5) {
      // If file rarely has components, skip component detection
      if (metrics.componentCount === 0) {
        optimized.detectComponents = false;
      }
      
      // If file has no TypeScript types, skip type analysis
      if (!options.filename.endsWith('.ts') && !options.filename.endsWith('.tsx')) {
        optimized.includeTypes = false;
      }
    }
    
    return optimized;
  }
  
  /**
   * Create parallel parsing worker pool
   */
  createWorkerPool(workerCount: number): WorkerPool {
    // Simplified worker pool interface
    // In a real implementation, this would use worker_threads
    return {
      parse: async (files: ParserOptions[]) => {
        // For now, parse sequentially
        const results: ParseResult[] = [];
        
        for (let i = 0; i < files.length; i++) {
          this.reportProgress(i + 1, files.length, `Parsing ${files[i].filename}`);
          
          // Check early termination
          const totalErrors = results.reduce((sum, r) => sum + (r.errors?.length || 0), 0);
          if (this.shouldTerminateEarly(totalErrors)) {
            this.emit('parse:terminated', { reason: 'too_many_errors', errors: totalErrors });
            break;
          }
          
          // Simulate async operation
          await new Promise(resolve => setImmediate(resolve));
        }
        
        return results;
      },
      terminate: () => {
        // Cleanup workers
      },
    };
  }
  
  /**
   * Dispose optimizer
   */
  dispose(): void {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
    
    this.cache.clear();
    this.fileHashes.clear();
    this.parseHistory.clear();
    this.removeAllListeners();
  }
}

interface ParseMetrics {
  parseCount: number;
  totalTime: number;
  averageTime: number;
  cacheHits: number;
  errors: number;
  componentCount?: number;
  importCount?: number;
  cacheHit?: boolean;
  parseTime?: number;
}

interface WorkerPool {
  parse(files: ParserOptions[]): Promise<ParseResult[]>;
  terminate(): void;
}

/**
 * Default progress reporter implementation
 */
export class ConsoleProgressReporter implements ProgressReporter {
  private startTime: number = 0;
  
  onStart(total: number): void {
    this.startTime = Date.now();
    console.log(`Starting to parse ${total} files...`);
  }
  
  onProgress(current: number, message?: string): void {
    if (message) {
      console.log(`[${current}] ${message}`);
    }
  }
  
  onComplete(): void {
    const duration = Date.now() - this.startTime;
    console.log(`Parsing completed in ${duration}ms`);
  }
  
  onError(error: Error): void {
    console.error(`Parsing error: ${error.message}`);
  }
}

/**
 * Memory-efficient cache implementation
 */
export class LRUParserCache implements ParserCache {
  private cache: Map<string, ParseResult>;
  private accessOrder: string[];
  
  constructor(private maxSize: number = 100) {
    this.cache = new Map();
    this.accessOrder = [];
  }
  
  get(key: string): ParseResult | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.updateAccessOrder(key);
    }
    return value;
  }
  
  set(key: string, value: ParseResult): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Remove least recently used
      const lru = this.accessOrder.shift();
      if (lru) {
        this.cache.delete(lru);
      }
    }
    
    this.cache.set(key, value);
    this.updateAccessOrder(key);
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  get size(): number {
    return this.cache.size;
  }
  
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
}