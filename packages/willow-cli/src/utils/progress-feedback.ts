import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { performance } from 'perf_hooks';

export interface ProgressOptions {
  showTime?: boolean;
  showSteps?: boolean;
  silent?: boolean;
}

export interface StepResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  message?: string;
  duration?: number;
}

export interface SummaryReport {
  title: string;
  totalDuration: number;
  steps: StepResult[];
  installedFeatures: string[];
  nextSteps: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Progress feedback manager for CLI operations
 */
export class ProgressFeedback {
  private spinner: Ora | null = null;
  private startTime: number = 0;
  private steps: StepResult[] = [];
  private options: ProgressOptions;
  private currentStep: { name: string; startTime: number } | null = null;

  constructor(options: ProgressOptions = {}) {
    this.options = {
      showTime: true,
      showSteps: true,
      silent: false,
      ...options
    };
  }

  /**
   * Starts a new progress operation
   */
  start(message: string): void {
    if (this.options.silent) return;
    
    this.startTime = performance.now();
    this.steps = [];
    this.spinner = ora({
      text: message,
      spinner: 'dots'
    }).start();
  }

  /**
   * Updates the progress message
   */
  update(message: string): void {
    if (this.options.silent || !this.spinner) return;
    
    this.spinner.text = message;
  }

  /**
   * Starts a new step
   */
  startStep(stepName: string): void {
    if (this.options.silent) return;
    
    // Complete previous step if any
    if (this.currentStep) {
      this.completeStep('success');
    }

    this.currentStep = {
      name: stepName,
      startTime: performance.now()
    };

    if (this.spinner) {
      this.spinner.text = stepName;
    }
  }

  /**
   * Completes the current step
   */
  completeStep(
    status: 'success' | 'warning' | 'error' | 'skipped',
    message?: string
  ): void {
    if (this.options.silent || !this.currentStep) return;

    const duration = performance.now() - this.currentStep.startTime;
    
    this.steps.push({
      name: this.currentStep.name,
      status,
      message,
      duration
    });

    if (this.spinner && this.options.showSteps) {
      const icon = this.getStatusIcon(status);
      const color = this.getStatusColor(status);
      const timeStr = this.options.showTime ? chalk.gray(` (${this.formatDuration(duration)})`) : '';
      
      this.spinner.stopAndPersist({
        symbol: icon,
        text: color(`${this.currentStep.name}${message ? ': ' + message : ''}${timeStr}`)
      });

      // Restart spinner for next step
      this.spinner = ora({
        spinner: 'dots'
      }).start();
    }

    this.currentStep = null;
  }

  /**
   * Completes the entire progress operation
   */
  complete(status: 'success' | 'error' = 'success', message?: string): void {
    if (this.options.silent) return;

    // Complete any pending step
    if (this.currentStep) {
      this.completeStep(status);
    }

    const totalDuration = performance.now() - this.startTime;

    if (this.spinner) {
      if (status === 'success') {
        this.spinner.succeed(
          message || `Completed${this.options.showTime ? chalk.gray(` (${this.formatDuration(totalDuration)})`) : ''}`
        );
      } else {
        this.spinner.fail(message || 'Failed');
      }
      this.spinner = null;
    }
  }

  /**
   * Shows a success message
   */
  success(message: string): void {
    if (this.options.silent) return;
    console.log(chalk.green('✓'), message);
  }

  /**
   * Shows a warning message
   */
  warning(message: string): void {
    if (this.options.silent) return;
    console.log(chalk.yellow('⚠'), message);
  }

  /**
   * Shows an error message
   */
  error(message: string): void {
    if (this.options.silent) return;
    console.log(chalk.red('✖'), message);
  }

  /**
   * Shows an info message
   */
  info(message: string): void {
    if (this.options.silent) return;
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Shows a summary report
   */
  showSummary(report: SummaryReport): void {
    if (this.options.silent) return;

    console.log('\n' + chalk.bold.underline(report.title));
    console.log(chalk.gray(`Total time: ${this.formatDuration(report.totalDuration)}\n`));

    // Show step summary
    if (report.steps.length > 0) {
      console.log(chalk.bold('Steps completed:'));
      report.steps.forEach(step => {
        const icon = this.getStatusIcon(step.status);
        const color = this.getStatusColor(step.status);
        const timeStr = step.duration ? chalk.gray(` (${this.formatDuration(step.duration)})`) : '';
        console.log(`  ${icon} ${color(step.name)}${step.message ? ': ' + step.message : ''}${timeStr}`);
      });
      console.log();
    }

    // Show installed features
    if (report.installedFeatures.length > 0) {
      console.log(chalk.bold('✨ Installed features:'));
      report.installedFeatures.forEach(feature => {
        console.log(`  ${chalk.green('•')} ${feature}`);
      });
      console.log();
    }

    // Show warnings
    if (report.warnings.length > 0) {
      console.log(chalk.bold.yellow('⚠ Warnings:'));
      report.warnings.forEach(warning => {
        console.log(`  ${chalk.yellow('•')} ${warning}`);
      });
      console.log();
    }

    // Show errors
    if (report.errors.length > 0) {
      console.log(chalk.bold.red('✖ Errors:'));
      report.errors.forEach(error => {
        console.log(`  ${chalk.red('•')} ${error}`);
      });
      console.log();
    }

    // Show next steps
    if (report.nextSteps.length > 0) {
      console.log(chalk.bold('📋 Next steps:'));
      report.nextSteps.forEach((step, index) => {
        console.log(`  ${chalk.cyan(`${index + 1}.`)} ${step}`);
      });
      console.log();
    }
  }

  /**
   * Creates a progress bar for known progress
   */
  createProgressBar(total: number, label: string = 'Progress'): ProgressBar {
    return new ProgressBar(total, label, this.options);
  }

  /**
   * Gets the current steps
   */
  getSteps(): StepResult[] {
    return [...this.steps];
  }

  /**
   * Gets total elapsed time
   */
  getElapsedTime(): number {
    return performance.now() - this.startTime;
  }

  private getStatusIcon(status: 'success' | 'warning' | 'error' | 'skipped'): string {
    switch (status) {
      case 'success':
        return chalk.green('✓');
      case 'warning':
        return chalk.yellow('⚠');
      case 'error':
        return chalk.red('✖');
      case 'skipped':
        return chalk.gray('○');
    }
  }

  private getStatusColor(status: 'success' | 'warning' | 'error' | 'skipped') {
    switch (status) {
      case 'success':
        return chalk.green;
      case 'warning':
        return chalk.yellow;
      case 'error':
        return chalk.red;
      case 'skipped':
        return chalk.gray;
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.round((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
}

/**
 * Progress bar for known progress
 */
export class ProgressBar {
  private current: number = 0;
  private barLength: number = 30;
  private lastUpdate: number = 0;
  private updateInterval: number = 100; // Update every 100ms max

  constructor(
    private total: number,
    private label: string,
    private options: ProgressOptions
  ) {}

  /**
   * Updates the progress
   */
  update(current: number, message?: string): void {
    if (this.options.silent) return;

    this.current = Math.min(current, this.total);
    
    // Throttle updates
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval && this.current < this.total) {
      return;
    }
    this.lastUpdate = now;

    const percentage = Math.round((this.current / this.total) * 100);
    const filled = Math.round((this.current / this.total) * this.barLength);
    const empty = this.barLength - filled;

    const bar = chalk.green('█').repeat(filled) + chalk.gray('░').repeat(empty);
    const status = message || `${this.current}/${this.total}`;

    process.stdout.write(`\r${this.label}: [${bar}] ${percentage}% ${chalk.gray(status)}`);

    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  /**
   * Completes the progress bar
   */
  complete(message?: string): void {
    this.update(this.total, message || 'Complete');
  }
}

/**
 * Creates a simple spinner
 */
export function createSpinner(text: string, options?: ProgressOptions): Ora {
  if (options?.silent) {
    // Return a mock spinner that does nothing
    return {
      start: () => {},
      stop: () => {},
      succeed: () => {},
      fail: () => {},
      warn: () => {},
      info: () => {},
      stopAndPersist: () => {},
      clear: () => {},
      render: () => {},
      frame: () => '',
      text: '',
      color: 'yellow',
      indent: 0,
      spinner: 'dots',
      interval: 80,
      isSpinning: false,
    } as any;
  }

  return ora({
    text,
    spinner: 'dots'
  });
}

/**
 * Formats a success message
 */
export function formatSuccess(message: string): string {
  return chalk.green('✓') + ' ' + message;
}

/**
 * Formats a warning message
 */
export function formatWarning(message: string): string {
  return chalk.yellow('⚠') + ' ' + message;
}

/**
 * Formats an error message
 */
export function formatError(message: string): string {
  return chalk.red('✖') + ' ' + message;
}

/**
 * Formats an info message
 */
export function formatInfo(message: string): string {
  return chalk.blue('ℹ') + ' ' + message;
}

/**
 * Prints a styled header
 */
export function printHeader(text: string): void {
  console.log('\n' + chalk.bold.underline(text) + '\n');
}

/**
 * Prints a styled section
 */
export function printSection(title: string, items: string[]): void {
  console.log(chalk.bold(title));
  items.forEach(item => {
    console.log(`  ${chalk.gray('•')} ${item}`);
  });
  console.log();
}