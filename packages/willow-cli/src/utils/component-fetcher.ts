/**
 * Component Fetching System
 * Handles fetching component metadata and files from the registry
 */

import chalk from 'chalk';
import type { ComponentMeta } from '../types/index.js';
import { WILLOW_REGISTRY, STABLE_COMPONENTS, UNSTABLE_COMPONENTS } from '../types/index.js';
import { HTTPClientFactory, HTTPClient, RequestProgress } from '../core/network/index.js';
import { ErrorRecovery } from '../errors/ErrorRecovery.js';

export interface FetchOptions {
  registry?: string;
  timeout?: number;
  retries?: number;
  includeUnstable?: boolean;
  cacheEnabled?: boolean;
  onProgress?: (component: string, progress: RequestProgress) => void;
}

export interface FetchResult {
  success: boolean;
  component?: ComponentMeta;
  error?: string;
  fromCache?: boolean;
}

export class ComponentFetcher {
  private cache: Map<string, ComponentMeta> = new Map();
  private options: Required<FetchOptions>;
  private httpClient: HTTPClient;

  constructor(options: FetchOptions = {}) {
    this.options = {
      registry: options.registry || WILLOW_REGISTRY,
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      includeUnstable: options.includeUnstable || false,
      cacheEnabled: options.cacheEnabled !== false,
      onProgress: options.onProgress || (() => {})
    };

    // Create HTTP client with registry-specific configuration
    this.httpClient = HTTPClientFactory.createRegistryClient({
      baseURL: this.options.registry,
      timeout: this.options.timeout,
      retry: {
        maxAttempts: this.options.retries,
        backoff: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000
      }
    });
  }

  /**
   * Get list of available components
   */
  async getAvailableComponents(): Promise<string[]> {
    const components = [...STABLE_COMPONENTS];
    if (this.options.includeUnstable) {
      components.push(...UNSTABLE_COMPONENTS);
    }
    return components;
  }

  /**
   * Fetch component metadata from registry
   */
  async fetchComponent(componentName: string): Promise<ComponentMeta> {
    // Check cache first
    if (this.options.cacheEnabled && this.cache.has(componentName)) {
      return this.cache.get(componentName)!;
    }

    // Validate component exists in our known list
    const isStable = STABLE_COMPONENTS.includes(componentName as any);
    const isUnstable = UNSTABLE_COMPONENTS.includes(componentName as any);
    
    if (!isStable && !isUnstable) {
      throw new Error(`Component ${componentName} not found in registry`);
    }

    if (isUnstable && !this.options.includeUnstable) {
      throw new Error(`Component ${componentName} is unstable. Use --include-unstable flag to include it.`);
    }

    try {
      // Try to fetch from actual registry first
      const metadata = await this.fetchFromRegistry(componentName);
      
      // Cache the result
      if (this.options.cacheEnabled) {
        this.cache.set(componentName, metadata);
      }

      return metadata;

    } catch (error) {
      throw new Error(`Failed to fetch component ${componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch multiple components in batch
   */
  async fetchComponents(componentNames: string[]): Promise<Map<string, FetchResult>> {
    const results = new Map<string, FetchResult>();
    
    // Process components in parallel with controlled concurrency
    const batchSize = 5;
    for (let i = 0; i < componentNames.length; i += batchSize) {
      const batch = componentNames.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (name) => {
        try {
          const wasInCache = this.cache.has(name);
          const component = await this.fetchComponent(name);
          return { name, result: { success: true, component, fromCache: wasInCache } };
        } catch (error) {
          return { 
            name, 
            result: { 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ name, result }) => {
        results.set(name, result);
      });
    }

    return results;
  }


  /**
   * Search components by pattern or category
   */
  async searchComponents(query: string): Promise<string[]> {
    const available = await this.getAvailableComponents();
    
    const queryLower = query.toLowerCase();
    return available.filter(component => 
      component.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Clear the component cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; components: string[] } {
    return {
      size: this.cache.size,
      components: Array.from(this.cache.keys())
    };
  }

  /**
   * Create mock component metadata for development
   * TODO: Replace with actual registry API integration
   */
  private async createMockMetadata(componentName: string): Promise<ComponentMeta> {
    // Simulate network delay (reduced in test environment)
    const delay = process.env.NODE_ENV === 'test' ? 0 : Math.random() * 100;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Define mock dependencies for realistic testing
    const dependencyMap: Record<string, string[]> = {
      'button': ['input', 'label'],
      'input': ['label'],
      'label': [],
      'card': ['button'],
      'form': ['input', 'button'], 
      'modal': ['button', 'card'],
      'dropdown': ['button'],
      'table': ['button', 'input'],
      'layout': ['card'],
      'navigation': ['button', 'dropdown'],
      'tooltip': ['button'],
      'checkbox': ['label'],
      'select': ['input', 'dropdown'],
      'textarea': ['input'],
      'accordion': ['button'],
      'tabs': ['button'],
      'chip': ['button'],
      'badge': [],
      'skeleton': [],
      'switch': ['label'],
      'tag': ['badge'],
      'toast': ['button']
    };

    return {
      name: componentName,
      type: 'component',
      files: [
        {
          name: `${componentName}.tsx`,
          content: `// ${componentName} component implementation`,
          type: 'component'
        },
        {
          name: `${componentName}.stories.tsx`,
          content: `// ${componentName} Storybook stories`,
          type: 'story'
        }
      ],
      registryDependencies: dependencyMap[componentName] || [],
      dependencies: [],
      tailwind: {
        config: {
          // Component-specific Tailwind config
        }
      },
      cssVars: {
        light: {
          [`--${componentName}-bg`]: '#ffffff',
          [`--${componentName}-text`]: '#000000'
        },
        dark: {
          [`--${componentName}-bg`]: '#000000',
          [`--${componentName}-text`]: '#ffffff'
        }
      }
    };
  }

  /**
   * Fetch component from registry
   */
  private async fetchFromRegistry(componentName: string): Promise<ComponentMeta> {
    try {
      // Attempt to fetch from actual registry
      const response = await this.httpClient.get<ComponentMeta>(
        `/api/components/${componentName}`,
        {
          onProgress: (progress) => {
            this.options.onProgress(componentName, progress);
          }
        }
      );

      return response.data;
    } catch (error) {
      // Fallback to mock data if registry is not available
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        return this.createMockMetadata(componentName);
      }
      throw error;
    }
  }

  /**
   * Download component files
   */
  async downloadComponentFiles(component: ComponentMeta, targetPath: string): Promise<void> {
    console.log(chalk.blue(`📁 Downloading ${component.name} to ${targetPath}`));
    
    // Download each file with progress tracking
    for (const file of component.files) {
      if (!file.content) {
        // Fetch file content from registry if not embedded
        const fileUrl = `/api/components/${component.name}/files/${file.name}`;
        
        try {
          const response = await this.httpClient.get<string>(fileUrl, {
            responseType: 'text',
            onProgress: (progress) => {
              this.options.onProgress(`${component.name}/${file.name}`, progress);
            }
          });
          
          file.content = response.data;
        } catch (error) {
          console.error(chalk.red(`Failed to download ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`));
          throw error;
        }
      }
    }
  }

  /**
   * Validate component integrity
   */
  validateComponent(component: ComponentMeta): boolean {
    if (!component.name || !component.type || !component.files) {
      return false;
    }

    if (component.files.length === 0) {
      return false;
    }

    // Validate required files exist
    const hasComponentFile = component.files.some(f => 
      f.type === 'component' || f.name?.endsWith('.tsx') || f.name?.endsWith('.ts')
    );

    return hasComponentFile;
  }
}

/**
 * Create a component fetcher configured for the Willow registry
 */
export function createWillowFetcher(options: FetchOptions = {}): ComponentFetcher {
  return new ComponentFetcher({
    registry: WILLOW_REGISTRY,
    ...options
  });
}

/**
 * Component fetcher factory function for dependency resolver integration
 */
export function createComponentFetcherFunction(options: FetchOptions = {}) {
  const fetcher = new ComponentFetcher(options);
  
  return async (componentName: string): Promise<ComponentMeta> => {
    return fetcher.fetchComponent(componentName);
  };
}