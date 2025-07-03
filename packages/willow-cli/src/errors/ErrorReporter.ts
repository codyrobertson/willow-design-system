/**
 * Error Reporter
 * Handles error telemetry and reporting
 */

import { BaseError } from './BaseError.js';
import { ErrorReport } from '../types/errors.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface ErrorReporterOptions {
  enabled?: boolean;
  logDir?: string;
  maxLogSize?: number;
  maxLogFiles?: number;
  includeSystemInfo?: boolean;
  includeEnvironment?: boolean;
  redactPatterns?: RegExp[];
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  cliVersion: string;
  memory: {
    total: number;
    free: number;
  };
  cpu: {
    model: string;
    cores: number;
  };
}

export class ErrorReporter {
  private readonly options: Required<ErrorReporterOptions>;
  private readonly errorBuffer: ErrorReport[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(options: ErrorReporterOptions = {}) {
    this.options = {
      enabled: options.enabled ?? (process.env.WILLOW_TELEMETRY !== 'false'),
      logDir: options.logDir ?? path.join(os.homedir(), '.willow', 'logs'),
      maxLogSize: options.maxLogSize ?? 10 * 1024 * 1024, // 10MB
      maxLogFiles: options.maxLogFiles ?? 5,
      includeSystemInfo: options.includeSystemInfo ?? true,
      includeEnvironment: options.includeEnvironment ?? false,
      redactPatterns: options.redactPatterns ?? [
        /api[_-]?key/i,
        /password/i,
        /token/i,
        /secret/i,
        /authorization/i
      ]
    };
  }

  /**
   * Report an error
   */
  async report(error: BaseError): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    const report = this.createReport(error);
    
    // Add to buffer
    this.errorBuffer.push(report);

    // Schedule flush
    this.scheduleFlush();

    // Log critical errors immediately
    if (!error.isOperational) {
      await this.flush();
    }
  }

  /**
   * Create error report
   */
  private createReport(error: BaseError): ErrorReport {
    const report: ErrorReport = {
      error: {
        code: error.code,
        message: this.redact(error.message),
        userMessage: this.redact(error.toUserMessage()),
        timestamp: error.timestamp.toISOString()
      },
      context: this.redactObject(error.context),
      metadata: this.redactObject(error.metadata),
      suggestions: error.getSuggestedActions(),
      isRetryable: error.isRetryable()
    };

    // Add system info if enabled
    if (this.options.includeSystemInfo) {
      (report as any).system = this.getSystemInfo();
    }

    // Add environment if enabled
    if (this.options.includeEnvironment) {
      (report as any).environment = this.getEnvironment();
    }

    // Add stack trace for non-operational errors
    if (!error.isOperational && error.stack) {
      (report as any).stack = this.redact(error.stack);
    }

    return report;
  }

  /**
   * Get system information
   */
  private getSystemInfo(): SystemInfo {
    const cpus = os.cpus();
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cliVersion: this.getCliVersion(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length
      }
    };
  }

  /**
   * Get CLI version
   */
  private getCliVersion(): string {
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const pkg = require(packagePath);
      return pkg.version || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get relevant environment variables
   */
  private getEnvironment(): Record<string, string | undefined> {
    return {
      NODE_ENV: process.env.NODE_ENV,
      CI: process.env.CI,
      WILLOW_REGISTRY: process.env.WILLOW_REGISTRY,
      WILLOW_CACHE_DIR: process.env.WILLOW_CACHE_DIR,
      // Add other relevant env vars
    };
  }

  /**
   * Redact sensitive information
   */
  private redact(text: string): string {
    let redacted = text;
    
    for (const pattern of this.options.redactPatterns) {
      redacted = redacted.replace(pattern, (match) => {
        const key = match.split(/[=:]/)[0];
        return `${key}=[REDACTED]`;
      });
    }

    return redacted;
  }

  /**
   * Redact object properties
   */
  private redactObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const redacted: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if key contains sensitive pattern
      const isSensitive = this.options.redactPatterns.some(
        pattern => pattern.test(key)
      );

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        redacted[key] = this.redact(value);
      } else if (typeof value === 'object') {
        redacted[key] = this.redactObject(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Schedule buffer flush
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flush().catch(console.error);
    }, 5000); // Flush after 5 seconds
  }

  /**
   * Flush error buffer to disk
   */
  async flush(): Promise<void> {
    if (this.errorBuffer.length === 0) {
      return;
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    const reports = [...this.errorBuffer];
    this.errorBuffer.length = 0;

    try {
      await this.writeReports(reports);
    } catch (error) {
      console.error('Failed to write error reports:', error);
    }
  }

  /**
   * Write reports to log file
   */
  private async writeReports(reports: ErrorReport[]): Promise<void> {
    // Ensure log directory exists
    await fs.mkdir(this.options.logDir, { recursive: true });

    // Get current log file
    const logFile = await this.getCurrentLogFile();

    // Append reports
    const content = reports.map(r => JSON.stringify(r)).join('\n') + '\n';
    await fs.appendFile(logFile, content, 'utf8');

    // Rotate if needed
    await this.rotateLogsIfNeeded();
  }

  /**
   * Get current log file path
   */
  private async getCurrentLogFile(): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.options.logDir, `errors-${date}.log`);
  }

  /**
   * Rotate logs if needed
   */
  private async rotateLogsIfNeeded(): Promise<void> {
    try {
      const files = await fs.readdir(this.options.logDir);
      const logFiles = files
        .filter(f => f.startsWith('errors-') && f.endsWith('.log'))
        .sort()
        .reverse();

      // Remove old files
      if (logFiles.length > this.options.maxLogFiles) {
        const toDelete = logFiles.slice(this.options.maxLogFiles);
        await Promise.all(
          toDelete.map(f => fs.unlink(path.join(this.options.logDir, f)))
        );
      }

      // Check current file size
      if (logFiles[0]) {
        const currentFile = path.join(this.options.logDir, logFiles[0]);
        const stats = await fs.stat(currentFile);
        
        if (stats.size > this.options.maxLogSize) {
          // Rename current file with timestamp
          const timestamp = Date.now();
          const newName = currentFile.replace('.log', `-${timestamp}.log`);
          await fs.rename(currentFile, newName);
        }
      }
    } catch (error) {
      // Don't fail on rotation errors
      console.error('Log rotation failed:', error);
    }
  }

  /**
   * Get error statistics
   */
  async getStatistics(): Promise<{
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByDate: Record<string, number>;
  }> {
    const stats = {
      totalErrors: 0,
      errorsByCode: {} as Record<string, number>,
      errorsByDate: {} as Record<string, number>
    };

    try {
      const files = await fs.readdir(this.options.logDir);
      const logFiles = files.filter(f => f.startsWith('errors-') && f.endsWith('.log'));

      for (const file of logFiles) {
        const content = await fs.readFile(
          path.join(this.options.logDir, file),
          'utf8'
        );

        const lines = content.trim().split('\n');
        for (const line of lines) {
          try {
            const report: ErrorReport = JSON.parse(line);
            stats.totalErrors++;

            // Count by code
            stats.errorsByCode[report.error.code] = 
              (stats.errorsByCode[report.error.code] || 0) + 1;

            // Count by date
            const date = report.error.timestamp.split('T')[0];
            stats.errorsByDate[date] = (stats.errorsByDate[date] || 0) + 1;
          } catch {
            // Skip invalid lines
          }
        }
      }
    } catch (error) {
      console.error('Failed to read error statistics:', error);
    }

    return stats;
  }
}

// Singleton instance
export const errorReporter = new ErrorReporter();