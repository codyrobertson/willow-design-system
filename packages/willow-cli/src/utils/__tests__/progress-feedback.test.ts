import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';

// Mock ora before importing the module
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    stopAndPersist: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    render: vi.fn().mockReturnThis(),
    text: '',
    color: 'yellow',
    spinner: 'dots',
    isSpinning: false
  }))
}));

import * as progressFeedback from '../progress-feedback.js';

// We'll create the spies inside the describe block to ensure proper setup

describe('progress-feedback', () => {
  let mockConsoleLog: any;
  let mockStdoutWrite: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Disable chalk colors for testing
    chalk.level = 0;
    // Create spies for console methods
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    // Re-enable chalk colors
    chalk.level = 3;
    mockConsoleLog.mockRestore();
    mockStdoutWrite.mockRestore();
  });


  describe('ProgressFeedback', () => {
    it('should start and complete a progress operation', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      progress.start('Starting operation');
      progress.complete('success', 'Operation completed');
      
      expect(progress.getSteps()).toHaveLength(0);
    });

    it('should track multiple steps', () => {
      const progress = new progressFeedback.ProgressFeedback({ showTime: false });
      
      progress.start('Starting operation');
      progress.startStep('Step 1');
      progress.completeStep('success');
      progress.startStep('Step 2');
      progress.completeStep('warning', 'Minor issue');
      progress.startStep('Step 3');
      progress.completeStep('error', 'Failed');
      progress.complete();
      
      const steps = progress.getSteps();
      expect(steps).toHaveLength(3);
      expect(steps[0].status).toBe('success');
      expect(steps[1].status).toBe('warning');
      expect(steps[2].status).toBe('error');
    });

    it('should handle silent mode', () => {
      const progress = new progressFeedback.ProgressFeedback({ silent: true });
      
      progress.start('Starting');
      progress.success('Success message');
      progress.warning('Warning message');
      progress.error('Error message');
      progress.info('Info message');
      progress.complete();
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should show colored messages', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      progress.success('Success message');
      expect(mockConsoleLog).toHaveBeenCalledWith('✓', 'Success message');
      
      progress.warning('Warning message');
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠', 'Warning message');
      
      progress.error('Error message');
      expect(mockConsoleLog).toHaveBeenCalledWith('✖', 'Error message');
      
      progress.info('Info message');
      expect(mockConsoleLog).toHaveBeenCalledWith('ℹ', 'Info message');
    });

    it('should show summary report', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      const report: progressFeedback.SummaryReport = {
        title: 'Setup Complete',
        totalDuration: 5000,
        steps: [
          { name: 'Install packages', status: 'success', duration: 2000 },
          { name: 'Configure TypeScript', status: 'success', duration: 1000 },
          { name: 'Setup ESLint', status: 'warning', message: 'Using defaults', duration: 500 }
        ],
        installedFeatures: [
          'Tailwind CSS',
          'TypeScript',
          'ESLint & Prettier'
        ],
        nextSteps: [
          'Run "npm run dev" to start development server',
          'Run "npm test" to run tests'
        ],
        warnings: ['ESLint configuration uses defaults'],
        errors: []
      };
      
      progress.showSummary(report);
      
      // Debug: log all calls to see what's happening
      // console.log('Console.log calls:', mockConsoleLog.mock.calls);
      
      // Check that console.log was called multiple times
      expect(mockConsoleLog).toHaveBeenCalled();
      
      // Get all console.log calls - when chalk.level = 0, formatting is stripped
      const allCalls = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
      
      // Since chalk.level = 0, we should check for plain text without formatting
      expect(allCalls).toContain('Setup Complete');
      expect(allCalls).toContain('Total time:');
      expect(allCalls).toContain('Steps completed:');
      expect(allCalls).toContain('Installed features:');
      expect(allCalls).toContain('Next steps:');
    });

    it('should track elapsed time', async () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      progress.start('Operation');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const elapsed = progress.getElapsedTime();
      expect(elapsed).toBeGreaterThan(40);
      expect(elapsed).toBeLessThan(100);
      
      progress.complete();
    });

    it('should handle step completion without starting', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      progress.start('Operation');
      // Complete step without starting - should not throw
      progress.completeStep('success');
      progress.complete();
      
      expect(progress.getSteps()).toHaveLength(0);
    });

    it('should update progress message', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      progress.start('Initial message');
      progress.update('Updated message');
      progress.complete();
      
      // Should not throw and complete successfully
      expect(progress.getSteps()).toHaveLength(0);
    });
  });

  describe('ProgressBar', () => {
    it('should create and update progress bar', async () => {
      const progress = new progressFeedback.ProgressFeedback();
      const bar = progress.createProgressBar(100, 'Downloading');
      
      bar.update(0);
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('0%'));
      
      mockStdoutWrite.mockClear();
      // Wait for throttle interval to pass
      await new Promise(resolve => setTimeout(resolve, 110));
      bar.update(50);
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('50%'));
      
      mockStdoutWrite.mockClear();
      // Force update by reaching 100%
      bar.update(100);
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('100%'));
    });

    it('should throttle updates', () => {
      const progress = new progressFeedback.ProgressFeedback();
      const bar = progress.createProgressBar(100, 'Processing');
      
      mockStdoutWrite.mockClear();
      
      // Rapid updates should be throttled
      for (let i = 0; i < 50; i++) {
        bar.update(i);
      }
      
      // Should have fewer calls than updates due to throttling
      expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
    });

    it('should complete progress bar', () => {
      const progress = new progressFeedback.ProgressFeedback();
      const bar = progress.createProgressBar(100, 'Loading');
      
      bar.complete('Done!');
      
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('100%'));
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('Done!'));
    });

    it('should handle silent mode for progress bar', () => {
      const progress = new progressFeedback.ProgressFeedback({ silent: true });
      const bar = progress.createProgressBar(100, 'Silent');
      
      mockStdoutWrite.mockClear();
      
      bar.update(50);
      bar.complete();
      
      expect(mockStdoutWrite).not.toHaveBeenCalled();
    });
  });

  describe('Utility functions', () => {
    it('should format messages correctly', () => {
      expect(progressFeedback.formatSuccess('Success')).toBe('✓ Success');
      expect(progressFeedback.formatWarning('Warning')).toBe('⚠ Warning');
      expect(progressFeedback.formatError('Error')).toBe('✖ Error');
      expect(progressFeedback.formatInfo('Info')).toBe('ℹ Info');
    });

    it('should print header', () => {
      progressFeedback.printHeader('Test Header');
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const allCalls = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allCalls).toContain('Test Header');
    });

    it('should print section', () => {
      progressFeedback.printSection('Features:', ['Feature 1', 'Feature 2']);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const allCalls = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allCalls).toContain('Features:');
      expect(allCalls).toContain('Feature 1');
      expect(allCalls).toContain('Feature 2');
    });

    it('should create spinner with silent option', () => {
      const spinner = progressFeedback.createSpinner('Loading', { silent: true });
      
      // Silent spinner should have all methods but do nothing
      expect(spinner.start).toBeDefined();
      expect(spinner.succeed).toBeDefined();
      expect(spinner.fail).toBeDefined();
      
      // Calling methods should not throw
      spinner.start();
      spinner.succeed();
      spinner.fail();
    });
  });

  describe('Duration formatting', () => {
    it('should format durations correctly', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      progress.start('Test');
      progress.startStep('Quick step');
      // Simulate different durations by mocking performance.now
      const perfNowSpy = vi.spyOn(performance, 'now');
      const startTime = 1000;
      perfNowSpy.mockReturnValueOnce(startTime);
      perfNowSpy.mockReturnValueOnce(startTime + 500); // 500ms
      progress.completeStep('success');
      
      progress.startStep('Medium step');
      perfNowSpy.mockReturnValueOnce(startTime + 500);
      perfNowSpy.mockReturnValueOnce(startTime + 5500); // 5s
      progress.completeStep('success');
      
      progress.startStep('Long step');
      perfNowSpy.mockReturnValueOnce(startTime + 5500);
      perfNowSpy.mockReturnValueOnce(startTime + 125500); // 2m 0s
      progress.completeStep('success');
      
      progress.complete();
      
      perfNowSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle errors in summary report', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      const report: progressFeedback.SummaryReport = {
        title: 'Setup Failed',
        totalDuration: 3000,
        steps: [
          { name: 'Step 1', status: 'success' },
          { name: 'Step 2', status: 'error', message: 'Connection failed' }
        ],
        installedFeatures: [],
        nextSteps: [],
        warnings: [],
        errors: ['Failed to connect to server', 'Invalid configuration']
      };
      
      progress.showSummary(report);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const allCalls = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allCalls).toContain('Errors:');
      expect(allCalls).toContain('Failed to connect');
    });

    it('should handle empty summary report', () => {
      const progress = new progressFeedback.ProgressFeedback();
      
      const report: progressFeedback.SummaryReport = {
        title: 'Empty Operation',
        totalDuration: 0,
        steps: [],
        installedFeatures: [],
        nextSteps: [],
        warnings: [],
        errors: []
      };
      
      // Should not throw
      progress.showSummary(report);
      
      expect(mockConsoleLog).toHaveBeenCalled();
      const allCalls = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allCalls).toContain('Empty Operation');
    });
  });
});