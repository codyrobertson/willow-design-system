/**
 * Template Processor
 * Processes templates for code generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TemplateConfig,
  TemplateContent,
  TemplateEngine,
  ITemplateProcessor,
} from './types';

export class TemplateProcessor implements ITemplateProcessor {
  private engines: Map<string, (template: string, data: any) => string> = new Map();
  private helpers: Map<string, (...args: any[]) => any> = new Map();

  constructor() {
    // Register built-in engines
    this.registerBuiltInEngines();
    
    // Register built-in helpers
    this.registerBuiltInHelpers();
  }

  /**
   * Process a template with given configuration
   */
  async process(config: TemplateConfig): Promise<string> {
    // Get template content
    const templateContent = await this.getTemplateContent(config.template);
    
    // Determine which engine to use
    const engine = this.determineEngine(templateContent);
    
    // Prepare template data with helpers
    const data = this.prepareTemplateData(config.variables, templateContent.helpers);
    
    // Process the template
    const processed = this.processWithEngine(templateContent.content, data, engine);
    
    // Post-process the result
    return this.postProcess(processed, config);
  }

  /**
   * Register custom template engine
   */
  registerEngine(
    name: string,
    engine: (template: string, data: any) => string
  ): void {
    this.engines.set(name, engine);
  }

  /**
   * Register template helper function
   */
  registerHelper(
    name: string,
    helper: (...args: any[]) => any
  ): void {
    this.helpers.set(name, helper);
  }

  /**
   * Register built-in template engines
   */
  private registerBuiltInEngines(): void {
    // Simple string replacement engine
    this.engines.set(TemplateEngine.Simple, (template, data) => {
      return this.simpleTemplateEngine(template, data);
    });

    // Handlebars-like engine (simplified)
    this.engines.set(TemplateEngine.Handlebars, (template, data) => {
      return this.handlebarsLikeEngine(template, data);
    });

    // EJS-like engine (simplified)
    this.engines.set(TemplateEngine.EJS, (template, data) => {
      return this.ejsLikeEngine(template, data);
    });
  }

  /**
   * Register built-in helper functions
   */
  private registerBuiltInHelpers(): void {
    // String manipulation helpers
    this.helpers.set('upperCase', (str: string) => str?.toUpperCase());
    this.helpers.set('lowerCase', (str: string) => str?.toLowerCase());
    this.helpers.set('capitalize', (str: string) => 
      str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
    );
    this.helpers.set('camelCase', (str: string) => this.toCamelCase(str));
    this.helpers.set('pascalCase', (str: string) => this.toPascalCase(str));
    this.helpers.set('kebabCase', (str: string) => this.toKebabCase(str));
    this.helpers.set('snakeCase', (str: string) => this.toSnakeCase(str));
    
    // Array helpers
    this.helpers.set('join', (arr: any[], separator: string = ', ') => 
      Array.isArray(arr) ? arr.join(separator) : ''
    );
    this.helpers.set('first', (arr: any[]) => 
      Array.isArray(arr) ? arr[0] : undefined
    );
    this.helpers.set('last', (arr: any[]) => 
      Array.isArray(arr) ? arr[arr.length - 1] : undefined
    );
    
    // Logic helpers
    this.helpers.set('if', (condition: any, ifTrue: any, ifFalse: any) => 
      condition ? ifTrue : ifFalse
    );
    this.helpers.set('unless', (condition: any, ifFalse: any, ifTrue: any) => 
      !condition ? ifFalse : ifTrue
    );
    
    // Date helpers
    this.helpers.set('now', () => new Date());
    this.helpers.set('timestamp', () => Date.now());
    this.helpers.set('year', () => new Date().getFullYear());
    
    // Code generation helpers
    this.helpers.set('indent', (str: string, spaces: number = 2) => {
      const indent = ' '.repeat(spaces);
      return str.split('\n').map(line => line ? indent + line : line).join('\n');
    });
    this.helpers.set('commentBlock', (text: string) => {
      return `/**\n * ${text.split('\n').join('\n * ')}\n */`;
    });
  }

  /**
   * Get template content from string or file
   */
  private async getTemplateContent(
    template: string | TemplateContent
  ): Promise<TemplateContent> {
    if (typeof template === 'string') {
      // Check if it's a file path or template content
      if (template.includes('\n') || !template.endsWith('.template')) {
        // It's template content
        return {
          content: template,
          engine: TemplateEngine.Simple,
        };
      } else {
        // It's a file path
        const content = await fs.readFile(template, 'utf-8');
        const engine = this.detectEngineFromFile(template);
        return { content, engine };
      }
    }
    
    return template;
  }

  /**
   * Detect template engine from file extension
   */
  private detectEngineFromFile(filePath: string): TemplateEngine {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.hbs':
      case '.handlebars':
        return TemplateEngine.Handlebars;
      case '.ejs':
        return TemplateEngine.EJS;
      default:
        return TemplateEngine.Simple;
    }
  }

  /**
   * Determine which engine to use
   */
  private determineEngine(templateContent: TemplateContent): TemplateEngine {
    if (templateContent.engine) {
      return templateContent.engine;
    }
    
    // Auto-detect based on content
    const content = templateContent.content;
    
    if (content.includes('{{') && content.includes('}}')) {
      return TemplateEngine.Handlebars;
    }
    
    if (content.includes('<%') && content.includes('%>')) {
      return TemplateEngine.EJS;
    }
    
    return TemplateEngine.Simple;
  }

  /**
   * Prepare template data with helpers
   */
  private prepareTemplateData(
    variables: Record<string, any>,
    customHelpers?: Record<string, (...args: any[]) => any>
  ): any {
    const data = { ...variables };
    
    // Add all registered helpers
    data.helpers = {};
    for (const [name, helper] of this.helpers) {
      data.helpers[name] = helper;
    }
    
    // Add custom helpers
    if (customHelpers) {
      Object.assign(data.helpers, customHelpers);
    }
    
    // Add utility functions that can be used in templates
    data.$ = data.helpers; // Shorthand access to helpers
    
    return data;
  }

  /**
   * Process template with selected engine
   */
  private processWithEngine(
    template: string,
    data: any,
    engine: TemplateEngine
  ): string {
    const engineFn = this.engines.get(engine);
    
    if (!engineFn) {
      throw new Error(`Template engine '${engine}' not found`);
    }
    
    try {
      return engineFn(template, data);
    } catch (error) {
      throw new Error(
        `Template processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Simple template engine implementation
   */
  private simpleTemplateEngine(template: string, data: any): string {
    // Replace ${variable} patterns
    return template.replace(/\$\{([^}]+)\}/g, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), data);
        return value !== undefined ? String(value) : match;
      } catch {
        return match;
      }
    });
  }

  /**
   * Handlebars-like template engine (simplified)
   */
  private handlebarsLikeEngine(template: string, data: any): string {
    let result = template;
    
    // Handle expressions {{expression}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const trimmed = expression.trim();
      
      // Handle helpers
      if (trimmed.includes(' ')) {
        const [helper, ...args] = trimmed.split(' ');
        if (data.helpers && data.helpers[helper]) {
          const evaluatedArgs = args.map(arg => 
            this.evaluateExpression(arg, data)
          );
          return String(data.helpers[helper](...evaluatedArgs));
        }
      }
      
      // Regular expression evaluation
      const value = this.evaluateExpression(trimmed, data);
      return value !== undefined ? String(value) : '';
    });
    
    // Handle conditionals {{#if condition}}...{{/if}}
    result = result.replace(
      /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        const value = this.evaluateExpression(condition.trim(), data);
        return value ? content : '';
      }
    );
    
    // Handle negative conditionals {{#unless condition}}...{{/unless}}
    result = result.replace(
      /\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
      (match, condition, content) => {
        const value = this.evaluateExpression(condition.trim(), data);
        return !value ? content : '';
      }
    );
    
    // Handle loops {{#each array}}...{{/each}}
    result = result.replace(
      /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayExpr, content) => {
        const array = this.evaluateExpression(arrayExpr.trim(), data);
        if (!Array.isArray(array)) return '';
        
        return array.map((item, index) => {
          const itemData = { ...data, this: item, '@index': index };
          return this.handlebarsLikeEngine(content, itemData);
        }).join('');
      }
    );
    
    return result;
  }

  /**
   * EJS-like template engine (simplified)
   */
  private ejsLikeEngine(template: string, data: any): string {
    let result = template;
    
    // Handle expressions <%= expression %>
    result = result.replace(/<%=\s*([^%>]+)\s*%>/g, (match, expression) => {
      const value = this.evaluateExpression(expression.trim(), data);
      return value !== undefined ? String(value) : '';
    });
    
    // Handle code blocks <% code %>
    // This is a simplified version - real EJS would execute JavaScript
    result = result.replace(/<%\s*([^%>]+)\s*%>/g, (match, code) => {
      // For safety, we only support simple conditionals and loops
      const trimmed = code.trim();
      
      if (trimmed.startsWith('if (') && trimmed.endsWith(') {')) {
        // Simple if statement
        const condition = trimmed.slice(4, -3);
        const value = this.evaluateExpression(condition, data);
        return value ? '' : '<%endif%>';
      }
      
      if (trimmed === '}' || trimmed === '} else {') {
        return '';
      }
      
      return '';
    });
    
    // Remove any endif markers when condition was false
    result = result.replace(/<%endif%>[\s\S]*?<%\s*}\s*%>/g, '');
    
    return result;
  }

  /**
   * Evaluate expression with data context
   */
  private evaluateExpression(expression: string, data: any): any {
    // Handle simple property access
    const parts = expression.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Post-process the generated content
   */
  private postProcess(content: string, config: TemplateConfig): string {
    let result = content;
    
    // Trim extra whitespace
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Ensure newline at end of file
    if (!result.endsWith('\n')) {
      result += '\n';
    }
    
    return result;
  }

  /**
   * String transformation helpers
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  private toPascalCase(str: string): string {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}