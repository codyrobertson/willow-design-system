/**
 * ArgumentParser Test Suite
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ArgumentParser } from '../ArgumentParser.js';
import { CLIError, CLIErrorCode } from '../../types/cli.js';

describe('ArgumentParser', () => {
  let parser: ArgumentParser;

  beforeEach(() => {
    parser = new ArgumentParser();
  });

  describe('parse', () => {
    it('should parse valid arguments', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
      });

      const result = parser.parse(
        { name: 'John', age: 25, active: true },
        schema
      );

      expect(result).toEqual({
        name: 'John',
        age: 25,
        active: true,
      });
    });

    it('should throw CLIError for invalid arguments', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      expect(() => 
        parser.parse({ name: 'John', age: 'invalid' }, schema)
      ).toThrow(CLIError);
    });

    it('should include context in error message', () => {
      const schema = z.object({
        name: z.string(),
      });

      try {
        parser.parse({ name: 123 }, schema, 'user data');
      } catch (error) {
        expect(error).toBeInstanceOf(CLIError);
        expect(error.message).toContain('Invalid user data');
      }
    });
  });

  describe('safeParse', () => {
    it('should return success result for valid data', () => {
      const schema = z.object({ name: z.string() });
      const result = parser.safeParse({ name: 'John' }, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John' });
      }
    });

    it('should return error result for invalid data', () => {
      const schema = z.object({ name: z.string() });
      const result = parser.safeParse({ name: 123 }, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(CLIError);
      }
    });
  });

  describe('validateComponentNames', () => {
    const availableComponents = ['button', 'input', 'select', 'checkbox'];

    it('should validate correct component names', () => {
      const result = parser.validateComponentNames(
        ['button', 'input'],
        availableComponents
      );

      expect(result.valid).toEqual(['button', 'input']);
      expect(result.invalid).toEqual([]);
      expect(result.suggestions.size).toBe(0);
    });

    it('should identify invalid component names', () => {
      const result = parser.validateComponentNames(
        ['button', 'invalid', 'select'],
        availableComponents
      );

      expect(result.valid).toEqual(['button', 'select']);
      expect(result.invalid).toEqual(['invalid']);
    });

    it('should provide suggestions for typos', () => {
      const result = parser.validateComponentNames(
        ['buton', 'inpt'],
        availableComponents
      );

      expect(result.invalid).toEqual(['buton', 'inpt']);
      expect(result.suggestions.get('buton')).toBe('button');
      expect(result.suggestions.get('inpt')).toBe('input');
    });

    it('should handle empty suggestions when disabled', () => {
      const parserNoSuggestions = new ArgumentParser({ suggestions: false });
      const result = parserNoSuggestions.validateComponentNames(
        ['buton'],
        availableComponents
      );

      expect(result.suggestions.size).toBe(0);
    });
  });

  describe('parseKeyValuePairs', () => {
    it('should parse valid key-value pairs', () => {
      const result = parser.parseKeyValuePairs([
        'name=John',
        'age=25',
        'active=true',
      ]);

      expect(result).toEqual({
        name: 'John',
        age: '25',
        active: 'true',
      });
    });

    it('should handle empty values', () => {
      const result = parser.parseKeyValuePairs(['key=']);
      expect(result).toEqual({ key: '' });
    });

    it('should handle values with equals signs', () => {
      const result = parser.parseKeyValuePairs(['url=https://example.com?foo=bar']);
      expect(result).toEqual({ url: 'https://example.com?foo=bar' });
    });

    it('should throw error for invalid format in strict mode', () => {
      expect(() =>
        parser.parseKeyValuePairs(['invalid'])
      ).toThrow(CLIError);
    });

    it('should skip invalid format in non-strict mode', () => {
      const nonStrictParser = new ArgumentParser({ strict: false });
      const result = nonStrictParser.parseKeyValuePairs(['invalid', 'key=value']);
      expect(result).toEqual({ key: 'value' });
    });
  });

  describe('parseFilePaths', () => {
    it('should parse valid file paths', () => {
      const result = parser.parseFilePaths(['file1.ts', 'file2.js']);
      expect(result).toEqual(['file1.ts', 'file2.js']);
    });

    it('should reject glob patterns when not allowed', () => {
      expect(() =>
        parser.parseFilePaths(['*.ts'])
      ).toThrow('Glob patterns not allowed');
    });

    it('should allow glob patterns when enabled', () => {
      const result = parser.parseFilePaths(['*.ts'], { allowGlobs: true });
      expect(result).toEqual(['*.ts']);
    });

    it('should validate file extensions', () => {
      expect(() =>
        parser.parseFilePaths(['file.txt'], { extensions: ['.ts', '.js'] })
      ).toThrow('Invalid file extension');

      const result = parser.parseFilePaths(
        ['file.ts', 'file.js'],
        { extensions: ['.ts', '.js'] }
      );
      expect(result).toEqual(['file.ts', 'file.js']);
    });
  });

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parser.parseNumber('42')).toBe(42);
      expect(parser.parseNumber('3.14')).toBe(3.14);
      expect(parser.parseNumber('-10')).toBe(-10);
    });

    it('should parse integers when required', () => {
      expect(parser.parseNumber('42', { integer: true })).toBe(42);
      expect(parser.parseNumber('3.14', { integer: true })).toBe(3);
    });

    it('should throw for invalid numbers', () => {
      expect(() => parser.parseNumber('invalid')).toThrow('Invalid number');
    });

    it('should validate minimum value', () => {
      expect(() =>
        parser.parseNumber('5', { min: 10 })
      ).toThrow('less than minimum');
    });

    it('should validate maximum value', () => {
      expect(() =>
        parser.parseNumber('15', { max: 10 })
      ).toThrow('greater than maximum');
    });

    it('should validate range', () => {
      const result = parser.parseNumber('5', { min: 0, max: 10 });
      expect(result).toBe(5);
    });
  });

  describe('parseEnum', () => {
    const validColors = ['red', 'green', 'blue'] as const;

    it('should parse valid enum values', () => {
      expect(parser.parseEnum('red', validColors)).toBe('red');
      expect(parser.parseEnum('blue', validColors)).toBe('blue');
    });

    it('should throw for invalid enum values', () => {
      expect(() =>
        parser.parseEnum('yellow', validColors)
      ).toThrow('Valid values: red, green, blue');
    });

    it('should include context in error message', () => {
      try {
        parser.parseEnum('yellow', validColors, 'color');
      } catch (error) {
        expect(error.message).toContain('Invalid color: yellow');
      }
    });

    it('should provide suggestions for typos', () => {
      try {
        parser.parseEnum('grean', validColors);
      } catch (error: any) {
        expect(error.suggestion).toBe('Did you mean "green"?');
      }
    });
  });

  describe('formatZodError', () => {
    it('should format type errors', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      try {
        parser.parse({ name: 123, age: 'invalid' }, schema);
      } catch (error) {
        expect(error).toBeInstanceOf(CLIError);
        expect(error.message).toContain('Expected string, received number');
      }
    });

    it('should format enum errors', () => {
      const schema = z.object({
        color: z.enum(['red', 'green', 'blue']),
      });

      try {
        parser.parse({ color: 'yellow' }, schema);
      } catch (error) {
        expect(error.message).toContain('Expected: red, green, blue');
      }
    });

    it('should format range errors', () => {
      const schema = z.object({
        age: z.number().min(18).max(100),
      });

      try {
        parser.parse({ age: 10 }, schema);
      } catch (error) {
        expect(error.message).toContain('minimum: 18');
      }
    });
  });
});