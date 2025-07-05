/**
 * Advanced Dependency Visualization
 * Generates visual representations of dependency graphs
 */

import chalk from 'chalk';
import type { DependencyTree, DependencyGraph } from './dependency-resolver.js';

export interface VisualizationOptions {
  format?: 'text' | 'dot' | 'json' | 'html';
  showVersions?: boolean;
  showDepth?: boolean;
  highlightCycles?: boolean;
  maxDepth?: number;
}

export class DependencyVisualizer {
  /**
   * Generate visualization in specified format
   */
  visualize(
    tree: DependencyTree,
    graph: DependencyGraph,
    options: VisualizationOptions = {}
  ): string {
    const format = options.format || 'text';
    
    switch (format) {
      case 'dot':
        return this.generateDotFormat(graph, options);
      case 'json':
        return this.generateJsonFormat(tree, graph, options);
      case 'html':
        return this.generateHtmlFormat(tree, graph, options);
      case 'text':
      default:
        return this.generateTextFormat(tree, options);
    }
  }

  /**
   * Generate text-based tree visualization
   */
  private generateTextFormat(tree: DependencyTree, options: VisualizationOptions): string {
    const lines: string[] = [];
    const visited = new Set<string>();
    const { maxDepth = Infinity, showDepth = true } = options;
    
    // Find root nodes (no dependencies or lowest depth)
    const roots = Object.entries(tree)
      .filter(([_, info]) => info.dependencies.length === 0 || info.depth === 0)
      .map(([name]) => name);
    
    lines.push(chalk.bold('📦 Dependency Tree\n'));
    
    for (const root of roots) {
      this.printNode(root, tree, lines, visited, '', true, 0, maxDepth, showDepth);
    }
    
    // Print any remaining nodes not connected to roots
    const remaining = Object.keys(tree).filter(name => !visited.has(name));
    if (remaining.length > 0) {
      lines.push(chalk.yellow('\n⚠️  Disconnected components:'));
      for (const name of remaining) {
        this.printNode(name, tree, lines, visited, '', true, 0, maxDepth, showDepth);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Recursive helper to print tree nodes
   */
  private printNode(
    name: string,
    tree: DependencyTree,
    lines: string[],
    visited: Set<string>,
    prefix: string,
    isLast: boolean,
    currentDepth: number,
    maxDepth: number,
    showDepth: boolean
  ): void {
    if (visited.has(name)) {
      lines.push(prefix + (isLast ? '└─ ' : '├─ ') + chalk.gray(`${name} (circular reference)`));
      return;
    }
    
    const info = tree[name];
    if (!info) return;
    
    // Check if node's depth exceeds maxDepth
    if (info.depth > maxDepth) {
      return;
    }
    
    visited.add(name);
    
    // Format node display
    let nodeStr = name;
    if (showDepth) {
      nodeStr += chalk.gray(` [depth: ${info.depth}]`);
    }
    if (info.dependents.length > 0) {
      nodeStr += chalk.cyan(` (${info.dependents.length} dependents)`);
    }
    
    lines.push(prefix + (isLast ? '└─ ' : '├─ ') + nodeStr);
    
    // Print dependencies
    const deps = info.dependencies;
    deps.forEach((dep, index) => {
      const isLastDep = index === deps.length - 1;
      const extension = isLast ? '   ' : '│  ';
      this.printNode(dep, tree, lines, visited, prefix + extension, isLastDep, currentDepth + 1, maxDepth, showDepth);
    });
  }

  /**
   * Generate DOT format for Graphviz
   */
  private generateDotFormat(graph: DependencyGraph, options: VisualizationOptions): string {
    const lines: string[] = [];
    const { showVersions = false, highlightCycles = false } = options;
    
    lines.push('digraph Dependencies {');
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box, style=rounded];');
    lines.push('');
    
    // Define nodes with attributes
    for (const [name, node] of graph.nodes) {
      let label = name;
      if (showVersions && node.version) {
        label += `\\n${node.version}`;
      }
      
      let attributes = `label="${label}"`;
      
      // Color by depth
      const colors = ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a'];
      const color = colors[Math.min(node.depth, colors.length - 1)];
      attributes += `, fillcolor="${color}", style=filled`;
      
      lines.push(`  "${name}" [${attributes}];`);
    }
    
    lines.push('');
    
    // Define edges
    for (const [from, edges] of graph.edges) {
      for (const to of edges) {
        let attributes = '';
        
        // Highlight circular dependencies if requested
        if (highlightCycles && this.isPartOfCycle(from, to, graph)) {
          attributes = ' [color=red, penwidth=2]';
        }
        
        lines.push(`  "${from}" -> "${to}"${attributes};`);
      }
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  /**
   * Generate JSON format
   */
  private generateJsonFormat(tree: DependencyTree, graph: DependencyGraph, options: VisualizationOptions): string {
    const data = {
      nodes: Array.from(graph.nodes.entries()).map(([name, node]) => ({
        id: name,
        name,
        version: node.version,
        depth: node.depth,
        dependencies: node.dependencies,
        dependents: node.dependents,
        meta: node.meta
      })),
      edges: Array.from(graph.edges.entries()).flatMap(([from, tos]) =>
        Array.from(tos).map(to => ({ from, to }))
      ),
      tree,
      metadata: {
        totalNodes: graph.nodes.size,
        totalEdges: Array.from(graph.edges.values()).reduce((sum, edges) => sum + edges.size, 0),
        maxDepth: Math.max(...Array.from(graph.nodes.values()).map(n => n.depth)),
        generated: new Date().toISOString()
      }
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate HTML format with interactive visualization
   */
  private generateHtmlFormat(tree: DependencyTree, graph: DependencyGraph, options: VisualizationOptions): string {
    const jsonData = this.generateJsonFormat(tree, graph, options);
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>Dependency Graph Visualization</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        #graph {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .node {
            cursor: pointer;
        }
        .node circle {
            fill: #69b3a2;
            stroke: #fff;
            stroke-width: 3px;
        }
        .node text {
            font: 12px sans-serif;
            pointer-events: none;
        }
        .link {
            fill: none;
            stroke: #999;
            stroke-opacity: 0.6;
            stroke-width: 2px;
        }
        .link.cycle {
            stroke: #ff6b6b;
            stroke-width: 3px;
        }
        #info {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 300px;
        }
        .stats {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>Dependency Graph Visualization</h1>
    <div id="info">
        <h3>Graph Statistics</h3>
        <div class="stats" id="stats"></div>
        <h3>Selected Node</h3>
        <div id="nodeInfo">Click on a node to see details</div>
    </div>
    <svg id="graph" width="1200" height="800"></svg>
    
    <script>
        const data = ${jsonData};
        
        // Display stats
        document.getElementById('stats').innerHTML = \`
            <div>Total Nodes: \${data.metadata.totalNodes}</div>
            <div>Total Edges: \${data.metadata.totalEdges}</div>
            <div>Max Depth: \${data.metadata.maxDepth}</div>
        \`;
        
        // d3.js force-directed graph
        const width = 1200;
        const height = 800;
        
        const svg = d3.select("#graph");
        
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.edges).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));
        
        const link = svg.append("g")
            .selectAll("line")
            .data(data.edges)
            .enter().append("line")
            .attr("class", "link");
        
        const node = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        node.append("circle")
            .attr("r", d => 10 + d.dependents.length * 2)
            .style("fill", d => d3.interpolateBlues(1 - d.depth / data.metadata.maxDepth));
        
        node.append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(d => d.name);
        
        node.on("click", function(event, d) {
            document.getElementById('nodeInfo').innerHTML = \`
                <strong>\${d.name}</strong><br>
                Version: \${d.version || 'N/A'}<br>
                Depth: \${d.depth}<br>
                Dependencies: \${d.dependencies.join(', ') || 'None'}<br>
                Dependents: \${d.dependents.join(', ') || 'None'}
            \`;
        });
        
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
        });
        
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    </script>
</body>
</html>`;
  }

  /**
   * Check if an edge is part of a cycle
   */
  private isPartOfCycle(from: string, to: string, graph: DependencyGraph): boolean {
    // Simple check: if there's a path from 'to' back to 'from'
    const visited = new Set<string>();
    const queue = [to];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === from) return true;
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      const edges = graph.edges.get(current);
      if (edges) {
        queue.push(...Array.from(edges));
      }
    }
    
    return false;
  }

  /**
   * Export dependency graph to file
   */
  async exportToFile(
    tree: DependencyTree,
    graph: DependencyGraph,
    filePath: string,
    options: VisualizationOptions = {}
  ): Promise<void> {
    const fs = await import('fs/promises');
    const content = this.visualize(tree, graph, options);
    await fs.writeFile(filePath, content, 'utf-8');
  }
}