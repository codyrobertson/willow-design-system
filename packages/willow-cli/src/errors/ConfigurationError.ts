/**
 * Configuration Error
 * For configuration file issues, parsing errors, and invalid settings
 */

import { BaseError } from './BaseError.js';
import { ErrorCode, ErrorContext } from '../types/errors.js';
import chalk from 'chalk';

export interface ConfigurationErrorDetails {
  configFile?: string;
  field?: string;
  value?: any;
  parseError?: string;
  availableOptions?: string[];
}

export class ConfigurationError extends BaseError {
  public readonly details: ConfigurationErrorDetails;

  constructor(
    message: string,
    code: ErrorCode,
    details: ConfigurationErrorDetails = {},
    options?: {
      cause?: Error;
      context?: ErrorContext;
    }
  ) {
    super(message, code, {
      ...options,
      context: {
        ...options?.context,
        path: details.configFile
      },
      metadata: details
    });

    this.details = details;
  }

  toUserMessage(): string {
    const parts: string[] = [
      chalk.red('✖ Configuration Error:'),
      this.message
    ];

    if (this.details.configFile) {
      parts.push(chalk.gray(`  Config file: ${this.details.configFile}`));
    }

    if (this.details.field) {
      parts.push(chalk.gray(`  Field: ${this.details.field}`));
      if (this.details.value !== undefined) {
        parts.push(chalk.gray(`  Value: ${JSON.stringify(this.details.value)}`));
      }
    }

    if (this.details.parseError) {
      parts.push(chalk.yellow(`\n  Parse error: ${this.details.parseError}`));
    }

    if (this.details.availableOptions?.length) {
      parts.push(chalk.yellow('\n  Available options:'));
      this.details.availableOptions.forEach(option => {
        parts.push(chalk.gray(`    • ${option}`));
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

    switch (this.code) {
      case ErrorCode.MISSING_CONFIG:
        suggestions.push('Run \'willow init\' to create a configuration file');
        suggestions.push('Create a willow.config.json file manually');
        break;

      case ErrorCode.INVALID_CONFIG:
        suggestions.push('Check the configuration file syntax');
        suggestions.push('Validate against the configuration schema');
        if (this.details.configFile?.endsWith('.json')) {
          suggestions.push('Use a JSON validator to check for syntax errors');
        }
        break;

      case ErrorCode.CONFIG_PARSE_ERROR:
        if (this.details.parseError?.includes('JSON')) {
          suggestions.push('Check for missing commas, brackets, or quotes');
          suggestions.push('Remove trailing commas from arrays and objects');
        }
        if (this.details.parseError?.includes('YAML')) {
          suggestions.push('Check indentation (use spaces, not tabs)');
          suggestions.push('Ensure proper YAML syntax');
        }
        break;
    }

    if (this.details.field && this.details.availableOptions?.length) {
      suggestions.push(`Set '${this.details.field}' to one of the available options`);
    }

    suggestions.push('Refer to the documentation for configuration examples');

    return suggestions;
  }

  static missingConfig(configFile: string): ConfigurationError {
    return new ConfigurationError(
      `Configuration file '${configFile}' not found`,
      ErrorCode.MISSING_CONFIG,
      { configFile }
    );
  }

  static invalidField(
    field: string,
    value: any,
    availableOptions?: string[]
  ): ConfigurationError {
    const message = availableOptions
      ? `Invalid value for '${field}': ${JSON.stringify(value)}`
      : `Invalid configuration field '${field}'`;

    return new ConfigurationError(
      message,
      ErrorCode.INVALID_CONFIG,
      { field, value, availableOptions }
    );
  }

  static parseError(configFile: string, error: Error): ConfigurationError {
    return new ConfigurationError(
      `Failed to parse configuration file '${configFile}'`,
      ErrorCode.CONFIG_PARSE_ERROR,
      { 
        configFile,
        parseError: error.message 
      },
      { cause: error }
    );
  }
}