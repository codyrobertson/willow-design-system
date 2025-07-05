/**
 * Component Publisher - Handles publishing components to registry
 */

import { readFile } from 'fs/promises';
import { join, relative, basename } from 'path';
import { glob } from 'glob';
import { HTTPClient } from '../core/http-client';
import { Component, ComponentMetadata, PublishOptions, WillowError } from '../types';
import { Logger } from '../core/logger';

export interface ComponentPublisherOptions {
  logger: Logger;
  registryURL?: string;
}

export class ComponentPublisher {
  private logger: Logger;
  private http: HTTPClient;

  constructor(options: ComponentPublisherOptions) {
    this.logger = options.logger;
    this.http = new HTTPClient({
      baseURL: options.registryURL || 'https://registry.willow.design/api/v1'
    });
  }

  /**
   * Publish a component to the registry
   */
  async publish(options: PublishOptions): Promise<{
    id: string;
    url: string;
  }> {
    const { component, token, private: isPrivate, tags } = options;
    
    try {
      // Validate component
      this.validateComponent(component);
      
      // Add tags to metadata
      if (tags && tags.length > 0) {
        component.metadata.tags = [...(component.metadata.tags || []), ...tags];
      }
      
      // Publish to registry
      const response = await this.http.post<{ id: string; url: string }>(
        '/components',
        {
          ...component,
          private: isPrivate
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response;
    } catch (error) {
      if (error instanceof WillowError) {
        throw error;
      }
      throw new WillowError(
        'Failed to publish component',
        'PUBLISH_ERROR',
        { error, component: component.metadata.name }
      );
    }
  }

  /**
   * Prepare component from directory
   */
  async prepareFromDirectory(path: string): Promise<Component> {
    try {
      // Find component files
      const files = await glob('**/*.{ts,tsx,js,jsx,css,scss,md}', {
        cwd: path,
        ignore: ['node_modules/**', '*.test.*', '*.spec.*', '*.stories.*']
      });
      
      if (files.length === 0) {
        throw new WillowError(
          'No component files found',
          'PREPARE_ERROR',
          { path }
        );
      }
      
      // Read file contents
      const content: Record<string, string> = {};
      const fileMap: Record<string, string> = {};
      
      for (const file of files) {
        const filePath = join(path, file);
        const fileContent = await readFile(filePath, 'utf-8');
        content[file] = fileContent;
        fileMap[file] = file; // In real implementation, this would be URLs
      }
      
      // Extract metadata from main component file
      const mainFile = files.find(f => 
        f.match(/index\.(tsx?|jsx?)$/) || 
        f.match(/[^/]+\.(tsx?|jsx?)$/)
      );
      
      if (!mainFile) {
        throw new WillowError(
          'No main component file found',
          'PREPARE_ERROR',
          { path }
        );
      }
      
      const metadata = await this.extractMetadata(
        content[mainFile],
        basename(path)
      );
      
      return {
        metadata,
        files: fileMap,
        content
      };
    } catch (error) {
      if (error instanceof WillowError) {
        throw error;
      }
      throw new WillowError(
        'Failed to prepare component',
        'PREPARE_ERROR',
        { error, path }
      );
    }
  }

  /**
   * Extract metadata from component source
   */
  private async extractMetadata(
    source: string,
    defaultName: string
  ): Promise<ComponentMetadata> {
    // Extract component name from export
    const nameMatch = source.match(/export\s+(?:function|const)\s+(\w+)/);
    const name = nameMatch ? nameMatch[1].toLowerCase() : defaultName;
    
    // Extract description from JSDoc
    const descMatch = source.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
    const description = descMatch ? descMatch[1].trim() : undefined;
    
    // Detect framework
    let framework: ComponentMetadata['framework'] = 'react';
    if (source.includes('vue')) framework = 'vue';
    else if (source.includes('svelte')) framework = 'svelte';
    
    // Detect category
    let category: ComponentMetadata['category'] = 'ui';
    if (source.includes('Layout') || source.includes('Container')) category = 'layout';
    else if (source.includes('use') && source.includes('hook')) category = 'hook';
    else if (source.includes('Provider') || source.includes('Context')) category = 'provider';
    else if (!source.includes('return') || !source.includes('jsx')) category = 'utility';
    
    // Extract dependencies
    const dependencies: string[] = [];
    const importMatches = source.matchAll(/import\s+.*?\s+from\s+['"](.+?)['"]/g);
    for (const match of importMatches) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('@/')) {
        dependencies.push(dep);
      }
    }
    
    return {
      name,
      version: '1.0.0',
      description,
      category,
      framework,
      dependencies: [...new Set(dependencies)],
      author: process.env.USER || 'unknown',
      publishedAt: new Date()
    };
  }

  /**
   * Validate component before publishing
   */
  private validateComponent(component: Component): void {
    const { metadata, files, content } = component;
    
    // Validate metadata
    if (!metadata.name || !metadata.version) {
      throw new WillowError(
        'Component must have name and version',
        'VALIDATION_ERROR'
      );
    }
    
    if (!/^[a-z0-9-]+$/.test(metadata.name)) {
      throw new WillowError(
        'Component name must be lowercase with hyphens only',
        'VALIDATION_ERROR',
        { name: metadata.name }
      );
    }
    
    if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
      throw new WillowError(
        'Invalid version format. Use semantic versioning (e.g., 1.0.0)',
        'VALIDATION_ERROR',
        { version: metadata.version }
      );
    }
    
    // Validate files
    if (Object.keys(files).length === 0) {
      throw new WillowError(
        'Component must have at least one file',
        'VALIDATION_ERROR'
      );
    }
    
    // Validate content
    if (Object.keys(content).length === 0) {
      throw new WillowError(
        'Component must have file contents',
        'VALIDATION_ERROR'
      );
    }
  }
}