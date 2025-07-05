/**
 * Registry Client - Interface for component registry API
 */

import { HTTPClient } from '../core/http-client';
import { Component, ComponentMetadata, SearchOptions, SearchResult, WillowError } from '../types';

export interface RegistryClientOptions {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
}

export class RegistryClient {
  private http: HTTPClient;
  private apiKey?: string;

  constructor(options: RegistryClientOptions = {}) {
    this.http = new HTTPClient({
      baseURL: options.baseURL || 'https://registry.willow.design/api/v1',
      timeout: options.timeout || 30000,
      headers: options.apiKey ? {
        'Authorization': `Bearer ${options.apiKey}`
      } : {}
    });
    this.apiKey = options.apiKey;
  }

  /**
   * List all available components
   */
  async listComponents(options?: {
    category?: string;
    framework?: string;
    limit?: number;
    offset?: number;
  }): Promise<ComponentMetadata[]> {
    try {
      const response = await this.http.get<{ components: ComponentMetadata[] }>('/components', {
        params: options
      });
      return response.components;
    } catch (error) {
      throw new WillowError(
        'Failed to list components',
        'REGISTRY_ERROR',
        { error }
      );
    }
  }

  /**
   * Get a specific component by name
   */
  async getComponent(name: string, version?: string): Promise<Component> {
    try {
      const path = version ? `/components/${name}/${version}` : `/components/${name}`;
      return await this.http.get<Component>(path);
    } catch (error) {
      throw new WillowError(
        `Failed to get component: ${name}`,
        'REGISTRY_ERROR',
        { error, component: name }
      );
    }
  }

  /**
   * Download component files
   */
  async downloadComponent(name: string, version?: string): Promise<{
    files: Record<string, string>;
    metadata: ComponentMetadata;
  }> {
    try {
      const component = await this.getComponent(name, version);
      
      // Download all file contents
      const files: Record<string, string> = {};
      for (const [fileName, fileUrl] of Object.entries(component.files)) {
        if (typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
          const content = await this.http.get<string>(fileUrl, {
            responseType: 'text'
          });
          files[fileName] = content;
        } else {
          // File content is inline
          files[fileName] = fileUrl;
        }
      }
      
      return {
        files,
        metadata: component.metadata
      };
    } catch (error) {
      throw new WillowError(
        `Failed to download component: ${name}`,
        'REGISTRY_ERROR',
        { error, component: name }
      );
    }
  }

  /**
   * Search for components
   */
  async search(options: SearchOptions): Promise<SearchResult> {
    try {
      return await this.http.post<SearchResult>('/search', options);
    } catch (error) {
      throw new WillowError(
        'Search failed',
        'REGISTRY_ERROR',
        { error, query: options.query }
      );
    }
  }

  /**
   * Get component dependencies
   */
  async getDependencies(name: string, version?: string): Promise<{
    components: string[];
    packages: Record<string, string>;
  }> {
    try {
      const path = version 
        ? `/components/${name}/${version}/dependencies`
        : `/components/${name}/dependencies`;
      return await this.http.get(path);
    } catch (error) {
      throw new WillowError(
        `Failed to get dependencies for: ${name}`,
        'REGISTRY_ERROR',
        { error, component: name }
      );
    }
  }

  /**
   * Check for component updates
   */
  async checkUpdates(components: Array<{ name: string; version: string }>): Promise<
    Array<{
      name: string;
      currentVersion: string;
      latestVersion: string;
      hasUpdate: boolean;
    }>
  > {
    try {
      return await this.http.post('/components/check-updates', { components });
    } catch (error) {
      throw new WillowError(
        'Failed to check for updates',
        'REGISTRY_ERROR',
        { error }
      );
    }
  }

  /**
   * Get registry statistics
   */
  async getStats(): Promise<{
    totalComponents: number;
    totalDownloads: number;
    popularComponents: ComponentMetadata[];
    recentComponents: ComponentMetadata[];
  }> {
    try {
      return await this.http.get('/stats');
    } catch (error) {
      throw new WillowError(
        'Failed to get registry stats',
        'REGISTRY_ERROR',
        { error }
      );
    }
  }
}