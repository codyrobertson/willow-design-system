/**
 * Dependency Visualizer Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyVisualizer } from '../dependency-visualizer.js';
import type { DependencyTree, DependencyGraph } from '../dependency-resolver.js';
import * as fs from 'fs/promises';

vi.mock('fs/promises');

describe('DependencyVisualizer', () => {
  let visualizer: DependencyVisualizer;
  
  const mockTree: DependencyTree = {
    'app': { dependencies: ['form', 'modal'], dependents: [], depth: 2 },
    'form': { dependencies: ['input', 'button'], dependents: ['app'], depth: 1 },
    'modal': { dependencies: ['button'], dependents: ['app'], depth: 1 },
    'button': { dependencies: [], dependents: ['form', 'modal'], depth: 0 },
    'input': { dependencies: [], dependents: ['form'], depth: 0 }
  };

  const mockGraph: DependencyGraph = {
    nodes: new Map([
      ['app', { name: 'app', dependencies: ['form', 'modal'], dependents: [], depth: 2, visited: false, visiting: false }],
      ['form', { name: 'form', dependencies: ['input', 'button'], dependents: ['app'], depth: 1, visited: false, visiting: false }],
      ['modal', { name: 'modal', dependencies: ['button'], dependents: ['app'], depth: 1, visited: false, visiting: false }],
      ['button', { name: 'button', dependencies: [], dependents: ['form', 'modal'], depth: 0, visited: false, visiting: false }],
      ['input', { name: 'input', dependencies: [], dependents: ['form'], depth: 0, visited: false, visiting: false }]
    ]),
    edges: new Map([
      ['app', new Set(['form', 'modal'])],
      ['form', new Set(['input', 'button'])],
      ['modal', new Set(['button'])],
      ['button', new Set()],
      ['input', new Set()]
    ])
  };

  beforeEach(() => {
    vi.clearAllMocks();
    visualizer = new DependencyVisualizer();
  });

  describe('text format visualization', () => {
    it('should generate text tree visualization', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'text' });

      expect(result).toContain('📦 Dependency Tree');
      expect(result).toContain('button');
      expect(result).toContain('input');
      expect(result).toContain('form');
      expect(result).toContain('modal');
      expect(result).toContain('app');
    });

    it('should show depth information when enabled', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { 
        format: 'text',
        showDepth: true 
      });

      expect(result).toContain('[depth: 0]');
      expect(result).toContain('[depth: 1]');
      expect(result).toContain('[depth: 2]');
    });

    it('should show dependent counts', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'text' });

      expect(result).toContain('(2 dependents)'); // button has 2 dependents
      expect(result).toContain('(1 dependents)'); // input has 1 dependent
    });

    it('should handle circular references', () => {
      const circularTree: DependencyTree = {
        'a': { dependencies: ['b'], dependents: ['b'], depth: 0 },
        'b': { dependencies: ['a'], dependents: ['a'], depth: 0 }
      };

      const result = visualizer.visualize(circularTree, mockGraph, { format: 'text' });

      expect(result).toContain('(circular reference)');
    });

    it('should respect maxDepth option', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { 
        format: 'text',
        maxDepth: 1 
      });

      // Should show depth 0 and 1, but not depth 2 (app)
      expect(result).toContain('button');
      expect(result).toContain('form');
      expect(result).not.toContain('app');
    });
  });

  describe('DOT format visualization', () => {
    it('should generate valid DOT format', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'dot' });

      expect(result).toContain('digraph Dependencies {');
      expect(result).toContain('rankdir=TB;');
      expect(result).toContain('}');
      
      // Check nodes
      expect(result).toContain('"button" [');
      expect(result).toContain('"input" [');
      
      // Check edges
      expect(result).toContain('"form" -> "button"');
      expect(result).toContain('"form" -> "input"');
    });

    it('should apply color coding by depth', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'dot' });

      // Check for fillcolor attribute
      expect(result).toMatch(/fillcolor="#[a-f0-9]{6}"/);
      expect(result).toContain('style=filled');
    });

    it('should show versions when enabled', () => {
      const graphWithVersions: DependencyGraph = {
        nodes: new Map([
          ['button', { 
            name: 'button', 
            version: '1.2.3',
            dependencies: [], 
            dependents: [], 
            depth: 0, 
            visited: false, 
            visiting: false 
          }]
        ]),
        edges: new Map()
      };

      const result = visualizer.visualize(
        { button: { dependencies: [], dependents: [], depth: 0 } }, 
        graphWithVersions, 
        { format: 'dot', showVersions: true }
      );

      expect(result).toContain('1.2.3');
    });

    it('should highlight circular dependencies', () => {
      const circularGraph: DependencyGraph = {
        nodes: new Map([
          ['a', { name: 'a', dependencies: ['b'], dependents: ['b'], depth: 0, visited: false, visiting: false }],
          ['b', { name: 'b', dependencies: ['a'], dependents: ['a'], depth: 0, visited: false, visiting: false }]
        ]),
        edges: new Map([
          ['a', new Set(['b'])],
          ['b', new Set(['a'])]
        ])
      };

      const result = visualizer.visualize(
        { a: { dependencies: ['b'], dependents: ['b'], depth: 0 },
          b: { dependencies: ['a'], dependents: ['a'], depth: 0 } },
        circularGraph,
        { format: 'dot', highlightCycles: true }
      );

      expect(result).toContain('color=red');
      expect(result).toContain('penwidth=2');
    });
  });

  describe('JSON format visualization', () => {
    it('should generate valid JSON', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'json' });
      
      expect(() => JSON.parse(result)).not.toThrow();
      
      const data = JSON.parse(result);
      expect(data).toHaveProperty('nodes');
      expect(data).toHaveProperty('edges');
      expect(data).toHaveProperty('tree');
      expect(data).toHaveProperty('metadata');
    });

    it('should include all node information', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'json' });
      const data = JSON.parse(result);

      expect(data.nodes).toHaveLength(5);
      expect(data.nodes[0]).toHaveProperty('id');
      expect(data.nodes[0]).toHaveProperty('name');
      expect(data.nodes[0]).toHaveProperty('depth');
      expect(data.nodes[0]).toHaveProperty('dependencies');
      expect(data.nodes[0]).toHaveProperty('dependents');
    });

    it('should include metadata', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'json' });
      const data = JSON.parse(result);

      expect(data.metadata.totalNodes).toBe(5);
      expect(data.metadata.totalEdges).toBe(5);
      expect(data.metadata.maxDepth).toBe(2);
      expect(data.metadata.generated).toBeDefined();
    });
  });

  describe('HTML format visualization', () => {
    it('should generate valid HTML with D3.js', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'html' });

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html>');
      expect(result).toContain('</html>');
      expect(result).toContain('d3.js');
      expect(result).toContain('force-directed graph');
    });

    it('should include interactive features', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'html' });

      expect(result).toContain('drag');
      expect(result).toContain('click');
      expect(result).toContain('nodeInfo');
    });

    it('should embed JSON data correctly', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'html' });

      // Check that JSON data is embedded
      expect(result).toContain('const data =');
      expect(result).toContain('"nodes"');
      expect(result).toContain('"edges"');
    });

    it('should include styling', () => {
      const result = visualizer.visualize(mockTree, mockGraph, { format: 'html' });

      expect(result).toContain('<style>');
      expect(result).toContain('</style>');
      expect(result).toContain('.node');
      expect(result).toContain('.link');
    });
  });

  describe('file export', () => {
    it('should export visualization to file', async () => {
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      await visualizer.exportToFile(mockTree, mockGraph, '/tmp/graph.dot', { format: 'dot' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/graph.dot',
        expect.stringContaining('digraph Dependencies'),
        'utf-8'
      );
    });

    it('should use correct format based on options', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await visualizer.exportToFile(mockTree, mockGraph, '/tmp/graph.json', { format: 'json' });
      await visualizer.exportToFile(mockTree, mockGraph, '/tmp/graph.html', { format: 'html' });

      const calls = vi.mocked(fs.writeFile).mock.calls;
      
      // Check JSON export
      expect(() => JSON.parse(calls[0][1] as string)).not.toThrow();
      
      // Check HTML export
      expect(calls[1][1]).toContain('<!DOCTYPE html>');
    });
  });

  describe('edge cases', () => {
    it('should handle empty dependency tree', () => {
      const emptyTree: DependencyTree = {};
      const emptyGraph: DependencyGraph = {
        nodes: new Map(),
        edges: new Map()
      };

      const result = visualizer.visualize(emptyTree, emptyGraph, { format: 'text' });

      expect(result).toContain('📦 Dependency Tree');
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    it('should handle single node', () => {
      const singleTree: DependencyTree = {
        'solo': { dependencies: [], dependents: [], depth: 0 }
      };
      const singleGraph: DependencyGraph = {
        nodes: new Map([
          ['solo', { name: 'solo', dependencies: [], dependents: [], depth: 0, visited: false, visiting: false }]
        ]),
        edges: new Map([['solo', new Set()]])
      };

      const result = visualizer.visualize(singleTree, singleGraph, { format: 'text' });

      expect(result).toContain('solo');
    });

    it('should handle disconnected components', () => {
      const disconnectedTree: DependencyTree = {
        'island1': { dependencies: [], dependents: [], depth: 0 },
        'island2': { dependencies: [], dependents: [], depth: 0 }
      };

      const result = visualizer.visualize(disconnectedTree, mockGraph, { format: 'text' });

      expect(result).toContain('island1');
      expect(result).toContain('island2');
    });
  });
});