/**
 * Advanced Dependency Resolution Tests
 * Tests for version conflicts, suggestions, and advanced features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyResolver } from '../dependency-resolver.js';
import type { ComponentMeta } from '../../types/index.js';

describe('DependencyResolver - Advanced Features', () => {
  let resolver: DependencyResolver;
  let mockFetcher: ReturnType<typeof vi.fn>;
  
  const createMockComponent = (
    name: string, 
    dependencies: string[] = [],
    version: string = '1.0.0'
  ): ComponentMeta => ({
    name,
    description: `${name} component`,
    version,
    category: 'ui',
    framework: 'react',
    uiKit: 'radix',
    dependencies: [],
    peerDependencies: {},
    registryDependencies: dependencies,
    files: [],
    examples: [],
    style: 'css'
  });

  beforeEach(() => {
    mockFetcher = vi.fn();
    resolver = new DependencyResolver(mockFetcher);
  });

  describe('version conflict detection and resolution', () => {
    it('should detect version conflicts between components', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['button@^1.0.0']))
        .mockResolvedValueOnce(createMockComponent('dialog', ['button@^2.0.0']))
        .mockResolvedValueOnce(createMockComponent('button', [], '1.5.0'));

      const result = await resolver.resolveDependencies(['form', 'dialog']);

      expect(result.versionConflicts).toHaveLength(1);
      expect(result.versionConflicts[0]).toMatchObject({
        component: 'button',
        requestedVersions: expect.arrayContaining([
          { version: '^1.0.0', requestedBy: 'form' },
          { version: '^2.0.0', requestedBy: 'dialog' }
        ]),
        resolution: 'failed'
      });
    });

    it('should auto-resolve compatible semver ranges', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['button@^1.2.0']))
        .mockResolvedValueOnce(createMockComponent('dialog', ['button@^1.0.0']))
        .mockResolvedValueOnce(createMockComponent('button', [], '1.5.0'));

      const result = await resolver.resolveDependencies(['form', 'dialog']);

      expect(result.success).toBe(true);
      expect(result.versionConflicts[0].resolution).toBe('auto');
      expect(result.versionConflicts[0].resolvedVersion).toBeDefined();
    });

    it('should handle latest tag specially', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['button@latest']))
        .mockResolvedValueOnce(createMockComponent('dialog', ['button@^1.0.0']))
        .mockResolvedValueOnce(createMockComponent('button', [], '2.0.0'));

      const result = await resolver.resolveDependencies(['form', 'dialog']);

      expect(result.versionConflicts).toHaveLength(1);
      expect(result.versionConflicts[0].requestedVersions).toHaveLength(2);
    });

    it('should handle exact version matches', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['button@1.2.3']))
        .mockResolvedValueOnce(createMockComponent('dialog', ['button@1.2.3']))
        .mockResolvedValueOnce(createMockComponent('button', [], '1.2.3'));

      const result = await resolver.resolveDependencies(['form', 'dialog']);

      expect(result.success).toBe(true);
      // Should not have conflicts if versions match exactly
      expect(result.versionConflicts.filter(c => !c.resolvedVersion)).toHaveLength(0);
    });
  });

  describe('missing dependency suggestions', () => {
    let suggestionsResolver: DependencyResolver;
    
    beforeEach(async () => {
      // Create a separate resolver instance for suggestions tests
      const suggestionsFetcher = vi.fn();
      suggestionsResolver = new DependencyResolver(suggestionsFetcher);
      
      // Pre-populate resolver with known components for suggestions
      suggestionsFetcher
        .mockResolvedValueOnce(createMockComponent('button'))
        .mockResolvedValueOnce(createMockComponent('input'))
        .mockResolvedValueOnce(createMockComponent('checkbox'))
        .mockResolvedValueOnce(createMockComponent('radio-button'))
        .mockResolvedValueOnce(createMockComponent('select'));
      
      await suggestionsResolver.resolveDependencies(['button', 'input', 'checkbox', 'radio-button', 'select']);
      
      // Now set up for the actual test
      mockFetcher = suggestionsFetcher;
      resolver = suggestionsResolver;
      mockFetcher.mockClear();
    });

    it('should suggest similar component names using Levenshtein distance', async () => {
      // The pre-populated components should still be in the graph
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['buttn']))
        .mockRejectedValueOnce(new Error('Component not found'));

      const result = await resolver.resolveDependencies(['form']);
      const suggestions = resolver.suggestMissingDependencyFixes(['buttn']);

      expect(suggestions.get('buttn')).toBeDefined();
      const buttnSuggestions = suggestions.get('buttn');
      expect(buttnSuggestions).toBeDefined();
      expect(buttnSuggestions!.length).toBeGreaterThan(0);
      expect(buttnSuggestions![0]).toContain('button');
    });

    it('should suggest known aliases', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['btn']))
        .mockRejectedValueOnce(new Error('Component not found'));

      const result = await resolver.resolveDependencies(['form']);
      const suggestions = resolver.suggestMissingDependencyFixes(['btn']);

      expect(suggestions.get('btn')).toContain('Use "button" instead');
    });

    it('should suggest case corrections', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['CheckBox']))
        .mockRejectedValueOnce(new Error('Component not found'));

      const result = await resolver.resolveDependencies(['form']);
      const suggestions = resolver.suggestMissingDependencyFixes(['CheckBox']);

      const checkBoxSuggestions = suggestions.get('CheckBox');
      expect(checkBoxSuggestions).toBeDefined();
      expect(checkBoxSuggestions!.length).toBeGreaterThan(0);
      expect(checkBoxSuggestions![0]).toMatch(/checkbox/i);
    });

    it('should suggest kebab-case to camelCase conversions', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['radioButton']))
        .mockRejectedValueOnce(new Error('Component not found'));

      const result = await resolver.resolveDependencies(['form']);
      const suggestions = resolver.suggestMissingDependencyFixes(['radioButton']);

      const radioSuggestions = suggestions.get('radioButton');
      expect(radioSuggestions).toBeDefined();
      expect(radioSuggestions!.length).toBeGreaterThan(0);
      expect(radioSuggestions![0]).toContain('radio-button');
    });

    it('should suggest plural/singular forms', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['checkboxes']))
        .mockRejectedValueOnce(new Error('Component not found'));

      const result = await resolver.resolveDependencies(['form']);
      const suggestions = resolver.suggestMissingDependencyFixes(['checkboxes']);

      const checkboxesSuggestions = suggestions.get('checkboxes');
      expect(checkboxesSuggestions).toBeDefined();
      expect(checkboxesSuggestions!.length).toBeGreaterThan(0);
      expect(checkboxesSuggestions![0]).toContain('checkbox');
    });

    it('should provide multiple suggestions when appropriate', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['slect']))
        .mockRejectedValueOnce(new Error('Component not found'));

      const result = await resolver.resolveDependencies(['form']);
      const suggestions = resolver.suggestMissingDependencyFixes(['slect']);

      const slectSuggestions = suggestions.get('slect');
      expect(slectSuggestions).toBeDefined();
      expect(slectSuggestions!.length).toBeGreaterThan(0);
      expect(slectSuggestions![0]).toContain('select');
    });
  });

  describe('dependency graph operations', () => {
    it('should build correct dependency graph with nodes and edges', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('app', ['form', 'modal']))
        .mockResolvedValueOnce(createMockComponent('form', ['input']))
        .mockResolvedValueOnce(createMockComponent('modal', ['button']))
        .mockResolvedValueOnce(createMockComponent('input'))
        .mockResolvedValueOnce(createMockComponent('button'));

      const result = await resolver.resolveDependencies(['app']);
      const graph = resolver.getDependencyGraph();

      expect(graph.nodes.size).toBe(5);
      expect(graph.nodes.get('app')?.dependencies).toEqual(['form', 'modal']);
      expect(graph.edges.get('app')).toContain('form');
      expect(graph.edges.get('app')).toContain('modal');
    });

    it('should track dependents correctly', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['button']))
        .mockResolvedValueOnce(createMockComponent('modal', ['button']))
        .mockResolvedValueOnce(createMockComponent('button'));

      const result = await resolver.resolveDependencies(['form', 'modal']);
      const graph = resolver.getDependencyGraph();

      const buttonNode = graph.nodes.get('button');
      expect(buttonNode?.dependents).toContain('form');
      expect(buttonNode?.dependents).toContain('modal');
    });
  });

  describe('complex resolution scenarios', () => {
    it('should handle diamond dependencies', async () => {
      // A depends on B and C, both B and C depend on D
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('a', ['b', 'c']))
        .mockResolvedValueOnce(createMockComponent('b', ['d']))
        .mockResolvedValueOnce(createMockComponent('c', ['d']))
        .mockResolvedValueOnce(createMockComponent('d'));

      const result = await resolver.resolveDependencies(['a']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toEqual(['d', 'b', 'c', 'a']);
      expect(result.stats.totalComponents).toBe(4);
    });

    it('should handle mixed version requirements', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('app', ['lib@^2.0.0', 'util@~1.5.0']))
        .mockResolvedValueOnce(createMockComponent('lib', [], '2.3.0'))
        .mockResolvedValueOnce(createMockComponent('util', [], '1.5.8'));

      const result = await resolver.resolveDependencies(['app']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toContain('lib');
      expect(result.installOrder).toContain('util');
    });

    it('should handle components with no version specified', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('form', ['button', 'input@^1.0.0']))
        .mockResolvedValueOnce(createMockComponent('button'))
        .mockResolvedValueOnce(createMockComponent('input', [], '1.2.0'));

      const result = await resolver.resolveDependencies(['form']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toHaveLength(3);
    });
  });

  describe('error recovery and resilience', () => {
    it('should continue resolution when some dependencies fail', async () => {
      mockFetcher
        .mockResolvedValueOnce(createMockComponent('app', ['valid', 'invalid']))
        .mockResolvedValueOnce(createMockComponent('valid'))
        .mockRejectedValueOnce(new Error('Component not found'));

      const result = await resolver.resolveDependencies(['app']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toContain('valid');
      expect(result.installOrder).toContain('app');
      expect(result.unresolvedDependencies).toContain('invalid');
    });

    it('should handle partial metadata', async () => {
      const partialComponent: Partial<ComponentMeta> = {
        name: 'partial',
        registryDependencies: ['button']
      };

      mockFetcher
        .mockResolvedValueOnce(partialComponent as ComponentMeta)
        .mockResolvedValueOnce(createMockComponent('button'));

      const result = await resolver.resolveDependencies(['partial']);

      expect(result.success).toBe(true);
      expect(result.installOrder).toContain('button');
      expect(result.installOrder).toContain('partial');
    });
  });

  describe('performance characteristics', () => {
    it('should handle wide dependency trees efficiently', async () => {
      // Create a component with many direct dependencies
      const wideDeps = Array.from({ length: 50 }, (_, i) => `dep-${i}`);
      
      mockFetcher.mockResolvedValueOnce(createMockComponent('wide', wideDeps));
      wideDeps.forEach(dep => {
        mockFetcher.mockResolvedValueOnce(createMockComponent(dep));
      });

      const startTime = performance.now();
      const result = await resolver.resolveDependencies(['wide']);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.installOrder).toHaveLength(51);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should track resolution time accurately', async () => {
      mockFetcher.mockResolvedValueOnce(createMockComponent('simple'));

      const result = await resolver.resolveDependencies(['simple']);

      expect(result.stats.resolutionTimeMs).toBeGreaterThan(0);
      expect(result.stats.resolutionTimeMs).toBeLessThan(1000);
    });
  });
});