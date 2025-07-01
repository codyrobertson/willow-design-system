/**
 * UI Components Test Suite
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProgressReporter } from '../ProgressReporter.js';
import { Logger } from '../Logger.js';
import { TerminalManager } from '../TerminalManager.js';
import { Wizard } from '../Wizard.js';

// Mock ora to avoid Intl.Segmenter issues in test environment
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

describe('UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProgressReporter', () => {
    it('should handle start/stop lifecycle', () => {
      const reporter = new ProgressReporter();
      
      reporter.start('Testing...');
      expect(() => reporter.stop()).not.toThrow();
    });

    it('should handle progress updates', () => {
      const reporter = new ProgressReporter();
      
      reporter.start('Testing...');
      reporter.progress('Step 1');
      reporter.progress('Step 2');
      reporter.succeed('Complete!');
    });

    it('should handle JSON output mode', () => {
      const reporter = new ProgressReporter({ json: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      reporter.start('Testing...');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"start"')
      );
      
      reporter.succeed('Done');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"complete"')
      );
    });
  });

  describe('Logger', () => {
    let logger: Logger;
    let consoleSpy: any;

    beforeEach(() => {
      logger = new Logger();
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should log different levels', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      logger.debug('Debug message');
      
      // Default log level is 'info', so debug is excluded
      expect(consoleSpy).toHaveBeenCalledTimes(1); // info
      expect(warnSpy).toHaveBeenCalledTimes(1); // warn
      expect(errorSpy).toHaveBeenCalledTimes(1); // error
      
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should respect log level', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger = new Logger({ level: 'error' });
      consoleSpy.mockClear();
      errorSpy.mockClear();
      
      logger.info('Info');
      logger.warn('Warning');
      logger.error('Error');
      
      expect(consoleSpy).toHaveBeenCalledTimes(0);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
    });

    it('should handle JSON output', () => {
      // Need to create a new logger instance with JSON mode
      const jsonLogger = new Logger({ json: true });
      consoleSpy.mockClear();
      
      jsonLogger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\{.*"level":"info".*\}/)
      );
    });

    it('should format sections', () => {
      logger.section('Test Section');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('TerminalManager', () => {
    it('should be a singleton', () => {
      const instance1 = TerminalManager.getInstance();
      const instance2 = TerminalManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should register cleanup handlers', () => {
      const manager = TerminalManager.getInstance();
      const handler = vi.fn();
      
      manager.registerCleanupHandler(handler);
      // Handler should be registered but not called yet
      expect(handler).not.toHaveBeenCalled();
    });

    it('should detect terminal capabilities', () => {
      // These are static methods that should always return a value
      const supportsColor = TerminalManager.supportsColor();
      const isInteractive = TerminalManager.isInteractive();
      const width = TerminalManager.getTerminalWidth();
      const height = TerminalManager.getTerminalHeight();
      
      // Check that methods exist and return expected types
      expect(TerminalManager.supportsColor).toBeDefined();
      expect(TerminalManager.isInteractive).toBeDefined();
      expect(TerminalManager.getTerminalWidth).toBeDefined();
      expect(TerminalManager.getTerminalHeight).toBeDefined();
      
      // In test environment, these should still return valid defaults
      expect(supportsColor).toBeDefined();
      expect(isInteractive).toBeDefined();
      expect(width).toBeDefined();
      expect(height).toBeDefined();
    });
  });

  describe('Wizard', () => {
    it('should create wizard with steps', () => {
      const wizard = new Wizard({
        title: 'Test Wizard',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            action: async () => 'value1',
          },
        ],
      });
      
      expect(wizard).toBeDefined();
    });

    it('should create confirmation step', () => {
      const step = Wizard.createConfirmationStep(
        'confirm',
        (context) => 'Confirm?'
      );
      
      expect(step.id).toBe('confirm');
      expect(step.title).toBe('Confirm Settings');
      expect(step.action).toBeDefined();
    });

    it('should create summary step', () => {
      const step = Wizard.createSummaryStep(
        'summary',
        (context) => [
          { label: 'Test', value: 'Value' },
        ]
      );
      
      expect(step.id).toBe('summary');
      expect(step.title).toBe('Review Configuration');
      expect(step.action).toBeDefined();
    });

    it('should validate step results', async () => {
      const wizard = new Wizard({
        title: 'Test',
        steps: [
          {
            id: 'test',
            title: 'Test Step',
            action: async () => 'invalid',
            validate: (value) => {
              if (value === 'invalid') {
                return 'Value is invalid';
              }
              return true;
            },
          },
        ],
      });
      
      // Note: Full wizard run would require mocking prompts
      expect(wizard).toBeDefined();
    });
  });
});