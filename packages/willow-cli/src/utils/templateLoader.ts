import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ProjectType } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the templates directory relative to this file
const TEMPLATES_DIR = join(__dirname, '../../templates');

export interface TemplateContext {
  projectType: ProjectType;
  isOnlineIDE: boolean;
  [key: string]: any;
}

/**
 * Load a template file and optionally process it with context
 */
export async function loadTemplate(
  templatePath: string, 
  context?: TemplateContext
): Promise<string> {
  try {
    const fullPath = join(TEMPLATES_DIR, templatePath);
    let content = await readFile(fullPath, 'utf-8');
    
    // Simple template variable replacement if context is provided
    if (context) {
      content = processTemplate(content, context);
    }
    
    return content;
  } catch (error) {
    throw new Error(`Failed to load template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load multiple templates in parallel
 */
export async function loadTemplates(
  templatePaths: string[], 
  context?: TemplateContext
): Promise<Record<string, string>> {
  const results = await Promise.all(
    templatePaths.map(async (path) => {
      const content = await loadTemplate(path, context);
      // Use filename as key (without extension)
      const key = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || path;
      return [key, content];
    })
  );
  
  return Object.fromEntries(results);
}

/**
 * Simple template variable replacement
 * Supports:
 * - {{variable}} - simple replacement
 * - {{#if condition}}...{{/if}} - conditional blocks
 * - {{#unless condition}}...{{/unless}} - negative conditional blocks
 */
function processTemplate(content: string, context: TemplateContext): string {
  // Replace simple variables
  content = content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key]?.toString() || match;
  });
  
  // Handle conditional blocks
  content = content.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, block) => {
    return context[condition] ? block : '';
  });
  
  content = content.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, block) => {
    return !context[condition] ? block : '';
  });
  
  return content;
}

/**
 * Get the appropriate template variant based on project type
 */
export function getTemplateVariant(baseName: string, projectType: ProjectType): string {
  const variants = [
    // Try specific variants first
    `${baseName}.${projectType.type}`,
    `${baseName}.${projectType.isOnlineIDE ? 'online' : 'local'}`,
    `${baseName}.${projectType.hasTypeScript ? 'ts' : 'js'}`,
    // Fallback to base
    baseName
  ];
  
  return variants[0]; // For now, return the most specific. Later we can add file existence checks
}

/**
 * Load template with automatic variant selection
 */
export async function loadTemplateVariant(
  baseName: string,
  projectType: ProjectType,
  context?: TemplateContext
): Promise<string> {
  const templatePath = getTemplateVariant(baseName, projectType);
  return loadTemplate(templatePath, context);
}

/**
 * Check if a template exists
 */
export async function templateExists(templatePath: string): Promise<boolean> {
  try {
    const fullPath = join(TEMPLATES_DIR, templatePath);
    await readFile(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List available templates in a directory
 */
export async function listTemplates(subdirectory: string = ''): Promise<string[]> {
  try {
    const { readdir } = await import('fs/promises');
    const fullPath = join(TEMPLATES_DIR, subdirectory);
    const files = await readdir(fullPath);
    return files.filter(file => file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json'));
  } catch {
    return [];
  }
}