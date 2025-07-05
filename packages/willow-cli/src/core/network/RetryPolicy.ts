/**
 * Retry Policy System
 * Comprehensive retry strategy configuration and implementation
 */

import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode } from '../../types/errors.js';
import { NetworkError, TimeoutError, HTTPError } from './NetworkError.js';

/**
 * Retry decision based on error analysis
 */
export interface RetryDecision {
  shouldRetry: boolean;
  delayMs?: number;
  reason?: string;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicyConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff strategy */
  backoffStrategy: 'linear' | 'exponential' | 'fibonacci' | 'custom';
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Jitter to add randomness to delays */
  jitterFactor?: number;
  /** Custom backoff function */
  customBackoff?: (attempt: number) => number;
  /** Retry condition function */
  retryCondition?: (error: any, attempt: number) => boolean;
  /** Specific HTTP status codes to retry */
  retryableStatusCodes?: number[];
  /** Specific error codes to retry */
  retryableErrorCodes?: ErrorCode[];
  /** Circuit breaker integration */
  respectCircuitBreaker?: boolean;
  /** Timeout for individual retry attempts */
  attemptTimeout?: number;
  /** Total timeout for all retries */
  totalTimeout?: number;
}

/**
 * Default retry policies for different scenarios
 */
export const DefaultRetryPolicies = {
  /** Conservative policy for critical operations */
  conservative: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffStrategy: 'exponential' as const,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    respectCircuitBreaker: true,
  },
  
  /** Aggressive policy for resilient operations */
  aggressive: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 30000,
    backoffStrategy: 'exponential' as const,
    backoffMultiplier: 3,
    jitterFactor: 0.2,
    retryableStatusCodes: [408, 425, 429, 500, 502, 503, 504],
    respectCircuitBreaker: true,
  },
  
  /** Fast retry for time-sensitive operations */
  fast: {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 1000,
    backoffStrategy: 'linear' as const,
    jitterFactor: 0.1,
    retryableStatusCodes: [429, 503],
    attemptTimeout: 5000,
    totalTimeout: 10000,
  },
  
  /** No retry policy */
  none: {
    maxAttempts: 1,
    initialDelayMs: 0,
    maxDelayMs: 0,
    backoffStrategy: 'linear' as const,
  },
} satisfies Record<string, Partial<RetryPolicyConfig>>;

/**
 * Retry policy implementation
 */
export class RetryPolicy {
  private config: RetryPolicyConfig;
  
  constructor(config: Partial<RetryPolicyConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffStrategy: 'exponential',
      backoffMultiplier: 2,
      jitterFactor: 0.1,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryableErrorCodes: [
        ErrorCode.NETWORK_ERROR,
        ErrorCode.TIMEOUT,
        ErrorCode.SERVICE_UNAVAILABLE,
      ],
      respectCircuitBreaker: true,
      ...config,
    };
  }
  
  /**
   * Create a policy from a preset
   */
  static fromPreset(preset: keyof typeof DefaultRetryPolicies): RetryPolicy {
    return new RetryPolicy(DefaultRetryPolicies[preset]);
  }
  
  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: any, attempt: number): RetryDecision {
    // Check max attempts
    if (attempt >= this.config.maxAttempts) {
      return { shouldRetry: false, reason: 'Max attempts reached' };
    }
    
    // Use custom retry condition if provided
    if (this.config.retryCondition) {
      const shouldRetry = this.config.retryCondition(error, attempt);
      return { 
        shouldRetry, 
        reason: shouldRetry ? 'Custom condition met' : 'Custom condition not met' 
      };
    }
    
    // Check if error is retryable
    if (error instanceof BaseError) {
      if (!error.isRetryable()) {
        return { shouldRetry: false, reason: 'Error marked as non-retryable' };
      }
      
      // Check error codes
      if (this.config.retryableErrorCodes?.includes(error.code)) {
        return { 
          shouldRetry: true, 
          delayMs: this.calculateDelay(attempt),
          reason: `Error code ${error.code} is retryable`
        };
      }
    }
    
    // Check HTTP errors
    if (error instanceof HTTPError && this.config.retryableStatusCodes) {
      const status = error.statusCode;
      if (this.config.retryableStatusCodes.includes(status)) {
        return { 
          shouldRetry: true, 
          delayMs: this.calculateDelay(attempt),
          reason: `HTTP status ${status} is retryable`
        };
      }
    }
    
    // Check network errors
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return { 
        shouldRetry: true, 
        delayMs: this.calculateDelay(attempt),
        reason: 'Network error is retryable'
      };
    }
    
    // Default: don't retry unknown errors
    return { shouldRetry: false, reason: 'Unknown error type' };
  }
  
  /**
   * Calculate delay for next retry attempt
   */
  calculateDelay(attempt: number): number {
    let delay: number;
    
    switch (this.config.backoffStrategy) {
      case 'linear':
        delay = this.config.initialDelayMs * attempt;
        break;
        
      case 'exponential':
        const multiplier = this.config.backoffMultiplier || 2;
        delay = this.config.initialDelayMs * Math.pow(multiplier, attempt - 1);
        break;
        
      case 'fibonacci':
        delay = this.fibonacci(attempt) * this.config.initialDelayMs;
        break;
        
      case 'custom':
        if (!this.config.customBackoff) {
          throw new Error('Custom backoff function not provided');
        }
        delay = this.config.customBackoff(attempt);
        break;
        
      default:
        delay = this.config.initialDelayMs;
    }
    
    // Apply max delay cap
    delay = Math.min(delay, this.config.maxDelayMs);
    
    // Apply jitter
    if (this.config.jitterFactor && this.config.jitterFactor > 0) {
      const jitter = delay * this.config.jitterFactor;
      delay += (Math.random() - 0.5) * 2 * jitter;
      delay = Math.max(0, delay); // Ensure non-negative
    }
    
    return Math.round(delay);
  }
  
  /**
   * Get retry configuration
   */
  getConfig(): Readonly<RetryPolicyConfig> {
    return { ...this.config };
  }
  
  /**
   * Calculate fibonacci number
   */
  private fibonacci(n: number): number {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }
}

/**
 * Retry context for tracking retry state
 */
export class RetryContext {
  private attempts = 0;
  private errors: Array<{ error: any; timestamp: number }> = [];
  private startTime = Date.now();
  
  constructor(
    private readonly policy: RetryPolicy,
    private readonly operation: string
  ) {}
  
  /**
   * Record an attempt
   */
  recordAttempt(error?: any): void {
    this.attempts++;
    if (error) {
      this.errors.push({ error, timestamp: Date.now() });
    }
  }
  
  /**
   * Get current attempt number
   */
  getAttempt(): number {
    return this.attempts;
  }
  
  /**
   * Check if should retry based on error and policy
   */
  shouldRetry(error: any): RetryDecision {
    const decision = this.policy.shouldRetry(error, this.attempts);
    
    // Check total timeout if configured
    const config = this.policy.getConfig();
    if (config.totalTimeout && Date.now() - this.startTime > config.totalTimeout) {
      return { shouldRetry: false, reason: 'Total timeout exceeded' };
    }
    
    return decision;
  }
  
  /**
   * Get retry statistics
   */
  getStats(): {
    attempts: number;
    errors: Array<{ error: any; timestamp: number }>;
    duration: number;
    operation: string;
  } {
    return {
      attempts: this.attempts,
      errors: [...this.errors],
      duration: Date.now() - this.startTime,
      operation: this.operation,
    };
  }
}

/**
 * Network status detector
 */
export class NetworkStatusDetector {
  private isOnline = true;
  private lastCheck = 0;
  private checkInterval = 5000; // 5 seconds
  
  /**
   * Check if network is available
   */
  async isNetworkAvailable(): Promise<boolean> {
    // Rate limit checks
    if (Date.now() - this.lastCheck < this.checkInterval) {
      return this.isOnline;
    }
    
    this.lastCheck = Date.now();
    
    try {
      // Try to resolve a reliable DNS
      const dns = await import('dns').then(m => m.promises);
      await dns.resolve4('dns.google.com');
      this.isOnline = true;
      return true;
    } catch {
      this.isOnline = false;
      return false;
    }
  }
  
  /**
   * Force update network status
   */
  setOnline(online: boolean): void {
    this.isOnline = online;
    this.lastCheck = Date.now();
  }
}