/**
 * Dependency Resolver Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyResolver, type ResolutionResult } from '../dependency-resolver.js';
import type { ComponentMeta } from '../../types/index.js';

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;
  let mockComponentFetcher: any;

  // Mock component metadata
  const mockComponents: Record<string, ComponentMeta> = {
    'button': {
      name: 'button',
      type: 'component',
      files: [],
      registryDependencies: ['input', 'label'] // button depends on input and label
    },
    'input': {
      name: 'input',
      type: 'component', 
      files: [],
      registryDependencies: ['label'] // input depends on label
    },
    'label': {
      name: 'label',
      type: 'component',
      files: [],
      registryDependencies: [] // label has no dependencies
    },
    'card': {
      name: 'card',
      type: 'component',
      files: [],
      registryDependencies: ['button'] // card depends on button
    },
    'form': {
      name: 'form',
      type: 'component',
      files: [],
      registryDependencies: ['input', 'button'] // form depends on input and button
    },
    'modal': {
      name: 'modal',
      type: 'component',
      files: [],
      registryDependencies: ['button', 'card'] // modal depends on button and card
    },
    // Circular dependency components
    'circular-a': {
      name: 'circular-a',
      type: 'component',
      files: [],
      registryDependencies: ['circular-b']
    },
    'circular-b': {
      name: 'circular-b', 
      type: 'component',
      files: [],
      registryDependencies: ['circular-c']
    },
    'circular-c': {
      name: 'circular-c',
      type: 'component',
      files: [],
      registryDependencies: ['circular-a'] // circular back to A
    }
  };

  beforeEach(() => {
    mockComponentFetcher = vi.fn().mockImplementation(async (component: string) => {
      if (mockComponents[component]) {
        return mockComponents[component];
      }
      throw new Error(`Component ${component} not found`);
    });

    resolver = new DependencyResolver(mockComponentFetcher);
  });

  describe('basic dependency resolution', () => {
    it('should resolve simple dependencies correctly', async () => {
      const result = await resolver.resolveDependencies(['button']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toEqual(['label', 'input', 'button']);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.unresolvedDependencies).toHaveLength(0);
    });

    it('should handle components with no dependencies', async () => {
      const result = await resolver.resolveDependencies(['label']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toEqual(['label']);
      expect(result.circularDependencies).toHaveLength(0);
    });

    it('should resolve multiple independent components', async () => {
      const result = await resolver.resolveDependencies(['label', 'input']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toEqual(['label', 'input']);
      expect(result.circularDependencies).toHaveLength(0);
    });

    it('should resolve complex dependency chains', async () => {
      const result = await resolver.resolveDependencies(['modal']);

      expect(result.success).toBe(true);
      // modal -> button, card
      // button -> input, label  
      // card -> button
      // input -> label
      // So: label, input, button, card, modal
      expect(result.installOrder).toEqual(['label', 'input', 'button', 'card', 'modal']);
    });

    it('should deduplicate dependencies', async () => {
      const result = await resolver.resolveDependencies(['button', 'input']);

      expect(result.success).toBe(true);
      // Both need label, button also needs input
      expect(result.installOrder).toEqual(['label', 'input', 'button']);
      expect(result.stats.totalComponents).toBe(3);
    });

    it('should handle deep dependency trees', async () => {
      const result = await resolver.resolveDependencies(['form', 'modal']);

      expect(result.success).toBe(true);
      // All dependencies should be resolved in correct order
      // form and modal can be in either order since they don't depend on each other
      expect(result.installOrder).toEqual(['label', 'input', 'button', 'form', 'card', 'modal']);
    });
  });

  describe('circular dependency detection', () => {
    it('should detect circular dependencies', async () => {
      const result = await resolver.resolveDependencies(['circular-a']);

      expect(result.success).toBe(false);
      expect(result.circularDependencies).toHaveLength(1);
      expect(result.circularDependencies[0]).toEqual(['circular-a', 'circular-b', 'circular-c', 'circular-a']);
      expect(result.installOrder).toHaveLength(0);
    });

    it('should detect multiple circular dependencies', async () => {
      // Create components with multiple cycles
      mockComponents['cycle1-a'] = {
        name: 'cycle1-a',
        type: 'component',
        files: [],
        registryDependencies: ['cycle1-b']
      };
      mockComponents['cycle1-b'] = {
        name: 'cycle1-b',
        type: 'component', 
        files: [],
        registryDependencies: ['cycle1-a']
      };

      const result = await resolver.resolveDependencies(['circular-a', 'cycle1-a']);

      expect(result.success).toBe(false);
      expect(result.circularDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing components gracefully', async () => {
      const result = await resolver.resolveDependencies(['nonexistent-component']);

      expect(result.success).toBe(true); // Should succeed but mark as unresolved
      expect(result.unresolvedDependencies).toContain('nonexistent-component');
      expect(result.installOrder).toEqual(['nonexistent-component']);
    });

    it('should handle network errors during fetch', async () => {
      mockComponentFetcher.mockRejectedValueOnce(new Error('Network error'));

      const result = await resolver.resolveDependencies(['button']);

      expect(result.success).toBe(true); // Should continue with available info
      expect(result.unresolvedDependencies).toContain('button');
    });

    it('should handle components with missing registryDependencies field', async () => {
      mockComponents['no-deps'] = {
        name: 'no-deps',
        type: 'component',
        files: []
        // No registryDependencies field
      } as ComponentMeta;

      const result = await resolver.resolveDependencies(['no-deps']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toEqual(['no-deps']);
    });
  });

  describe('dependency tree and statistics', () => {
    it('should calculate correct dependency depths', async () => {
      const result = await resolver.resolveDependencies(['modal']);

      expect(result.success).toBe(true);
      expect(result.dependencyTree['label'].depth).toBe(0); // no dependencies
      expect(result.dependencyTree['input'].depth).toBe(1); // depends on label
      expect(result.dependencyTree['button'].depth).toBe(2); // depends on input and label (max depth + 1)
      expect(result.dependencyTree['card'].depth).toBe(3); // depends on button
      expect(result.dependencyTree['modal'].depth).toBe(4); // depends on button(2) and card(3), max is 3, so 3+1=4
    });

    it('should provide accurate statistics', async () => {
      const result = await resolver.resolveDependencies(['form', 'modal']);

      expect(result.success).toBe(true);
      expect(result.stats.totalComponents).toBe(6); // label, input, button, card, form, modal
      expect(result.stats.maxDepth).toBe(4); // modal has depth 4
      expect(result.stats.resolutionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should build correct dependency tree structure', async () => {
      const result = await resolver.resolveDependencies(['button']);

      expect(result.success).toBe(true);
      
      const tree = result.dependencyTree;
      expect(tree['button'].dependencies).toEqual(['input', 'label']);
      expect(tree['input'].dependencies).toEqual(['label']);
      expect(tree['label'].dependencies).toEqual([]);
      
      expect(tree['label'].dependents).toContain('input');
      expect(tree['label'].dependents).toContain('button');
      expect(tree['input'].dependents).toContain('button');
    });
  });

  describe('performance and optimization', () => {
    it('should resolve large dependency trees efficiently', async () => {
      // Create a larger mock component set
      for (let i = 0; i < 20; i++) {
        mockComponents[`comp-${i}`] = {
          name: `comp-${i}`,
          type: 'component',
          files: [],
          registryDependencies: i > 0 ? [`comp-${i-1}`] : []
        };
      }

      const startTime = performance.now();
      const result = await resolver.resolveDependencies(['comp-19']);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.installOrder).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle duplicate resolution requests efficiently', async () => {
      // Resolve the same dependencies multiple times
      const result1 = await resolver.resolveDependencies(['button']);
      const result2 = await resolver.resolveDependencies(['button']);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.installOrder).toEqual(result2.installOrder);
    });
  });

  describe('edge cases', () => {
    it('should handle empty component list', async () => {
      const result = await resolver.resolveDependencies([]);

      expect(result.success).toBe(true);
      expect(result.installOrder).toHaveLength(0);
      expect(result.stats.totalComponents).toBe(0);
    });

    it('should handle self-referencing components', async () => {
      mockComponents['self-ref'] = {
        name: 'self-ref',
        type: 'component',
        files: [],
        registryDependencies: ['self-ref'] // depends on itself
      };

      const result = await resolver.resolveDependencies(['self-ref']);

      expect(result.success).toBe(false);
      expect(result.circularDependencies).toHaveLength(1);
    });

    it('should handle mixed valid and invalid components', async () => {
      const result = await resolver.resolveDependencies(['button', 'invalid-component', 'label']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toContain('button');
      expect(result.installOrder).toContain('label');
      expect(result.unresolvedDependencies).toContain('invalid-component');
    });
  });
});