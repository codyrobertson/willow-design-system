/**
 * Argument Parsing and Validation System
 */

import { z } from 'zod';
import didyoumean from 'didyoumean';
import { CLIError, CLIErrorCode } from '../types/cli.js';

export interface ArgumentParserOptions {
  strict?: boolean;
  suggestions?: boolean;
}

export class ArgumentParser {
  private options: ArgumentParserOptions;

  constructor(options: ArgumentParserOptions = {}) {
    this.options = {
      strict: options.strict !== false,
      suggestions: options.suggestions !== false,
    };
  }

  /**
   * Parse and validate arguments against a schema
   */
  parse<T>(
    args: unknown,
    schema: z.ZodSchema<T>,
    context?: string
  ): T {
    try {
      return schema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.formatZodError(error, context);
      }
      throw error;
    }
  }

  /**
   * Parse with optional validation
   */
  safeParse<T>(
    args: unknown,
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; error: CLIError } {
    try {
      const data = schema.parse(args);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          error: this.formatZodError(error) 
        };
      }
      return {
        success: false,
        error: new CLIError(
          CLIErrorCode.INVALID_ARGUMENTS,
          'Argument validation failed',
          error
        ),
      };
    }
  }

  /**
   * Validate component names
   */
  validateComponentNames(
    names: string[],
    availableComponents: string[]
  ): { valid: string[]; invalid: string[]; suggestions: Map<string, string> } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const suggestions = new Map<string, string>();

    for (const name of names) {
      if (availableComponents.includes(name)) {
        valid.push(name);
      } else {
        invalid.push(name);
        
        if (this.options.suggestions) {
          const suggestion = didyoumean(name, availableComponents);
          if (suggestion) {
            suggestions.set(name, suggestion);
          }
        }
      }
    }

    return { valid, invalid, suggestions };
  }

  /**
   * Parse key-value pairs from arguments
   */
  parseKeyValuePairs(args: string[]): Record<string, string> {
    const pairs: Record<string, string> = {};
    
    for (const arg of args) {
      const match = arg.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        pairs[key] = value;
      } else if (this.options.strict) {
        throw new CLIError(
          CLIErrorCode.INVALID_ARGUMENTS,
          `Invalid key-value format: ${arg}. Expected format: key=value`
        );
      }
    }
    
    return pairs;
  }

  /**
   * Parse file paths and validate them
   */
  parseFilePaths(
    paths: string[],
    options: {
      mustExist?: boolean;
      allowGlobs?: boolean;
      extensions?: string[];
    } = {}
  ): string[] {
    const validPaths: string[] = [];
    
    for (const path of paths) {
      // Check for glob patterns
      if (!options.allowGlobs && (path.includes('*') || path.includes('?'))) {
        throw new CLIError(
          CLIErrorCode.INVALID_ARGUMENTS,
          `Glob patterns not allowed: ${path}`
        );
      }
      
      // Check extensions
      if (options.extensions) {
        const hasValidExtension = options.extensions.some(ext => 
          path.endsWith(ext)
        );
        
        if (!hasValidExtension) {
          throw new CLIError(
            CLIErrorCode.INVALID_ARGUMENTS,
            `Invalid file extension: ${path}. Expected: ${options.extensions.join(', ')}`
          );
        }
      }
      
      validPaths.push(path);
    }
    
    return validPaths;
  }

  /**
   * Parse numeric arguments with bounds checking
   */
  parseNumber(
    value: string,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
    } = {}
  ): number {
    const num = options.integer ? parseInt(value, 10) : parseFloat(value);
    
    if (isNaN(num)) {
      throw new CLIError(
        CLIErrorCode.INVALID_ARGUMENTS,
        `Invalid number: ${value}`
      );
    }
    
    if (options.min !== undefined && num < options.min) {
      throw new CLIError(
        CLIErrorCode.INVALID_ARGUMENTS,
        `Value ${num} is less than minimum ${options.min}`
      );
    }
    
    if (options.max !== undefined && num > options.max) {
      throw new CLIError(
        CLIErrorCode.INVALID_ARGUMENTS,
        `Value ${num} is greater than maximum ${options.max}`
      );
    }
    
    return num;
  }

  /**
   * Parse enum values with validation
   */
  parseEnum<T extends string>(
    value: string,
    validValues: readonly T[],
    context?: string
  ): T {
    if (validValues.includes(value as T)) {
      return value as T;
    }
    
    const message = context
      ? `Invalid ${context}: ${value}`
      : `Invalid value: ${value}`;
    
    const error = new CLIError(
      CLIErrorCode.INVALID_ARGUMENTS,
      `${message}. Valid values: ${validValues.join(', ')}`
    );
    
    // Add suggestion if available
    if (this.options.suggestions) {
      const suggestion = didyoumean(value, validValues as string[]);
      if (suggestion) {
        (error as any).suggestion = `Did you mean "${suggestion}"?`;
      }
    }
    
    throw error;
  }

  /**
   * Format Zod errors into user-friendly messages
   */
  private formatZodError(error: z.ZodError, context?: string): CLIError {
    const messages = error.errors.map(err => {
      const path = err.path.join('.');
      const prefix = path ? `${path}: ` : '';
      
      switch (err.code) {
        case 'invalid_type':
          return `${prefix}Expected ${err.expected}, received ${err.received}`;
        case 'invalid_enum_value':
          return `${prefix}Invalid value. Expected: ${err.options.join(', ')}`;
        case 'too_small':
          return `${prefix}Value too small (minimum: ${err.minimum})`;
        case 'too_big':
          return `${prefix}Value too large (maximum: ${err.maximum})`;
        default:
          return `${prefix}${err.message}`;
      }
    });
    
    const mainMessage = context
      ? `Invalid ${context}: ${messages[0]}`
      : messages[0];
    
    return new CLIError(
      CLIErrorCode.INVALID_ARGUMENTS,
      mainMessage,
      messages.length > 1 ? messages : undefined
    );
  }
}

// Global instance
export const argumentParser = new ArgumentParser();