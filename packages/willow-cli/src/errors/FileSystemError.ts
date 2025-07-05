/**
 * File System Error
 * For file operations, directory access, and I/O failures
 */

import { BaseError } from './BaseError.js';
import { ErrorCode, ErrorContext } from '../types/errors.js';
import chalk from 'chalk';
import path from 'path';

export interface FileSystemErrorDetails {
  path?: string;
  operation?: 'read' | 'write' | 'delete' | 'create' | 'copy' | 'move';
  systemCode?: string;
  permissions?: string;
}

export class FileSystemError extends BaseError {
  public readonly details: FileSystemErrorDetails;

  constructor(
    message: string,
    details: FileSystemErrorDetails = {},
    options?: {
      cause?: Error;
      context?: ErrorContext;
    }
  ) {
    const code = FileSystemError.getErrorCode(details, options?.cause);

    super(message, code, {
      ...options,
      context: {
        ...options?.context,
        path: details.path,
        operation: details.operation
      },
      metadata: details
    });

    this.details = details;
  }

  private static getErrorCode(details: FileSystemErrorDetails, cause?: Error): ErrorCode {
    const systemCode = details.systemCode || (cause as any)?.code;
    
    switch (systemCode) {
      case 'ENOENT':
        return ErrorCode.FILE_NOT_FOUND;
      case 'EACCES':
      case 'EPERM':
        return ErrorCode.FILE_ACCESS_DENIED;
      case 'EEXIST':
        return ErrorCode.FILE_ALREADY_EXISTS;
      case 'ENOTEMPTY':
        return ErrorCode.DIRECTORY_NOT_EMPTY;
      case 'ENOSPC':
        return ErrorCode.DISK_FULL;
      default:
        return ErrorCode.SYSTEM_ERROR;
    }
  }

  toUserMessage(): string {
    const parts: string[] = [
      chalk.red('✖ File System Error:'),
      this.message
    ];

    if (this.details.path) {
      const displayPath = this.formatPath(this.details.path);
      parts.push(chalk.gray(`  Path: ${displayPath}`));
    }

    if (this.details.operation) {
      parts.push(chalk.gray(`  Operation: ${this.details.operation}`));
    }

    if (this.details.systemCode) {
      parts.push(chalk.gray(`  Error code: ${this.details.systemCode}`));
    }

    const suggestions = this.getSuggestedActions();
    if (suggestions.length > 0) {
      parts.push(chalk.cyan('\n  Suggestions:'));
      suggestions.forEach(suggestion => {
        parts.push(chalk.cyan(`    → ${suggestion}`));
      });
    }

    return parts.join('\n');
  }

  private formatPath(filePath: string): string {
    // Show relative path if it's in the current working directory
    const cwd = process.cwd();
    if (filePath.startsWith(cwd)) {
      return path.relative(cwd, filePath) || '.';
    }
    
    // Shorten home directory
    const home = process.env.HOME || process.env.USERPROFILE;
    if (home && filePath.startsWith(home)) {
      return filePath.replace(home, '~');
    }
    
    return filePath;
  }

  getSuggestedActions(): string[] {
    const suggestions: string[] = [];

    switch (this.code) {
      case ErrorCode.FILE_NOT_FOUND:
        suggestions.push('Check that the file or directory exists');
        suggestions.push('Verify the path is correct');
        if (this.details.path?.includes('node_modules')) {
          suggestions.push('Try running \'npm install\' first');
        }
        break;

      case ErrorCode.FILE_ACCESS_DENIED:
        suggestions.push('Check file permissions');
        if (process.platform !== 'win32') {
          suggestions.push(`Try running with sudo: 'sudo ${process.argv.join(' ')}'`);
        }
        if (this.details.path?.includes('node_modules')) {
          suggestions.push('Try deleting node_modules and reinstalling');
        }
        break;

      case ErrorCode.FILE_ALREADY_EXISTS:
        suggestions.push('Use --overwrite flag to replace existing files');
        suggestions.push('Choose a different name or location');
        break;

      case ErrorCode.DIRECTORY_NOT_EMPTY:
        suggestions.push('The directory must be empty');
        suggestions.push('Use --force flag to override (use with caution)');
        break;

      case ErrorCode.DISK_FULL:
        suggestions.push('Free up disk space');
        suggestions.push('Try a different location with more space');
        break;
    }

    return suggestions;
  }

  static fromNodeError(error: NodeJS.ErrnoException, filePath?: string): FileSystemError {
    const operation = FileSystemError.inferOperation(error);
    
    return new FileSystemError(
      error.message || 'File system operation failed',
      {
        path: filePath || error.path,
        operation,
        systemCode: error.code
      },
      { cause: error }
    );
  }

  private static inferOperation(error: NodeJS.ErrnoException): FileSystemErrorDetails['operation'] | undefined {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('read') || error.syscall === 'read') return 'read';
    if (message.includes('write') || error.syscall === 'write') return 'write';
    if (message.includes('unlink') || message.includes('delete')) return 'delete';
    if (message.includes('mkdir') || message.includes('create')) return 'create';
    if (message.includes('copy') || message.includes('cp')) return 'copy';
    if (message.includes('rename') || message.includes('move')) return 'move';
    
    return undefined;
  }
}