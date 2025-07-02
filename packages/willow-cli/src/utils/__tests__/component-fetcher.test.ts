/**
 * Component Fetcher Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFetcher, createWillowFetcher, createComponentFetcherFunction } from '../component-fetcher.js';
import { STABLE_COMPONENTS, UNSTABLE_COMPONENTS } from '../../types/index.js';

describe('ComponentFetcher', () => {
  let fetcher: ComponentFetcher;

  beforeEach(() => {
    fetcher = new ComponentFetcher();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor and options', () => {
    it('should use default options when none provided', () => {
      const defaultFetcher = new ComponentFetcher();
      const stats = defaultFetcher.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should accept custom options', () => {
      const customFetcher = new ComponentFetcher({
        timeout: 5000,
        retries: 5,
        includeUnstable: true,
        cacheEnabled: false
      });
      
      // Should not use cache when disabled
      expect(customFetcher.getCacheStats().size).toBe(0);
    });
  });

  describe('fetchComponent', () => {
    it('should fetch stable component successfully', async () => {
      const component = await fetcher.fetchComponent('button');

      expect(component).toBeDefined();
      expect(component.name).toBe('button');
      expect(component.type).toBe('component');
      expect(component.files).toBeInstanceOf(Array);
      expect(component.files.length).toBeGreaterThan(0);
    });

    it('should handle component with dependencies', async () => {
      const component = await fetcher.fetchComponent('button');

      expect(component.registryDependencies).toBeInstanceOf(Array);
      expect(component.registryDependencies).toContain('input');
      expect(component.registryDependencies).toContain('label');
    });

    it('should handle component with no dependencies', async () => {
      const component = await fetcher.fetchComponent('label');

      expect(component.registryDependencies).toBeInstanceOf(Array);
      expect(component.registryDependencies.length).toBe(0);
    });

    it('should throw error for non-existent component', async () => {
      await expect(fetcher.fetchComponent('non-existent-component'))
        .rejects.toThrow('Component non-existent-component not found in registry');
    });

    it('should throw error for unstable component when not enabled', async () => {
      const unstableComponent = UNSTABLE_COMPONENTS[0];
      
      await expect(fetcher.fetchComponent(unstableComponent))
        .rejects.toThrow('is unstable. Use --include-unstable flag');
    });

    it('should allow unstable components when enabled', async () => {
      const unstableFetcher = new ComponentFetcher({ includeUnstable: true });
      const unstableComponent = UNSTABLE_COMPONENTS[0];
      
      const component = await unstableFetcher.fetchComponent(unstableComponent);
      expect(component.name).toBe(unstableComponent);
    });

    it('should use cache for repeated requests', async () => {
      // First request
      const component1 = await fetcher.fetchComponent('button');
      
      // Second request should use cache
      const component2 = await fetcher.fetchComponent('button');
      
      expect(component1).toEqual(component2);
      expect(fetcher.getCacheStats().size).toBe(1);
      expect(fetcher.getCacheStats().components).toContain('button');
    });

    it('should respect cache disabled option', async () => {
      const noCacheFetcher = new ComponentFetcher({ cacheEnabled: false });
      
      await noCacheFetcher.fetchComponent('button');
      expect(noCacheFetcher.getCacheStats().size).toBe(0);
    });
  });

  describe('fetchComponents', () => {
    it('should fetch multiple components successfully', async () => {
      const components = ['button', 'input', 'label'];
      const results = await fetcher.fetchComponents(components);

      expect(results.size).toBe(3);
      
      for (const component of components) {
        const result = results.get(component);
        expect(result?.success).toBe(true);
        expect(result?.component?.name).toBe(component);
      }
    });

    it('should handle mixed valid and invalid components', async () => {
      const components = ['button', 'invalid-component', 'label'];
      const results = await fetcher.fetchComponents(components);

      expect(results.size).toBe(3);
      
      // Valid components should succeed
      expect(results.get('button')?.success).toBe(true);
      expect(results.get('label')?.success).toBe(true);
      
      // Invalid component should fail
      expect(results.get('invalid-component')?.success).toBe(false);
      expect(results.get('invalid-component')?.error).toContain('not found in registry');
    });

    it('should process components in batches', async () => {
      const components = Array.from(STABLE_COMPONENTS).slice(0, 10);
      const results = await fetcher.fetchComponents(components);

      expect(results.size).toBe(10);
      
      // All should be successful
      for (const [name, result] of results) {
        expect(result.success).toBe(true);
        expect(result.component?.name).toBe(name);
      }
    });

    it('should indicate cache usage in results', async () => {
      // Pre-cache a component
      await fetcher.fetchComponent('button');
      
      const results = await fetcher.fetchComponents(['button', 'input']);
      
      expect(results.get('button')?.fromCache).toBe(true);
      expect(results.get('input')?.fromCache).toBe(false);
    });
  });

  describe('getAvailableComponents', () => {
    it('should return only stable components by default', async () => {
      const components = await fetcher.getAvailableComponents();

      expect(components).toEqual(expect.arrayContaining(Array.from(STABLE_COMPONENTS)));
      expect(components.length).toBe(STABLE_COMPONENTS.length);
      
      // Should not include unstable components
      for (const unstable of UNSTABLE_COMPONENTS) {
        expect(components).not.toContain(unstable);
      }
    });

    it('should include unstable components when enabled', async () => {
      const unstableFetcher = new ComponentFetcher({ includeUnstable: true });
      const components = await unstableFetcher.getAvailableComponents();

      expect(components).toEqual(expect.arrayContaining(Array.from(STABLE_COMPONENTS)));
      expect(components).toEqual(expect.arrayContaining(Array.from(UNSTABLE_COMPONENTS)));
      expect(components.length).toBe(STABLE_COMPONENTS.length + UNSTABLE_COMPONENTS.length);
    });
  });

  describe('searchComponents', () => {
    it('should find components by exact name', async () => {
      const results = await fetcher.searchComponents('button');
      expect(results).toContain('button');
    });

    it('should find components by partial name', async () => {
      const results = await fetcher.searchComponents('but');
      expect(results).toContain('button');
    });

    it('should be case insensitive', async () => {
      const results = await fetcher.searchComponents('BUTTON');
      expect(results).toContain('button');
    });

    it('should return empty array for no matches', async () => {
      const results = await fetcher.searchComponents('xyz123');
      expect(results).toEqual([]);
    });

    it('should find multiple matching components', async () => {
      const results = await fetcher.searchComponents('a'); // Should match many components
      expect(results.length).toBeGreaterThan(1);
    });
  });

  describe('cache management', () => {
    it('should clear cache successfully', async () => {
      await fetcher.fetchComponent('button');
      await fetcher.fetchComponent('input');
      
      expect(fetcher.getCacheStats().size).toBe(2);
      
      fetcher.clearCache();
      expect(fetcher.getCacheStats().size).toBe(0);
    });

    it('should provide accurate cache statistics', async () => {
      const components = ['button', 'input', 'label'];
      
      for (const component of components) {
        await fetcher.fetchComponent(component);
      }
      
      const stats = fetcher.getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.components).toEqual(expect.arrayContaining(components));
    });
  });

  describe('validateComponent', () => {
    it('should validate valid component', async () => {
      const component = await fetcher.fetchComponent('button');
      expect(fetcher.validateComponent(component)).toBe(true);
    });

    it('should reject component without name', () => {
      const invalidComponent = {
        type: 'component',
        files: [{ name: 'test.tsx', content: 'test' }]
      } as any;
      
      expect(fetcher.validateComponent(invalidComponent)).toBe(false);
    });

    it('should reject component without files', () => {
      const invalidComponent = {
        name: 'test',
        type: 'component',
        files: []
      } as any;
      
      expect(fetcher.validateComponent(invalidComponent)).toBe(false);
    });

    it('should reject component without component file', () => {
      const invalidComponent = {
        name: 'test',
        type: 'component',
        files: [{ name: 'readme.md', content: 'docs' }]
      } as any;
      
      expect(fetcher.validateComponent(invalidComponent)).toBe(false);
    });
  });

  describe('downloadComponentFiles', () => {
    it('should simulate file download', async () => {
      const component = await fetcher.fetchComponent('button');
      const targetPath = '/tmp/components';
      
      // Should not throw error
      await expect(fetcher.downloadComponentFiles(component, targetPath))
        .resolves.not.toThrow();
    });
  });
});

describe('factory functions', () => {
  describe('createWillowFetcher', () => {
    it('should create fetcher with Willow registry defaults', () => {
      const fetcher = createWillowFetcher();
      expect(fetcher).toBeInstanceOf(ComponentFetcher);
    });

    it('should accept custom options', () => {
      const fetcher = createWillowFetcher({ includeUnstable: true });
      expect(fetcher).toBeInstanceOf(ComponentFetcher);
    });
  });

  describe('createComponentFetcherFunction', () => {
    it('should create function compatible with dependency resolver', async () => {
      const fetcherFn = createComponentFetcherFunction();
      
      const component = await fetcherFn('button');
      expect(component.name).toBe('button');
      expect(component.type).toBe('component');
    });

    it('should handle errors appropriately', async () => {
      const fetcherFn = createComponentFetcherFunction();
      
      await expect(fetcherFn('invalid-component'))
        .rejects.toThrow('not found in registry');
    });

    it('should work with custom options', async () => {
      const fetcherFn = createComponentFetcherFunction({ includeUnstable: true });
      const unstableComponent = UNSTABLE_COMPONENTS[0];
      
      const component = await fetcherFn(unstableComponent);
      expect(component.name).toBe(unstableComponent);
    });
  });
});

describe('integration with dependency resolver', () => {
  it('should provide components in format expected by dependency resolver', async () => {
    const fetcherFn = createComponentFetcherFunction();
    
    const buttonComponent = await fetcherFn('button');
    
    // Should have the fields needed by dependency resolver
    expect(buttonComponent).toHaveProperty('name');
    expect(buttonComponent).toHaveProperty('registryDependencies');
    expect(buttonComponent.registryDependencies).toBeInstanceOf(Array);
  });

  it('should handle component dependency chains', async () => {
    const fetcherFn = createComponentFetcherFunction();
    
    // Test a component with deep dependencies
    const modalComponent = await fetcherFn('modal');
    expect(modalComponent.registryDependencies).toContain('button');
    expect(modalComponent.registryDependencies).toContain('card');
    
    // Test its dependencies
    const buttonComponent = await fetcherFn('button');
    expect(buttonComponent.registryDependencies).toContain('input');
    expect(buttonComponent.registryDependencies).toContain('label');
  });
});