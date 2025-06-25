import type { ImportMappingConfig, PathMapping, TransformContext } from '../types';
import { ImportParser } from './import-parser';

/**
 * Resolves and transforms import paths based on mapping configuration
 */
export class ImportPathResolver {
  constructor(
    private config: ImportMappingConfig,
    private context: TransformContext
  ) {}
  
  /**
   * Resolve import path
   */
  resolve(source: string): string {
    // Check direct package mapping
    const directMapping = this.config.packageMappings[source];
    if (directMapping) {
      this.logResolution(source, directMapping, 'direct package mapping');
      return directMapping;
    }
    
    // Check if it's a sub-module import (e.g., @mui/material/Button)
    const resolvedSubModule = this.resolveSubModuleImport(source);
    if (resolvedSubModule !== source) {
      return resolvedSubModule;
    }
    
    // Check path mappings
    const pathMapping = this.resolvePathMapping(source);
    if (pathMapping !== source) {
      return pathMapping;
    }
    
    // Check wildcard mappings
    const wildcardMapping = this.resolveWildcardMapping(source);
    if (wildcardMapping !== source) {
      return wildcardMapping;
    }
    
    return source;
  }
  
  /**
   * Resolve sub-module imports
   */
  private resolveSubModuleImport(source: string): string {
    // Check if source contains a sub-path
    const parts = source.split('/');
    if (parts.length > 1) {
      // Check if the base package has a mapping
      const basePackage = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
      const subPath = parts.slice(basePackage.split('/').length).join('/');
      
      const baseMapping = this.config.packageMappings[basePackage];
      if (baseMapping) {
        const resolved = subPath ? `${baseMapping}/${subPath}` : baseMapping;
        this.logResolution(source, resolved, 'sub-module mapping');
        return resolved;
      }
    }
    
    return source;
  }
  
  /**
   * Resolve path mapping
   */
  private resolvePathMapping(source: string): string {
    if (!this.config.pathMappings) {
      return source;
    }
    
    for (const [pattern, mapping] of Object.entries(this.config.pathMappings)) {
      if (this.matchesPattern(source, pattern)) {
        const resolved = this.applyPathMapping(source, pattern, mapping);
        if (resolved !== source) {
          this.logResolution(source, resolved, 'path mapping');
          return resolved;
        }
      }
    }
    
    return source;
  }
  
  /**
   * Resolve wildcard mapping
   */
  private resolveWildcardMapping(source: string): string {
    for (const [pattern, target] of Object.entries(this.config.packageMappings)) {
      if (pattern.includes('*')) {
        const regex = this.patternToRegex(pattern);
        const match = source.match(regex);
        if (match) {
          let resolved = target;
          // Replace wildcards in target
          match.slice(1).forEach((group, index) => {
            resolved = resolved.replace(`$${index + 1}`, group);
            resolved = resolved.replace('*', group);
          });
          this.logResolution(source, resolved, 'wildcard mapping');
          return resolved;
        }
      }
    }
    
    return source;
  }
  
  /**
   * Apply path mapping
   */
  private applyPathMapping(source: string, pattern: string, mapping: PathMapping): string {
    if (mapping.transform) {
      return mapping.transform(source);
    }
    
    if (mapping.target) {
      // Simple replacement
      if (pattern.includes('*')) {
        const regex = this.patternToRegex(pattern);
        return source.replace(regex, mapping.target);
      }
      return mapping.target;
    }
    
    return source;
  }
  
  /**
   * Check if source matches pattern
   */
  private matchesPattern(source: string, pattern: string): boolean {
    if (pattern === source) return true;
    
    if (pattern.includes('*')) {
      const regex = this.patternToRegex(pattern);
      return regex.test(source);
    }
    
    return source.startsWith(pattern);
  }
  
  /**
   * Convert glob pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '(.*)');
    return new RegExp(`^${escaped}$`);
  }
  
  /**
   * Log resolution for debugging
   */
  private logResolution(from: string, to: string, reason: string): void {
    if (this.context.config.verbose) {
      console.log(`Import resolution: "${from}" → "${to}" (${reason})`);
    }
  }
  
  /**
   * Validate import path
   */
  validatePath(source: string): { valid: boolean; reason?: string } {
    // Check for invalid characters
    if (source.includes('\\')) {
      return { valid: false, reason: 'Import paths must use forward slashes' };
    }
    
    // Check for dangerous patterns
    if (source.includes('..') && ImportParser.isPackageImport(source)) {
      return { valid: false, reason: 'Package imports cannot contain ".."' };
    }
    
    // Check for empty path
    if (!source || source.trim() === '') {
      return { valid: false, reason: 'Import path cannot be empty' };
    }
    
    return { valid: true };
  }
  
  /**
   * Normalize import path
   */
  normalizePath(source: string): string {
    // Convert backslashes to forward slashes
    let normalized = source.replace(/\\/g, '/');
    
    // Remove trailing slashes
    normalized = normalized.replace(/\/$/, '');
    
    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');
    
    return normalized;
  }
  
  /**
   * Check if path needs transformation
   */
  needsTransformation(source: string): boolean {
    const resolved = this.resolve(source);
    return resolved !== source;
  }
}