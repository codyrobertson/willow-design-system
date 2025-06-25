import { beforeEach, afterEach, vi } from 'vitest';

// Mock global browser APIs that are not available in Node.js test environment
global.fetch = vi.fn();
global.navigator = {
  userAgent: 'test-user-agent',
  platform: 'test-platform',
  language: 'en-US',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
} as any;

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
} as any;

global.Intl = {
  DateTimeFormat: () => ({
    resolvedOptions: () => ({ timeZone: 'America/New_York' }),
  }),
} as any;

// Global test setup
beforeEach(() => {
  // Reset any mocks or test state
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after tests
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
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});