import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import * as frameworkDetection from '../framework-detection.js';

// Mock fs
vi.mock('fs');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('framework-detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectFramework', () => {
    it('should detect Next.js project', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('next');
      expect(result.version).toBe('^14.0.0');
      expect(result.typescript).toBe(true);
      expect(result.supportedFeatures).toContain('ssr');
    });

    it('should detect React project with Vite', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('vite.config.js');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        },
        devDependencies: {
          vite: '^5.0.0',
          typescript: '^5.0.0'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('react');
      expect(result.buildTool).toBe('vite');
      expect(result.typescript).toBe(true);
      expect(result.configFiles).toContain('vite.config.js');
    });

    it('should detect Vue project', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          vue: '^3.3.0'
        },
        devDependencies: {
          vite: '^5.0.0'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('vue');
      expect(result.buildTool).toBe('vite');
      expect(result.supportedFeatures).toContain('composition-api');
    });

    it('should detect Svelte project', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          svelte: '^4.0.0'
        },
        devDependencies: {
          vite: '^5.0.0'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('svelte');
      expect(result.buildTool).toBe('vite');
      expect(result.supportedFeatures).toContain('stores');
    });

    it('should detect Angular project', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('angular.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          '@angular/core': '^17.0.0'
        },
        devDependencies: {
          '@angular/cli': '^17.0.0',
          typescript: '^5.0.0',
          webpack: '^5.0.0'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('angular');
      expect(result.buildTool).toBe('webpack');
      expect(result.typescript).toBe(true);
      expect(result.supportedFeatures).toContain('dependency-injection');
    });

    it('should detect Nuxt project', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          nuxt: '^3.8.0',
          vue: '^3.3.0'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('nuxt');
      expect(result.supportedFeatures).toContain('ssr');
      expect(result.supportedFeatures).toContain('auto-imports');
    });

    it('should return unknown for projects without recognized frameworks', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          lodash: '^4.17.21'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('unknown');
      expect(result.buildTool).toBe('unknown');
      expect(result.typescript).toBe(false);
    });

    it('should handle missing package.json', () => {
      mockExistsSync.mockReturnValue(false);

      const result = frameworkDetection.detectFramework();
      
      expect(result.framework).toBe('unknown');
      expect(result.buildTool).toBe('unknown');
      expect(result.typescript).toBe(false);
    });

    it('should detect additional features from dependencies', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          'react-router-dom': '^6.0.0',
          'redux': '^4.2.0',
          'framer-motion': '^10.0.0',
          'tailwindcss': '^3.3.0'
        }
      }));

      const result = frameworkDetection.detectFramework();
      
      expect(result.supportedFeatures).toContain('client-routing');
      expect(result.supportedFeatures).toContain('state-management');
      expect(result.supportedFeatures).toContain('animations');
      expect(result.supportedFeatures).toContain('tailwind');
    });
  });

  describe('isFrameworkSupported', () => {
    it('should return true for supported frameworks', () => {
      expect(frameworkDetection.isFrameworkSupported('next')).toBe(true);
      expect(frameworkDetection.isFrameworkSupported('react')).toBe(true);
      expect(frameworkDetection.isFrameworkSupported('vue')).toBe(true);
      expect(frameworkDetection.isFrameworkSupported('svelte')).toBe(true);
    });

    it('should return false for unsupported frameworks', () => {
      expect(frameworkDetection.isFrameworkSupported('angular')).toBe(false);
      expect(frameworkDetection.isFrameworkSupported('unknown')).toBe(false);
    });
  });

  describe('getFrameworkRecommendations', () => {
    it('should return Next.js specific recommendations', () => {
      const result = {
        framework: 'next' as const,
        buildTool: 'webpack' as const,
        typescript: true,
        configFiles: [],
        dependencies: {},
        devDependencies: {},
        supportedFeatures: []
      };

      const recommendations = frameworkDetection.getFrameworkRecommendations(result);
      
      expect(recommendations.postCssConfig).toBe(false); // Next.js has built-in PostCSS
      expect(recommendations.componentPath).toBe('components');
      expect(recommendations.utilsPath).toBe('lib');
    });

    it('should return React specific recommendations', () => {
      const result = {
        framework: 'react' as const,
        buildTool: 'vite' as const,
        typescript: true,
        configFiles: [],
        dependencies: {},
        devDependencies: {},
        supportedFeatures: []
      };

      const recommendations = frameworkDetection.getFrameworkRecommendations(result);
      
      expect(recommendations.postCssConfig).toBe(true);
      expect(recommendations.componentPath).toBe('src/components');
      expect(recommendations.utilsPath).toBe('src/lib');
    });

    it('should return Vue specific recommendations', () => {
      const result = {
        framework: 'vue' as const,
        buildTool: 'vite' as const,
        typescript: true,
        configFiles: [],
        dependencies: {},
        devDependencies: {},
        supportedFeatures: []
      };

      const recommendations = frameworkDetection.getFrameworkRecommendations(result);
      
      expect(recommendations.postCssConfig).toBe(true);
      expect(recommendations.componentPath).toBe('src/components');
      expect(recommendations.utilsPath).toBe('src/utils');
    });
  });

  describe('detectMonorepo', () => {
    it('should detect npm workspaces', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        workspaces: ['packages/*']
      }));

      const result = frameworkDetection.detectMonorepo();
      
      expect(result.isMonorepo).toBe(true);
      expect(result.tool).toBe('npm-workspaces');
      expect(result.packages).toEqual(['packages/*']);
    });

    it('should detect yarn workspaces', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('yarn.lock');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        workspaces: {
          packages: ['packages/*', 'apps/*']
        }
      }));

      const result = frameworkDetection.detectMonorepo();
      
      expect(result.isMonorepo).toBe(true);
      expect(result.tool).toBe('yarn-workspaces');
      expect(result.packages).toEqual(['packages/*', 'apps/*']);
    });

    it('should detect pnpm workspaces', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('pnpm-lock.yaml');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        workspaces: ['packages/*']
      }));

      const result = frameworkDetection.detectMonorepo();
      
      expect(result.isMonorepo).toBe(true);
      expect(result.tool).toBe('pnpm-workspaces');
    });

    it('should detect Lerna monorepo', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('lerna.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const result = frameworkDetection.detectMonorepo();
      
      expect(result.isMonorepo).toBe(true);
      expect(result.tool).toBe('lerna');
    });

    it('should detect Nx monorepo', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('nx.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const result = frameworkDetection.detectMonorepo();
      
      expect(result.isMonorepo).toBe(true);
      expect(result.tool).toBe('nx');
    });

    it('should detect Rush monorepo', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('rush.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const result = frameworkDetection.detectMonorepo();
      
      expect(result.isMonorepo).toBe(true);
      expect(result.tool).toBe('rush');
    });

    it('should return false for non-monorepo projects', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });
      
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' }
      }));

      const result = frameworkDetection.detectMonorepo();
      
      expect(result.isMonorepo).toBe(false);
      expect(result.tool).toBeUndefined();
    });
  });
});