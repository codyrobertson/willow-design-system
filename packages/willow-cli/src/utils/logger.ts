import chalk from 'chalk';

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogOptions {
  prefix?: string;
  indent?: number;
  timestamp?: boolean;
}

/**
 * Enhanced logging utility with consistent formatting and context
 */
export class Logger {
  private static indent = 0;
  private static debugMode = process.env.WILLOW_DEBUG === 'true';
  
  static setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  static increaseIndent(): void {
    this.indent += 2;
  }
  
  static decreaseIndent(): void {
    this.indent = Math.max(0, this.indent - 2);
  }
  
  static resetIndent(): void {
    this.indent = 0;
  }
  
  private static getIndent(): string {
    return ' '.repeat(this.indent);
  }
  
  private static getTimestamp(): string {
    return new Date().toLocaleTimeString();
  }
  
  static info(message: string, options: LogOptions = {}): void {
    const { prefix, indent = 0, timestamp = false } = options;
    const indentStr = ' '.repeat(this.indent + indent);
    const prefixStr = prefix ? `${prefix} ` : '';
    const timestampStr = timestamp ? `[${this.getTimestamp()}] ` : '';
    
    console.log(`${indentStr}${timestampStr}${prefixStr}${message}`);
  }
  
  static success(message: string, options: LogOptions = {}): void {
    const { prefix = '✅', indent = 0, timestamp = false } = options;
    const indentStr = ' '.repeat(this.indent + indent);
    const timestampStr = timestamp ? `[${this.getTimestamp()}] ` : '';
    
    console.log(chalk.green(`${indentStr}${timestampStr}${prefix} ${message}`));
  }
  
  static warning(message: string, options: LogOptions = {}): void {
    const { prefix = '⚠️', indent = 0, timestamp = false } = options;
    const indentStr = ' '.repeat(this.indent + indent);
    const timestampStr = timestamp ? `[${this.getTimestamp()}] ` : '';
    
    console.log(chalk.yellow(`${indentStr}${timestampStr}${prefix} ${message}`));
  }
  
  static error(message: string, options: LogOptions = {}): void {
    const { prefix = '❌', indent = 0, timestamp = false } = options;
    const indentStr = ' '.repeat(this.indent + indent);
    const timestampStr = timestamp ? `[${this.getTimestamp()}] ` : '';
    
    console.error(chalk.red(`${indentStr}${timestampStr}${prefix} ${message}`));
  }
  
  static debug(message: string, options: LogOptions = {}): void {
    if (!this.debugMode) return;
    
    const { prefix = '🐛', indent = 0, timestamp = true } = options;
    const indentStr = ' '.repeat(this.indent + indent);
    const timestampStr = timestamp ? `[${this.getTimestamp()}] ` : '';
    
    console.log(chalk.gray(`${indentStr}${timestampStr}${prefix} ${message}`));
  }
  
  static step(message: string): void {
    console.log(chalk.blue(`⏳ ${message}...`));
  }
  
  static substep(message: string): void {
    this.info(chalk.gray(`   ${message}`));
  }
  
  static title(message: string): void {
    console.log(chalk.blue.bold(`\n🎨 ${message}`));
  }
  
  static section(message: string): void {
    console.log(chalk.blue(`\n📦 ${message}`));
  }
  
  static spacer(): void {
    console.log();
  }
  
  static divider(): void {
    console.log(chalk.gray('─'.repeat(60)));
  }
  
  static table(headers: string[], rows: string[][]): void {
    // Simple table implementation
    const colWidths = headers.map((header, i) => 
      Math.max(header.length, ...rows.map(row => (row[i] || '').length))
    );
    
    // Header
    const headerRow = headers.map((header, i) => 
      header.padEnd(colWidths[i])
    ).join(' │ ');
    console.log(chalk.blue(`│ ${headerRow} │`));
    
    // Separator
    const separator = colWidths.map(width => '─'.repeat(width)).join('─┼─');
    console.log(chalk.blue(`├─${separator}─┤`));
    
    // Rows
    rows.forEach(row => {
      const rowStr = row.map((cell, i) => 
        (cell || '').padEnd(colWidths[i])
      ).join(' │ ');
      console.log(`│ ${rowStr} │`);
    });
  }
  
  static list(items: string[], options: { ordered?: boolean; indent?: number } = {}): void {
    const { ordered = false, indent = 0 } = options;
    const indentStr = ' '.repeat(this.indent + indent);
    
    items.forEach((item, index) => {
      const marker = ordered ? `${index + 1}.` : '•';
      console.log(`${indentStr}${marker} ${item}`);
    });
  }
  
  static group(title: string, callback: () => void): void {
    this.section(title);
    this.increaseIndent();
    try {
      callback();
    } finally {
      this.decreaseIndent();
    }
  }
}

/**
 * Simple step logger for tracking progress
 */
export class StepLogger {
  private currentStep = 0;
  private totalSteps: number;
  private steps: string[];
  
  constructor(steps: string[]) {
    this.steps = steps;
    this.totalSteps = steps.length;
    this.logProgress();
  }
  
  next(message?: string): void {
    if (this.currentStep < this.totalSteps) {
      Logger.success(message || this.steps[this.currentStep]);
      this.currentStep++;
      this.logProgress();
    }
  }
  
  fail(message?: string): void {
    Logger.error(message || `Failed: ${this.steps[this.currentStep]}`);
  }
  
  skip(message?: string): void {
    Logger.warning(message || `Skipped: ${this.steps[this.currentStep]}`);
    this.currentStep++;
    this.logProgress();
  }
  
  private logProgress(): void {
    if (this.currentStep < this.totalSteps) {
      Logger.step(`(${this.currentStep + 1}/${this.totalSteps}) ${this.steps[this.currentStep]}`);
    }
  }
  
  complete(): void {
    Logger.success(`All ${this.totalSteps} steps completed!`);
  }
}

/**
 * Utility functions for common logging patterns
 */
export function logFileOperation(operation: 'create' | 'update' | 'delete', filePath: string): void {
  const icons = {
    create: '📝',
    update: '✏️',
    delete: '🗑️',
  };
  
  const messages = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
  };
  
  Logger.info(`${icons[operation]} ${messages[operation]}: ${filePath}`);
}

export function logDependencyInstall(deps: string[], manager: string = 'npm'): void {
  Logger.info(`📦 Installing dependencies with ${manager}:`);
  Logger.list(deps, { indent: 2 });
}

export function logComponentInstall(componentName: string, success: boolean): void {
  if (success) {
    Logger.success(`Installed component: ${componentName}`);
  } else {
    Logger.error(`Failed to install component: ${componentName}`);
  }
}

export function logValidationResult(
  valid: boolean, 
  issues: string[] = [], 
  warnings: string[] = []
): void {
  if (valid) {
    Logger.success('Project validation passed');
  } else {
    Logger.error('Project validation failed');
    if (issues.length > 0) {
      Logger.warning('Issues found:');
      Logger.list(issues, { indent: 2 });
    }
  }
  
  if (warnings.length > 0) {
    Logger.warning('Warnings:');
    Logger.list(warnings, { indent: 2 });
  }
}

export function logEnvironmentInfo(info: Record<string, unknown>): void {
  Logger.section('Environment Information');
  Object.entries(info).forEach(([key, value]) => {
    Logger.info(`${key}: ${value}`, { indent: 2 });
  });
}

// Convenience exports
export const log = Logger;
export { Logger as default };