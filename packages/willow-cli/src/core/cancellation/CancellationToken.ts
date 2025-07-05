/**
 * Cancellation Token System
 * Provides a way to cancel long-running operations gracefully
 */

import { EventEmitter } from 'events';

export interface CancellationTokenOptions {
  /** Parent token to inherit cancellation from */
  parent?: CancellationToken;
  /** Timeout in milliseconds before auto-cancellation */
  timeout?: number;
  /** Reason for cancellation */
  reason?: string;
}

export interface CancellationReason {
  /** The reason for cancellation */
  message: string;
  /** Optional error code */
  code?: string;
  /** Timestamp of cancellation */
  timestamp: Date;
  /** Source of cancellation (user, timeout, parent, etc.) */
  source: 'user' | 'timeout' | 'parent' | 'signal' | 'error';
}

/**
 * Token for managing operation cancellation
 */
export class CancellationToken extends EventEmitter {
  private _isCancelled = false;
  private _reason?: CancellationReason;
  private _callbacks = new Set<(reason: CancellationReason) => void>();
  private _children = new Set<CancellationToken>();
  private _parent?: CancellationToken;
  private _timeoutId?: NodeJS.Timeout;
  private _abortController?: AbortController;

  constructor(options: CancellationTokenOptions = {}) {
    super();
    
    // Set up parent relationship
    if (options.parent) {
      this._parent = options.parent;
      this._parent._children.add(this);
      
      // If parent is already cancelled, cancel this token too
      if (this._parent.isCancelled) {
        this.cancel({
          message: options.reason || 'Parent token was cancelled',
          source: 'parent',
          timestamp: new Date(),
        });
      } else {
        // Listen for parent cancellation
        this._parent.onCancelled((reason) => {
          this.cancel({
            ...reason,
            message: `Parent cancelled: ${reason.message}`,
            source: 'parent',
          });
        });
      }
    }
    
    // Set up timeout if specified
    if (options.timeout && options.timeout > 0) {
      this._timeoutId = setTimeout(() => {
        this.cancel({
          message: `Operation timed out after ${options.timeout}ms`,
          code: 'TIMEOUT',
          source: 'timeout',
          timestamp: new Date(),
        });
      }, options.timeout);
    }
  }

  /**
   * Check if the token has been cancelled
   */
  get isCancelled(): boolean {
    return this._isCancelled;
  }

  /**
   * Get the cancellation reason
   */
  get reason(): CancellationReason | undefined {
    return this._reason;
  }

  /**
   * Get an AbortController linked to this token
   */
  get abortController(): AbortController {
    if (!this._abortController) {
      this._abortController = new AbortController();
      
      // Cancel abort controller if token is already cancelled
      if (this._isCancelled) {
        this._abortController.abort(this._reason?.message);
      }
    }
    
    return this._abortController;
  }

  /**
   * Get an AbortSignal linked to this token
   */
  get abortSignal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Cancel the token
   */
  cancel(reason?: Partial<CancellationReason> | string): void {
    if (this._isCancelled) {
      return;
    }
    
    // Create reason object
    if (typeof reason === 'string') {
      this._reason = {
        message: reason,
        source: 'user',
        timestamp: new Date(),
      };
    } else {
      this._reason = {
        message: reason?.message || 'Operation cancelled',
        code: reason?.code,
        source: reason?.source || 'user',
        timestamp: reason?.timestamp || new Date(),
      };
    }
    
    this._isCancelled = true;
    
    // Clear timeout if set
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    
    // Abort the AbortController if it exists
    if (this._abortController) {
      this._abortController.abort(this._reason.message);
    }
    
    // Notify all callbacks
    this._callbacks.forEach(callback => {
      try {
        callback(this._reason!);
      } catch (error) {
        console.error('Error in cancellation callback:', error);
      }
    });
    
    // Emit cancellation event
    this.emit('cancelled', this._reason);
    
    // Cancel all children
    this._children.forEach(child => {
      child.cancel({
        ...this._reason,
        message: `Parent cancelled: ${this._reason!.message}`,
        source: 'parent',
      });
    });
    
    // Clean up
    this._callbacks.clear();
    this._children.clear();
    
    // Remove from parent if exists
    if (this._parent) {
      this._parent._children.delete(this);
    }
  }

  /**
   * Register a callback to be called when cancelled
   */
  onCancelled(callback: (reason: CancellationReason) => void): () => void {
    // If already cancelled, call immediately
    if (this._isCancelled && this._reason) {
      callback(this._reason);
      return () => {};
    }
    
    // Otherwise register for future cancellation
    this._callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this._callbacks.delete(callback);
    };
  }

  /**
   * Throw an error if cancelled
   */
  throwIfCancelled(): void {
    if (this._isCancelled) {
      const error = new CancellationError(
        this._reason?.message || 'Operation was cancelled',
        this._reason?.code
      );
      error.reason = this._reason;
      throw error;
    }
  }

  /**
   * Create a child token
   */
  createChild(options: Omit<CancellationTokenOptions, 'parent'> = {}): CancellationToken {
    return new CancellationToken({
      ...options,
      parent: this,
    });
  }

  /**
   * Create a linked token source
   */
  static link(...tokens: CancellationToken[]): CancellationToken {
    const linkedToken = new CancellationToken();
    
    // Cancel linked token if any source token is cancelled
    tokens.forEach(token => {
      if (token.isCancelled) {
        linkedToken.cancel({
          message: 'Linked token was cancelled',
          source: 'parent',
          timestamp: new Date(),
        });
      } else {
        token.onCancelled((reason) => {
          linkedToken.cancel({
            ...reason,
            message: `Linked token cancelled: ${reason.message}`,
            source: 'parent',
          });
        });
      }
    });
    
    return linkedToken;
  }

  /**
   * Create a token that never cancels
   */
  static get none(): CancellationToken {
    return new CancellationToken();
  }

  /**
   * Create a token that is already cancelled
   */
  static cancelled(reason?: string): CancellationToken {
    const token = new CancellationToken();
    token.cancel(reason || 'Token was pre-cancelled');
    return token;
  }

  /**
   * Wait for cancellation
   */
  async waitForCancellation(): Promise<CancellationReason> {
    if (this._isCancelled && this._reason) {
      return this._reason;
    }
    
    return new Promise<CancellationReason>((resolve) => {
      this.onCancelled(resolve);
    });
  }

  /**
   * Race a promise against cancellation
   */
  async race<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      this.waitForCancellation().then(reason => {
        throw new CancellationError(reason.message, reason.code);
      }),
    ]);
  }

  /**
   * Dispose of the token and clean up resources
   */
  dispose(): void {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    
    this._callbacks.clear();
    this._children.clear();
    
    if (this._parent) {
      this._parent._children.delete(this);
    }
    
    this.removeAllListeners();
  }
}

/**
 * Error thrown when an operation is cancelled
 */
export class CancellationError extends Error {
  public readonly code?: string;
  public reason?: CancellationReason;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'CancellationError';
    this.code = code;
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CancellationError);
    }
  }
  
  /**
   * Check if an error is a cancellation error
   */
  static is(error: unknown): error is CancellationError {
    return error instanceof CancellationError;
  }
}

/**
 * Token source for creating and managing cancellation tokens
 */
export class CancellationTokenSource {
  private _token: CancellationToken;
  
  constructor(options: CancellationTokenOptions = {}) {
    this._token = new CancellationToken(options);
  }
  
  /**
   * Get the cancellation token
   */
  get token(): CancellationToken {
    return this._token;
  }
  
  /**
   * Cancel the token
   */
  cancel(reason?: Partial<CancellationReason> | string): void {
    this._token.cancel(reason);
  }
  
  /**
   * Dispose of the token source
   */
  dispose(): void {
    this._token.dispose();
  }
}