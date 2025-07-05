import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as packageManager from '../package-manager.js';
import * as frameworkDetection from '../framework-detection.js';
import * as tailwindInstaller from '../tailwind-installer.js';

// Mock fs and dependencies
vi.mock('fs');
vi.mock('../package-manager.js');
vi.mock('../framework-detection.js');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

describe('tailwind-installer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('installTailwindCSS', () => {
    it('should install Tailwind CSS for React project', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockReturnValue({
        name: 'npm',
        version: '9.0.0',
        lockFile: 'package-lock.json',
        installCommand: 'npm install',
        addCommand: 'npm install',
        removeCommand: 'npm uninstall',
        runCommand: 'npm run'
      });

      vi.mocked(frameworkDetection.detectFramework).mockReturnValue({
        framework: 'react',
        buildTool: 'vite',
        typescript: true,
        configFiles: [],
        dependencies: { react: '^18.0.0' },
        devDependencies: {},
        supportedFeatures: []
      });

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install tailwindcss postcss autoprefixer --save-dev'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const result = await tailwindInstaller.installTailwindCSS();

      expect(result.success).toBe(true);
      expect(result.installed).toEqual(['tailwindcss', 'postcss', 'autoprefixer']);
      expect(result.configCreated).toBe(true);
      expect(result.cssFileCreated).toBe(true);
    });

    it('should skip already installed packages', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockReturnValue({
        name: 'npm',
        version: '9.0.0',
        lockFile: 'package-lock.json',
        installCommand: 'npm install',
        addCommand: 'npm install',
        removeCommand: 'npm uninstall',
        runCommand: 'npm run'
      });

      vi.mocked(frameworkDetection.detectFramework).mockReturnValue({
        framework: 'react',
        buildTool: 'vite',
        typescript: true,
        configFiles: [],
        dependencies: { react: '^18.0.0' },
        devDependencies: {},
        supportedFeatures: []
      });

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {
          tailwindcss: '^3.3.0',
          postcss: '^8.4.0',
          autoprefixer: '^10.4.0'
        }
      }));

      const result = await tailwindInstaller.installTailwindCSS();

      expect(result.success).toBe(true);
      expect(result.installed).toEqual([]);
      expect(result.skipped).toEqual(['tailwindcss', 'postcss', 'autoprefixer']);
    });

    it('should handle Next.js project with specific configuration', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockReturnValue({
        name: 'npm',
        version: '9.0.0',
        lockFile: 'package-lock.json',
        installCommand: 'npm install',
        addCommand: 'npm install',
        removeCommand: 'npm uninstall',
        runCommand: 'npm run'
      });

      vi.mocked(frameworkDetection.detectFramework).mockReturnValue({
        framework: 'next',
        buildTool: 'webpack',
        typescript: true,
        configFiles: [],
        dependencies: { next: '^14.0.0', react: '^18.0.0' },
        devDependencies: {},
        supportedFeatures: ['ssr']
      });

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: false,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'components',
        utilsPath: 'lib'
      });

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { next: '^14.0.0', react: '^18.0.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install tailwindcss postcss autoprefixer --save-dev'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const result = await tailwindInstaller.installTailwindCSS();

      expect(result.success).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('tailwind.config.js'),
        expect.stringContaining('module.exports'),
        'utf-8'
      );
    });

    it('should handle Vue project', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockReturnValue({
        name: 'npm',
        version: '9.0.0',
        lockFile: 'package-lock.json',
        installCommand: 'npm install',
        addCommand: 'npm install',
        removeCommand: 'npm uninstall',
        runCommand: 'npm run'
      });

      vi.mocked(frameworkDetection.detectFramework).mockReturnValue({
        framework: 'vue',
        buildTool: 'vite',
        typescript: true,
        configFiles: [],
        dependencies: { vue: '^3.3.0' },
        devDependencies: {},
        supportedFeatures: []
      });

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/utils'
      });

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { vue: '^3.3.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install tailwindcss postcss autoprefixer --save-dev'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const result = await tailwindInstaller.installTailwindCSS();

      expect(result.success).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('tailwind.config.js'),
        expect.stringContaining('export default'),
        'utf-8'
      );
    });

    it('should skip config creation when skipConfig is true', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockReturnValue({
        name: 'npm',
        version: '9.0.0',
        lockFile: 'package-lock.json',
        installCommand: 'npm install',
        addCommand: 'npm install',
        removeCommand: 'npm uninstall',
        runCommand: 'npm run'
      });

      vi.mocked(frameworkDetection.detectFramework).mockReturnValue({
        framework: 'react',
        buildTool: 'vite',
        typescript: true,
        configFiles: [],
        dependencies: { react: '^18.0.0' },
        devDependencies: {},
        supportedFeatures: []
      });

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install tailwindcss postcss autoprefixer --save-dev'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const result = await tailwindInstaller.installTailwindCSS(
        process.cwd(),
        { skipConfig: true }
      );

      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
    });

    it('should handle package installation failure', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockReturnValue({
        name: 'npm',
        version: '9.0.0',
        lockFile: 'package-lock.json',
        installCommand: 'npm install',
        addCommand: 'npm install',
        removeCommand: 'npm uninstall',
        runCommand: 'npm run'
      });

      vi.mocked(frameworkDetection.detectFramework).mockReturnValue({
        framework: 'react',
        buildTool: 'vite',
        typescript: true,
        configFiles: [],
        dependencies: { react: '^18.0.0' },
        devDependencies: {},
        supportedFeatures: []
      });

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install tailwindcss postcss autoprefixer --save-dev'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: false,
        output: '',
        error: 'Network error'
      });

      const result = await tailwindInstaller.installTailwindCSS();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to install packages: Network error');
    });
  });

  describe('validateTailwindInstallation', () => {
    it('should validate complete Tailwind installation', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.endsWith('tailwind.config.js') ||
               pathStr.endsWith('src/index.css');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('package.json')) {
          return JSON.stringify({
            devDependencies: {
              tailwindcss: '^3.3.0',
              postcss: '^8.4.0',
              autoprefixer: '^10.4.0'
            }
          });
        }
        if (pathStr.endsWith('src/index.css')) {
          return '@tailwind base;\n@tailwind components;\n@tailwind utilities;';
        }
        return '';
      });

      const result = tailwindInstaller.validateTailwindInstallation();

      expect(result.isInstalled).toBe(true);
      expect(result.hasConfig).toBe(true);
      expect(result.hasCss).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing packages', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          tailwindcss: '^3.3.0'
          // Missing postcss and autoprefixer
        }
      }));

      const result = tailwindInstaller.validateTailwindInstallation();

      expect(result.isInstalled).toBe(false);
      expect(result.issues).toContain('Missing packages: postcss, autoprefixer');
    });

    it('should identify missing config file', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('src/index.css');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('package.json')) {
          return JSON.stringify({
            devDependencies: {
              tailwindcss: '^3.3.0',
              postcss: '^8.4.0',
              autoprefixer: '^10.4.0'
            }
          });
        }
        return '@tailwind base;\n@tailwind components;\n@tailwind utilities;';
      });

      const result = tailwindInstaller.validateTailwindInstallation();

      expect(result.hasConfig).toBe(false);
      expect(result.issues).toContain('No Tailwind config file found');
    });

    it('should identify missing CSS directives', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('tailwind.config.js');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          tailwindcss: '^3.3.0',
          postcss: '^8.4.0',
          autoprefixer: '^10.4.0'
        }
      }));

      const result = tailwindInstaller.validateTailwindInstallation();

      expect(result.hasCss).toBe(false);
      expect(result.issues).toContain('No CSS file with Tailwind directives found');
    });
  });
});