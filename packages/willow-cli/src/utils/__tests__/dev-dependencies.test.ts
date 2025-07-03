import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import * as packageManager from '../package-manager.js';
import * as devDependencies from '../dev-dependencies.js';

// Mock fs and dependencies
vi.mock('fs');
vi.mock('../package-manager.js');

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('dev-dependencies', () => {
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

  describe('setupDevDependencies', () => {
    it('should install dev dependencies for React TypeScript project', async () => {
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

      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install --save-dev eslint prettier husky lint-staged'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const frameworkResult = createFrameworkResult();
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.packagesInstalled.length).toBeGreaterThan(0);
      expect(result.eslintConfigured).toBe(true);
      expect(result.prettierConfigured).toBe(true);
    });

    it('should create ESLint configuration', async () => {
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

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {
          eslint: '^8.0.0',
          '@typescript-eslint/parser': '^5.0.0',
          '@typescript-eslint/eslint-plugin': '^5.0.0'
        }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.eslintConfigured).toBe(true);
      
      // Check ESLint config was created
      const eslintConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('.eslintrc.json')
      );
      expect(eslintConfigCalls.length).toBe(1);
      
      const eslintConfig = JSON.parse(eslintConfigCalls[0][1] as string);
      expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
      expect(eslintConfig.extends).toContain('plugin:tailwindcss/recommended');
    });

    it('should create Prettier configuration with Tailwind plugin', async () => {
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

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: {
          prettier: '^3.0.0',
          'prettier-plugin-tailwindcss': '^0.5.0'
        }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.prettierConfigured).toBe(true);
      
      // Check Prettier config was created
      const prettierConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('.prettierrc.json')
      );
      expect(prettierConfigCalls.length).toBe(1);
      
      const prettierConfig = JSON.parse(prettierConfigCalls[0][1] as string);
      expect(prettierConfig.plugins).toContain('prettier-plugin-tailwindcss');
      expect(prettierConfig.singleQuote).toBe(true);
      expect(prettierConfig.semi).toBe(false);
    });

    it('should configure Next.js specific ESLint', async () => {
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

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { next: '^14.0.0' },
        devDependencies: {
          'eslint-config-next': '^14.0.0'
        }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('next');
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(true);
      
      const eslintConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('.eslintrc.json')
      );
      
      const eslintConfig = JSON.parse(eslintConfigCalls[0][1] as string);
      expect(eslintConfig.extends).toContain('next/core-web-vitals');
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

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: {
          eslint: '^8.0.0',
          prettier: '^3.0.0',
          husky: '^8.0.0',
          'lint-staged': '^15.0.0',
          '@typescript-eslint/parser': '^5.0.0',
          '@typescript-eslint/eslint-plugin': '^5.0.0',
          'eslint-plugin-react': '^7.0.0',
          'eslint-plugin-react-hooks': '^4.0.0',
          'eslint-plugin-jsx-a11y': '^6.0.0',
          'eslint-plugin-tailwindcss': '^3.0.0',
          'prettier-plugin-tailwindcss': '^0.5.0'
        }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.packagesInstalled).toEqual([]);
      
      // Should not call buildInstallCommand for packages
      expect(vi.mocked(packageManager.buildInstallCommand)).not.toHaveBeenCalled();
    });

    it('should configure Husky and lint-staged', async () => {
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

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      const packageJson = {
        dependencies: {},
        devDependencies: {
          husky: '^8.0.0',
          'lint-staged': '^15.0.0'
        },
        scripts: {}
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.huskyConfigured).toBe(true);
      expect(result.lintStagedConfigured).toBe(true);
      
      // Check lint-staged configuration was added to package.json
      const packageJsonCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().endsWith('package.json')
      );
      
      expect(packageJsonCalls.length).toBeGreaterThan(0);
      const updatedPackageJson = JSON.parse(packageJsonCalls[packageJsonCalls.length - 1][1] as string);
      expect(updatedPackageJson['lint-staged']).toBeDefined();
      expect(updatedPackageJson.scripts.prepare).toBe('husky install');
    });

    it('should handle Vue configuration', async () => {
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

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { vue: '^3.0.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install --save-dev eslint eslint-plugin-vue'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('vue');
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(true);
      
      const eslintConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('.eslintrc.json')
      );
      
      const eslintConfig = JSON.parse(eslintConfigCalls[0][1] as string);
      expect(eslintConfig.extends).toContain('plugin:vue/vue3-recommended');
    });

    it('should skip configurations when options specify', async () => {
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

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: {}
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult, {
        skipEslint: true,
        skipPrettier: true,
        skipHusky: true
      });

      expect(result.success).toBe(true);
      expect(result.eslintConfigured).toBe(false);
      expect(result.prettierConfigured).toBe(false);
      expect(result.huskyConfigured).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockImplementation(() => {
        throw new Error('Package manager error');
      });

      const frameworkResult = createFrameworkResult();
      const result = await devDependencies.setupDevDependencies('/test', frameworkResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Package manager error');
    });
  });

  describe('validateDevDependenciesSetup', () => {
    it('should validate complete dev dependencies setup', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.includes('.eslintrc') ||
               pathStr.includes('.prettierrc') ||
               pathStr.includes('.husky');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          eslint: '^8.0.0',
          prettier: '^3.0.0',
          'prettier-plugin-tailwindcss': '^0.5.0',
          husky: '^8.0.0',
          'lint-staged': '^15.0.0'
        },
        'lint-staged': {
          '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write']
        }
      }));

      const result = devDependencies.validateDevDependenciesSetup('/test');

      expect(result.hasEslint).toBe(true);
      expect(result.hasPrettier).toBe(true);
      expect(result.hasHusky).toBe(true);
      expect(result.hasLintStaged).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing ESLint configuration', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          eslint: '^8.0.0'
        }
      }));

      const result = devDependencies.validateDevDependenciesSetup('/test');

      expect(result.hasEslint).toBe(true);
      expect(result.issues).toContain('ESLint installed but no configuration found');
    });

    it('should identify missing Prettier Tailwind plugin', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('.prettierrc');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          prettier: '^3.0.0'
        }
      }));

      const result = devDependencies.validateDevDependenciesSetup('/test');

      expect(result.hasPrettier).toBe(true);
      expect(result.issues).toContain('Missing prettier-plugin-tailwindcss for Tailwind class sorting');
    });

    it('should identify uninitialized Husky', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          husky: '^8.0.0'
        }
      }));

      const result = devDependencies.validateDevDependenciesSetup('/test');

      expect(result.hasHusky).toBe(true);
      expect(result.issues).toContain('Husky installed but not initialized');
    });

    it('should identify unconfigured lint-staged', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          'lint-staged': '^15.0.0'
        }
      }));

      const result = devDependencies.validateDevDependenciesSetup('/test');

      expect(result.hasLintStaged).toBe(true);
      expect(result.issues).toContain('lint-staged installed but not configured');
    });

    it('should identify all missing packages', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {}
      }));

      const result = devDependencies.validateDevDependenciesSetup('/test');

      expect(result.hasEslint).toBe(false);
      expect(result.hasPrettier).toBe(false);
      expect(result.hasHusky).toBe(false);
      expect(result.hasLintStaged).toBe(false);
      expect(result.missingPackages).toEqual(['eslint', 'prettier', 'husky', 'lint-staged']);
    });
  });
});