import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import * as packageManager from '../package-manager.js';
import * as testingFramework from '../testing-framework.js';

// Mock fs and dependencies
vi.mock('fs');
vi.mock('../package-manager.js');

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);

describe('testing-framework', () => {
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

  describe('setupTestingFramework', () => {
    it('should setup Vitest for Vite React project', async () => {
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
        'npm install --save-dev vitest @vitest/ui jsdom @testing-library/react'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.framework).toBe('vitest');
      expect(result.packagesInstalled.length).toBeGreaterThan(0);
      expect(result.configCreated).toBe(true);
      expect(result.setupFilesCreated).toBe(true);
    });

    it('should create Vitest configuration', async () => {
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
        devDependencies: { vitest: '^0.34.0' }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.configCreated).toBe(true);
      
      // Check Vitest config was created
      const vitestConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('vitest.config')
      );
      expect(vitestConfigCalls.length).toBe(1);
      
      const vitestConfig = vitestConfigCalls[0][1] as string;
      expect(vitestConfig).toContain('defineConfig');
      expect(vitestConfig).toContain('globals: true');
      expect(vitestConfig).toContain("environment: 'jsdom'");
    });

    it('should setup Jest for CRA project', async () => {
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
        'npm install --save-dev jest @types/jest jest-environment-jsdom'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const frameworkResult = createFrameworkResult('react', 'cra');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.framework).toBe('jest');
    });

    it('should create Jest configuration for TypeScript', async () => {
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
        devDependencies: { jest: '^29.0.0' }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('react', 'webpack', true);
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult, {
        preferVitest: false
      });

      expect(result.success).toBe(true);
      expect(result.framework).toBe('jest');
      
      // Check Jest config was created
      const jestConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('jest.config')
      );
      expect(jestConfigCalls.length).toBe(1);
      
      const jestConfig = jestConfigCalls[0][1] as string;
      expect(jestConfig).toContain("preset: 'ts-jest'");
      expect(jestConfig).toContain("testEnvironment: 'jsdom'");
    });

    it('should create setup files', async () => {
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
        devDependencies: { vitest: '^0.34.0' }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.setupFilesCreated).toBe(true);
      
      // Check setup file was created
      const setupFileCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('setup.ts')
      );
      expect(setupFileCalls.length).toBe(1);
      
      const setupContent = setupFileCalls[0][1] as string;
      expect(setupContent).toContain('@testing-library/jest-dom');
      expect(setupContent).toContain('window.matchMedia');
      
      // Check test utils was created
      const testUtilsCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('test-utils')
      );
      expect(testUtilsCalls.length).toBe(1);
      
      const utilsContent = testUtilsCalls[0][1] as string;
      expect(utilsContent).toContain('customRender');
      expect(utilsContent).toContain('@testing-library/react');
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
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { vue: '^3.0.0' },
        devDependencies: {}
      }));

      vi.mocked(packageManager.buildInstallCommand).mockReturnValue(
        'npm install --save-dev vitest @testing-library/vue @vue/test-utils'
      );

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('vue', 'vite');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.framework).toBe('vitest');
      
      const vitestConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('vitest.config')
      );
      
      const vitestConfig = vitestConfigCalls[0][1] as string;
      expect(vitestConfig).toContain('vue()');
    });

    it('should update package.json scripts', async () => {
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

      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { vitest: '^0.34.0' },
        scripts: {}
      };

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(true);
      
      const packageJsonCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().endsWith('package.json')
      );
      
      expect(packageJsonCalls.length).toBeGreaterThan(0);
      const updatedPackageJson = JSON.parse(packageJsonCalls[packageJsonCalls.length - 1][1] as string);
      expect(updatedPackageJson.scripts.test).toBe('vitest');
      expect(updatedPackageJson.scripts['test:ui']).toBe('vitest --ui');
      expect(updatedPackageJson.scripts['test:coverage']).toBe('vitest --coverage');
    });

    it('should skip when testing framework already exists', async () => {
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
        return pathStr.endsWith('package.json') || pathStr.includes('vitest.config');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {
          vitest: '^0.34.0',
          '@vitest/ui': '^0.34.0',
          jsdom: '^22.0.0',
          '@testing-library/react': '^14.0.0',
          '@testing-library/jest-dom': '^6.0.0',
          '@testing-library/user-event': '^14.0.0'
        }
      }));

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.framework).toBe('vitest');
      expect(result.packagesInstalled).toEqual([]);
      expect(result.configCreated).toBe(false);
    });

    it('should use custom config when provided', async () => {
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
        devDependencies: { vitest: '^0.34.0' }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('react', 'vite');
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult, {
        customConfig: {
          testTimeout: 10000,
          maxConcurrency: 5
        }
      });

      expect(result.success).toBe(true);
      
      const vitestConfigCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('vitest.config')
      );
      
      const vitestConfig = vitestConfigCalls[0][1] as string;
      expect(vitestConfig).toContain('testTimeout: 10000');
      expect(vitestConfig).toContain('maxConcurrency: 5');
    });

    it('should handle errors gracefully', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockImplementation(() => {
        throw new Error('Package manager error');
      });

      const frameworkResult = createFrameworkResult();
      const result = await testingFramework.setupTestingFramework('/test', frameworkResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Package manager error');
    });
  });

  describe('validateTestingSetup', () => {
    it('should validate complete testing setup', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.includes('vitest.config') ||
               pathStr.includes('src/test/setup');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          vitest: '^0.34.0',
          '@testing-library/react': '^14.0.0',
          '@testing-library/jest-dom': '^6.0.0'
        }
      }));

      const result = testingFramework.validateTestingSetup('/test');

      expect(result.hasTestingFramework).toBe(true);
      expect(result.framework).toBe('vitest');
      expect(result.hasConfig).toBe(true);
      expect(result.hasSetupFiles).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing testing configuration', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          vitest: '^0.34.0'
        }
      }));

      const result = testingFramework.validateTestingSetup('/test');

      expect(result.hasTestingFramework).toBe(true);
      expect(result.hasConfig).toBe(false);
      expect(result.issues).toContain('Vitest installed but no configuration found');
    });

    it('should identify missing testing library', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('jest.config');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          jest: '^29.0.0'
        }
      }));

      const result = testingFramework.validateTestingSetup('/test');

      expect(result.hasTestingFramework).toBe(true);
      expect(result.framework).toBe('jest');
      expect(result.issues).toContain('No testing library found for component testing');
    });

    it('should detect Jest in package.json config', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          jest: '^29.0.0',
          '@testing-library/react': '^14.0.0'
        },
        jest: {
          testEnvironment: 'jsdom'
        }
      }));

      const result = testingFramework.validateTestingSetup('/test');

      expect(result.hasTestingFramework).toBe(true);
      expect(result.framework).toBe('jest');
      expect(result.hasConfig).toBe(true);
    });

    it('should check for test utilities', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.includes('vitest.config') ||
               pathStr.includes('test-utils');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          vitest: '^0.34.0',
          '@testing-library/react': '^14.0.0'
        }
      }));

      const result = testingFramework.validateTestingSetup('/test');

      expect(result.hasTestingFramework).toBe(true);
      expect(result.hasTestUtils).toBe(true);
    });
  });
});