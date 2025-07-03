/**
 * ValidationError Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ValidationError } from '../ValidationError.js';
import { ErrorCode } from '../../types/errors.js';
import chalk from 'chalk';

// Mock chalk for consistent testing
vi.mock('chalk', () => ({
  default: {
    red: (text: string) => `[RED]${text}[/RED]`,
    yellow: (text: string) => `[YELLOW]${text}[/YELLOW]`,
    gray: (text: string) => `[GRAY]${text}[/GRAY]`,
    cyan: (text: string) => `[CYAN]${text}[/CYAN]`
  }
}));

describe('ValidationError', () => {
  it('should create validation error with details', () => {
    const error = new ValidationError('Invalid input', {
      field: 'email',
      value: 'not-an-email',
      expectedType: 'email'
    });
    
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe(ErrorCode.INVALID_ARGUMENT);
    expect(error.details).toEqual({
      field: 'email',
      value: 'not-an-email',
      expectedType: 'email'
    });
  });

  it('should use VALIDATION_ERROR code when no field specified', () => {
    const error = new ValidationError('General validation error');
    
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('should format user message with field details', () => {
    const error = new ValidationError('Invalid email format', {
      field: 'email',
      value: 'test',
      expectedType: 'email address'
    });
    
    const message = error.toUserMessage();
    
    expect(message).toContain('[RED]✖ Validation Error:[/RED]');
    expect(message).toContain('Invalid email format');
    expect(message).toContain('[GRAY]  Field: email[/GRAY]');
    expect(message).toContain('[GRAY]  Received: "test"[/GRAY]');
    expect(message).toContain('[GRAY]  Expected: email address[/GRAY]');
  });

  it('should format user message with validation errors list', () => {
    const error = new ValidationError('Multiple validation errors', {
      validationErrors: [
        { field: 'name', message: 'Required field' },
        { field: 'age', message: 'Must be a positive number' }
      ]
    });
    
    const message = error.toUserMessage();
    
    expect(message).toContain('[YELLOW]\n  Validation errors:[/YELLOW]');
    expect(message).toContain('[GRAY]    • name: Required field[/GRAY]');
    expect(message).toContain('[GRAY]    • age: Must be a positive number[/GRAY]');
  });

  it('should provide suggestions based on constraints', () => {
    const error = new ValidationError('Invalid value', {
      field: 'username',
      constraints: {
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9]+$'
      }
    });
    
    const suggestions = error.getSuggestedActions();
    
    expect(suggestions).toContain('Value must be at least 3 characters long');
    expect(suggestions).toContain('Value must be at most 20 characters long');
    expect(suggestions).toContain('Value must match pattern: ^[a-zA-Z0-9]+$');
  });

  it('should provide enum suggestions', () => {
    const error = new ValidationError('Invalid option', {
      field: 'theme',
      constraints: {
        enum: ['light', 'dark', 'auto']
      }
    });
    
    const suggestions = error.getSuggestedActions();
    
    expect(suggestions).toContain('Value must be one of: light, dark, auto');
  });

  it('should suggest help command when context has command', () => {
    const error = new ValidationError('Invalid option', {}, {
      context: { command: 'import' }
    });
    
    const suggestions = error.getSuggestedActions();
    
    expect(suggestions).toContain("Run 'willow import --help' for usage information");
  });

  it('should create from Zod error', () => {
    const zodError = {
      errors: [
        { path: ['config', 'theme'], message: 'Invalid enum value' },
        { path: ['name'], message: 'Required' }
      ]
    };
    
    const error = ValidationError.fromZodError(zodError, { command: 'init' });
    
    expect(error.message).toBe('Invalid config.theme: Invalid enum value');
    expect(error.details.validationErrors).toEqual([
      { field: 'config.theme', message: 'Invalid enum value' },
      { field: 'name', message: 'Required' }
    ]);
    expect(error.cause).toBe(zodError);
    expect(error.context).toEqual({ command: 'init' });
  });

  it('should handle empty Zod errors', () => {
    const zodError = { errors: [] };
    
    const error = ValidationError.fromZodError(zodError);
    
    expect(error.message).toBe('Validation failed');
    expect(error.details.validationErrors).toEqual([]);
  });

  it('should format complete user message with suggestions', () => {
    const error = new ValidationError('Invalid configuration', {
      field: 'port',
      value: 'abc',
      expectedType: 'number',
      constraints: {
        minValue: 1,
        maxValue: 65535
      }
    }, {
      context: { command: 'serve' }
    });
    
    const message = error.toUserMessage();
    
    expect(message).toContain('[RED]✖ Validation Error:[/RED]');
    expect(message).toContain('[CYAN]\n  Suggestions:[/CYAN]');
    expect(message).toContain('[CYAN]    → Provide a value of type: number[/CYAN]');
    expect(message).toContain("[CYAN]    → Run 'willow serve --help' for usage information[/CYAN]");
  });
});