#!/usr/bin/env node

// Willow Components Direct Installer
// This module handles direct component installation without relying on shadcn CLI

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const WILLOW_REGISTRY = 'https://iridescent-brigadeiros-fe4174.netlify.app/r';

// Map of component dependencies
export const COMPONENT_DEPS = {
  'button': ['utils'],
  'badge': ['utils'],
  'card': ['utils'],
  'input': ['utils', 'label'],
  'label': ['utils'],
  'select': ['utils'],
  'textarea': ['utils'],
  'accordion': ['utils'],
  'tabs': ['utils'],
  'modal': ['utils', 'button'],
  'avatar': ['utils'],
  'checkbox': ['utils'],
  'chip': ['utils'],
  'fancy-button': ['utils', 'button'],
  'form-card': ['utils', 'card'],
  'form-field': ['utils', 'label', 'input'],
  'gradient-bg': ['utils'],
  'highlight': ['utils'],
  'info-card': ['utils', 'card'],
  'list': ['utils'],
  'logo': ['utils'],
  'skeleton': ['utils'],
  'switch': ['utils'],
  'tag': ['utils', 'badge'],
  'toast': ['utils'],
  'tooltip': ['utils']
};

export async function installWillowComponent(componentName, options = {}) {
  const { 
    targetDir = 'components/ui',
    isVite = false,
    verbose = false 
  } = options;
  
  const componentDir = isVite ? `src/${targetDir}` : targetDir;
  
  try {
    // Ensure directory exists
    await fs.mkdir(componentDir, { recursive: true });
    
    // Fetch component from registry
    const response = await fetch(`${WILLOW_REGISTRY}/${componentName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${componentName}: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.files || !data.files[0] || !data.files[0].content) {
      throw new Error(`Invalid component data for ${componentName}`);
    }
    
    // Write component file
    const content = data.files[0].content;
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(componentDir, fileName);
    
    await fs.writeFile(filePath, content);
    
    // Verify file was written
    const stats = await fs.stat(filePath);
    
    if (verbose) {
      console.log(`✓ Installed ${componentName} (${stats.size} bytes)`);
    }
    
    return { success: true, path: filePath, size: stats.size };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function installAllWillowComponents(options = {}) {
  const components = Object.keys(COMPONENT_DEPS);
  const results = {
    success: [],
    failed: []
  };
  
  // Install utils first if needed
  const utilsPath = options.isVite ? 'src/lib/utils.ts' : 'lib/utils.ts';
  try {
    await fs.access(utilsPath);
  } catch {
    const utilsDir = path.dirname(utilsPath);
    await fs.mkdir(utilsDir, { recursive: true });
    
    const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
    
    await fs.writeFile(utilsPath, utilsContent);
    if (options.verbose) {
      console.log(`✓ Created ${utilsPath}`);
    }
  }
  
  // Install components
  for (const component of components) {
    const result = await installWillowComponent(component, options);
    if (result.success) {
      results.success.push(component);
    } else {
      results.failed.push({ component, error: result.error });
    }
  }
  
  return results;
}