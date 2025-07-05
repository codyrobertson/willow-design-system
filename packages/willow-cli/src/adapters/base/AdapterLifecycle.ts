import { UIKitAdapter, AdapterConfig } from './UIKitAdapter.js';

/**
 * Lifecycle hooks for UI Kit adapters
 */
export interface AdapterLifecycleHooks {
  beforeInitialize?: (config: AdapterConfig) => Promise<void> | void;
  afterInitialize?: (adapter: UIKitAdapter) => Promise<void> | void;
  beforeComponentMap?: (componentName: string, props: any) => Promise<void> | void;
  afterComponentMap?: (result: any) => Promise<void> | void;
  beforeStyleTranslate?: (styles: any) => Promise<void> | void;
  afterStyleTranslate?: (result: any) => Promise<void> | void;
  beforeTokenConvert?: (tokens: any) => Promise<void> | void;
  afterTokenConvert?: (result: any) => Promise<void> | void;
  onError?: (error: Error, context: string) => Promise<void> | void;
  onWarning?: (warning: string, context: string) => Promise<void> | void;
}

/**
 * Lifecycle phases for adapter operations
 */
export enum AdapterLifecyclePhase {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  PROCESSING = 'processing',
  ERROR = 'error',
  DISPOSED = 'disposed',
}

/**
 * Lifecycle event data
 */
export interface AdapterLifecycleEvent {
  phase: AdapterLifecyclePhase;
  timestamp: number;
  context?: string;
  data?: any;
  error?: Error;
}

/**
 * Lifecycle manager for UI Kit adapters
 */
export class AdapterLifecycleManager {
  private hooks: AdapterLifecycleHooks = {};
  private phase: AdapterLifecyclePhase = AdapterLifecyclePhase.UNINITIALIZED;
  private events: AdapterLifecycleEvent[] = [];
  private maxEvents = 1000;

  constructor(hooks?: AdapterLifecycleHooks) {
    if (hooks) {
      this.hooks = { ...hooks };
    }
  }

  /**
   * Register lifecycle hooks
   */
  registerHooks(hooks: Partial<AdapterLifecycleHooks>): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Get current lifecycle phase
   */
  getCurrentPhase(): AdapterLifecyclePhase {
    return this.phase;
  }

  /**
   * Get lifecycle event history
   */
  getEventHistory(): AdapterLifecycleEvent[] {
    return [...this.events];
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.events = [];
  }

  /**
   * Execute beforeInitialize hook
   */
  async executeBeforeInitialize(config: AdapterConfig): Promise<void> {
    await this.executeHook('beforeInitialize', config, 'initialization');
    this.setPhase(AdapterLifecyclePhase.INITIALIZING);
  }

  /**
   * Execute afterInitialize hook
   */
  async executeAfterInitialize(adapter: UIKitAdapter): Promise<void> {
    await this.executeHook('afterInitialize', adapter, 'initialization');
    this.setPhase(AdapterLifecyclePhase.READY);
  }

  /**
   * Execute beforeComponentMap hook
   */
  async executeBeforeComponentMap(componentName: string, props: any): Promise<void> {
    await this.executeHook('beforeComponentMap', componentName, 'component-mapping', { props });
    this.setPhase(AdapterLifecyclePhase.PROCESSING);
  }

  /**
   * Execute afterComponentMap hook
   */
  async executeAfterComponentMap(result: any): Promise<void> {
    await this.executeHook('afterComponentMap', result, 'component-mapping');
    this.setPhase(AdapterLifecyclePhase.READY);
  }

  /**
   * Execute beforeStyleTranslate hook
   */
  async executeBeforeStyleTranslate(styles: any): Promise<void> {
    await this.executeHook('beforeStyleTranslate', styles, 'style-translation');
    this.setPhase(AdapterLifecyclePhase.PROCESSING);
  }

  /**
   * Execute afterStyleTranslate hook
   */
  async executeAfterStyleTranslate(result: any): Promise<void> {
    await this.executeHook('afterStyleTranslate', result, 'style-translation');
    this.setPhase(AdapterLifecyclePhase.READY);
  }

  /**
   * Execute beforeTokenConvert hook
   */
  async executeBeforeTokenConvert(tokens: any): Promise<void> {
    await this.executeHook('beforeTokenConvert', tokens, 'token-conversion');
    this.setPhase(AdapterLifecyclePhase.PROCESSING);
  }

  /**
   * Execute afterTokenConvert hook
   */
  async executeAfterTokenConvert(result: any): Promise<void> {
    await this.executeHook('afterTokenConvert', result, 'token-conversion');
    this.setPhase(AdapterLifecyclePhase.READY);
  }

  /**
   * Handle errors
   */
  async handleError(error: Error, context: string): Promise<void> {
    this.setPhase(AdapterLifecyclePhase.ERROR, error);
    await this.executeHook('onError', error, context);
  }

  /**
   * Handle warnings
   */
  async handleWarning(warning: string, context: string): Promise<void> {
    await this.executeHook('onWarning', warning, context);
  }

  /**
   * Dispose adapter resources
   */
  dispose(): void {
    this.setPhase(AdapterLifecyclePhase.DISPOSED);
    this.hooks = {};
    this.clearEventHistory();
  }

  /**
   * Execute a specific hook safely
   */
  private async executeHook(
    hookName: keyof AdapterLifecycleHooks,
    data: any,
    context: string,
    additionalData?: any
  ): Promise<void> {
    const hook = this.hooks[hookName];
    if (!hook) return;

    try {
      await hook(data, additionalData);
    } catch (error) {
      console.error(`Error executing ${hookName} hook:`, error);
      // Don't re-throw to prevent hook errors from breaking the main flow
    }
  }

  /**
   * Set current phase and record event
   */
  private setPhase(phase: AdapterLifecyclePhase, error?: Error): void {
    this.phase = phase;
    
    const event: AdapterLifecycleEvent = {
      phase,
      timestamp: Date.now(),
      error,
    };

    this.events.push(event);

    // Limit event history size
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }
}

/**
 * Enhanced adapter with lifecycle support
 */
export abstract class LifecycleAwareAdapter extends UIKitAdapter {
  protected lifecycleManager: AdapterLifecycleManager;

  constructor(config: AdapterConfig, hooks?: AdapterLifecycleHooks) {
    super(config);
    this.lifecycleManager = new AdapterLifecycleManager(hooks);
  }

  /**
   * Initialize with lifecycle hooks
   */
  async initialize(): Promise<void> {
    try {
      await this.lifecycleManager.executeBeforeInitialize(this.config);
      await this.performInitialization();
      await this.lifecycleManager.executeAfterInitialize(this);
    } catch (error) {
      await this.lifecycleManager.handleError(error as Error, 'initialization');
      throw error;
    }
  }

  /**
   * Map component with lifecycle hooks
   */
  mapComponent(componentName: string, props: Record<string, any>) {
    return this.executeWithLifecycle(
      () => this.lifecycleManager.executeBeforeComponentMap(componentName, props),
      () => this.performComponentMapping(componentName, props),
      (result) => this.lifecycleManager.executeAfterComponentMap(result),
      'component-mapping'
    );
  }

  /**
   * Translate styles with lifecycle hooks
   */
  translateStyles(styles: any) {
    return this.executeWithLifecycle(
      () => this.lifecycleManager.executeBeforeStyleTranslate(styles),
      () => this.performStyleTranslation(styles),
      (result) => this.lifecycleManager.executeAfterStyleTranslate(result),
      'style-translation'
    );
  }

  /**
   * Convert tokens with lifecycle hooks
   */
  convertTokens(tokens: any) {
    return this.executeWithLifecycle(
      () => this.lifecycleManager.executeBeforeTokenConvert(tokens),
      () => this.performTokenConversion(tokens),
      (result) => this.lifecycleManager.executeAfterTokenConvert(result),
      'token-conversion'
    );
  }

  /**
   * Get lifecycle manager for external access
   */
  getLifecycleManager(): AdapterLifecycleManager {
    return this.lifecycleManager;
  }

  /**
   * Execute operation with lifecycle hooks
   */
  private async executeWithLifecycle<T>(
    beforeHook: () => Promise<void>,
    operation: () => T | Promise<T>,
    afterHook: (result: T) => Promise<void>,
    context: string
  ): Promise<T> {
    try {
      await beforeHook();
      const result = await operation();
      await afterHook(result);
      return result;
    } catch (error) {
      await this.lifecycleManager.handleError(error as Error, context);
      throw error;
    }
  }

  /**
   * Dispose adapter resources
   */
  dispose(): void {
    this.lifecycleManager.dispose();
  }

  // Abstract methods that concrete adapters must implement
  protected abstract performInitialization(): Promise<void>;
  protected abstract performComponentMapping(componentName: string, props: any): any;
  protected abstract performStyleTranslation(styles: any): any;
  protected abstract performTokenConversion(tokens: any): any;
}