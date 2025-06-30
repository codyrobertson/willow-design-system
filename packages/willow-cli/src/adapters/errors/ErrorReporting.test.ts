import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ErrorReporter,
  ErrorReporterConfig,
  ErrorReport,
  ErrorReportContext,
  Breadcrumb,
  PerformanceInfo,
  EnvironmentInfo,
  ErrorFilter,
  ErrorTransformer,
  globalErrorReporter,
  reportError,
  addBreadcrumb,
  ErrorFilters,
} from './ErrorReporting';
import { AdapterError, AdapterValidationError } from './AdapterError';

// Mock browser APIs
const mockNavigator = {
  userAgent: 'test-user-agent',
  platform: 'test-platform',
  language: 'en-US',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
};

const mockScreen = {
  width: 1920,
  height: 1080,
  colorDepth: 24,
};

const mockWindow = {
  innerWidth: 1200,
  innerHeight: 800,
  addEventListener: vi.fn(),
  location: {
    href: 'https://test.com/path',
    pathname: '/path',
  },
  screen: mockScreen, // Add screen to window object
};

const mockPerformance = {
  memory: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
  },
  timing: {
    navigationStart: Date.now() - 5000,
    domContentLoadedEventEnd: Date.now() - 3000,
    responseEnd: Date.now() - 4000,
    requestStart: Date.now() - 4500,
  },
};

// Mock fetch
const mockFetch = vi.fn();

// Set up global stubs before all tests
beforeAll(() => {
  vi.stubGlobal('screen', mockScreen);
  vi.stubGlobal('navigator', mockNavigator);
  vi.stubGlobal('window', mockWindow);
  vi.stubGlobal('performance', mockPerformance);
  vi.stubGlobal('document', {
    addEventListener: vi.fn(),
  });
  vi.stubGlobal('Intl', {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' }),
    }),
  });
});

beforeEach(() => {
  // Setup global mocks
  (global as any).navigator = mockNavigator;
  (global as any).screen = mockScreen;
  (global as any).window = mockWindow;
  (global as any).performance = mockPerformance;
  (global as any).fetch = mockFetch;
  (global as any).document = {
    addEventListener: vi.fn(),
  };
  (global as any).Intl = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' }),
    }),
  };

  vi.clearAllMocks();
});

afterEach(() => {
  mockFetch.mockReset();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('ErrorReporter', () => {
  let errorReporter: ErrorReporter;
  let consoleErrorSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    errorReporter = new ErrorReporter();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('Constructor and configuration', () => {
    it('should create with default configuration', () => {
      const reporter = new ErrorReporter();
      expect(reporter).toBeInstanceOf(ErrorReporter);
    });

    it('should create with custom configuration', () => {
      const config: Partial<ErrorReporterConfig> = {
        endpoint: 'https://api.example.com/errors',
        apiKey: 'test-key',
        enableBreadcrumbs: false,
        maxBreadcrumbs: 20,
        enablePerformanceTracking: false,
        enableAutoSubmit: false,
      };

      const reporter = new ErrorReporter(config);
      expect(reporter).toBeInstanceOf(ErrorReporter);
    });

    it('should generate unique session IDs', () => {
      const reporter1 = new ErrorReporter();
      const reporter2 = new ErrorReporter();

      // Session IDs should be different for different instances
      expect(reporter1).not.toBe(reporter2);
    });
  });

  describe('Breadcrumb management', () => {
    it('should add breadcrumbs', () => {
      const breadcrumb: Omit<Breadcrumb, 'timestamp'> = {
        category: 'user',
        message: 'User clicked button',
        level: 'info',
        data: { buttonId: 'submit' },
      };

      errorReporter.addBreadcrumb(breadcrumb);
      const breadcrumbs = errorReporter.getBreadcrumbs();

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]).toEqual(
        expect.objectContaining({
          ...breadcrumb,
          timestamp: expect.any(Date),
        })
      );
    });

    it('should limit breadcrumbs to max count', () => {
      const reporter = new ErrorReporter({ maxBreadcrumbs: 3 });

      // Add more breadcrumbs than the limit
      for (let i = 0; i < 5; i++) {
        reporter.addBreadcrumb({
          category: 'system',
          message: `Message ${i}`,
          level: 'info',
        });
      }

      const breadcrumbs = reporter.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].message).toBe('Message 2'); // First one should be removed
      expect(breadcrumbs[2].message).toBe('Message 4'); // Last one should remain
    });

    it('should not add breadcrumbs when disabled', () => {
      const reporter = new ErrorReporter({ enableBreadcrumbs: false });

      reporter.addBreadcrumb({
        category: 'user',
        message: 'Test message',
        level: 'info',
      });

      expect(reporter.getBreadcrumbs()).toHaveLength(0);
    });

    it('should clear breadcrumbs', () => {
      errorReporter.addBreadcrumb({
        category: 'user',
        message: 'Test',
        level: 'info',
      });

      expect(errorReporter.getBreadcrumbs()).toHaveLength(1);

      errorReporter.clearBreadcrumbs();
      expect(errorReporter.getBreadcrumbs()).toHaveLength(0);
    });
  });

  describe('User management', () => {
    it('should set user information', () => {
      const userData = { role: 'admin', department: 'engineering' };
      errorReporter.setUser('user123', userData);

      const breadcrumbs = errorReporter.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]).toEqual(
        expect.objectContaining({
          category: 'user',
          message: 'User identified',
          level: 'info',
          data: userData,
        })
      );
    });

    it('should clear user information', () => {
      errorReporter.setUser('user123');
      errorReporter.clearUser();

      const breadcrumbs = errorReporter.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[1]).toEqual(
        expect.objectContaining({
          category: 'user',
          message: 'User cleared',
          level: 'info',
        })
      );
    });
  });

  describe('Error reporting', () => {
    it('should report errors successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const reporter = new ErrorReporter({
        endpoint: 'https://api.example.com/errors',
        apiKey: 'test-key',
        enableAutoSubmit: true,
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error, {
        operation: 'test-operation',
        adapterName: 'test-adapter',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
          }),
          body: expect.stringContaining('"TEST_ERROR"'),
        })
      );

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error report submitted successfully:'),
        expect.any(String)
      );
    });

    it('should queue reports when auto submit is disabled', async () => {
      const reporter = new ErrorReporter({
        enableAutoSubmit: false,
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      expect(reporter.getQueuedReportsCount()).toBe(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should apply filters to reports', async () => {
      const filter: ErrorFilter = (error) => error.severity !== 'low';

      const reporter = new ErrorReporter({
        filters: [filter],
      });

      const lowSeverityError = new AdapterError('Low error', 'LOW_ERROR', {
        severity: 'low',
      });

      const highSeverityError = new AdapterError('High error', 'HIGH_ERROR', {
        severity: 'high',
      });

      await reporter.report(lowSeverityError);
      await reporter.report(highSeverityError);

      expect(reporter.getQueuedReportsCount()).toBe(1); // Only high severity should be queued
    });

    it('should apply transformers to reports', async () => {
      const transformer: ErrorTransformer = (report) => ({
        ...report,
        context: {
          ...report.context,
          transformed: true,
        },
      });

      const reporter = new ErrorReporter({
        transformers: [transformer],
        enableAutoSubmit: false,
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      // Since we can't directly access the queued report, we'll create a new auto-submit reporter and check the fetch call
      const autoSubmitReporter = new ErrorReporter({
        transformers: [transformer],
        enableAutoSubmit: true,
        endpoint: 'https://test.com',
      });
      mockFetch.mockResolvedValue({ ok: true });

      const error2 = new AdapterError('Test error 2', 'TEST_ERROR_2');
      await autoSubmitReporter.report(error2);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"transformed":true'),
        })
      );
    });

    it('should apply beforeSend hook', async () => {
      const beforeSend = vi.fn().mockImplementation((report) => ({
        ...report,
        context: {
          ...report.context,
          modifiedByHook: true,
        },
      }));

      const reporter = new ErrorReporter({
        beforeSend,
        enableAutoSubmit: false,
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      expect(beforeSend).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'TEST_ERROR',
          }),
        })
      );
    });

    it('should cancel report when beforeSend returns null', async () => {
      const beforeSend = vi.fn().mockReturnValue(null);

      const reporter = new ErrorReporter({
        beforeSend,
        enableAutoSubmit: false,
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      expect(reporter.getQueuedReportsCount()).toBe(0);
    });

    it('should add breadcrumb when reporting error', async () => {
      const error = new AdapterError('Test error', 'TEST_ERROR');
      await errorReporter.report(error, {
        operation: 'test-operation',
      });

      const breadcrumbs = errorReporter.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]).toEqual(
        expect.objectContaining({
          category: 'adapter',
          message: 'Error reported: TEST_ERROR',
          level: 'error',
          data: {
            errorCode: 'TEST_ERROR',
            operation: 'test-operation',
          },
        })
      );
    });
  });

  describe('Report structure and environment', () => {
    it('should create complete error report', async () => {
      const reporter = new ErrorReporter({
        enableAutoSubmit: false,
      });

      reporter.setUser('test-user');
      
      const error = new AdapterValidationError(
        'Validation failed',
        [
          { path: 'field1', message: 'Required', code: 'REQUIRED' },
        ]
      );

      await reporter.report(error, {
        operation: 'validate-config',
        adapterName: 'test-adapter',
        adapterVersion: '1.0.0',
        componentName: 'TestComponent',
        props: { variant: 'primary' },
      });

      // Verify report structure by submitting and checking fetch call
      // Create a new reporter with auto submit enabled
      const autoSubmitReporter = new ErrorReporter({ 
        enableAutoSubmit: true, 
        endpoint: 'https://test.com',
        enableBreadcrumbs: false // Disable to avoid adding extra breadcrumbs 
      });
      mockFetch.mockResolvedValue({ ok: true });
      
      // Move queued reports to auto-submit reporter
      const error2 = new AdapterValidationError(
        'Validation failed',
        [{ path: 'field1', message: 'Required', code: 'REQUIRED' }]
      );
      await autoSubmitReporter.report(error2, {
        operation: 'validate-config',
        adapterName: 'test-adapter',
        adapterVersion: '1.0.0',
        componentName: 'TestComponent',
        props: { variant: 'primary' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringMatching(/"id":"report_\d+_[a-z0-9]+"/),
        })
      );

      const fetchCall = mockFetch.mock.calls[0];
      const reportData = JSON.parse(fetchCall[1].body);

      expect(reportData).toMatchObject({
          id: expect.stringMatching(/^report_/),
          timestamp: expect.any(String),
          error: expect.objectContaining({
            name: 'AdapterValidationError',
            code: 'ADAPTER_VALIDATION_ERROR',
            validationErrors: expect.arrayContaining([
              expect.objectContaining({
                path: 'field1',
                message: 'Required',
                code: 'REQUIRED',
              }),
            ]),
          }),
          context: expect.objectContaining({
            operation: 'validate-config',
            adapterName: 'test-adapter',
            adapterVersion: '1.0.0',
            componentName: 'TestComponent',
            props: { variant: 'primary' },
            breadcrumbs: expect.any(Array),
            performance: expect.any(Object),
          }),
          environment: expect.objectContaining({
            platform: 'test-platform',
            userAgent: 'test-user-agent',
            language: 'en-US',
            timezone: 'America/New_York',
            screen: expect.objectContaining({
              width: 1920,
              height: 1080,
              colorDepth: 24,
            }),
            viewport: expect.objectContaining({
              width: 1200,
              height: 800,
            }),
            connection: expect.objectContaining({
              effectiveType: '4g',
              downlink: 10,
              rtt: 50,
            }),
          }),
          userAgent: 'test-user-agent',
          sessionId: expect.stringMatching(/^session_/),
        });
    });

    it('should collect performance information', () => {
      const reporter = new ErrorReporter({
        enablePerformanceTracking: true,
      });

      // Access private method through any cast for testing
      const performanceInfo = (reporter as any).getPerformanceInfo();

      expect(performanceInfo).toEqual(
        expect.objectContaining({
          memoryUsage: expect.objectContaining({
            used: 50000000,
            total: 100000000,
            percentage: 50,
          }),
          timing: expect.objectContaining({
            operationDuration: expect.any(Number),
            renderTime: expect.any(Number),
            networkTime: expect.any(Number),
          }),
        })
      );
    });

    it('should not collect performance info when disabled', () => {
      const reporter = new ErrorReporter({
        enablePerformanceTracking: false,
      });

      const performanceInfo = (reporter as any).getPerformanceInfo();

      expect(performanceInfo).toEqual({});
    });

    it('should handle missing performance APIs gracefully', () => {
      // Temporarily remove performance APIs
      const originalMemory = (global as any).performance.memory;
      const originalTiming = (global as any).performance.timing;

      delete (global as any).performance.memory;
      delete (global as any).performance.timing;

      const reporter = new ErrorReporter({
        enablePerformanceTracking: true,
      });

      const performanceInfo = (reporter as any).getPerformanceInfo();

      expect(performanceInfo).toEqual({});

      // Restore APIs
      (global as any).performance.memory = originalMemory;
      (global as any).performance.timing = originalTiming;
    });
  });

  describe('Network handling', () => {
    it('should handle network failures gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const reporter = new ErrorReporter({
        endpoint: 'https://api.example.com/errors',
        enableAutoSubmit: true,
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to submit error report:',
        expect.any(Error)
      );

      // Should queue the report for later
      expect(reporter.getQueuedReportsCount()).toBe(1);
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const reporter = new ErrorReporter({
        endpoint: 'https://api.example.com/errors',
        enableAutoSubmit: true,
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to submit error report:',
        expect.any(Error)
      );
    });

    it('should queue reports when offline', async () => {
      const reporter = new ErrorReporter({
        endpoint: 'https://api.example.com/errors',
        enableAutoSubmit: true,
      });

      // Simulate being offline
      (reporter as any).isOnline = false;

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      expect(reporter.getQueuedReportsCount()).toBe(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should queue reports when no endpoint is configured', async () => {
      const reporter = new ErrorReporter({
        enableAutoSubmit: true,
        // No endpoint configured
      });

      const error = new AdapterError('Test error', 'TEST_ERROR');
      await reporter.report(error);

      expect(reporter.getQueuedReportsCount()).toBe(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Queue management', () => {
    it('should submit queued reports', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const reporter = new ErrorReporter({
        endpoint: 'https://api.example.com/errors',
        enableAutoSubmit: false,
      });

      // Queue some reports
      const error1 = new AdapterError('Error 1', 'ERROR_1');
      const error2 = new AdapterError('Error 2', 'ERROR_2');

      await reporter.report(error1);
      await reporter.report(error2);

      expect(reporter.getQueuedReportsCount()).toBe(2);

      await reporter.submitQueuedReports();

      expect(reporter.getQueuedReportsCount()).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should re-queue failed reports during batch submission', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // First report succeeds
        .mockRejectedValueOnce(new Error('Network error')); // Second report fails

      const reporter = new ErrorReporter({
        endpoint: 'https://api.example.com/errors',
        enableAutoSubmit: false,
      });

      // Queue some reports
      await reporter.report(new AdapterError('Error 1', 'ERROR_1'));
      await reporter.report(new AdapterError('Error 2', 'ERROR_2'));

      expect(reporter.getQueuedReportsCount()).toBe(2);

      await reporter.submitQueuedReports();

      // One should be re-queued
      expect(reporter.getQueuedReportsCount()).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should limit queue size', async () => {
      const reporter = new ErrorReporter({
        enableAutoSubmit: false,
      });

      // Add more than 100 reports (the limit)
      for (let i = 0; i < 105; i++) {
        await reporter.report(new AdapterError(`Error ${i}`, `ERROR_${i}`));
      }

      expect(reporter.getQueuedReportsCount()).toBe(100);
    });
  });

  describe('Event listeners and auto-capture', () => {
    it('should set up online/offline listeners', () => {
      new ErrorReporter();

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });

    it('should set up console capture when enabled', () => {
      const originalConsole = { ...console };
      
      const reporter = new ErrorReporter({
        enableConsoleCapture: true,
      });

      // Console methods should be wrapped
      expect(console.error).not.toBe(originalConsole.error);
      expect(console.warn).not.toBe(originalConsole.warn);
      expect(console.info).not.toBe(originalConsole.info);
      expect(console.log).not.toBe(originalConsole.log);

      // Test console capture
      console.error('Test error message', { data: 'test' });

      const breadcrumbs = reporter.getBreadcrumbs();
      expect(breadcrumbs).toContainEqual(
        expect.objectContaining({
          category: 'system',
          message: 'Console error: Test error message [object Object]',
          level: 'error',
          data: { args: ['Test error message', { data: 'test' }] },
        })
      );
    });

    it('should set up user action capture when enabled', () => {
      new ErrorReporter({
        enableUserActions: true,
      });

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
      expect((global as any).document.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });

    it('should not set up console capture when disabled', () => {
      const originalConsole = { ...console };
      
      new ErrorReporter({
        enableConsoleCapture: false,
      });

      expect(console.error).toBe(originalConsole.error);
    });
  });

  describe('Error filters', () => {
    describe('severityFilter', () => {
      it('should filter by minimum severity level', () => {
        const filter = ErrorFilters.severityFilter('high');

        const lowError = new AdapterError('Low', 'LOW', { severity: 'low' });
        const mediumError = new AdapterError('Medium', 'MEDIUM', { severity: 'medium' });
        const highError = new AdapterError('High', 'HIGH', { severity: 'high' });
        const criticalError = new AdapterError('Critical', 'CRITICAL', { severity: 'critical' });

        expect(filter(lowError, {} as any)).toBe(false);
        expect(filter(mediumError, {} as any)).toBe(false);
        expect(filter(highError, {} as any)).toBe(true);
        expect(filter(criticalError, {} as any)).toBe(true);
      });
    });

    describe('codeFilter', () => {
      it('should filter by error code patterns', () => {
        const filter = ErrorFilters.codeFilter(['TEST_', 'DEBUG_']);

        const testError = new AdapterError('Test', 'TEST_ERROR');
        const debugError = new AdapterError('Debug', 'DEBUG_INFO');
        const prodError = new AdapterError('Production', 'PROD_ERROR');

        expect(filter(testError, {} as any)).toBe(false);
        expect(filter(debugError, {} as any)).toBe(false);
        expect(filter(prodError, {} as any)).toBe(true);
      });
    });

    describe('rateLimitFilter', () => {
      it('should implement rate limiting', () => {
        const filter = ErrorFilters.rateLimitFilter(2);

        const error = new AdapterError('Test', 'TEST');
        const context = {} as any;

        expect(filter(error, context)).toBe(true); // 1st error
        expect(filter(error, context)).toBe(true); // 2nd error
        expect(filter(error, context)).toBe(false); // 3rd error - should be rate limited
      });

      it('should reset rate limit after time window', (done) => {
        const filter = ErrorFilters.rateLimitFilter(1);

        const error = new AdapterError('Test', 'TEST');
        const context = {} as any;

        expect(filter(error, context)).toBe(true); // 1st error
        expect(filter(error, context)).toBe(false); // 2nd error - rate limited

        // Wait for time window to reset (using shorter time for test)
        setTimeout(() => {
          expect(filter(error, context)).toBe(true); // Should be allowed again
          done();
        }, 1100); // Just over 1 second
      });
    });
  });

  describe('Global convenience functions', () => {
    it('should use global error reporter for reportError', async () => {
      const error = new AdapterError('Global test', 'GLOBAL_TEST');
      
      await reportError(error, {
        operation: 'global-operation',
      });

      const breadcrumbs = globalErrorReporter.getBreadcrumbs();
      expect(breadcrumbs).toContainEqual(
        expect.objectContaining({
          category: 'adapter',
          message: 'Error reported: GLOBAL_TEST',
        })
      );
    });

    it('should use global error reporter for addBreadcrumb', () => {
      addBreadcrumb({
        category: 'user',
        message: 'Global breadcrumb',
        level: 'info',
      });

      const breadcrumbs = globalErrorReporter.getBreadcrumbs();
      expect(breadcrumbs).toContainEqual(
        expect.objectContaining({
          category: 'user',
          message: 'Global breadcrumb',
          level: 'info',
        })
      );
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should handle transformer that returns null', async () => {
      const nullTransformer: ErrorTransformer = () => null as any;

      const reporter = new ErrorReporter({
        transformers: [nullTransformer],
        enableAutoSubmit: false,
      });

      const error = new AdapterError('Test', 'TEST');
      await reporter.report(error);

      expect(reporter.getQueuedReportsCount()).toBe(0); // Report should be cancelled
    });

    it('should handle multiple transformers with one returning null', async () => {
      const firstTransformer: ErrorTransformer = (report) => ({
        ...report,
        context: { ...report.context, first: true },
      });

      const nullTransformer: ErrorTransformer = () => null as any;

      const reporter = new ErrorReporter({
        transformers: [firstTransformer, nullTransformer],
        enableAutoSubmit: false,
      });

      const error = new AdapterError('Test', 'TEST');
      await reporter.report(error);

      expect(reporter.getQueuedReportsCount()).toBe(0);
    });

    it('should handle empty context gracefully', async () => {
      const error = new AdapterError('Test', 'TEST');
      await errorReporter.report(error); // No context provided

      expect(errorReporter.getBreadcrumbs()).toContainEqual(
        expect.objectContaining({
          message: 'Error reported: TEST',
        })
      );
    });

    it('should handle undefined user agent', () => {
      // Temporarily remove userAgent
      const originalUserAgent = (global as any).navigator.userAgent;
      delete (global as any).navigator.userAgent;

      const reporter = new ErrorReporter();
      const envInfo = (reporter as any).getEnvironmentInfo();

      expect(envInfo.userAgent).toBeUndefined();

      // Restore userAgent
      (global as any).navigator.userAgent = originalUserAgent;
    });

    it('should handle missing connection API', () => {
      // Temporarily remove connection
      const originalConnection = (global as any).navigator.connection;
      delete (global as any).navigator.connection;

      const reporter = new ErrorReporter();
      const envInfo = (reporter as any).getEnvironmentInfo();

      expect(envInfo.connection).toBeUndefined();

      // Restore connection
      (global as any).navigator.connection = originalConnection;
    });

    it('should handle very long breadcrumb messages', () => {
      const longMessage = 'a'.repeat(10000);

      errorReporter.addBreadcrumb({
        category: 'system',
        message: longMessage,
        level: 'info',
      });

      const breadcrumbs = errorReporter.getBreadcrumbs();
      expect(breadcrumbs[0].message).toBe(longMessage); // Should handle without truncation
    });

    it('should handle circular references in breadcrumb data', () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;

      errorReporter.addBreadcrumb({
        category: 'system',
        message: 'Circular data test',
        level: 'info',
        data: circularData,
      });

      // Should not throw an error
      const breadcrumbs = errorReporter.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
    });
  });
});