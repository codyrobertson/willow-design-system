/**
 * Log Formatters for Different Output Formats
 */

import chalk from 'chalk';
import { LogEntry, LogFormatter, LogLevel } from './types.js';

/**
 * Plain text formatter
 */
export class PlainTextFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (entry.metadata.timestamp) {
      parts.push(`[${entry.metadata.timestamp.toISOString()}]`);
    }
    
    parts.push(`[${LogLevel[entry.level]}]`);
    
    if (entry.metadata.context?.operation) {
      parts.push(`[${entry.metadata.context.operation}]`);
    }
    
    parts.push(entry.message);
    
    if (entry.metadata.error) {
      parts.push(`\n${entry.metadata.error.stack || entry.metadata.error.message}`);
    }
    
    return parts.join(' ');
  }
}

/**
 * JSON formatter
 */
export class JSONFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const output = {
      level: LogLevel[entry.level],
      message: entry.message,
      timestamp: entry.metadata.timestamp.toISOString(),
      ...entry.metadata,
    };
    
    if (entry.metadata.error) {
      output.error = {
        name: entry.metadata.error.name,
        message: entry.metadata.error.message,
        stack: entry.metadata.error.stack,
      };
    }
    
    return JSON.stringify(output);
  }
}

/**
 * Pretty console formatter with colors
 */
export class PrettyConsoleFormatter implements LogFormatter {
  private readonly levelColors = {
    [LogLevel.DEBUG]: chalk.gray,
    [LogLevel.INFO]: chalk.blue,
    [LogLevel.WARN]: chalk.yellow,
    [LogLevel.ERROR]: chalk.red,
  };
  
  private readonly levelIcons = {
    [LogLevel.DEBUG]: '🔍',
    [LogLevel.INFO]: 'ℹ️ ',
    [LogLevel.WARN]: '⚠️ ',
    [LogLevel.ERROR]: '❌',
  };
  
  constructor(private enableColors: boolean = true) {
    if (!enableColors) {
      chalk.level = 0;
    }
  }
  
  format(entry: LogEntry): string {
    const color = this.levelColors[entry.level];
    const icon = this.levelIcons[entry.level];
    const parts: string[] = [];
    
    // Timestamp
    if (entry.metadata.timestamp) {
      const time = entry.metadata.timestamp.toLocaleTimeString();
      parts.push(chalk.gray(`[${time}]`));
    }
    
    // Level with icon
    parts.push(`${icon} ${color(LogLevel[entry.level].padEnd(5))}`);
    
    // Context
    if (entry.metadata.context) {
      const ctx = entry.metadata.context;
      if (ctx.operation) {
        parts.push(chalk.cyan(`[${ctx.operation}]`));
      }
      if (ctx.id) {
        parts.push(chalk.gray(`(${ctx.id.substring(0, 8)})`));
      }
    }
    
    // Tags
    if (entry.metadata.tags && entry.metadata.tags.length > 0) {
      const tags = entry.metadata.tags.map(tag => chalk.magenta(`#${tag}`)).join(' ');
      parts.push(tags);
    }
    
    // Message
    parts.push(this.formatMessage(entry.message, entry.level));
    
    // Error details
    if (entry.metadata.error) {
      const error = entry.metadata.error;
      parts.push('\n' + chalk.red(`  ${error.name}: ${error.message}`));
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(1, 4);
        stackLines.forEach(line => {
          parts.push('\n' + chalk.gray(`  ${line.trim()}`));
        });
      }
    }
    
    // Additional metadata
    const additionalMeta = this.getAdditionalMetadata(entry.metadata);
    if (Object.keys(additionalMeta).length > 0) {
      parts.push('\n' + chalk.gray(`  ${JSON.stringify(additionalMeta, null, 2)}`));
    }
    
    return parts.join(' ');
  }
  
  private formatMessage(message: string, level: LogLevel): string {
    const color = this.levelColors[level];
    
    // Highlight important patterns
    message = message.replace(/`([^`]+)`/g, (_, code) => chalk.cyan(code));
    message = message.replace(/"([^"]+)"/g, (_, str) => chalk.green(`"${str}"`));
    message = message.replace(/\b(\d+(?:\.\d+)?)\b/g, (_, num) => chalk.yellow(num));
    
    return color(message);
  }
  
  private getAdditionalMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const { timestamp, level, context, error, tags, ...additional } = metadata;
    return additional;
  }
}

/**
 * Structured formatter for machine-readable output
 */
export class StructuredFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const output: Record<string, unknown> = {
      '@timestamp': entry.metadata.timestamp.toISOString(),
      '@level': LogLevel[entry.level],
      '@message': entry.message,
    };
    
    if (entry.metadata.context) {
      output['@context'] = {
        id: entry.metadata.context.id,
        operation: entry.metadata.context.operation,
        parent_id: entry.metadata.context.parentId,
      };
    }
    
    if (entry.metadata.tags) {
      output['@tags'] = entry.metadata.tags;
    }
    
    if (entry.metadata.error) {
      output['@error'] = {
        type: entry.metadata.error.name,
        message: entry.metadata.error.message,
        stack_trace: entry.metadata.error.stack?.split('\n'),
      };
    }
    
    // Add any additional metadata
    const { timestamp, level, context, error, tags, ...additional } = entry.metadata;
    Object.assign(output, additional);
    
    return JSON.stringify(output);
  }
}

/**
 * Compact formatter for single-line output
 */
export class CompactFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const level = LogLevel[entry.level].substring(0, 1);
    const time = entry.metadata.timestamp.toLocaleTimeString();
    const context = entry.metadata.context?.operation || '';
    const contextPart = context ? ` [${context}]` : '';
    
    let message = entry.message;
    if (entry.metadata.error) {
      message += ` - ${entry.metadata.error.message}`;
    }
    
    return `${time} ${level}${contextPart}: ${message}`;
  }
}

/**
 * Development formatter with full details
 */
export class DevelopmentFormatter implements LogFormatter {
  private prettyFormatter: PrettyConsoleFormatter;
  
  constructor(enableColors: boolean = true) {
    this.prettyFormatter = new PrettyConsoleFormatter(enableColors);
  }
  
  format(entry: LogEntry): string {
    const base = this.prettyFormatter.format(entry);
    const parts = [base];
    
    // Add performance metrics if available
    if (entry.metadata.duration !== undefined) {
      parts.push(chalk.gray(`  Duration: ${entry.metadata.duration}ms`));
    }
    
    // Add memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
      parts.push(chalk.gray(`  Memory: ${heapUsed}MB`));
    }
    
    // Add source location if available
    if (entry.metadata.source) {
      parts.push(chalk.gray(`  Source: ${entry.metadata.source}`));
    }
    
    return parts.join('\n');
  }
}

/**
 * Factory for creating formatters
 */
export class FormatterFactory {
  private static formatters = new Map<string, new (options?: any) => LogFormatter>([
    ['plain', PlainTextFormatter],
    ['json', JSONFormatter],
    ['pretty', PrettyConsoleFormatter],
    ['structured', StructuredFormatter],
    ['compact', CompactFormatter],
    ['development', DevelopmentFormatter],
  ]);
  
  static create(type: string, options?: any): LogFormatter {
    const FormatterClass = this.formatters.get(type);
    if (!FormatterClass) {
      throw new Error(`Unknown formatter type: ${type}`);
    }
    return new FormatterClass(options);
  }
  
  static register(name: string, formatter: new (options?: any) => LogFormatter): void {
    this.formatters.set(name, formatter);
  }
}