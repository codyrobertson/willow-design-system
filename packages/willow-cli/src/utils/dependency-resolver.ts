/**
 * Dependency Resolution Algorithm for Component Import
 * Implements graph-based dependency resolution with topological sorting
 */

import chalk from 'chalk';
import type { ComponentMeta } from '../types/index.js';

export interface DependencyNode {
  name: string;
  meta?: ComponentMeta;
  dependencies: string[];
  dependents: string[];
  depth: number;
  visited: boolean;
  visiting: boolean;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Map<string, Set<string>>;
}

export interface ResolutionResult {
  success: boolean;
  installOrder: string[];
  circularDependencies: string[][];
  unresolvedDependencies: string[];
  dependencyTree: DependencyTree;
  stats: {
    totalComponents: number;
    maxDepth: number;
    resolutionTimeMs: number;
  };
}

export interface DependencyTree {
  [component: string]: {
    dependencies: string[];
    dependents: string[];
    depth: number;
  };
}

export class DependencyResolver {
  private graph: DependencyGraph;
  private componentFetcher: (component: string) => Promise<ComponentMeta>;

  constructor(componentFetcher: (component: string) => Promise<ComponentMeta>) {
    this.graph = {
      nodes: new Map(),
      edges: new Map()
    };
    this.componentFetcher = componentFetcher;
  }

  /**
   * Resolve dependencies for a list of components
   */
  async resolveDependencies(components: string[]): Promise<ResolutionResult> {
    const startTime = performance.now();
    
    // Reset graph
    this.graph = {
      nodes: new Map(),
      edges: new Map()
    };

    try {
      // Build dependency graph
      await this.buildDependencyGraph(components);

      // Detect circular dependencies
      const circularDependencies = this.detectCircularDependencies();
      
      if (circularDependencies.length > 0) {
        return {
          success: false,
          installOrder: [],
          circularDependencies,
          unresolvedDependencies: [],
          dependencyTree: {},
          stats: {
            totalComponents: this.graph.nodes.size,
            maxDepth: 0,
            resolutionTimeMs: performance.now() - startTime
          }
        };
      }

      // Perform topological sort
      const installOrder = this.topologicalSort();

      // Find unresolved dependencies
      const unresolvedDependencies = this.findUnresolvedDependencies();

      // Calculate dependency depths
      this.calculateDepths();

      // Build dependency tree
      const dependencyTree = this.buildDependencyTree();

      const endTime = performance.now();

      return {
        success: true,
        installOrder,
        circularDependencies: [],
        unresolvedDependencies,
        dependencyTree,
        stats: {
          totalComponents: this.graph.nodes.size,
          maxDepth: Math.max(...Array.from(this.graph.nodes.values()).map(n => n.depth)),
          resolutionTimeMs: endTime - startTime
        }
      };

    } catch (error) {
      console.error(chalk.red('Failed to resolve dependencies:'), error);
      
      return {
        success: false,
        installOrder: [],
        circularDependencies: [],
        unresolvedDependencies: components,
        dependencyTree: {},
        stats: {
          totalComponents: 0,
          maxDepth: 0,
          resolutionTimeMs: performance.now() - startTime
        }
      };
    }
  }

  /**
   * Build dependency graph by fetching component metadata
   */
  private async buildDependencyGraph(rootComponents: string[]): Promise<void> {
    const visited = new Set<string>();
    const queue = [...rootComponents];

    while (queue.length > 0) {
      const component = queue.shift()!;
      
      if (visited.has(component)) continue;
      visited.add(component);

      // Create node if it doesn't exist
      if (!this.graph.nodes.has(component)) {
        this.graph.nodes.set(component, {
          name: component,
          dependencies: [],
          dependents: [],
          depth: 0,
          visited: false,
          visiting: false
        });
        this.graph.edges.set(component, new Set());
      }

      try {
        // Fetch component metadata
        const meta = await this.componentFetcher(component);
        const node = this.graph.nodes.get(component)!;
        node.meta = meta;

        // Get component dependencies (registry dependencies only)
        const dependencies = meta.registryDependencies || [];
        node.dependencies = dependencies;

        // Add dependencies to graph
        for (const dep of dependencies) {
          // Add edge from component to dependency
          this.graph.edges.get(component)!.add(dep);

          // Create dependency node if it doesn't exist
          if (!this.graph.nodes.has(dep)) {
            this.graph.nodes.set(dep, {
              name: dep,
              dependencies: [],
              dependents: [],
              depth: 0,
              visited: false,
              visiting: false
            });
            this.graph.edges.set(dep, new Set());
          }

          // Add to dependent list
          const depNode = this.graph.nodes.get(dep)!;
          if (!depNode.dependents.includes(component)) {
            depNode.dependents.push(component);
          }

          // Add to queue for processing
          if (!visited.has(dep)) {
            queue.push(dep);
          }
        }

      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Failed to fetch metadata for ${component}: ${error instanceof Error ? error.message : 'Unknown error'}`));
        // Continue with empty dependencies for missing components
      }
    }
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Reset visiting flags
    for (const node of this.graph.nodes.values()) {
      node.visited = false;
      node.visiting = false;
    }

    // Check each unvisited node
    for (const [componentName] of this.graph.nodes) {
      if (!visited.has(componentName)) {
        const cycle = this.dfsDetectCycle(componentName, visited, recursionStack, []);
        if (cycle.length > 0) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }

  /**
   * DFS helper for cycle detection
   */
  private dfsDetectCycle(
    component: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] {
    visited.add(component);
    recursionStack.add(component);
    path.push(component);

    const edges = this.graph.edges.get(component) || new Set();
    
    for (const dependency of edges) {
      if (!visited.has(dependency)) {
        const cycle = this.dfsDetectCycle(dependency, visited, recursionStack, [...path]);
        if (cycle.length > 0) return cycle;
      } else if (recursionStack.has(dependency)) {
        // Found cycle
        const cycleStart = path.indexOf(dependency);
        return path.slice(cycleStart).concat([dependency]);
      }
    }

    recursionStack.delete(component);
    return [];
  }

  /**
   * Perform topological sort using Kahn's algorithm
   * Returns components in dependency order (dependencies first)
   */
  private topologicalSort(): string[] {
    const result: string[] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degrees (how many dependencies each component has)
    for (const [component] of this.graph.nodes) {
      const edges = this.graph.edges.get(component) || new Set();
      inDegree.set(component, edges.size);
    }

    // Find nodes with no dependencies (in-degree 0)
    for (const [component, degree] of inDegree) {
      if (degree === 0) {
        queue.push(component);
      }
    }

    // Process nodes in topological order
    while (queue.length > 0) {
      const component = queue.shift()!;
      result.push(component);

      // For each component that depends on this one, reduce its in-degree
      for (const [otherComponent, edges] of this.graph.edges) {
        if (edges.has(component)) {
          const newDegree = (inDegree.get(otherComponent) || 0) - 1;
          inDegree.set(otherComponent, newDegree);
          
          if (newDegree === 0) {
            queue.push(otherComponent);
          }
        }
      }
    }

    return result;
  }

  /**
   * Find components that couldn't be resolved
   */
  private findUnresolvedDependencies(): string[] {
    const unresolved: string[] = [];
    
    for (const [component, node] of this.graph.nodes) {
      if (!node.meta) {
        unresolved.push(component);
      }
    }

    return unresolved;
  }

  /**
   * Calculate dependency depths for visualization
   * Depth 0 = no dependencies, depth 1 = depends on depth 0 components, etc.
   */
  private calculateDepths(): void {
    // Reset all depths
    for (const node of this.graph.nodes.values()) {
      node.depth = 0;
    }

    // Use topological ordering to calculate depths correctly
    const sorted = this.topologicalSort();
    const depths = new Map<string, number>();

    // Calculate depth for each component based on its dependencies
    for (const component of sorted) {
      const node = this.graph.nodes.get(component);
      if (!node) continue;

      let maxDepth = 0;
      const dependencies = node.dependencies || [];
      
      // Find the maximum depth among all dependencies and add 1
      for (const dep of dependencies) {
        const depDepth = depths.get(dep) || 0;
        maxDepth = Math.max(maxDepth, depDepth + 1);
      }

      depths.set(component, maxDepth);
      node.depth = maxDepth;
    }
  }

  /**
   * Build dependency tree for visualization
   */
  private buildDependencyTree(): DependencyTree {
    const tree: DependencyTree = {};

    for (const [component, node] of this.graph.nodes) {
      tree[component] = {
        dependencies: node.dependencies,
        dependents: node.dependents,
        depth: node.depth
      };
    }

    return tree;
  }

  /**
   * Get dependency graph for debugging
   */
  getDependencyGraph(): DependencyGraph {
    return this.graph;
  }

  /**
   * Print dependency tree for debugging
   */
  printDependencyTree(tree: DependencyTree): void {
    console.log(chalk.bold('\n📊 Dependency Tree:'));
    
    const componentsByDepth = new Map<number, string[]>();
    
    // Group components by depth
    for (const [component, info] of Object.entries(tree)) {
      const depth = info.depth;
      if (!componentsByDepth.has(depth)) {
        componentsByDepth.set(depth, []);
      }
      componentsByDepth.get(depth)!.push(component);
    }

    // Print by depth levels
    const maxDepth = Math.max(...Array.from(componentsByDepth.keys()));
    for (let depth = 0; depth <= maxDepth; depth++) {
      const components = componentsByDepth.get(depth) || [];
      if (components.length > 0) {
        console.log(chalk.cyan(`\nLevel ${depth}:`));
        components.forEach(component => {
          const info = tree[component];
          const depStr = info.dependencies.length > 0 ? ` (deps: ${info.dependencies.join(', ')})` : '';
          console.log(`  ${chalk.gray('├─')} ${component}${depStr}`);
        });
      }
    }
  }
}