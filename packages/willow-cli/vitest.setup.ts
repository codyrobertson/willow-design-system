import { beforeEach, afterEach } from 'vitest';

// Global test setup
beforeEach(() => {
  // Reset any mocks or test state
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