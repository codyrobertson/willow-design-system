/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by failing fast when a service is unavailable
 */

import { EventEmitter } from 'events';
import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode } from '../../types/errors.js';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Success threshold to close circuit from half-open state */
  successThreshold: number;
  /** Time in ms before attempting to close circuit */
  resetTimeout: number;
  /** Time window in ms to track failures */
  rollingWindow?: number;
  /** Function to determine if an error should trip the circuit */
  isFailure?: (error: any) => boolean;
  /** Name for logging and identification */
  name?: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  totalRequests: number;
  rejectedRequests: number;
}

export class CircuitBreakerError extends BaseError {
  constructor(circuitName: string, state: CircuitState) {
    super(
      `Circuit breaker '${circuitName}' is ${state}`,
      ErrorCode.RESOURCE_EXHAUSTED,
      {
        context: { circuitName, state }
      }
    );
  }

  toUserMessage(): string {
    return 'The service is temporarily unavailable due to repeated failures. Please try again later.';
  }

  isRetryable(): boolean {
    return true;
  }

  getSuggestedActions(): string[] {
    return [
      'Wait a few minutes before retrying',
      'Check service status',
      'Contact support if the issue persists'
    ];
  }
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private totalRequests: number = 0;
  private rejectedRequests: number = 0;
  private resetTimer?: NodeJS.Timeout;
  private readonly name: string;
  private readonly options: Required<CircuitBreakerOptions>;
  private readonly failureTimestamps: number[] = [];

  constructor(options: CircuitBreakerOptions) {
    super();
    
    this.name = options.name || 'default';
    this.options = {
      ...options,
      rollingWindow: options.rollingWindow || 60000, // 1 minute default
      isFailure: options.isFailure || (() => true),
      successThreshold: options.successThreshold,
      name: this.name
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      this.rejectedRequests++;
      this.emit('rejected', this.getStats());
      throw new CircuitBreakerError(this.name, this.state);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute a function that returns a value or throws
   */
  async protect<T>(fn: () => T | Promise<T>): Promise<T> {
    return this.execute(async () => fn());
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Manually trip the circuit breaker
   */
  trip(): void {
    this.changeState(CircuitState.OPEN);
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps.length = 0;
    this.changeState(CircuitState.CLOSED);
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      if (this.successes >= this.options.successThreshold) {
        this.reset();
        this.emit('close', this.getStats());
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Remove old failure timestamps outside the rolling window
      this.cleanupFailureTimestamps();
    }

    this.emit('success', this.getStats());
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: any): void {
    // Check if this error should be considered a failure
    if (!this.options.isFailure(error)) {
      return;
    }

    this.lastFailureTime = Date.now();
    this.failureTimestamps.push(this.lastFailureTime);
    this.failures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.changeState(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // Clean up old timestamps and check threshold
      this.cleanupFailureTimestamps();
      
      const recentFailures = this.failureTimestamps.length;
      if (recentFailures >= this.options.failureThreshold) {
        this.changeState(CircuitState.OPEN);
      }
    }

    this.emit('failure', { error, stats: this.getStats() });
  }

  /**
   * Change circuit state
   */
  private changeState(newState: CircuitState): void {
    const oldState = this.state;
    
    if (oldState === newState) {
      return;
    }

    this.state = newState;
    this.emit('stateChange', { from: oldState, to: newState, stats: this.getStats() });

    // Set up reset timer when opening circuit
    if (newState === CircuitState.OPEN) {
      this.scheduleReset();
      this.emit('open', this.getStats());
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successes = 0;
      this.failures = 0;
      this.emit('halfOpen', this.getStats());
    }
  }

  /**
   * Schedule circuit reset attempt
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.changeState(CircuitState.HALF_OPEN);
      this.resetTimer = undefined;
    }, this.options.resetTimeout);
  }

  /**
   * Remove failure timestamps outside the rolling window
   */
  private cleanupFailureTimestamps(): void {
    const now = Date.now();
    const cutoff = now - this.options.rollingWindow;
    
    // Remove timestamps older than the rolling window
    while (this.failureTimestamps.length > 0 && this.failureTimestamps[0] < cutoff) {
      this.failureTimestamps.shift();
    }
  }
}

/**
 * Circuit breaker factory with shared instances
 */
export class CircuitBreakerFactory {
  private static instances = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker instance
   */
  static getInstance(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    let instance = this.instances.get(name);
    
    if (!instance && options) {
      instance = new CircuitBreaker({ ...options, name });
      this.instances.set(name, instance);
    }
    
    if (!instance) {
      throw new Error(`Circuit breaker '${name}' not found and no options provided`);
    }
    
    return instance;
  }

  /**
   * Remove a circuit breaker instance
   */
  static removeInstance(name: string): void {
    const instance = this.instances.get(name);
    if (instance) {
      instance.reset();
      instance.removeAllListeners();
      this.instances.delete(name);
    }
  }

  /**
   * Get all circuit breaker instances
   */
  static getAllInstances(): Map<string, CircuitBreaker> {
    return new Map(this.instances);
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    for (const instance of this.instances.values()) {
      instance.reset();
    }
  }
}