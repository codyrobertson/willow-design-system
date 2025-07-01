import { AdapterLifecycleHooks } from './AdapterLifecycle';
import { UIKitAdapter, AdapterConfig } from './UIKitAdapter';

/**
 * Built-in hook implementations for common adapter needs
 */
export class AdapterHooks {
  /**
   * Create a performance monitoring hook
   */
  static createPerformanceHook(options: {
    logThreshold?: number;
    includeMemory?: boolean;
  } = {}): AdapterLifecycleHooks {
    const { logThreshold = 100, includeMemory = false } = options;
    const performanceMap = new Map<string, number>();

    return {
      beforeComponentMap: (componentName: string) => {
        performanceMap.set(`map-${componentName}`, performance.now());
      },
      afterComponentMap: (result: any) => {
        const startTime = performanceMap.get(`map-${result.component}`);
        if (startTime) {
          const duration = performance.now() - startTime;
          if (duration > logThreshold) {
            console.warn(`Component mapping took ${duration.toFixed(2)}ms for ${result.component}`);
          }
          performanceMap.delete(`map-${result.component}`);
        }
      },
      beforeStyleTranslate: () => {
        performanceMap.set('style-translate', performance.now());
        if (includeMemory) {
          performanceMap.set('memory-before', (performance as any).memory?.usedJSHeapSize || 0);
        }
      },
      afterStyleTranslate: () => {
        const startTime = performanceMap.get('style-translate');
        if (startTime) {
          const duration = performance.now() - startTime;
          if (duration > logThreshold) {
            console.warn(`Style translation took ${duration.toFixed(2)}ms`);
          }
          
          if (includeMemory) {
            const memoryBefore = performanceMap.get('memory-before') || 0;
            const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
            const memoryDiff = memoryAfter - memoryBefore;
            if (memoryDiff > 1024 * 1024) { // 1MB threshold
              console.warn(`Style translation used ${(memoryDiff / 1024 / 1024).toFixed(2)}MB memory`);
            }
          }
          
          performanceMap.delete('style-translate');
          performanceMap.delete('memory-before');
        }
      },
    };
  }

  /**
   * Create a logging hook for debugging
   */
  static createLoggingHook(options: {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    includeProps?: boolean;
    includeResults?: boolean;
  } = {}): AdapterLifecycleHooks {
    const { logLevel = 'debug', includeProps = false, includeResults = false } = options;

    const log = (level: string, message: string, data?: any) => {
      if (console[level]) {
        if (data && (includeProps || includeResults)) {
          console[level](message, data);
        } else {
          console[level](message);
        }
      }
    };

    return {
      beforeInitialize: (config: AdapterConfig) => {
        log(logLevel, `Initializing adapter: ${config.name} v${config.version}`);
      },
      afterInitialize: (adapter: UIKitAdapter) => {
        log(logLevel, `Adapter initialized successfully: ${adapter.getMetadata().name}`);
      },
      beforeComponentMap: (componentName: string, props: any) => {
        log(logLevel, `Mapping component: ${componentName}`, includeProps ? props : undefined);
      },
      afterComponentMap: (result: any) => {
        log(logLevel, `Component mapped: ${result.component}`, includeResults ? result : undefined);
      },
      beforeStyleTranslate: (styles: any) => {
        log(logLevel, 'Translating styles', includeProps ? styles : undefined);
      },
      afterStyleTranslate: (result: any) => {
        log(logLevel, 'Styles translated', includeResults ? result : undefined);
      },
      beforeTokenConvert: (tokens: any) => {
        log(logLevel, 'Converting tokens', includeProps ? tokens : undefined);
      },
      afterTokenConvert: (result: any) => {
        log(logLevel, 'Tokens converted', includeResults ? result : undefined);
      },
      onError: (error: Error, context: string) => {
        console.error(`Adapter error in ${context}:`, error);
      },
      onWarning: (warning: string, context: string) => {
        console.warn(`Adapter warning in ${context}: ${warning}`);
      },
    };
  }

  /**
   * Create a validation hook to ensure data integrity
   */
  static createValidationHook(options: {
    validateProps?: boolean;
    validateResults?: boolean;
    strictMode?: boolean;
  } = {}): AdapterLifecycleHooks {
    const { validateProps = true, validateResults = true, strictMode = false } = options;

    const validateData = (data: any, context: string, phase: 'input' | 'output') => {
      if (!data) {
        const message = `${phase === 'input' ? 'Input' : 'Output'} data is null/undefined in ${context}`;
        if (strictMode) {
          throw new Error(message);
        } else {
          console.warn(message);
        }
      }

      if (typeof data === 'object' && Object.keys(data).length === 0) {
        const message = `${phase === 'input' ? 'Input' : 'Output'} data is empty in ${context}`;
        if (strictMode) {
          console.warn(message);
        }
      }
    };

    return {
      beforeComponentMap: validateProps ? (componentName: string, props: any) => {
        validateData(props, 'component mapping', 'input');
        if (typeof componentName !== 'string' || !componentName.trim()) {
          const message = 'Component name must be a non-empty string';
          if (strictMode) {
            throw new Error(message);
          } else {
            console.warn(message);
          }
        }
      } : undefined,
      afterComponentMap: validateResults ? (result: any) => {
        validateData(result, 'component mapping', 'output');
        if (!result.component) {
          const message = 'Component mapping result must include component property';
          if (strictMode) {
            throw new Error(message);
          } else {
            console.warn(message);
          }
        }
      } : undefined,
      beforeStyleTranslate: validateProps ? (styles: any) => {
        validateData(styles, 'style translation', 'input');
      } : undefined,
      afterStyleTranslate: validateResults ? (result: any) => {
        validateData(result, 'style translation', 'output');
      } : undefined,
      beforeTokenConvert: validateProps ? (tokens: any) => {
        validateData(tokens, 'token conversion', 'input');
      } : undefined,
      afterTokenConvert: validateResults ? (result: any) => {
        validateData(result, 'token conversion', 'output');
      } : undefined,
    };
  }

  /**
   * Create a caching hook to improve performance
   */
  static createCachingHook(options: {
    maxCacheSize?: number;
    ttl?: number; // Time to live in milliseconds
    enableComponentCache?: boolean;
    enableStyleCache?: boolean;
    enableTokenCache?: boolean;
  } = {}): AdapterLifecycleHooks {
    const {
      maxCacheSize = 1000,
      ttl = 5 * 60 * 1000, // 5 minutes
      enableComponentCache = true,
      enableStyleCache = true,
      enableTokenCache = true,
    } = options;

    interface CacheEntry<T> {
      value: T;
      timestamp: number;
    }

    const componentCache = new Map<string, CacheEntry<any>>();
    const styleCache = new Map<string, CacheEntry<any>>();
    const tokenCache = new Map<string, CacheEntry<any>>();

    const getCacheKey = (data: any): string => {
      try {
        return JSON.stringify(data);
      } catch {
        return String(data);
      }
    };

    const isExpired = (entry: CacheEntry<any>): boolean => {
      return Date.now() - entry.timestamp > ttl;
    };

    const getCached = <T>(cache: Map<string, CacheEntry<T>>, key: string): T | null => {
      const entry = cache.get(key);
      if (entry && !isExpired(entry)) {
        return entry.value;
      }
      if (entry) {
        cache.delete(key); // Remove expired entry
      }
      return null;
    };

    const setCache = <T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void => {
      if (cache.size >= maxCacheSize) {
        // Remove oldest entry
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, { value, timestamp: Date.now() });
    };

    return {
      beforeComponentMap: enableComponentCache ? (componentName: string, props: any) => {
        const cacheKey = getCacheKey({ componentName, props });
        const cached = getCached(componentCache, cacheKey);
        if (cached) {
          // Store for afterComponentMap to skip actual processing
          (globalThis as any).__adapterCacheHit = cached;
        }
      } : undefined,
      afterComponentMap: enableComponentCache ? (result: any) => {
        const cacheHit = (globalThis as any).__adapterCacheHit;
        if (cacheHit) {
          delete (globalThis as any).__adapterCacheHit;
          return cacheHit;
        }
        // Cache the result for future use
        // Note: We'd need the original inputs to create proper cache key
        // This is a simplified implementation
      } : undefined,
    };
  }

  /**
   * Create an analytics hook to track usage patterns
   */
  static createAnalyticsHook(options: {
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
  } = {}): AdapterLifecycleHooks {
    const { batchSize = 10, flushInterval = 30000 } = options;
    const events: any[] = [];

    const recordEvent = (eventType: string, data?: any) => {
      events.push({
        type: eventType,
        timestamp: Date.now(),
        data,
      });

      if (events.length >= batchSize) {
        flushEvents();
      }
    };

    const flushEvents = () => {
      if (events.length === 0) return;
      
      console.log('Analytics events:', events.splice(0));
      // In real implementation, would send to analytics endpoint
    };

    // Flush events periodically
    setInterval(flushEvents, flushInterval);

    return {
      afterInitialize: (adapter: UIKitAdapter) => {
        recordEvent('adapter_initialized', {
          name: adapter.getMetadata().name,
          version: adapter.getMetadata().version,
        });
      },
      afterComponentMap: (result: any) => {
        recordEvent('component_mapped', {
          component: result.component,
        });
      },
      afterStyleTranslate: () => {
        recordEvent('styles_translated');
      },
      afterTokenConvert: () => {
        recordEvent('tokens_converted');
      },
      onError: (error: Error, context: string) => {
        recordEvent('error_occurred', {
          context,
          error: error.message,
        });
      },
    };
  }

  /**
   * Combine multiple hooks into one
   */
  static combineHooks(...hooks: AdapterLifecycleHooks[]): AdapterLifecycleHooks {
    const combined: AdapterLifecycleHooks = {};

    const hookNames: (keyof AdapterLifecycleHooks)[] = [
      'beforeInitialize',
      'afterInitialize',
      'beforeComponentMap',
      'afterComponentMap',
      'beforeStyleTranslate',
      'afterStyleTranslate',
      'beforeTokenConvert',
      'afterTokenConvert',
      'onError',
      'onWarning',
    ];

    for (const hookName of hookNames) {
      const hookFunctions = hooks.map(h => h[hookName]).filter(Boolean);
      if (hookFunctions.length > 0) {
        combined[hookName] = async (...args: any[]) => {
          for (const hookFn of hookFunctions) {
            await hookFn(...args);
          }
        };
      }
    }

    return combined;
  }
}