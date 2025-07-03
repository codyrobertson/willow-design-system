import { describe, it, expect } from 'vitest';
import { EnvironmentLoader } from './environment';

describe('EnvironmentLoader', () => {
  describe('basic loading', () => {
    it('should load simple environment variables', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_VERSION: '2.0.0',
        WILLOW_UI_KIT: 'radix',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        version: '2.0.0',
        ui: {
          kit: 'radix',
        },
      });
    });
    
    it('should ignore non-prefixed variables', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_VERSION: '1.0.0',
        OTHER_VAR: 'ignored',
        NODE_ENV: 'test',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        version: '1.0.0',
      });
    });
  });
  
  describe('nested properties', () => {
    it('should handle nested properties with delimiter', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_DESIGN_SYSTEM__NAME: 'My Design System',
        WILLOW_DESIGN_SYSTEM__TOKENS__COLORS__PRIMARY: 'blue',
        WILLOW_PATHS__SRC: './source',
        WILLOW_PATHS__OUTPUT: './dist',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        design: {
          system: {
            name: 'My Design System',
            tokens: {
              colors: {
                primary: 'blue',
              },
            },
          },
        },
        paths: {
          src: './source',
          output: './dist',
        },
      });
    });
    
    it('should support custom delimiter', () => {
      const loader = new EnvironmentLoader({ delimiter: '_' });
      const env = {
        WILLOW_FEATURES_DRY_RUN: 'true',
        WILLOW_FEATURES_VERBOSE: 'false',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        features: {
          dry: {
            run: true,
          },
          verbose: false,
        },
      });
    });
  });
  
  describe('type conversion', () => {
    it('should convert boolean values', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_FEATURES__AST_TRANSFORM: 'true',
        WILLOW_FEATURES__VALIDATION: 'false',
        WILLOW_FEATURES__DRY_RUN: 'TRUE',
        WILLOW_FEATURES__VERBOSE: 'FALSE',
      };
      
      const config = loader.load(env);
      
      expect(config.features).toEqual({
        ast: { transform: true },
        validation: false,
        dry: { run: true },
        verbose: false,
      });
    });
    
    it('should convert numeric values', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_MAX_FILES: '100',
        WILLOW_TIMEOUT: '30000',
        WILLOW_RATIO: '1.5',
        WILLOW_NEGATIVE: '-42',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        max: { files: 100 },
        timeout: 30000,
        ratio: 1.5,
        negative: -42,
      });
    });
    
    it('should handle null values', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_OPTIONAL: 'null',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        optional: null,
      });
    });
    
    it('should parse JSON values', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_PLUGINS: '["plugin1","plugin2"]',
        WILLOW_CONFIG: '{"key":"value","nested":{"prop":true}}',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        plugins: ['plugin1', 'plugin2'],
        config: {
          key: 'value',
          nested: {
            prop: true,
          },
        },
      });
    });
  });
  
  describe('case conversion', () => {
    it('should convert SNAKE_CASE to camelCase', () => {
      const loader = new EnvironmentLoader({ convertCase: true });
      const env = {
        WILLOW_UI_KIT: 'radix',
        WILLOW_DRY_RUN: 'true',
        WILLOW_MAX_RETRIES: '3',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        uiKit: 'radix',
        dryRun: true,
        maxRetries: 3,
      });
    });
  });
  
  describe('custom parsers', () => {
    it('should use custom parser for specific paths', () => {
      const loader = new EnvironmentLoader({
        parsers: {
          'paths.aliases': (value: string) => {
            // Parse comma-separated aliases
            return value.split(',').reduce((acc, alias) => {
              const [from, to] = alias.split(':');
              acc[from] = to;
              return acc;
            }, {} as Record<string, string>);
          },
        },
      });
      
      const env = {
        WILLOW_PATHS__ALIASES: '@:src,@components:src/components',
      };
      
      const config = loader.load(env);
      
      expect(config).toEqual({
        paths: {
          aliases: {
            '@': 'src',
            '@components': 'src/components',
          },
        },
      });
    });
  });
  
  describe('utility methods', () => {
    it('should get all prefixed variables', () => {
      const loader = new EnvironmentLoader();
      const env = {
        WILLOW_VAR1: 'value1',
        WILLOW_VAR2: 'value2',
        OTHER_VAR: 'ignored',
      };
      
      const all = loader.getAll(env);
      
      expect(all).toEqual({
        WILLOW_VAR1: 'value1',
        WILLOW_VAR2: 'value2',
      });
    });
    
    it('should create environment variable names', () => {
      const loader = new EnvironmentLoader();
      
      expect(loader.createEnvName(['ui', 'kit'])).toBe('WILLOW_UI__KIT');
      expect(loader.createEnvName(['features', 'dry', 'run'])).toBe('WILLOW_FEATURES__DRY__RUN');
    });
    
    it('should create env names with case conversion', () => {
      const loader = new EnvironmentLoader({ convertCase: true });
      
      expect(loader.createEnvName(['uiKit'])).toBe('WILLOW_UI_KIT');
      expect(loader.createEnvName(['dryRun'])).toBe('WILLOW_DRY_RUN');
    });
  });
  
  describe('documentation generation', () => {
    it('should generate environment variable docs', () => {
      const loader = new EnvironmentLoader();
      const docs = loader.generateDocs();
      
      expect(docs).toContain('# WILLOW_ Environment Variables');
      expect(docs).toContain('WILLOW_UI__KIT=radix');
      expect(docs).toContain('WILLOW_FEATURES__DRY__RUN=true');
    });
  });
});