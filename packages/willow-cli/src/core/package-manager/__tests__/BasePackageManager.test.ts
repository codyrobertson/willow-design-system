/**
 * BasePackageManager Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BasePackageManager } from '../BasePackageManager.js';
import { PackageManagerName, PackageManagerCapabilities } from '../types.js';
import { existsSync, readFileSync } from 'fs';

vi.mock('fs');
vi.mock('child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn()
}));

// Test implementation
class TestPackageManager extends BasePackageManager {
  name: PackageManagerName = 'npm';
  lockfileName = 'package-lock.json';
  capabilities: PackageManagerCapabilities = {
    workspaces: true,
    lockfile: true,
    peerDependencies: true,
    resolutions: false,
    protocols: ['file:', 'link:'],
    offline: true,
    scripts: true
  };

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getVersion(): Promise<string> {
    return '1.0.0';
  }

  async install() {
    return this.executeCommand({ command: 'npm', args: ['install'] });
  }

  async add(packages: string[]) {
    return this.executeCommand({ command: 'npm', args: ['install', ...packages] });
  }

  async remove(packages: string[]) {
    return this.executeCommand({ command: 'npm', args: ['uninstall', ...packages] });
  }

  async update() {
    return this.executeCommand({ command: 'npm', args: ['update'] });
  }

  async run(script: string) {
    return this.executeCommand({ command: 'npm', args: ['run', script] });
  }

  async exec(command: string[]) {
    return this.executeCommand({ command: 'npm', args: ['exec', ...command] });
  }

  async list() {
    return [];
  }

  async getWorkspaces() {
    return [];
  }

  async clean() {
    return this.executeCommand({ command: 'npm', args: ['cache', 'clean'] });
  }

  async getPackageInfo(packageName: string) {
    return { name: packageName };
  }

  protected buildCommand(command: string, args: string[]) {
    return { command, args };
  }
}

describe('BasePackageManager', () => {
  let manager: TestPackageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new TestPackageManager('/test/path');
  });

  describe('readPackageJson', () => {
    it('should read and parse package.json', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          dependencies: {
            lodash: '^4.17.21'
          }
        })
      );

      const result = await manager['readPackageJson']();
      
      expect(result).toEqual({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          lodash: '^4.17.21'
        }
      });
    });

    it('should return null if package.json does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await manager['readPackageJson']();
      expect(result).toBeNull();
    });

    it('should return null if package.json is invalid', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('invalid json');

      const result = await manager['readPackageJson']();
      expect(result).toBeNull();
    });
  });

  describe('isPackageInstalled', () => {
    it('should return true if package is in dependencies', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          dependencies: {
            lodash: '^4.17.21'
          }
        })
      );

      const result = await manager.isPackageInstalled('lodash');
      expect(result).toBe(true);
    });

    it('should return true if package is in devDependencies', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          devDependencies: {
            jest: '^29.0.0'
          }
        })
      );

      const result = await manager.isPackageInstalled('jest');
      expect(result).toBe(true);
    });

    it('should return false if package is not installed', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          dependencies: {}
        })
      );

      const result = await manager.isPackageInstalled('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getInstalledVersion', () => {
    it('should return version if package is installed', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          dependencies: {
            lodash: '^4.17.21'
          }
        })
      );

      const result = await manager.getInstalledVersion('lodash');
      expect(result).toBe('^4.17.21');
    });

    it('should return null if package is not installed', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          dependencies: {}
        })
      );

      const result = await manager.getInstalledVersion('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('translateCommand', () => {
    it('should translate common commands', () => {
      expect(manager.translateCommand('install-deps')).toBe('install');
      expect(manager.translateCommand('add-dep')).toBe('add');
      expect(manager.translateCommand('remove-dep')).toBe('remove');
      expect(manager.translateCommand('clean-cache')).toBe('clean');
    });

    it('should return original command if no translation exists', () => {
      expect(manager.translateCommand('custom-command')).toBe('custom-command');
    });
  });

  describe('getLockfilePath', () => {
    it('should return correct lockfile path', () => {
      const path = manager.getLockfilePath();
      expect(path).toBe('/test/path/package-lock.json');
    });
  });
});