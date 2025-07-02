import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import * as packageManager from '../package-manager.js';
import * as frameworkDetection from '../framework-detection.js';
import * as shadcnUtils from '../shadcn-utils.js';

// Mock fs and dependencies
vi.mock('fs');
vi.mock('../package-manager.js');
vi.mock('../framework-detection.js');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);

describe('shadcn-utils', () => {
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

  describe('setupShadcnUtils', () => {
    it('should set up shadcn utilities for React project', async () => {
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
        'npm install clsx tailwind-merge class-variance-authority'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const frameworkResult = createFrameworkResult();
      const result = await shadcnUtils.setupShadcnUtils('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.packagesInstalled).toEqual(['clsx', 'tailwind-merge', 'class-variance-authority']);
      expect(result.utilsCreated).toBe(true);
      expect(result.configCreated).toBe(true);
    });

    it('should create cn utility function', async () => {
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

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('src/lib');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.0.0',
          'class-variance-authority': '^0.7.0'
        }
      }));

      const frameworkResult = createFrameworkResult();
      const result = await shadcnUtils.setupShadcnUtils('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.utilsCreated).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('utils.ts'),
        expect.stringContaining('export function cn'),
        'utf-8'
      );
    });

    it('should create components.json configuration', async () => {
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

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('src/lib');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.0.0',
          'class-variance-authority': '^0.7.0'
        }
      }));

      const frameworkResult = createFrameworkResult();
      const result = await shadcnUtils.setupShadcnUtils('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      const configCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().endsWith('components.json')
      );
      expect(configCalls.length).toBe(1);
      
      const configContent = JSON.parse(configCalls[0][1] as string);
      expect(configContent.$schema).toBe('https://ui.shadcn.com/schema.json');
      expect(configContent.tsx).toBe(true);
      expect(configContent.aliases.components).toBe('@/src/components');
      expect(configContent.aliases.utils).toBe('@/src/lib');
    });

    it('should handle Next.js specific configuration', async () => {
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

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: false,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'components',
        utilsPath: 'lib'
      });

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('lib');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.0.0',
          'class-variance-authority': '^0.7.0'
        }
      }));

      const frameworkResult = createFrameworkResult('next');
      const result = await shadcnUtils.setupShadcnUtils('/test', frameworkResult);

      expect(result.success).toBe(true);
      
      const configCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().endsWith('components.json')
      );
      
      const configContent = JSON.parse(configCalls[0][1] as string);
      expect(configContent.rsc).toBe(true); // React Server Components for Next.js
      expect(configContent.tailwind.css).toBe('styles/globals.css');
    });

    it('should skip package installation when already installed', async () => {
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

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('src/lib');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.0.0',
          'class-variance-authority': '^0.7.0'
        }
      }));

      const frameworkResult = createFrameworkResult();
      const result = await shadcnUtils.setupShadcnUtils('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.packagesInstalled).toEqual([]);
      expect(vi.mocked(packageManager.executePackageManagerCommand)).not.toHaveBeenCalled();
    });

    it('should include animation packages when requested', async () => {
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
        'npm install clsx tailwind-merge class-variance-authority framer-motion @radix-ui/react-slot'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const frameworkResult = createFrameworkResult();
      const result = await shadcnUtils.setupShadcnUtils(
        '/test', 
        frameworkResult, 
        { includeAnimations: true }
      );

      expect(result.success).toBe(true);
      expect(result.packagesInstalled).toContain('framer-motion');
      expect(result.packagesInstalled).toContain('@radix-ui/react-slot');
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

      vi.mocked(frameworkDetection.getFrameworkRecommendations).mockReturnValue({
        tailwindConfig: 'tailwind.config.js',
        postCssConfig: true,
        tsConfigPath: 'tsconfig.json',
        componentPath: 'src/components',
        utilsPath: 'src/lib'
      });

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('src/lib');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.0.0',
          'class-variance-authority': '^0.7.0'
        }
      }));

      const frameworkResult = createFrameworkResult();
      const result = await shadcnUtils.setupShadcnUtils(
        '/test', 
        frameworkResult, 
        { skipConfig: true }
      );

      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(false);
      
      const configCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().endsWith('components.json')
      );
      expect(configCalls.length).toBe(0);
    });
  });

  describe('validateShadcnSetup', () => {
    it('should validate complete shadcn setup', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.endsWith('utils.ts') ||
               pathStr.endsWith('components.json');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('package.json')) {
          return JSON.stringify({
            dependencies: {
              clsx: '^2.0.0',
              'tailwind-merge': '^2.0.0',
              'class-variance-authority': '^0.7.0'
            }
          });
        }
        if (pathStr.endsWith('utils.ts')) {
          return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
        }
        if (pathStr.endsWith('components.json')) {
          return JSON.stringify({
            tailwind: { css: 'src/index.css' },
            aliases: { components: '@/components' }
          });
        }
        return '';
      });

      const result = shadcnUtils.validateShadcnSetup('/test');

      expect(result.hasPackages).toBe(true);
      expect(result.hasCnUtility).toBe(true);
      expect(result.hasComponentsConfig).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing packages', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          clsx: '^2.0.0'
          // Missing tailwind-merge and class-variance-authority
        }
      }));

      const result = shadcnUtils.validateShadcnSetup('/test');

      expect(result.hasPackages).toBe(false);
      expect(result.missingPackages).toEqual(['tailwind-merge', 'class-variance-authority']);
      expect(result.issues).toContain('Missing packages: tailwind-merge, class-variance-authority');
    });

    it('should identify missing cn utility', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.endsWith('components.json');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('package.json')) {
          return JSON.stringify({
            dependencies: {
              clsx: '^2.0.0',
              'tailwind-merge': '^2.0.0',
              'class-variance-authority': '^0.7.0'
            }
          });
        }
        if (pathStr.endsWith('components.json')) {
          return JSON.stringify({
            tailwind: { css: 'src/index.css' },
            aliases: { components: '@/components' }
          });
        }
        return '';
      });

      const result = shadcnUtils.validateShadcnSetup('/test');

      expect(result.hasCnUtility).toBe(false);
      expect(result.issues).toContain('cn utility function not found');
    });

    it('should identify missing components.json', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('utils.ts');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('package.json')) {
          return JSON.stringify({
            dependencies: {
              clsx: '^2.0.0',
              'tailwind-merge': '^2.0.0',
              'class-variance-authority': '^0.7.0'
            }
          });
        }
        if (pathStr.includes('utils.ts')) {
          return `export function cn() {}`;
        }
        return '';
      });

      const result = shadcnUtils.validateShadcnSetup('/test');

      expect(result.hasComponentsConfig).toBe(false);
      expect(result.issues).toContain('components.json not found');
    });
  });

  describe('getCnUtilityPath', () => {
    it('should find cn utility in common locations', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().includes('src/lib/utils.ts');
      });

      mockReadFileSync.mockReturnValue(`export function cn() {}`);

      const path = shadcnUtils.getCnUtilityPath('/test');
      expect(path).toBe('/test/src/lib/utils.ts');
    });

    it('should return null when cn utility not found', () => {
      mockExistsSync.mockReturnValue(false);

      const path = shadcnUtils.getCnUtilityPath('/test');
      expect(path).toBeNull();
    });
  });

  describe('updateUtilsWithCn', () => {
    it('should add cn function to existing utils file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`// Existing utils\nexport function formatDate() {}`);

      const result = shadcnUtils.updateUtilsWithCn('/test/utils.ts');

      expect(result.success).toBe(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/utils.ts',
        expect.stringContaining('export function formatDate'),
        'utf-8'
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/utils.ts',
        expect.stringContaining('export function cn'),
        'utf-8'
      );
    });

    it('should skip if cn already exists', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`export function cn() {}`);

      const result = shadcnUtils.updateUtilsWithCn('/test/utils.ts');

      expect(result.success).toBe(true);
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should handle missing file', () => {
      mockExistsSync.mockReturnValue(false);

      const result = shadcnUtils.updateUtilsWithCn('/test/utils.ts');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Utils file does not exist');
    });
  });
});