import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as postCSSConfig from '../postcss-config.js';
import type { FrameworkDetectionResult } from '../framework-detection.js';

// Mock fs
vi.mock('fs');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

describe('postcss-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFrameworkResult = (framework: string, buildTool: string = 'vite'): FrameworkDetectionResult => ({
    framework: framework as any,
    buildTool: buildTool as any,
    typescript: true,
    configFiles: [],
    dependencies: {},
    devDependencies: {},
    supportedFeatures: []
  });

  describe('setupPostCSSConfig', () => {
    it('should create PostCSS config for React project', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = postCSSConfig.setupPostCSSConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/postcss.config.js',
        expect.stringContaining('module.exports'),
        'utf-8'
      );
    });

    it('should create PostCSS config for Vue project with ES modules', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('vue');
      const result = postCSSConfig.setupPostCSSConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/postcss.config.js',
        expect.stringContaining('export default'),
        'utf-8'
      );
    });

    it('should create PostCSS config for Svelte project', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('svelte');
      const result = postCSSConfig.setupPostCSSConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/postcss.config.js',
        expect.stringContaining('export default'),
        'utf-8'
      );
    });

    it('should skip PostCSS config for Next.js project', () => {
      const frameworkResult = createFrameworkResult('next', 'webpack');
      const result = postCSSConfig.setupPostCSSConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('built-in PostCSS support');
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should skip PostCSS config for Angular project', () => {
      const frameworkResult = createFrameworkResult('angular', 'webpack');
      const result = postCSSConfig.setupPostCSSConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('built-in PostCSS support');
    });

    it('should skip creation when config already exists', () => {
      mockExistsSync.mockReturnValue(true);
      
      const frameworkResult = createFrameworkResult('react');
      const result = postCSSConfig.setupPostCSSConfig('/test', frameworkResult);
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('PostCSS config already exists');
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should force creation when config exists and force is true', () => {
      mockExistsSync.mockReturnValue(true);
      
      const frameworkResult = createFrameworkResult('react');
      const result = postCSSConfig.setupPostCSSConfig(
        '/test', 
        frameworkResult, 
        { force: true }
      );
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should use custom path when provided', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = postCSSConfig.setupPostCSSConfig(
        '/test', 
        frameworkResult, 
        { customPath: '/test/custom-postcss.config.js' }
      );
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/custom-postcss.config.js',
        expect.any(String),
        'utf-8'
      );
    });

    it('should include additional plugins when specified', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = postCSSConfig.setupPostCSSConfig(
        '/test', 
        frameworkResult, 
        { includePlugins: ['postcss-nested', 'cssnano'] }
      );
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain('postcss-nested');
      expect(writtenContent).toContain('cssnano');
    });

    it('should exclude plugins when specified', () => {
      mockExistsSync.mockReturnValue(false);
      
      const frameworkResult = createFrameworkResult('react');
      const result = postCSSConfig.setupPostCSSConfig(
        '/test', 
        frameworkResult, 
        { excludePlugins: ['autoprefixer'] }
      );
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('autoprefixer');
      expect(writtenContent).toContain('tailwindcss');
    });

    it('should handle write errors gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Write permission denied');
      });
      
      const frameworkResult = createFrameworkResult('react');
      const result = postCSSConfig.setupPostCSSConfig('/test', frameworkResult);
      
      expect(result.success).toBe(false);
      expect(result.configCreated).toBe(false);
      expect(result.error).toBe('Write permission denied');
    });
  });

  describe('validatePostCSSConfig', () => {
    it('should validate complete PostCSS configuration', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('postcss.config.js');
      });

      mockReadFileSync.mockReturnValue(`module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

      const result = postCSSConfig.validatePostCSSConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.hasTailwind).toBe(true);
      expect(result.hasAutoprefixer).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing PostCSS config', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = postCSSConfig.validatePostCSSConfig('/test');
      
      expect(result.hasConfig).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('No PostCSS config file found');
    });

    it('should identify missing Tailwind plugin', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('postcss.config.js');
      });

      mockReadFileSync.mockReturnValue(`module.exports = {
  plugins: {
    autoprefixer: {},
  },
}`);

      const result = postCSSConfig.validatePostCSSConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.hasTailwind).toBe(false);
      expect(result.hasAutoprefixer).toBe(true);
      expect(result.issues).toContain('Tailwind CSS plugin not found in PostCSS config');
    });

    it('should identify missing Autoprefixer plugin', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('postcss.config.js');
      });

      mockReadFileSync.mockReturnValue(`module.exports = {
  plugins: {
    tailwindcss: {},
  },
}`);

      const result = postCSSConfig.validatePostCSSConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.hasTailwind).toBe(true);
      expect(result.hasAutoprefixer).toBe(false);
      expect(result.issues).toContain('Autoprefixer plugin not found in PostCSS config');
    });

    it('should validate ES module syntax', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('postcss.config.js');
      });

      mockReadFileSync.mockReturnValue(`export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

      const result = postCSSConfig.validatePostCSSConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.hasTailwind).toBe(true);
      expect(result.hasAutoprefixer).toBe(true);
    });

    it('should handle invalid config structure', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('postcss.config.js');
      });

      mockReadFileSync.mockReturnValue(`invalid javascript content`);

      const result = postCSSConfig.validatePostCSSConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('PostCSS config appears to have invalid structure');
    });

    it('should handle file read errors', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('postcss.config.js');
      });

      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = postCSSConfig.validatePostCSSConfig('/test');
      
      expect(result.hasConfig).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Failed to read PostCSS config: Error: Permission denied');
    });
  });

  describe('updatePostCSSConfigForTailwind', () => {
    it('should update existing config to include Tailwind', () => {
      // Mock existsSync to return true for postcss.config.js
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        // Return true for any postcss config file check
        return pathStr.includes('postcss.config');
      });

      const originalConfig = `module.exports = {
  plugins: {
    autoprefixer: {},
  },
}`;

      // Mock readFileSync to always return the original config without tailwindcss
      mockReadFileSync.mockReturnValue(originalConfig);

      // Mock writeFileSync to capture the written content
      let writtenContent = '';
      mockWriteFileSync.mockImplementation((path, content) => {
        writtenContent = content as string;
      });

      const result = postCSSConfig.updatePostCSSConfigForTailwind('/test');
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      expect(mockWriteFileSync).toHaveBeenCalled();
      expect(writtenContent).toContain('tailwindcss');
    });

    it('should skip update when Tailwind is already configured', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('postcss.config.js');
      });

      mockReadFileSync.mockReturnValue(`module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

      const result = postCSSConfig.updatePostCSSConfigForTailwind('/test');
      
      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('Tailwind CSS already configured in PostCSS');
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should handle missing config file', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = postCSSConfig.updatePostCSSConfigForTailwind('/test');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No PostCSS config found to update');
    });
  });

  describe('getPostCSSTemplate', () => {
    it('should return React template', () => {
      const template = postCSSConfig.getPostCSSTemplate('react');
      expect(template).toContain('module.exports');
      expect(template).toContain('tailwindcss');
      expect(template).toContain('autoprefixer');
    });

    it('should return Vue template with ES modules', () => {
      const template = postCSSConfig.getPostCSSTemplate('vue');
      expect(template).toContain('export default');
      expect(template).toContain('postcss-import');
      expect(template).toContain('tailwindcss');
    });

    it('should return default template for unknown frameworks', () => {
      const template = postCSSConfig.getPostCSSTemplate('unknown');
      expect(template).toContain('module.exports');
      expect(template).toContain('tailwindcss');
      expect(template).toContain('autoprefixer');
    });
  });
});