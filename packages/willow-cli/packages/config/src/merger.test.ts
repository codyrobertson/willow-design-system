import { describe, it, expect } from 'vitest';
import { ConfigMerger } from './merger';

describe('ConfigMerger', () => {
  describe('basic merging', () => {
    it('should merge simple objects', () => {
      const merger = new ConfigMerger();
      const result = merger.merge(
        {
          config: { version: '1.0', uiKit: 'willow' },
          source: { type: 'default', priority: 0 },
        },
        {
          config: { uiKit: 'radix' },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result).toEqual({
        version: '1.0',
        uiKit: 'radix',
      });
    });
    
    it('should respect precedence order', () => {
      const merger = new ConfigMerger();
      const result = merger.merge(
        {
          config: { uiKit: 'cli' },
          source: { type: 'cli', priority: 4 },
        },
        {
          config: { uiKit: 'file' },
          source: { type: 'file', priority: 2 },
        },
        {
          config: { uiKit: 'env' },
          source: { type: 'env', priority: 3 },
        }
      );
      
      expect(result.uiKit).toBe('cli');
    });
  });
  
  describe('deep merging', () => {
    it('should merge nested objects', () => {
      const merger = new ConfigMerger();
      const result = merger.merge(
        {
          config: {
            designSystem: {
              name: 'Willow',
              tokens: {
                colors: { primary: 'blue' },
              },
            },
          },
          source: { type: 'default', priority: 0 },
        },
        {
          config: {
            designSystem: {
              tokens: {
                colors: { secondary: 'green' },
                spacing: { small: '4px' },
              },
            },
          },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.designSystem).toEqual({
        name: 'Willow',
        tokens: {
          colors: { primary: 'blue', secondary: 'green' },
          spacing: { small: '4px' },
        },
      });
    });
    
    it('should override nested values', () => {
      const merger = new ConfigMerger();
      const result = merger.merge(
        {
          config: {
            paths: {
              src: './src',
              output: './dist',
            },
          },
          source: { type: 'default', priority: 0 },
        },
        {
          config: {
            paths: {
              output: './build',
            },
          },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.paths).toEqual({
        src: './src',
        output: './build',
      });
    });
  });
  
  describe('array merging', () => {
    it('should replace arrays by default', () => {
      const merger = new ConfigMerger();
      const result = merger.merge(
        {
          config: { plugins: ['plugin1', 'plugin2'] },
          source: { type: 'default', priority: 0 },
        },
        {
          config: { plugins: ['plugin3'] },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.plugins).toEqual(['plugin3']);
    });
    
    it('should concat arrays when specified', () => {
      const merger = new ConfigMerger({ arrayStrategy: 'concat' });
      const result = merger.merge(
        {
          config: { plugins: ['plugin1', 'plugin2'] },
          source: { type: 'default', priority: 0 },
        },
        {
          config: { plugins: ['plugin3'] },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.plugins).toEqual(['plugin1', 'plugin2', 'plugin3']);
    });
    
    it('should merge unique arrays when specified', () => {
      const merger = new ConfigMerger({ arrayStrategy: 'unique' });
      const result = merger.merge(
        {
          config: { plugins: ['plugin1', 'plugin2'] },
          source: { type: 'default', priority: 0 },
        },
        {
          config: { plugins: ['plugin2', 'plugin3'] },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.plugins).toEqual(['plugin1', 'plugin2', 'plugin3']);
    });
  });
  
  describe('custom strategies', () => {
    it('should use custom merge strategy', () => {
      const merger = new ConfigMerger({
        strategies: {
          plugins: (target, source) => {
            // Custom strategy: always append
            return [...(target || []), ...source];
          },
        },
      });
      
      const result = merger.merge(
        {
          config: { plugins: ['plugin1'] },
          source: { type: 'default', priority: 0 },
        },
        {
          config: { plugins: ['plugin2'] },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.plugins).toEqual(['plugin1', 'plugin2']);
    });
  });
  
  describe('createSources', () => {
    it('should create sources with correct priorities', () => {
      const sources = ConfigMerger.createSources({
        defaults: { version: '1.0' },
        global: { uiKit: 'global' },
        project: { uiKit: 'project' },
        env: { uiKit: 'env' },
        cli: { uiKit: 'cli' },
      });
      
      expect(sources).toHaveLength(5);
      expect(sources[0].source.priority).toBe(0);
      expect(sources[1].source.priority).toBe(1);
      expect(sources[2].source.priority).toBe(2);
      expect(sources[3].source.priority).toBe(3);
      expect(sources[4].source.priority).toBe(4);
    });
  });
  
  describe('edge cases', () => {
    it('should handle null and undefined values', () => {
      const merger = new ConfigMerger();
      const result = merger.merge(
        {
          config: { uiKit: 'willow', features: { validation: true } },
          source: { type: 'default', priority: 0 },
        },
        {
          config: { uiKit: null as any, features: undefined as any },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.uiKit).toBeNull();
      expect(result.features).toBeUndefined();
    });
    
    it('should handle dates and regexes', () => {
      const merger = new ConfigMerger();
      const date = new Date('2024-01-01');
      const regex = /test/gi;
      
      const result = merger.merge(
        {
          config: { custom: { date: new Date('2023-01-01'), regex: /old/i } },
          source: { type: 'default', priority: 0 },
        },
        {
          config: { custom: { date, regex } },
          source: { type: 'file', priority: 1 },
        }
      );
      
      expect(result.custom.date).toBe(date);
      expect(result.custom.regex).toBe(regex);
    });
  });
});