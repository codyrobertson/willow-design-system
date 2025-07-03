/**
 * Validation Error
 * For input validation and schema validation failures
 */

import { BaseError } from './BaseError.js';
import { ErrorCode, ErrorContext } from '../types/errors.js';
import chalk from 'chalk';

export interface ValidationErrorDetails {
  field?: string;
  value?: any;
  expectedType?: string;
  constraints?: Record<string, any>;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

export class ValidationError extends BaseError {
  public readonly details: ValidationErrorDetails;

  constructor(
    message: string,
    details: ValidationErrorDetails = {},
    options?: {
      cause?: Error;
      context?: ErrorContext;
    }
  ) {
    const code = details.field 
      ? ErrorCode.INVALID_ARGUMENT 
      : ErrorCode.VALIDATION_ERROR;

    super(message, code, {
      ...options,
      metadata: { details }
    });

    this.details = details;
  }

  toUserMessage(): string {
    const parts: string[] = [
      chalk.red('✖ Validation Error:'),
      this.message
    ];

    if (this.details.field) {
      parts.push(chalk.gray(`  Field: ${this.details.field}`));
    }

    if (this.details.value !== undefined) {
      parts.push(chalk.gray(`  Received: ${JSON.stringify(this.details.value)}`));
    }

    if (this.details.expectedType) {
      parts.push(chalk.gray(`  Expected: ${this.details.expectedType}`));
    }

    if (this.details.validationErrors?.length) {
      parts.push(chalk.yellow('\n  Validation errors:'));
      this.details.validationErrors.forEach(err => {
        parts.push(chalk.gray(`    • ${err.field}: ${err.message}`));
      });
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

  getSuggestedActions(): string[] {
    const suggestions: string[] = [];

    if (this.details.expectedType) {
      suggestions.push(`Provide a value of type: ${this.details.expectedType}`);
    }

    if (this.details.constraints) {
      Object.entries(this.details.constraints).forEach(([key, value]) => {
        switch (key) {
          case 'minLength':
            suggestions.push(`Value must be at least ${value} characters long`);
            break;
          case 'maxLength':
            suggestions.push(`Value must be at most ${value} characters long`);
            break;
          case 'pattern':
            suggestions.push(`Value must match pattern: ${value}`);
            break;
          case 'enum':
            suggestions.push(`Value must be one of: ${value.join(', ')}`);
            break;
        }
      });
    }

    if (this.context?.command) {
      suggestions.push(`Run 'willow ${this.context.command} --help' for usage information`);
    }

    return suggestions;
  }

  static fromZodError(zodError: any, context?: ErrorContext): ValidationError {
    const validationErrors = zodError.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message
    }));

    const firstError = zodError.errors[0];
    const message = firstError 
      ? `Invalid ${firstError.path.join('.')}: ${firstError.message}`
      : 'Validation failed';

    return new ValidationError(
      message,
      { validationErrors },
      { cause: zodError, context }
    );
  }
}