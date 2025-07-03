/**
 * Output Formatter
 * Handles different output formats for generated code
 */

import * as ts from 'typescript';
import { OutputFormat } from './types';

export class OutputFormatter {
  /**
   * Format code based on output format
   */
  static format(code: string, format: OutputFormat): string {
    switch (format) {
      case OutputFormat.TypeScript:
        return this.formatTypeScript(code);
      
      case OutputFormat.JavaScript:
        return this.formatJavaScript(code);
      
      case OutputFormat.JSX:
        return this.formatJSX(code);
      
      case OutputFormat.TSX:
        return this.formatTSX(code);
      
      case OutputFormat.ESModule:
        return this.formatESModule(code);
      
      case OutputFormat.CommonJS:
        return this.formatCommonJS(code);
      
      default:
        return code;
    }
  }

  /**
   * Format TypeScript code
   */
  private static formatTypeScript(code: string): string {
    // TypeScript specific formatting
    return code;
  }

  /**
   * Format JavaScript code
   */
  private static formatJavaScript(code: string): string {
    // Remove TypeScript-specific syntax that might have been missed
    let formatted = code;
    
    // Remove type annotations
    formatted = formatted.replace(/:\s*[A-Za-z<>[\]|&{}]+(?=\s*[=,;)\]}])/g, '');
    
    // Remove interface declarations
    formatted = formatted.replace(/interface\s+\w+\s*{[^}]*}/g, '');
    
    // Remove type aliases
    formatted = formatted.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
    
    return formatted;
  }

  /**
   * Format JSX code
   */
  private static formatJSX(code: string): string {
    let formatted = this.formatJavaScript(code);
    
    // Ensure JSX pragma if not present
    if (!formatted.includes('@jsx') && formatted.includes('<')) {
      formatted = `/** @jsx React.createElement */\n${formatted}`;
    }
    
    return formatted;
  }

  /**
   * Format TSX code
   */
  private static formatTSX(code: string): string {
    // TSX is already properly formatted by TypeScript printer
    return code;
  }

  /**
   * Format ES Module code
   */
  private static formatESModule(code: string): string {
    let formatted = this.formatJavaScript(code);
    
    // Add .js extension to relative imports
    formatted = formatted.replace(
      /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js)['"]/g,
      "from '$1.js'"
    );
    
    // Ensure export syntax is ES6
    formatted = formatted.replace(/module\.exports\s*=\s*/, 'export default ');
    formatted = formatted.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');
    
    return formatted;
  }

  /**
   * Format CommonJS code
   */
  private static formatCommonJS(code: string): string {
    let formatted = this.formatJavaScript(code);
    
    // Convert ES6 imports to require
    formatted = formatted.replace(
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      "const $1 = require('$2')"
    );
    
    formatted = formatted.replace(
      /import\s*\*\s*as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      "const $1 = require('$2')"
    );
    
    formatted = formatted.replace(
      /import\s*{([^}]+)}\s*from\s+['"]([^'"]+)['"]/g,
      "const {$1} = require('$2')"
    );
    
    // Convert ES6 exports to module.exports
    formatted = formatted.replace(/export\s+default\s+/, 'module.exports = ');
    
    formatted = formatted.replace(
      /export\s+(const|let|var)\s+(\w+)\s*=/g,
      '$1 $2 = exports.$2 ='
    );
    
    formatted = formatted.replace(
      /export\s+{([^}]+)}/g,
      (match, exports) => {
        const items = exports.split(',').map((e: string) => e.trim());
        return items.map((item: string) => {
          const [local, exported = local] = item.split(/\s+as\s+/);
          return `exports.${exported} = ${local};`;
        }).join('\n');
      }
    );
    
    return formatted;
  }

  /**
   * Get file extension for format
   */
  static getExtension(format: OutputFormat): string {
    const extensionMap: Record<OutputFormat, string> = {
      [OutputFormat.TypeScript]: '.ts',
      [OutputFormat.JavaScript]: '.js',
      [OutputFormat.JSX]: '.jsx',
      [OutputFormat.TSX]: '.tsx',
      [OutputFormat.ESModule]: '.mjs',
      [OutputFormat.CommonJS]: '.cjs',
    };
    
    return extensionMap[format] || '.js';
  }

  /**
   * Detect format from file extension
   */
  static detectFormat(fileName: string): OutputFormat {
    const ext = fileName.toLowerCase();
    
    if (ext.endsWith('.ts')) return OutputFormat.TypeScript;
    if (ext.endsWith('.tsx')) return OutputFormat.TSX;
    if (ext.endsWith('.jsx')) return OutputFormat.JSX;
    if (ext.endsWith('.mjs')) return OutputFormat.ESModule;
    if (ext.endsWith('.cjs')) return OutputFormat.CommonJS;
    
    return OutputFormat.JavaScript;
  }
}