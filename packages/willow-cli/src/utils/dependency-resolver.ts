/**
 * Dependency Resolution Algorithm for Component Import
 * Implements graph-based dependency resolution with topological sorting
 */

import chalk from 'chalk';
import semver from 'semver';
import { performance } from 'perf_hooks';
import type { ComponentMeta } from '../types/index.js';

export interface DependencyNode {
  name: string;
  version?: string;
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

export interface VersionConflict {
  component: string;
  requestedVersions: Array<{
    version: string;
    requestedBy: string;
  }>;
  resolvedVersion?: string;
  resolution: 'auto' | 'manual' | 'failed';
}

export interface ResolutionResult {
  success: boolean;
  installOrder: string[];
  circularDependencies: string[][];
  unresolvedDependencies: string[];
  versionConflicts: VersionConflict[];
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
  private knownComponents: Set<string> = new Set();

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
          versionConflicts: [],
          dependencyTree: {},
          stats: {
            totalComponents: this.graph.nodes.size,
            maxDepth: 0,
            resolutionTimeMs: performance.now() - startTime
          }
        };
      }

      // Detect version conflicts
      const versionConflicts = this.detectVersionConflicts();

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
        versionConflicts,
        dependencyTree,
        stats: {
          totalComponents: this.graph.nodes.size,
          maxDepth: this.graph.nodes.size > 0 ? Math.max(...Array.from(this.graph.nodes.values()).map(n => n.depth)) : 0,
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
        versionConflicts: [],
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
      
      // Parse component name if it has version
      const componentMatch = component.match(/^(.+?)@(.+)$/);
      const componentName = componentMatch ? componentMatch[1] : component;
      const componentVersion = componentMatch ? componentMatch[2] : undefined;
      
      if (visited.has(componentName)) continue;
      visited.add(componentName);

      // Create node if it doesn't exist
      if (!this.graph.nodes.has(componentName)) {
        this.graph.nodes.set(componentName, {
          name: componentName,
          version: componentVersion,
          dependencies: [],
          dependents: [],
          depth: 0,
          visited: false,
          visiting: false
        });
        this.graph.edges.set(componentName, new Set());
      }
      
      // Track known components
      this.knownComponents.add(componentName);

      try {
        // Fetch component metadata (use base name)
        const meta = await this.componentFetcher(componentName);
        const node = this.graph.nodes.get(componentName)!;
        node.meta = meta;
        if (meta.version) {
          node.version = meta.version;
        }

        // Get component dependencies (registry dependencies only)
        const dependencies = meta.registryDependencies || [];
        node.dependencies = dependencies;

        // Add dependencies to graph
        for (const dep of dependencies) {
          // Parse dependency name and version
          const match = dep.match(/^(.+?)@(.+)$/);
          const depName = match ? match[1] : dep;
          const depVersion = match ? match[2] : 'latest';
          
          // Add edge from component to dependency (use base name)
          this.graph.edges.get(componentName)!.add(depName);

          // Create dependency node if it doesn't exist
          if (!this.graph.nodes.has(depName)) {
            this.graph.nodes.set(depName, {
              name: depName,
              version: depVersion,
              dependencies: [],
              dependents: [],
              depth: 0,
              visited: false,
              visiting: false
            });
            this.graph.edges.set(depName, new Set());
          }
          
          // Track known components
          this.knownComponents.add(depName);

          // Add to dependent list
          const depNode = this.graph.nodes.get(depName)!;
          if (!depNode.dependents.includes(componentName)) {
            depNode.dependents.push(componentName);
          }

          // Add to queue for processing
          if (!visited.has(depName)) {
            queue.push(depName);
          }
        }

      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Failed to fetch metadata for ${componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
   * Detect version conflicts in dependencies
   */
  private detectVersionConflicts(): VersionConflict[] {
    const conflicts: VersionConflict[] = [];
    const componentVersions = new Map<string, Map<string, Set<string>>>();

    // Build version requirements map
    for (const [componentName, node] of this.graph.nodes) {
      if (node.meta?.registryDependencies) {
        for (const dep of node.meta.registryDependencies) {
          // Parse dependency with version (e.g., "button@^1.0.0")
          const match = dep.match(/^(.+?)@(.+)$/);
          const depName = match ? match[1] : dep;
          const depVersion = match ? match[2] : 'latest';

          if (!componentVersions.has(depName)) {
            componentVersions.set(depName, new Map());
          }
          
          const versions = componentVersions.get(depName)!;
          if (!versions.has(depVersion)) {
            versions.set(depVersion, new Set());
          }
          versions.get(depVersion)!.add(componentName);
        }
      }
    }

    // Check for conflicts
    for (const [component, versions] of componentVersions) {
      if (versions.size > 1) {
        const versionList = Array.from(versions.entries()).map(([version, requesters]) => ({
          version,
          requestedBy: Array.from(requesters)
        }));

        // Try to resolve conflict automatically
        const resolvedVersion = this.resolveVersionConflict(
          component,
          versionList.map(v => v.version)
        );

        conflicts.push({
          component,
          requestedVersions: versionList.flatMap(v => 
            v.requestedBy.map(r => ({ version: v.version, requestedBy: r }))
          ),
          resolvedVersion: resolvedVersion || undefined,
          resolution: resolvedVersion ? 'auto' : 'failed'
        });
      }
    }

    return conflicts;
  }

  /**
   * Attempt to resolve version conflicts using semver
   */
  private resolveVersionConflict(component: string, versions: string[]): string | null {
    // Remove duplicates
    const uniqueVersions = [...new Set(versions)];
    
    // If only one version, no conflict
    if (uniqueVersions.length === 1) {
      return uniqueVersions[0];
    }

    // Handle 'latest' tag
    const nonLatestVersions = uniqueVersions.filter(v => v !== 'latest');
    if (nonLatestVersions.length === 0) {
      return 'latest';
    }

    // Try to find a version that satisfies all ranges
    const ranges = nonLatestVersions.filter(v => v.includes('^') || v.includes('~') || v.includes('>') || v.includes('<'));
    const exactVersions = nonLatestVersions.filter(v => semver.valid(v));

    // If we have exact versions, pick the highest
    if (exactVersions.length > 0) {
      const sorted = exactVersions.sort((a, b) => semver.rcompare(a, b));
      const highest = sorted[0];
      
      // Check if this version satisfies all ranges
      if (ranges.every(range => semver.satisfies(highest, range))) {
        return highest;
      }
    }

    // Try to find an intersection of all ranges
    if (ranges.length > 0) {
      // This is a simplified approach - in reality we'd need to compute
      // the intersection of all ranges
      try {
        const minVersion = semver.minVersion(ranges[0]);
        if (minVersion && ranges.every(range => semver.satisfies(minVersion.version, range))) {
          return minVersion.version;
        }
      } catch {
        // Invalid range, fall through
      }
    }

    // Could not resolve automatically
    return null;
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

  /**
   * Suggest fixes for missing dependencies
   */
  suggestMissingDependencyFixes(unresolvedDeps: string[]): Map<string, string[]> {
    const suggestions = new Map<string, string[]>();
    
    for (const dep of unresolvedDeps) {
      const possibleFixes: string[] = [];
      
      // Check for typos in existing components
      const similarComponents = this.findSimilarComponents(dep);
      if (similarComponents.length > 0) {
        possibleFixes.push(...similarComponents.map(c => `Did you mean "${c}"?`));
      }
      
      // Check if it's a known alias
      const aliases = this.getKnownAliases();
      if (aliases.has(dep)) {
        possibleFixes.push(`Use "${aliases.get(dep)}" instead`);
      }
      
      // Check for common naming patterns
      const namingFixes = this.checkNamingPatterns(dep);
      if (namingFixes.length > 0) {
        possibleFixes.push(...namingFixes);
      }
      
      suggestions.set(dep, possibleFixes);
    }
    
    return suggestions;
  }

  /**
   * Find components with similar names using Levenshtein distance
   */
  private findSimilarComponents(name: string): string[] {
    const similar: Array<{ name: string; distance: number }> = [];
    const threshold = 3; // Maximum edit distance
    
    // Use knownComponents which persists across resolveDependencies calls
    for (const componentName of this.knownComponents) {
      const distance = this.levenshteinDistance(name.toLowerCase(), componentName.toLowerCase());
      if (distance <= threshold && distance > 0) {
        similar.push({ name: componentName, distance });
      }
    }
    
    return similar
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(s => s.name);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  /**
   * Get known component aliases
   */
  private getKnownAliases(): Map<string, string> {
    return new Map([
      ['btn', 'button'],
      ['msg', 'message'],
      ['notification', 'alert'],
      ['dialog', 'modal'],
      ['popover', 'tooltip'],
      ['checkbox', 'check-box'],
      ['radiobutton', 'radio-button'],
      ['selectbox', 'select'],
      ['dropdown', 'select'],
    ]);
  }

  /**
   * Check for common naming pattern issues
   */
  private checkNamingPatterns(name: string): string[] {
    const suggestions: string[] = [];
    
    // Check for case variations
    const lowerName = name.toLowerCase();
    for (const known of this.knownComponents) {
      if (known.toLowerCase() === lowerName && known !== name) {
        suggestions.push(`Did you mean "${known}"?`);
      }
    }
    
    // Check for camelCase vs kebab-case
    if (name.includes('-')) {
      const camelCase = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (this.knownComponents.has(camelCase)) {
        suggestions.push(`Use camelCase: "${camelCase}"`);
      }
    } else if (/[A-Z]/.test(name)) {
      const kebabCase = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
      if (this.knownComponents.has(kebabCase)) {
        suggestions.push(`Use kebab-case: "${kebabCase}"`);
      }
    }
    
    // Check for plural/singular
    if (name.endsWith('s')) {
      const singular = name.slice(0, -1);
      if (this.knownComponents.has(singular)) {
        suggestions.push(`Use singular form: "${singular}"`);
      }
    } else {
      const plural = name + 's';
      if (this.knownComponents.has(plural)) {
        suggestions.push(`Use plural form: "${plural}"`);
      }
    }
    
    return suggestions;
  }
}