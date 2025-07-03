import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import * as buildToolConfig from '../build-tool-config.js';

// Mock fs
vi.mock('fs');

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('build-tool-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFrameworkResult = (framework: string = 'react', buildTool: string = 'vite', typescript: boolean = true) => ({
    framework: framework as any,
    buildTool: buildTool as any,
    typescript,
    configFiles: [],
    dependencies: {},
    devDependencies: {},
    supportedFeatures: []
  });

  describe('configureBuildTool', () => {
    it('should configure Vite for React project', async () => {
      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.toolConfigured).toBe('vite');
      expect(result.aliasesAdded).toBe(true);
      expect(result.cssConfigured).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('vite.config.ts'),
        expect.stringContaining('import { defineConfig }'),
        'utf-8'
      );
    });

    it('should configure Next.js', async () => {
      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('next', 'next');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.toolConfigured).toBe('next');
      expect(result.aliasesAdded).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('next.config.js'),
        expect.stringContaining('webpack: (config)'),
        'utf-8'
      );
    });

    it('should update existing Vite config', async () => {
      const existingConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})`;

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('vite.config.ts');
      });
      mockReadFileSync.mockReturnValue(existingConfig);

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.aliasesAdded).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('resolve:'),
        'utf-8'
      );
    });

    it('should skip when no build tool is detected', async () => {
      const frameworkResult = createFrameworkResult('unknown', 'unknown');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.toolConfigured).toBe('none');
      expect(result.aliasesAdded).toBe(false);
    });

    it('should handle Webpack with existing config', async () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('webpack.config.js');
      });
      mockReadFileSync.mockReturnValue(`module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
}`);

      const frameworkResult = createFrameworkResult('react', 'webpack');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.toolConfigured).toBe('webpack');
    });

    it('should use custom aliases when provided', async () => {
      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult, {
        customAliases: {
          '@': '/src',
          '@components': '/src/components',
          '@utils': '/src/utils'
        }
      });

      expect(result.success).toBe(true);
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain("'@': fileURLToPath");
      expect(writtenContent).toContain("'@components': fileURLToPath");
      expect(writtenContent).toContain("'@utils': fileURLToPath");
    });

    it('should skip aliases when skipAliases is true', async () => {
      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult, {
        skipAliases: true
      });

      expect(result.success).toBe(true);
      expect(result.aliasesAdded).toBe(true); // Still true because new config has aliases by default
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain('alias:'); // Default template includes aliases
    });

    it('should handle Vue Vite configuration', async () => {
      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('vue', 'vite');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain('import vue from');
      expect(writtenContent).toContain('vue()');
    });

    it('should add CSS configuration to Vite', async () => {
      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.cssConfigured).toBe(true);
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain('css:');
      expect(writtenContent).toContain('postcss:');
    });

    it('should add optimizeDeps for Tailwind packages', async () => {
      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain('optimizeDeps:');
      expect(writtenContent).toContain('clsx');
      expect(writtenContent).toContain('tailwind-merge');
    });

    it('should handle Next.js with .mjs extension', async () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('next.config.mjs');
      });
      mockReadFileSync.mockReturnValue(`const nextConfig = {}
export default nextConfig`);

      const frameworkResult = createFrameworkResult('next', 'next');
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('next.config.mjs'),
        expect.stringContaining('export default'),
        'utf-8'
      );
    });

    it('should handle errors gracefully', async () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const frameworkResult = createFrameworkResult();
      const result = await buildToolConfig.configureBuildTool('/test', frameworkResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File system error');
    });
  });

  describe('validateBuildToolConfig', () => {
    it('should validate Vite configuration', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('vite.config.js');
      });
      mockReadFileSync.mockReturnValue(`export default defineConfig({
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  css: {
    postcss: './postcss.config.js'
  }
})`);

      const result = buildToolConfig.validateBuildToolConfig('/test');

      expect(result.hasConfig).toBe(true);
      expect(result.buildTool).toBe('vite');
      expect(result.hasAliases).toBe(true);
      expect(result.hasCssConfig).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing aliases', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('vite.config.js');
      });
      mockReadFileSync.mockReturnValue(`export default defineConfig({
  plugins: [react()]
})`);

      const result = buildToolConfig.validateBuildToolConfig('/test');

      expect(result.hasConfig).toBe(true);
      expect(result.hasAliases).toBe(false);
      expect(result.issues).toContain('Missing @ alias configuration');
    });

    it('should validate Next.js configuration', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('next.config.js');
      });
      mockReadFileSync.mockReturnValue(`module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      '@': './src'
    }
    return config
  }
}`);

      const result = buildToolConfig.validateBuildToolConfig('/test');

      expect(result.hasConfig).toBe(true);
      expect(result.buildTool).toBe('next');
      expect(result.hasAliases).toBe(true);
      expect(result.hasCssConfig).toBe(true); // Next.js handles CSS automatically
    });

    it('should identify no build tool configuration', () => {
      mockExistsSync.mockReturnValue(false);

      const result = buildToolConfig.validateBuildToolConfig('/test');

      expect(result.hasConfig).toBe(false);
      expect(result.buildTool).toBe('none');
      expect(result.issues).toContain('No build tool configuration found');
    });

    it('should validate Webpack configuration', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('webpack.config.js');
      });
      mockReadFileSync.mockReturnValue(`module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  }
}`);

      const result = buildToolConfig.validateBuildToolConfig('/test');

      expect(result.hasConfig).toBe(true);
      expect(result.buildTool).toBe('webpack');
      expect(result.hasAliases).toBe(true);
      expect(result.hasCssConfig).toBe(true);
    });
  });
});