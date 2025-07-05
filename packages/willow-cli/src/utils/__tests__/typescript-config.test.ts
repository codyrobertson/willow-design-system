import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as typescriptConfig from '../typescript-config.js';
import type { FrameworkDetectionResult } from '../framework-detection.js';

// Mock fs
vi.mock('fs');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

describe('typescript-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFrameworkResult = (
    framework: string, 
    typescript: boolean = true,
    buildTool: string = 'vite'
  ): FrameworkDetectionResult => ({
    framework: framework as any,
    buildTool: buildTool as any,
    typescript,
    configFiles: [],
    dependencies: {},
    devDependencies: {},
    supportedFeatures: []
  });

  describe('setupTypeScriptConfig', () => {
    it('should create TypeScript config for React project', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/tsconfig.json',
        expect.stringContaining('"jsx": "react-jsx"'),
        'utf-8'
      );
    });

    it('should create TypeScript config for Next.js project', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('next', true, 'webpack');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);
      
      expect(config.compilerOptions.jsx).toBe('react-jsx');
      expect(config.include).toContain('next-env.d.ts');
      expect(config.compilerOptions.incremental).toBe(true);
    });

    it('should create TypeScript config for Vue project', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('vue');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);
      
      expect(config.compilerOptions.jsx).toBe('preserve');
      expect(config.compilerOptions.types).toContain('vite/client');
      expect(config.include).toContain('src/**/*.vue');
    });

    it('should create TypeScript config for Svelte project', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('svelte');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);
      
      expect(config.compilerOptions.jsx).toBe('preserve');
      expect(config.compilerOptions.types).toContain('svelte');
      expect(config.include).toContain('src/**/*.svelte');
    });

    it('should create TypeScript config for Angular project', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('angular', true, 'webpack');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);
      
      expect(config.compilerOptions.experimentalDecorators).toBe(true);
      expect(config.compilerOptions.emitDecoratorMetadata).toBe(true);
      expect(config.compilerOptions.target).toBe('ES2022');
    });

    it('should skip when TypeScript not detected and not forced', () => {
      const frameworkResult = createFrameworkResult('react', false);
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('TypeScript not detected');
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should force creation when TypeScript not detected but forced', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react', false);
      const result = typescriptConfig.setupTypeScriptConfig(
        '/test', 
        frameworkResult, 
        { force: true }
      );
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should include path mapping by default', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);
      
      expect(config.compilerOptions.baseUrl).toBe('.');
      expect(config.compilerOptions.paths).toHaveProperty('@/*');
    });

    it('should skip path mapping when explicitly disabled', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = typescriptConfig.setupTypeScriptConfig(
        '/test', 
        frameworkResult, 
        { pathMapping: false }
      );
      
      expect(result.success).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);
      
      expect(config.compilerOptions.baseUrl).toBeUndefined();
      expect(config.compilerOptions.paths).toBeUndefined();
    });

    it('should update existing config when present', () => {
      mockExistsSync.mockReturnValue(true);
      
      const existingConfig = {
        compilerOptions: {
          target: 'ES5',
          module: 'CommonJS'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig, null, 2));
      
      const frameworkResult = createFrameworkResult('react');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      expect(result.configUpdated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should use custom path when provided', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = typescriptConfig.setupTypeScriptConfig(
        '/test', 
        frameworkResult, 
        { customPath: '/test/custom-tsconfig.json' }
      );
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/custom-tsconfig.json',
        expect.any(String),
        'utf-8'
      );
    });

    it('should handle write errors gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const frameworkResult = createFrameworkResult('react');
      const result = typescriptConfig.setupTypeScriptConfig('/test', frameworkResult);
      
      expect(result.success).toBe(false);
      expect(result.configCreated).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('validateTypeScriptConfig', () => {
    it('should validate complete TypeScript configuration', () => {
      mockExistsSync.mockReturnValue(true);
      
      const validConfig = {
        compilerOptions: {
          jsx: 'react-jsx',
          baseUrl: '.',
          paths: {
            '@/*': ['src/*']
          },
          resolveJsonModule: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(validConfig, null, 2));
      
      const result = typescriptConfig.validateTypeScriptConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.hasPathMapping).toBe(true);
      expect(result.hasProperJSX).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing tsconfig.json', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = typescriptConfig.validateTypeScriptConfig('/test');
      
      expect(result.hasConfig).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('No tsconfig.json found');
    });

    it('should identify missing path mapping', () => {
      mockExistsSync.mockReturnValue(true);
      
      const configWithoutPaths = {
        compilerOptions: {
          jsx: 'react-jsx',
          resolveJsonModule: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(configWithoutPaths, null, 2));
      
      const result = typescriptConfig.validateTypeScriptConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.hasPathMapping).toBe(false);
      expect(result.issues).toContain('No @/* path mapping configured');
    });

    it('should identify invalid JSX configuration', () => {
      mockExistsSync.mockReturnValue(true);
      
      const configWithInvalidJSX = {
        compilerOptions: {
          jsx: 'invalid-jsx',
          baseUrl: '.',
          paths: { '@/*': ['src/*'] },
          resolveJsonModule: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(configWithInvalidJSX, null, 2));
      
      const result = typescriptConfig.validateTypeScriptConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.hasProperJSX).toBe(false);
      expect(result.issues).toContain('JSX configuration missing or invalid');
    });

    it('should identify missing essential options', () => {
      mockExistsSync.mockReturnValue(true);
      
      const minimalConfig = {
        compilerOptions: {
          jsx: 'react-jsx',
          baseUrl: '.',
          paths: { '@/*': ['src/*'] }
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(minimalConfig, null, 2));
      
      const result = typescriptConfig.validateTypeScriptConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.includes('resolveJsonModule'))).toBe(true);
    });

    it('should handle invalid JSON gracefully', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json content');
      
      const result = typescriptConfig.validateTypeScriptConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('Failed to parse tsconfig.json');
    });
  });

  describe('checkTypeScriptInstallation', () => {
    it('should detect TypeScript installation', () => {
      mockExistsSync.mockReturnValue(true);
      
      const packageJson = {
        devDependencies: {
          typescript: '^5.0.0',
          '@types/node': '^20.0.0',
          '@types/react': '^18.0.0'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson, null, 2));
      
      const result = typescriptConfig.checkTypeScriptInstallation('/test');
      
      expect(result.isInstalled).toBe(true);
      expect(result.version).toBe('^5.0.0');
      expect(result.hasTypes).toBe(true);
      expect(result.missingTypes).toEqual(['@types/react-dom']);
    });

    it('should detect missing TypeScript', () => {
      mockExistsSync.mockReturnValue(true);
      
      const packageJson = {
        dependencies: {
          react: '^18.0.0'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson, null, 2));
      
      const result = typescriptConfig.checkTypeScriptInstallation('/test');
      
      expect(result.isInstalled).toBe(false);
      expect(result.hasTypes).toBe(false);
      expect(result.missingTypes).toEqual(['@types/node', '@types/react', '@types/react-dom']);
    });

    it('should handle missing package.json', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = typescriptConfig.checkTypeScriptInstallation('/test');
      
      expect(result.isInstalled).toBe(false);
      expect(result.hasTypes).toBe(false);
      expect(result.missingTypes).toEqual([]);
    });
  });

  describe('getTypeScriptTemplate', () => {
    it('should return React template', () => {
      const template = typescriptConfig.getTypeScriptTemplate('react');
      
      expect(template.compilerOptions.jsx).toBe('react-jsx');
      expect(template.compilerOptions.baseUrl).toBe('.');
      expect(template.compilerOptions.paths).toHaveProperty('@/*');
      expect(template.include).toContain('src/**/*.tsx');
    });

    it('should return Next.js template', () => {
      const template = typescriptConfig.getTypeScriptTemplate('next');
      
      expect(template.compilerOptions.jsx).toBe('react-jsx');
      expect(template.compilerOptions.incremental).toBe(true);
      expect(template.include).toContain('next-env.d.ts');
    });

    it('should return Vue template', () => {
      const template = typescriptConfig.getTypeScriptTemplate('vue');
      
      expect(template.compilerOptions.jsx).toBe('preserve');
      expect(template.compilerOptions.types).toContain('vite/client');
      expect(template.include).toContain('src/**/*.vue');
    });
  });
});