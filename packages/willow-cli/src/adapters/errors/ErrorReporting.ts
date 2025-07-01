import { AdapterError } from './AdapterError';

/**
 * Error report interface
 */
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: AdapterError;
  context: ErrorReportContext;
  environment: EnvironmentInfo;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
}

/**
 * Error report context
 */
export interface ErrorReportContext {
  operation: string;
  adapterName?: string;
  adapterVersion?: string;
  componentName?: string;
  props?: Record<string, any>;
  stackTrace?: string;
  breadcrumbs: Breadcrumb[];
  performance: PerformanceInfo;
}

/**
 * Breadcrumb for error tracking
 */
export interface Breadcrumb {
  timestamp: Date;
  category: 'navigation' | 'user' | 'system' | 'adapter' | 'network';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

/**
 * Performance information
 */
export interface PerformanceInfo {
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  timing?: {
    operationDuration: number;
    renderTime?: number;
    networkTime?: number;
  };
  metrics?: Record<string, number>;
}

/**
 * Environment information
 */
export interface EnvironmentInfo {
  platform: string;
  userAgent: string;
  language: string;
  timezone: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
  viewport: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

/**
 * Error reporter configuration
 */
export interface ErrorReporterConfig {
  endpoint?: string;
  apiKey?: string;
  enableBreadcrumbs?: boolean;
  maxBreadcrumbs?: number;
  enablePerformanceTracking?: boolean;
  enableAutoSubmit?: boolean;
  enableConsoleCapture?: boolean;
  enableNetworkCapture?: boolean;
  enableUserActions?: boolean;
  filters?: ErrorFilter[];
  transformers?: ErrorTransformer[];
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
}

/**
 * Error filter function
 */
export type ErrorFilter = (error: AdapterError, context: ErrorReportContext) => boolean;

/**
 * Error transformer function
 */
export type ErrorTransformer = (report: ErrorReport) => ErrorReport;

/**
 * Error reporter for collecting and sending error reports
 */
export class ErrorReporter {
  private readonly config: Required<ErrorReporterConfig>;
  private readonly breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private userId?: string;
  private reportQueue: ErrorReport[] = [];
  private isOnline = true;

  constructor(config: Partial<ErrorReporterConfig> = {}) {
    this.config = {
      endpoint: '',
      apiKey: '',
      enableBreadcrumbs: true,
      maxBreadcrumbs: 50,
      enablePerformanceTracking: true,
      enableAutoSubmit: true,
      enableConsoleCapture: true,
      enableNetworkCapture: false,
      enableUserActions: true,
      filters: [],
      transformers: [],
      beforeSend: (report) => report,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
  }

  /**
   * Report an error
   */
  async report(
    error: AdapterError,
    context: Partial<ErrorReportContext> = {}
  ): Promise<void> {
    // Apply filters
    const fullContext: ErrorReportContext = {
      operation: 'unknown',
      breadcrumbs: [...this.breadcrumbs],
      performance: this.getPerformanceInfo(),
      ...context,
    };

    if (!this.shouldReport(error, fullContext)) {
      return;
    }

    // Create error report
    const report: ErrorReport = {
      id: this.generateReportId(),
      timestamp: new Date(),
      error,
      context: fullContext,
      environment: this.getEnvironmentInfo(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      sessionId: this.sessionId,
      userId: this.userId,
    };

    // Apply transformers
    const transformedReport = this.applyTransformers(report);
    if (!transformedReport) {
      return;
    }

    // Apply beforeSend hook
    const finalReport = this.config.beforeSend(transformedReport);
    if (!finalReport) {
      return;
    }

    // Add breadcrumb for this error
    this.addBreadcrumb({
      category: 'adapter',
      message: `Error reported: ${error.code}`,
      level: 'error',
      data: {
        errorCode: error.code,
        operation: fullContext.operation,
      },
    });

    // Submit report
    if (this.config.enableAutoSubmit) {
      await this.submitReport(finalReport);
    } else {
      this.queueReport(finalReport);
    }
  }

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    if (!this.config.enableBreadcrumbs) {
      return;
    }

    const fullBreadcrumb: Breadcrumb = {
      timestamp: new Date(),
      ...breadcrumb,
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Maintain max breadcrumbs limit
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Set user information
   */
  setUser(userId: string, userData?: Record<string, any>): void {
    this.userId = userId;
    this.addBreadcrumb({
      category: 'user',
      message: 'User identified',
      level: 'info',
      data: userData,
    });
  }

  /**
   * Clear user information
   */
  clearUser(): void {
    this.userId = undefined;
    this.addBreadcrumb({
      category: 'user',
      message: 'User cleared',
      level: 'info',
    });
  }

  /**
   * Manually submit queued reports
   */
  async submitQueuedReports(): Promise<void> {
    const reports = [...this.reportQueue];
    this.reportQueue = [];

    for (const report of reports) {
      try {
        await this.submitReport(report);
      } catch (error) {
        console.error('Failed to submit error report:', error);
        // Re-queue failed reports
        this.reportQueue.push(report);
      }
    }
  }

  /**
   * Get queued reports count
   */
  getQueuedReportsCount(): number {
    return this.reportQueue.length;
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs.length = 0;
  }

  /**
   * Get current breadcrumbs
   */
  getBreadcrumbs(): readonly Breadcrumb[] {
    return this.breadcrumbs;
  }

  /**
   * Check if error should be reported
   */
  private shouldReport(error: AdapterError, context: ErrorReportContext): boolean {
    return this.config.filters.every(filter => filter(error, context));
  }

  /**
   * Apply transformers to error report
   */
  private applyTransformers(report: ErrorReport): ErrorReport | null {
    let transformedReport: ErrorReport | null = report;

    for (const transformer of this.config.transformers) {
      if (!transformedReport) break;
      transformedReport = transformer(transformedReport);
    }

    return transformedReport;
  }

  /**
   * Submit error report to endpoint
   */
  private async submitReport(report: ErrorReport): Promise<void> {
    if (!this.config.endpoint || !this.isOnline) {
      this.queueReport(report);
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.debug('Error report submitted successfully:', report.id);
    } catch (error) {
      console.error('Failed to submit error report:', error);
      this.queueReport(report);
    }
  }

  /**
   * Queue report for later submission
   */
  private queueReport(report: ErrorReport): void {
    this.reportQueue.push(report);
    
    // Limit queue size
    if (this.reportQueue.length > 100) {
      this.reportQueue.shift();
    }
  }

  /**
   * Get environment information
   */
  private getEnvironmentInfo(): EnvironmentInfo {
    // Default values for non-browser environments
    const defaultScreen = { width: 0, height: 0, colorDepth: 0 };
    const defaultViewport = { width: 0, height: 0 };
    
    const screen = typeof window !== 'undefined' ? window.screen : defaultScreen;
    const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;

    return {
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight,
      } : defaultViewport,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      } : undefined,
    };
  }

  /**
   * Get performance information
   */
  private getPerformanceInfo(): PerformanceInfo {
    const info: PerformanceInfo = {};

    if (this.config.enablePerformanceTracking) {
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        info.memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        };
      }

      // Timing information
      if (performance.timing) {
        const timing = performance.timing;
        info.timing = {
          operationDuration: Date.now() - timing.navigationStart,
          renderTime: timing.domContentLoadedEventEnd - timing.navigationStart,
          networkTime: timing.responseEnd - timing.requestStart,
        };
      }
    }

    return info;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.addBreadcrumb({
        category: 'system',
        message: 'Connection restored',
        level: 'info',
      });
      
      // Submit queued reports when back online
      if (this.config.enableAutoSubmit) {
        this.submitQueuedReports().catch(console.error);
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.addBreadcrumb({
        category: 'system',
        message: 'Connection lost',
        level: 'warning',
      });
    });

    // Console capture
    if (this.config.enableConsoleCapture) {
      this.setupConsoleCapture();
    }

    // User action capture
    if (this.config.enableUserActions && typeof document !== 'undefined') {
      this.setupUserActionCapture();
    }
  }

  /**
   * Setup console capture
   */
  private setupConsoleCapture(): void {
    const originalConsole = { ...console };

    ['error', 'warn', 'info', 'log'].forEach(level => {
      (console as any)[level] = (...args: any[]) => {
        this.addBreadcrumb({
          category: 'system',
          message: `Console ${level}: ${args.join(' ')}`,
          level: level === 'error' ? 'error' : level === 'warn' ? 'warning' : 'info',
          data: { args },
        });

        (originalConsole as any)[level](...args);
      };
    });
  }

  /**
   * Setup user action capture
   */
  private setupUserActionCapture(): void {
    // Click events
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      this.addBreadcrumb({
        category: 'user',
        message: `Clicked ${target.tagName.toLowerCase()}`,
        level: 'info',
        data: {
          tagName: target.tagName,
          className: target.className,
          id: target.id,
        },
      });
    });

    // Navigation
    window.addEventListener('popstate', () => {
      this.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${window.location.pathname}`,
        level: 'info',
        data: { url: window.location.href },
      });
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global error reporter instance
 */
export const globalErrorReporter = new ErrorReporter();

/**
 * Convenience function for reporting errors
 */
export async function reportError(
  error: AdapterError,
  context?: Partial<ErrorReportContext>
): Promise<void> {
  return globalErrorReporter.report(error, context);
}

/**
 * Add breadcrumb convenience function
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  globalErrorReporter.addBreadcrumb(breadcrumb);
}

/**
 * Common error filters
 */
export const ErrorFilters = {
  /**
   * Filter out low severity errors
   */
  severityFilter: (minSeverity: 'low' | 'medium' | 'high' | 'critical'): ErrorFilter => {
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = severityLevels[minSeverity];
    
    return (error) => severityLevels[error.severity] >= minLevel;
  },

  /**
   * Filter out errors by code pattern
   */
  codeFilter: (excludePatterns: string[]): ErrorFilter => {
    return (error) => !excludePatterns.some(pattern => error.code.includes(pattern));
  },

  /**
   * Rate limiting filter
   */
  rateLimitFilter: (maxErrorsPerMinute: number): ErrorFilter => {
    const errorTimes: number[] = [];
    
    return (error) => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      // Remove errors older than one minute
      while (errorTimes.length > 0 && errorTimes[0] < oneMinuteAgo) {
        errorTimes.shift();
      }
      
      // Check if we're under the limit
      if (errorTimes.length < maxErrorsPerMinute) {
        errorTimes.push(now);
        return true;
      }
      
      return false;
    };
  },
};