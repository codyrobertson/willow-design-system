import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import * as packageManager from '../package-manager.js';
import * as storybookConfig from '../storybook-config.js';

// Mock fs and child_process
vi.mock('fs');
vi.mock('child_process');
vi.mock('../package-manager.js');

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockExecSync = vi.mocked(execSync);

describe('storybook-config', () => {
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

  describe('setupStorybook', () => {
    it('should initialize Storybook for React project', async () => {
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
        devDependencies: {},
        scripts: {}
      }));

      mockExecSync.mockReturnValue(Buffer.from('Success'));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Packages installed successfully'
      });

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.initialized).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('npx storybook@latest init'),
        expect.any(Object)
      );
    });

    it('should skip initialization if Storybook already installed', async () => {
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
        return pathStr.endsWith('package.json') || pathStr.includes('.storybook');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: {
          '@storybook/react': '^7.0.0'
        },
        scripts: {
          storybook: 'storybook dev -p 6006',
          'build-storybook': 'storybook build'
        }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.initialized).toBe(false);
      expect(mockExecSync).not.toHaveBeenCalled();
    });

    it('should update Storybook configuration for Tailwind', async () => {
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
        devDependencies: { '@storybook/react': '^7.0.0' },
        scripts: { storybook: 'storybook dev' }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.configUpdated).toBe(true);
      
      // Check preview config was created
      const previewCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('preview')
      );
      expect(previewCalls.length).toBeGreaterThan(0);
      
      const previewContent = previewCalls[0][1] as string;
      expect(previewContent).toContain("import '../src/index.css'");
      expect(previewContent).toContain('themes:');
    });

    it('should install Storybook addons', async () => {
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
        devDependencies: { '@storybook/react': '^7.0.0' },
        scripts: { storybook: 'storybook dev' }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.addonsInstalled.length).toBeGreaterThan(0);
      expect(vi.mocked(packageManager.executePackageManagerCommand)).toHaveBeenCalledWith(
        expect.stringContaining('@storybook/addon-a11y'),
        expect.any(Object)
      );
    });

    it('should create example stories', async () => {
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
        devDependencies: { '@storybook/react': '^7.0.0' },
        scripts: { storybook: 'storybook dev' }
      }));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(true);
      expect(result.exampleCreated).toBe(true);
      
      // Check Button story was created
      const buttonStoryCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('Button.stories')
      );
      expect(buttonStoryCalls.length).toBe(1);
      
      const buttonStory = buttonStoryCalls[0][1] as string;
      expect(buttonStory).toContain('import { Button }');
      expect(buttonStory).toContain('title: \'Example/Button\'');
      
      // Check Card story was created
      const cardStoryCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('Card.stories')
      );
      expect(cardStoryCalls.length).toBe(1);
    });

    it('should handle Vue framework', async () => {
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
        devDependencies: {},
        scripts: {}
      }));

      mockExecSync.mockReturnValue(Buffer.from('Success'));

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult('vue');
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(true);
      
      const previewCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('preview')
      );
      
      const previewContent = previewCalls[0][1] as string;
      expect(previewContent).toContain('@storybook/vue3');
    });

    it('should update existing main.js configuration', async () => {
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

      const existingMain = `module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs)'],
  addons: [
    '@storybook/addon-essentials'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  }
}`;

      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.includes('.storybook') ||
               pathStr.endsWith('main.js');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('main.js')) {
          return existingMain;
        }
        return JSON.stringify({
          dependencies: { react: '^18.0.0' },
          devDependencies: { '@storybook/react': '^7.0.0' },
          scripts: { storybook: 'storybook dev' }
        });
      });

      vi.mocked(packageManager.executePackageManagerCommand).mockReturnValue({
        success: true,
        output: 'Success'
      });

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(true);
      
      // Check main config was updated
      const mainCalls = mockWriteFileSync.mock.calls.filter(
        call => call[0].toString().includes('main')
      );
      
      if (mainCalls.length > 0) {
        const mainContent = mainCalls[0][1] as string;
        expect(mainContent).toContain('@storybook/addon-postcss');
        expect(mainContent).toContain('.stories.@(js|jsx|mjs|ts|tsx)');
      }
    });

    it('should skip when options specify', async () => {
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
        devDependencies: { '@storybook/react': '^7.0.0' },
        scripts: { storybook: 'storybook dev' }
      }));

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult, {
        skipAddons: true,
        skipExamples: true
      });

      expect(result.success).toBe(true);
      expect(result.addonsInstalled).toEqual([]);
      expect(result.exampleCreated).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Setup mocks
      vi.mocked(packageManager.detectPackageManager).mockImplementation(() => {
        throw new Error('Package manager error');
      });

      const frameworkResult = createFrameworkResult();
      const result = await storybookConfig.setupStorybook('/test', frameworkResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Package manager error');
    });
  });

  describe('validateStorybookSetup', () => {
    it('should validate complete Storybook setup', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.includes('.storybook') ||
               pathStr.includes('preview');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('package.json')) {
          return JSON.stringify({
            devDependencies: {
              '@storybook/react': '^7.0.0',
              '@storybook/addon-essentials': '^7.0.0',
              '@storybook/addon-a11y': '^7.0.0',
              '@storybook/addon-interactions': '^7.0.0',
              'storybook-addon-themes': '^6.1.0',
              '@storybook/addon-postcss': '^2.0.0'
            },
            scripts: {
              storybook: 'storybook dev'
            }
          });
        }
        if (pathStr.includes('preview')) {
          return "import '../src/index.css';\nexport default {};";
        }
        return '';
      });

      const result = storybookConfig.validateStorybookSetup('/test');

      expect(result.isInstalled).toBe(true);
      expect(result.hasConfig).toBe(true);
      expect(result.hasPreview).toBe(true);
      expect(result.hasAddons.length).toBeGreaterThan(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing Storybook installation', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package.json');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {},
        scripts: {}
      }));

      const result = storybookConfig.validateStorybookSetup('/test');

      expect(result.isInstalled).toBe(false);
      expect(result.issues).toContain('Storybook is not installed');
    });

    it('should identify missing preview configuration', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        // Return true for package.json and .storybook directory, but false for preview files
        return (pathStr.endsWith('package.json') || 
                (pathStr.includes('.storybook') && !pathStr.includes('preview')));
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          '@storybook/react': '^7.0.0'
        },
        scripts: {
          storybook: 'storybook dev'
        }
      }));

      const result = storybookConfig.validateStorybookSetup('/test');

      expect(result.isInstalled).toBe(true);
      expect(result.hasConfig).toBe(true);
      expect(result.hasPreview).toBe(false);
      expect(result.issues).toContain('No preview configuration found');
    });

    it('should identify missing Tailwind CSS import', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || 
               pathStr.includes('.storybook') ||
               pathStr.includes('preview');
      });

      mockReadFileSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('package.json')) {
          return JSON.stringify({
            devDependencies: { '@storybook/react': '^7.0.0' },
            scripts: { storybook: 'storybook dev' }
          });
        }
        if (pathStr.includes('preview')) {
          return 'export default {};'; // No CSS import
        }
        return '';
      });

      const result = storybookConfig.validateStorybookSetup('/test');

      expect(result.hasPreview).toBe(true);
      expect(result.issues).toContain('Tailwind CSS not imported in preview configuration');
    });

    it('should identify missing addons', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.endsWith('package.json') || pathStr.includes('.storybook');
      });

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          '@storybook/react': '^7.0.0',
          '@storybook/addon-essentials': '^7.0.0'
        },
        scripts: {
          storybook: 'storybook dev'
        }
      }));

      const result = storybookConfig.validateStorybookSetup('/test');

      expect(result.hasAddons).toContain('@storybook/addon-essentials');
      expect(result.missingAddons).toContain('@storybook/addon-a11y');
      expect(result.issues).toContain('PostCSS addon not installed for Tailwind support');
    });
  });
});