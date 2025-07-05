/**
 * Search Engine - Full-text search for components
 */

import { Component, ComponentMetadata, SearchOptions, SearchResult, WillowError } from '../types';
import { HTTPClient } from '../core/http-client';

interface SearchIndex {
  components: Map<string, IndexedComponent>;
  terms: Map<string, Set<string>>; // term -> component IDs
  tags: Map<string, Set<string>>; // tag -> component IDs
  categories: Map<string, Set<string>>; // category -> component IDs
}

interface IndexedComponent {
  id: string;
  metadata: ComponentMetadata;
  searchText: string;
  score: number;
}

export class SearchEngine {
  private index: SearchIndex;
  private http?: HTTPClient;

  constructor(options?: { registryURL?: string }) {
    this.index = {
      components: new Map(),
      terms: new Map(),
      tags: new Map(),
      categories: new Map()
    };
    
    if (options?.registryURL) {
      this.http = new HTTPClient({
        baseURL: `${options.registryURL}/api/v1`
      });
    }
  }

  /**
   * Search for components
   */
  async search(options: SearchOptions): Promise<SearchResult> {
    // If using remote registry, delegate to API
    if (this.http) {
      return this.searchRemote(options);
    }
    
    // Otherwise use local index
    return this.searchLocal(options);
  }

  /**
   * Search using remote API
   */
  private async searchRemote(options: SearchOptions): Promise<SearchResult> {
    try {
      return await this.http!.post<SearchResult>('/search', options);
    } catch (error) {
      throw new WillowError(
        'Search failed',
        'SEARCH_ERROR',
        { error, query: options.query }
      );
    }
  }

  /**
   * Search using local index
   */
  private searchLocal(options: SearchOptions): SearchResult {
    const {
      query = '',
      category,
      framework,
      tags,
      limit = 10,
      offset = 0,
      sortBy = 'relevance'
    } = options;
    
    // Start with all components
    let results = Array.from(this.index.components.values());
    
    // Filter by query
    if (query) {
      const queryTerms = this.tokenize(query.toLowerCase());
      results = results.filter(component => {
        const matches = queryTerms.filter(term => 
          component.searchText.includes(term)
        );
        component.score = matches.length / queryTerms.length;
        return matches.length > 0;
      });
    }
    
    // Filter by category
    if (category) {
      const categoryComponents = this.index.categories.get(category) || new Set();
      results = results.filter(c => categoryComponents.has(c.id));
    }
    
    // Filter by framework
    if (framework) {
      results = results.filter(c => c.metadata.framework === framework);
    }
    
    // Filter by tags
    if (tags && tags.length > 0) {
      results = results.filter(component => {
        const componentTags = new Set(component.metadata.tags || []);
        return tags.some(tag => componentTags.has(tag));
      });
    }
    
    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.score || 0) - (a.score || 0);
        case 'downloads':
          return (b.metadata.downloads || 0) - (a.metadata.downloads || 0);
        case 'rating':
          return (b.metadata.rating || 0) - (a.metadata.rating || 0);
        case 'date':
          return new Date(b.metadata.publishedAt || 0).getTime() - 
                 new Date(a.metadata.publishedAt || 0).getTime();
        default:
          return 0;
      }
    });
    
    // Apply pagination
    const total = results.length;
    results = results.slice(offset, offset + limit);
    
    // Build facets
    const facets = this.buildFacets(results);
    
    return {
      components: results.map(r => r.metadata),
      total,
      facets
    };
  }

  /**
   * Index a component for search
   */
  async indexComponent(component: Component): Promise<void> {
    const id = `${component.metadata.name}@${component.metadata.version}`;
    
    // Build search text
    const searchText = [
      component.metadata.name,
      component.metadata.description || '',
      component.metadata.category,
      component.metadata.framework || '',
      ...(component.metadata.tags || [])
    ].join(' ').toLowerCase();
    
    // Create indexed component
    const indexed: IndexedComponent = {
      id,
      metadata: component.metadata,
      searchText,
      score: 0
    };
    
    // Add to main index
    this.index.components.set(id, indexed);
    
    // Index terms
    const terms = this.tokenize(searchText);
    for (const term of terms) {
      if (!this.index.terms.has(term)) {
        this.index.terms.set(term, new Set());
      }
      this.index.terms.get(term)!.add(id);
    }
    
    // Index category
    if (!this.index.categories.has(component.metadata.category)) {
      this.index.categories.set(component.metadata.category, new Set());
    }
    this.index.categories.get(component.metadata.category)!.add(id);
    
    // Index tags
    for (const tag of component.metadata.tags || []) {
      if (!this.index.tags.has(tag)) {
        this.index.tags.set(tag, new Set());
      }
      this.index.tags.get(tag)!.add(id);
    }
  }

  /**
   * Remove component from index
   */
  async removeComponent(name: string, version?: string): Promise<void> {
    const id = version ? `${name}@${version}` : name;
    
    // Find matching components
    const toRemove: string[] = [];
    for (const [componentId, component] of this.index.components) {
      if (componentId === id || componentId.startsWith(`${id}@`)) {
        toRemove.push(componentId);
      }
    }
    
    // Remove from all indexes
    for (const componentId of toRemove) {
      const component = this.index.components.get(componentId);
      if (!component) continue;
      
      // Remove from main index
      this.index.components.delete(componentId);
      
      // Remove from term index
      const terms = this.tokenize(component.searchText);
      for (const term of terms) {
        this.index.terms.get(term)?.delete(componentId);
        if (this.index.terms.get(term)?.size === 0) {
          this.index.terms.delete(term);
        }
      }
      
      // Remove from category index
      this.index.categories.get(component.metadata.category)?.delete(componentId);
      
      // Remove from tag index
      for (const tag of component.metadata.tags || []) {
        this.index.tags.get(tag)?.delete(componentId);
        if (this.index.tags.get(tag)?.size === 0) {
          this.index.tags.delete(tag);
        }
      }
    }
  }

  /**
   * Tokenize text for indexing
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/[\s-]+/)
      .filter(term => term.length > 2);
  }

  /**
   * Build search facets
   */
  private buildFacets(results: IndexedComponent[]): SearchResult['facets'] {
    const categories: Record<string, number> = {};
    const frameworks: Record<string, number> = {};
    const tags: Record<string, number> = {};
    
    for (const component of results) {
      // Count categories
      categories[component.metadata.category] = 
        (categories[component.metadata.category] || 0) + 1;
      
      // Count frameworks
      if (component.metadata.framework) {
        frameworks[component.metadata.framework] = 
          (frameworks[component.metadata.framework] || 0) + 1;
      }
      
      // Count tags
      for (const tag of component.metadata.tags || []) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
    }
    
    return { categories, frameworks, tags };
  }
}