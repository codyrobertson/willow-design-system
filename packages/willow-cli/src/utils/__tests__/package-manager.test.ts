import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import * as packageManager from '../package-manager.js';

// Mock fs and child_process
vi.mock('fs');
vi.mock('child_process');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockExecSync = vi.mocked(execSync);

describe('package-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectPackageManager', () => {
    it('should detect bun from lock file', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('bun.lockb');
      });
      mockExecSync.mockReturnValue('1.0.0');

      const result = packageManager.detectPackageManager();
      expect(result.name).toBe('bun');
    });

    it('should detect pnpm from lock file', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('pnpm-lock.yaml');
      });
      mockExecSync.mockReturnValue('8.0.0');

      const result = packageManager.detectPackageManager();
      expect(result.name).toBe('pnpm');
    });

    it('should detect yarn from lock file', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('yarn.lock');
      });
      mockExecSync.mockReturnValue('1.22.0');

      const result = packageManager.detectPackageManager();
      expect(result.name).toBe('yarn');
    });

    it('should detect npm from lock file', () => {
      mockExistsSync.mockImplementation((path) => {
        return path.toString().endsWith('package-lock.json');
      });
      mockExecSync.mockReturnValue('9.0.0');

      const result = packageManager.detectPackageManager();
      expect(result.name).toBe('npm');
    });

    it('should fallback to available binaries when no lock files', () => {
      mockExistsSync.mockReturnValue(false);
      
      // Mock isPackageManagerAvailable function directly
      const mockIsPackageManagerAvailable = vi.spyOn(packageManager, 'isPackageManagerAvailable');
      mockIsPackageManagerAvailable.mockImplementation((manager) => {
        return manager === 'bun';
      });
      
      mockExecSync.mockReturnValue('1.0.0');

      const result = packageManager.detectPackageManager();
      expect(result.name).toBe('bun');
      
      mockIsPackageManagerAvailable.mockRestore();
    });

    it('should fallback to npm when nothing is available', () => {
      mockExistsSync.mockReturnValue(false);
      
      // Mock execSync to throw for all package manager checks
      // This simulates none being available
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = packageManager.detectPackageManager();
      expect(result.name).toBe('npm');
    });
  });

  describe('isPackageManagerAvailable', () => {
    it('should return true when package manager is available', () => {
      mockExecSync.mockImplementation((command) => {
        // Return version for any command, simulating the package manager is available
        return '1.0.0';
      });
      expect(packageManager.isPackageManagerAvailable('bun')).toBe(true);
    });

    it('should return false when package manager is not available', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });
      expect(packageManager.isPackageManagerAvailable('bun')).toBe(false);
    });
  });

  describe('getPackageManagerInfo', () => {
    it('should return correct info for npm', () => {
      mockExecSync.mockReturnValue('9.0.0');
      const info = packageManager.getPackageManagerInfo('npm');
      
      expect(info.name).toBe('npm');
      expect(info.lockFile).toBe('package-lock.json');
      expect(info.installCommand).toBe('npm install');
      expect(info.addCommand).toBe('npm install');
      expect(info.removeCommand).toBe('npm uninstall');
      expect(info.runCommand).toBe('npm run');
    });

    it('should return correct info for yarn', () => {
      mockExecSync.mockReturnValue('1.22.0');
      const info = packageManager.getPackageManagerInfo('yarn');
      
      expect(info.name).toBe('yarn');
      expect(info.lockFile).toBe('yarn.lock');
      expect(info.installCommand).toBe('yarn install');
      expect(info.addCommand).toBe('yarn add');
      expect(info.removeCommand).toBe('yarn remove');
      expect(info.runCommand).toBe('yarn');
    });

    it('should return correct info for pnpm', () => {
      mockExecSync.mockReturnValue('8.0.0');
      const info = packageManager.getPackageManagerInfo('pnpm');
      
      expect(info.name).toBe('pnpm');
      expect(info.lockFile).toBe('pnpm-lock.yaml');
      expect(info.installCommand).toBe('pnpm install');
      expect(info.addCommand).toBe('pnpm add');
      expect(info.removeCommand).toBe('pnpm remove');
      expect(info.runCommand).toBe('pnpm run');
    });

    it('should return correct info for bun', () => {
      mockExecSync.mockReturnValue('1.0.0');
      const info = packageManager.getPackageManagerInfo('bun');
      
      expect(info.name).toBe('bun');
      expect(info.lockFile).toBe('bun.lockb');
      expect(info.installCommand).toBe('bun install');
      expect(info.addCommand).toBe('bun add');
      expect(info.removeCommand).toBe('bun remove');
      expect(info.runCommand).toBe('bun run');
    });
  });

  describe('buildInstallCommand', () => {
    const npmInfo = {
      name: 'npm' as const,
      version: '9.0.0',
      lockFile: 'package-lock.json',
      installCommand: 'npm install',
      addCommand: 'npm install',
      removeCommand: 'npm uninstall',
      runCommand: 'npm run'
    };

    it('should build basic install command', () => {
      const command = packageManager.buildInstallCommand(npmInfo, 'react');
      expect(command).toBe('npm install react');
    });

    it('should build install command with multiple packages', () => {
      const command = packageManager.buildInstallCommand(npmInfo, ['react', 'react-dom']);
      expect(command).toBe('npm install react react-dom');
    });

    it('should add dev flag for npm', () => {
      const command = packageManager.buildInstallCommand(npmInfo, 'typescript', { dev: true });
      expect(command).toBe('npm install typescript --save-dev');
    });

    it('should add exact flag for npm', () => {
      const command = packageManager.buildInstallCommand(npmInfo, 'react', { exact: true });
      expect(command).toBe('npm install react --save-exact');
    });

    it('should combine multiple flags', () => {
      const command = packageManager.buildInstallCommand(npmInfo, 'typescript', { dev: true, exact: true });
      expect(command).toBe('npm install typescript --save-dev --save-exact');
    });
  });

  describe('arePackagesInstalled', () => {
    it('should return true when packages are installed', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' }
      }));

      expect(packageManager.arePackagesInstalled(['react', 'typescript'])).toBe(true);
    });

    it('should return false when packages are not installed', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' }
      }));

      expect(packageManager.arePackagesInstalled(['react', 'vue'])).toBe(false);
    });

    it('should return false when package.json does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      expect(packageManager.arePackagesInstalled(['react'])).toBe(false);
    });
  });

  describe('getInstalledPackageVersions', () => {
    it('should return package versions', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' }
      }));

      const versions = packageManager.getInstalledPackageVersions(['react', 'typescript', 'vue']);
      expect(versions).toEqual({
        react: '^18.0.0',
        typescript: '^5.0.0',
        vue: null
      });
    });

    it('should handle missing package.json', () => {
      mockExistsSync.mockReturnValue(false);
      const versions = packageManager.getInstalledPackageVersions(['react']);
      expect(versions).toEqual({ react: null });
    });
  });

  describe('executePackageManagerCommand', () => {
    it('should execute command successfully', () => {
      mockExecSync.mockReturnValue('Success');
      const result = packageManager.executePackageManagerCommand('npm install');
      
      expect(result.success).toBe(true);
      expect(result.output).toBe('Success');
    });

    it('should handle command errors', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      
      const result = packageManager.executePackageManagerCommand('npm install');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Command failed');
    });
  });
});