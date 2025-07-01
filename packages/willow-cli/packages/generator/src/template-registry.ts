/**
 * Template Registry
 * Manages and organizes component templates for different frameworks
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { TemplateConfig, TemplateEngine } from './types';

export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  framework: 'react' | 'vue' | 'angular' | 'shared';
  category: 'component' | 'service' | 'hook' | 'util' | 'config' | 'test' | 'style';
  language: 'typescript' | 'javascript';
  styling?: 'css' | 'scss' | 'styled-components' | 'emotion' | 'tailwind' | 'css-modules';
  templatePath: string;
  variables: TemplateVariable[];
  dependencies?: string[];
  devDependencies?: string[];
  imports?: string[];
  exports?: string[];
  tags?: string[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  validator?: (value: any) => boolean;
}

export class TemplateRegistry {
  private templates: Map<string, ComponentTemplate> = new Map();
  private templatesPath: string;

  constructor(templatesPath?: string) {
    this.templatesPath = templatesPath || path.join(__dirname, '../templates');
  }

  /**
   * Initialize the registry by loading all templates
   */
  async initialize(): Promise<void> {
    await this.loadTemplates();
  }

  /**
   * Load all templates from the templates directory
   */
  private async loadTemplates(): Promise<void> {
    const frameworks = ['react', 'vue', 'angular', 'shared'];

    for (const framework of frameworks) {
      const frameworkPath = path.join(this.templatesPath, framework);

      try {
        const files = await this.scanDirectory(frameworkPath);

        for (const file of files) {
          if (file.endsWith('.template.json')) {
            const template = await this.loadTemplate(file);
            if (template) {
              this.templates.set(template.id, template);
            }
          }
        }
      } catch (error) {
        // Framework directory might not exist yet
        console.debug(`No templates found for ${framework}`);
      }
    }
  }

  /**
   * Scan directory recursively for files
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }

    return files;
  }

  /**
   * Load a single template definition
   */
  private async loadTemplate(templatePath: string): Promise<ComponentTemplate | null> {
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      const templateDef = JSON.parse(content) as ComponentTemplate;

      // Resolve template path relative to the JSON file
      const dir = path.dirname(templatePath);
      templateDef.templatePath = path.join(dir, templateDef.templatePath);

      return templateDef;
    } catch (error) {
      console.error(`Failed to load template from ${templatePath}:`, error);
      return null;
    }
  }

  /**
   * Register a template programmatically
   */
  registerTemplate(template: ComponentTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): ComponentTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ComponentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Find templates by criteria
   */
  findTemplates(
    criteria: Partial<{
      framework: string;
      category: string;
      language: string;
      styling: string;
      tags: string[];
    }>
  ): ComponentTemplate[] {
    return this.getAllTemplates().filter((template) => {
      if (criteria.framework && template.framework !== criteria.framework) {
        return false;
      }

      if (criteria.category && template.category !== criteria.category) {
        return false;
      }

      if (criteria.language && template.language !== criteria.language) {
        return false;
      }

      if (criteria.styling && template.styling !== criteria.styling) {
        return false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const templateTags = template.tags || [];
        const hasAllTags = criteria.tags.every((tag) => templateTags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get template content
   */
  async getTemplateContent(id: string): Promise<string> {
    const template = this.getTemplate(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    return fs.readFile(template.templatePath, 'utf-8');
  }

  /**
   * Create a template configuration from a template
   */
  createTemplateConfig(
    templateId: string,
    variables: Record<string, any>,
    outputPath: string
  ): TemplateConfig {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate required variables
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in variables)) {
        if (variable.default !== undefined) {
          variables[variable.name] = variable.default;
        } else {
          throw new Error(`Required variable missing: ${variable.name}`);
        }
      }

      // Run validator if provided
      if (variable.validator && variable.name in variables) {
        if (!variable.validator(variables[variable.name])) {
          throw new Error(`Invalid value for variable: ${variable.name}`);
        }
      }
    }

    return {
      name: template.id,
      variables,
      template: template.templatePath,
      outputPath,
    };
  }

  /**
   * Get templates grouped by framework
   */
  getTemplatesByFramework(): Record<string, ComponentTemplate[]> {
    const grouped: Record<string, ComponentTemplate[]> = {
      react: [],
      vue: [],
      angular: [],
      shared: [],
    };

    for (const template of this.getAllTemplates()) {
      grouped[template.framework].push(template);
    }

    return grouped;
  }

  /**
   * Get templates grouped by category
   */
  getTemplatesByCategory(): Record<string, ComponentTemplate[]> {
    const grouped: Record<string, ComponentTemplate[]> = {};

    for (const template of this.getAllTemplates()) {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    }

    return grouped;
  }

  /**
   * Export template catalog as JSON
   */
  exportCatalog(): string {
    const catalog = {
      version: '1.0.0',
      templates: this.getAllTemplates().map((template) => ({
        ...template,
        // Don't include the full path in the export
        templatePath: path.relative(this.templatesPath, template.templatePath),
      })),
      frameworks: this.getTemplatesByFramework(),
      categories: this.getTemplatesByCategory(),
    };

    return JSON.stringify(catalog, null, 2);
  }
}

// Singleton instance
let registryInstance: TemplateRegistry | null = null;

/**
 * Get the global template registry instance
 */
export function getTemplateRegistry(templatesPath?: string): TemplateRegistry {
  if (!registryInstance) {
    registryInstance = new TemplateRegistry(templatesPath);
  }
  return registryInstance;
}

/**
 * Create a new template registry instance
 */
export function createTemplateRegistry(templatesPath?: string): TemplateRegistry {
  return new TemplateRegistry(templatesPath);
}
