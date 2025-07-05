import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import * as frameworkDetection from '../framework-detection.js';
import * as directoryStructure from '../directory-structure.js';

// Mock fs and dependencies
vi.mock('fs');
vi.mock('../framework-detection.js');

const mockMkdirSync = vi.mocked(mkdirSync);
const mockExistsSync = vi.mocked(existsSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('directory-structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFrameworkResult = (framework: string = 'react', typescript: boolean = true) => ({
    framework: framework as any,
    buildTool: 'vite' as any,
    typescript,
    configFiles: [],
    dependencies: {},
    devDependencies: {},
    supportedFeatures: []
  });

  describe('createDirectoryStructure', () => {
    it('should create directory structure for React project', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult();
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.directoriesCreated).toContain('src/components');
      expect(result.directoriesCreated).toContain('src/components/ui');
      expect(result.directoriesCreated).toContain('src/lib');
      expect(result.directoriesCreated).toContain('src/lib/hooks');
      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('src/components'),
        { recursive: true }
      );
    });

    it('should create index files for directories', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult();
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.filesCreated.some(f => f.includes('index.ts'))).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('index.ts'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should create JavaScript index files for non-TypeScript projects', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', false);
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.filesCreated.some(f => f.includes('index.js'))).toBe(true);
      expect(result.filesCreated.every(f => !f.includes('index.ts'))).toBe(true);
    });

    it('should skip existing directories', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        return path.toString().includes('src/components');
      });

      const frameworkResult = createFrameworkResult();
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.skipped).toContain('src/components');
      expect(result.directoriesCreated).not.toContain('src/components');
    });

    it('should create Next.js specific structure', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: false,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'components',
        utilsPath: 'lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('next');
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.directoriesCreated).toContain('components');
      expect(result.directoriesCreated).toContain('lib');
      expect(result.directoriesCreated).toContain('styles');
      expect(result.directoriesCreated).toContain('public');
    });

    it('should create Vue specific structure', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/utils'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('vue');
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.directoriesCreated).toContain('src/components');
      expect(result.directoriesCreated).toContain('src/utils');
      expect(result.directoriesCreated).toContain('src/styles');
      expect(result.directoriesCreated).toContain('src/assets');
    });

    it('should skip index files when skipFiles is true', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult();
      const result = directoryStructure.createDirectoryStructure(
        '/test', 
        frameworkResult,
        { skipFiles: true }
      );

      expect(result.success).toBe(true);
      expect(result.filesCreated).toHaveLength(0);
      expect(mockWriteFileSync).not.toHaveBeenCalledWith(
        expect.stringContaining('index'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should use custom paths when provided', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult();
      const result = directoryStructure.createDirectoryStructure(
        '/test', 
        frameworkResult,
        {
          customPaths: {
            components: 'custom/components',
            utils: 'custom/utils',
            lib: 'custom/lib'
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.directoriesCreated).toContain('custom/components');
      expect(result.directoriesCreated).toContain('custom/lib');
    });

    it('should create globals.d.ts for TypeScript projects', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', true);
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.filesCreated.some(f => f.includes('globals.d.ts'))).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('globals.d.ts'),
        expect.stringContaining('declare module'),
        'utf-8'
      );
    });

    it('should create env.d.ts for Vite TypeScript projects', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult('react', true);
      frameworkResult.buildTool = 'vite';
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.filesCreated.some(f => f.includes('env.d.ts'))).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('env.d.ts'),
        expect.stringContaining('vite/client'),
        'utf-8'
      );
    });

    it('should create appropriate CSS file', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);

      const frameworkResult = createFrameworkResult();
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.filesCreated.some(f => f.includes('index.css'))).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('index.css'),
        expect.stringContaining('@tailwind base'),
        'utf-8'
      );
    });

    it('should handle errors gracefully', () => {
      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const frameworkResult = createFrameworkResult();
      const result = directoryStructure.createDirectoryStructure('/test', frameworkResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('validateDirectoryStructure', () => {
    it('should validate complete directory structure', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('src/components') || 
               pathStr.includes('src/lib') ||
               pathStr.includes('src/components/ui');
      });

      const result = directoryStructure.validateDirectoryStructure('/test');

      expect(result.hasComponentsDir).toBe(true);
      expect(result.hasUtilsDir).toBe(true);
      expect(result.hasUIDir).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing components directory', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('src/lib');
      });

      const result = directoryStructure.validateDirectoryStructure('/test');

      expect(result.hasComponentsDir).toBe(false);
      expect(result.hasUIDir).toBe(false);
      expect(result.missingDirs).toContain('components');
      expect(result.issues).toContain('No components directory found');
    });

    it('should identify missing utils directory', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('src/components');
      });

      const result = directoryStructure.validateDirectoryStructure('/test');

      expect(result.hasUtilsDir).toBe(false);
      expect(result.missingDirs).toContain('utils or lib');
      expect(result.issues).toContain('No utils/lib directory found');
    });

    it('should find directories in different locations', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('components') || 
               pathStr.endsWith('lib') ||
               pathStr.endsWith('components/ui');
      });

      const result = directoryStructure.validateDirectoryStructure('/test');

      expect(result.hasComponentsDir).toBe(true);
      expect(result.hasUtilsDir).toBe(true);
      expect(result.hasUIDir).toBe(true);
      expect(result.existingDirs).toContain('components');
      expect(result.existingDirs).toContain('lib');
    });
  });
});