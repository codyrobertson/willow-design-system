/**
 * PackageManagerDetector Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PackageManagerDetector } from '../PackageManagerDetector.js';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

vi.mock('fs');
vi.mock('child_process');

describe('PackageManagerDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.npm_config_user_agent;
    delete process.env.npm_execpath;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detect', () => {
    it('should detect npm from package-lock.json', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('package-lock.json');
      });

      const result = await PackageManagerDetector.detect();
      expect(result).toBe('npm');
    });

    it('should detect yarn from yarn.lock', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('yarn.lock');
      });

      const result = await PackageManagerDetector.detect();
      expect(result).toBe('yarn');
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('pnpm-lock.yaml');
      });

      const result = await PackageManagerDetector.detect();
      expect(result).toBe('pnpm');
    });

    it('should detect bun from bun.lockb', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('bun.lockb');
      });

      const result = await PackageManagerDetector.detect();
      expect(result).toBe('bun');
    });

    it('should detect from packageManager field in package.json', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('package.json');
      });
      
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'test-project',
          packageManager: 'pnpm@8.0.0'
        })
      );

      const result = await PackageManagerDetector.detect();
      expect(result).toBe('pnpm');
    });

    it('should detect from npm_config_user_agent', async () => {
      process.env.npm_config_user_agent = 'yarn/1.22.0 npm/? node/v16.0.0';
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await PackageManagerDetector.detect();
      expect(result).toBe('yarn');
    });

    it('should use preferred manager if available', async () => {
      vi.mocked(execSync).mockImplementation(() => Buffer.from('1.0.0'));
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await PackageManagerDetector.detect({
        preferredManager: 'pnpm'
      });
      
      expect(result).toBe('pnpm');
    });

    it('should default to npm if nothing detected', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = await PackageManagerDetector.detect();
      expect(result).toBe('npm');
    });
  });

  describe('detectLockfiles', () => {
    it('should detect multiple lockfiles', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('yarn.lock') || pathStr.includes('package-lock.json');
      });

      const result = await PackageManagerDetector.detectLockfiles('/test/path');
      
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(
        expect.objectContaining({
          manager: 'yarn',
          path: expect.stringContaining('yarn.lock')
        })
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          manager: 'npm',
          path: expect.stringContaining('package-lock.json')
        })
      );
    });

    it('should return empty array if no lockfiles found', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await PackageManagerDetector.detectLockfiles('/test/path');
      expect(result).toEqual([]);
    });
  });

  describe('detectWorkspaceRoot', () => {
    it('should detect workspace root from package.json workspaces field', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path.toString().includes('package.json');
      });
      
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'monorepo',
          workspaces: ['packages/*']
        })
      );

      const result = await PackageManagerDetector.detectWorkspaceRoot('/test/packages/app');
      expect(result).toBeTruthy();
    });

    it('should detect pnpm workspace from pnpm-workspace.yaml', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = path.toString();
        return pathStr.includes('pnpm-workspace.yaml') || pathStr.includes('package.json');
      });
      
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'test-package'
        })
      );

      const result = await PackageManagerDetector.detectWorkspaceRoot('/test/packages/app');
      expect(result).toBeTruthy();
    });

    it('should return null if no workspace found', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await PackageManagerDetector.detectWorkspaceRoot('/test/path');
      expect(result).toBeNull();
    });
  });
});