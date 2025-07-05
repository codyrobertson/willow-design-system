import { beforeEach, afterEach, vi, expect } from 'vitest';

// Increase max listeners for tests to avoid warnings
if (typeof process !== 'undefined') {
  process.setMaxListeners(20);
}

// Mock global browser APIs that are not available in Node.js test environment
global.fetch = vi.fn();

// Use Object.defineProperty for navigator to avoid read-only errors
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    platform: 'test-platform',
    language: 'en-US',
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    },
  },
  writable: true,
  configurable: true,
});

global.screen = {
  width: 1920,
  height: 1080,
  colorDepth: 24,
} as any;

global.window = {
  innerWidth: 1200,
  innerHeight: 800,
  addEventListener: vi.fn(),
  location: {
    href: 'https://test.com/path',
    pathname: '/path',
  },
} as any;

global.performance = {
  now: () => Date.now(),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
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
} as any;

global.document = {
  addEventListener: vi.fn(),
  createElement: vi.fn((tagName: string) => ({
    tagName,
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    style: {},
  })),
} as any;

// Extend Intl instead of replacing it
if (!global.Intl) {
  global.Intl = {} as any;
}

if (!global.Intl.DateTimeFormat) {
  global.Intl.DateTimeFormat = (() => ({
    resolvedOptions: () => ({ timeZone: 'America/New_York' }),
  })) as any;
}

// Global test setup
beforeEach(() => {
  // Reset any mocks or test state
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after tests
  // Remove all listeners to prevent memory leaks
  if (typeof process !== 'undefined') {
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
  }
});

// Mock console methods during tests to reduce noise
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

beforeEach(() => {
  console.log = () => {};
  console.info = () => {};
  
  // Only show warnings/errors in verbose mode or when VERBOSE_TESTS is set
  if (process.env.VERBOSE_TESTS === 'true' || process.argv.includes('--verbose')) {
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  } else {
    // In normal test runs, suppress expected error logs from error handling tests
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      // Only suppress expected plugin/adapter errors during tests
      if (message.includes('Plugin') || message.includes('execution failed') || message.includes('initialization failed')) {
        return;
      }
      originalConsole.warn(...args);
    };
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      // Only suppress expected errors from error handling tests
      if (message.includes('Plugin') || message.includes('execution failed') || message.includes('initialization failed')) {
        return;
      }
      originalConsole.error(...args);
    };
  }
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

// Add custom matchers
expect.extend({
  toHaveBeenCalledExactlyOnceWith(received: any, ...expectedArgs: any[]) {
    const pass = 
      vi.isMockFunction(received) &&
      received.mock.calls.length === 1 &&
      JSON.stringify(received.mock.calls[0]) === JSON.stringify(expectedArgs);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have been called exactly once with ${expectedArgs}`,
        pass: true,
      };
    } else {
      return {
        message: () => {
          if (!vi.isMockFunction(received)) {
            return `expected ${received} to be a mock function`;
          }
          if (received.mock.calls.length !== 1) {
            return `expected ${received} to have been called exactly once, but was called ${received.mock.calls.length} times`;
          }
          return `expected ${received} to have been called with ${JSON.stringify(expectedArgs)}, but was called with ${JSON.stringify(received.mock.calls[0])}`;
        },
        pass: false,
      };
    }
  },
});

// Polyfill Intl.Segmenter for ora/string-width compatibility
if (!global.Intl.Segmenter) {
  // @ts-ignore
  global.Intl.Segmenter = class {
    constructor() {}
    segment(str: string) {
      return Array.from(str).map((char, index) => ({
        segment: char,
        index,
        isWordLike: /\w/.test(char)
      }));
    }
  };
}

