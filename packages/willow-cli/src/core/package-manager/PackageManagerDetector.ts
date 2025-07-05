/**
 * Package Manager Detector
 * Automatically detects which package manager is being used in a project
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import {
  PackageManagerName,
  PackageManagerDetectorOptions,
  LockfileInfo
} from './types.js';

export class PackageManagerDetector {
  private static readonly LOCKFILE_MAP: Record<string, PackageManagerName> = {
    'bun.lockb': 'bun',
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm',
    'npm-shrinkwrap.json': 'npm'
  };

  private static readonly PACKAGE_MANAGER_REGEX = /^(npm|yarn|pnpm|bun)@/;

  /**
   * Detect the package manager from various sources
   */
  static async detect(options: PackageManagerDetectorOptions = {}): Promise<PackageManagerName> {
    const cwd = options.cwd || process.cwd();

    // 1. Check for preferred manager if specified
    if (options.preferredManager) {
      const isAvailable = await this.isManagerAvailable(options.preferredManager);
      if (isAvailable) {
        return options.preferredManager;
      }
    }

    // 2. Check packageManager field in package.json
    const packageManagerField = await this.detectFromPackageJson(cwd);
    if (packageManagerField) {
      return packageManagerField;
    }

    // 3. Check for lockfiles
    const lockfileManager = await this.detectFromLockfile(cwd);
    if (lockfileManager) {
      return lockfileManager;
    }

    // 4. Check environment variables
    const envManager = this.detectFromEnvironment();
    if (envManager) {
      return envManager;
    }

    // 5. Check which package managers are available
    const availableManager = await this.detectFromAvailable();
    if (availableManager) {
      return availableManager;
    }

    // 6. Default to npm
    return 'npm';
  }

  /**
   * Detect all lockfiles in the project
   */
  static async detectLockfiles(cwd: string = process.cwd()): Promise<LockfileInfo[]> {
    const lockfiles: LockfileInfo[] = [];
    
    // Search up the directory tree
    let currentPath = cwd;
    const root = dirname(currentPath);

    while (currentPath !== root) {
      for (const [filename, manager] of Object.entries(this.LOCKFILE_MAP)) {
        const lockfilePath = join(currentPath, filename);
        
        if (existsSync(lockfilePath)) {
          lockfiles.push({
            manager,
            path: lockfilePath
          });
        }
      }

      currentPath = dirname(currentPath);
    }

    return lockfiles;
  }

  /**
   * Detect from package.json packageManager field
   */
  private static async detectFromPackageJson(cwd: string): Promise<PackageManagerName | null> {
    try {
      const packageJsonPath = join(cwd, 'package.json');
      
      if (!existsSync(packageJsonPath)) {
        return null;
      }

      const { readFileSync } = await import('fs');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      if (packageJson.packageManager) {
        const match = packageJson.packageManager.match(this.PACKAGE_MANAGER_REGEX);
        if (match) {
          return match[1] as PackageManagerName;
        }
      }
    } catch {
      // Ignore errors
    }

    return null;
  }

  /**
   * Detect from lockfile
   */
  private static async detectFromLockfile(cwd: string): Promise<PackageManagerName | null> {
    // Check in current directory first
    for (const [filename, manager] of Object.entries(this.LOCKFILE_MAP)) {
      if (existsSync(join(cwd, filename))) {
        return manager;
      }
    }

    // Check parent directories
    let currentPath = cwd;
    const { parse } = await import('path');
    const root = parse(currentPath).root;

    while (currentPath !== root) {
      currentPath = dirname(currentPath);
      
      for (const [filename, manager] of Object.entries(this.LOCKFILE_MAP)) {
        if (existsSync(join(currentPath, filename))) {
          return manager;
        }
      }
    }

    return null;
  }

  /**
   * Detect from environment variables
   */
  private static detectFromEnvironment(): PackageManagerName | null {
    // Check npm_config_user_agent
    const userAgent = process.env.npm_config_user_agent;
    if (userAgent) {
      if (userAgent.includes('yarn')) return 'yarn';
      if (userAgent.includes('pnpm')) return 'pnpm';
      if (userAgent.includes('bun')) return 'bun';
      if (userAgent.includes('npm')) return 'npm';
    }

    // Check npm_execpath
    const execPath = process.env.npm_execpath;
    if (execPath) {
      if (execPath.includes('yarn')) return 'yarn';
      if (execPath.includes('pnpm')) return 'pnpm';
      if (execPath.includes('bun')) return 'bun';
      if (execPath.includes('npm')) return 'npm';
    }

    return null;
  }

  /**
   * Detect from available package managers
   */
  private static async detectFromAvailable(): Promise<PackageManagerName | null> {
    // Check in order of preference
    const managers: PackageManagerName[] = ['pnpm', 'yarn', 'bun', 'npm'];
    
    for (const manager of managers) {
      if (await this.isManagerAvailable(manager)) {
        return manager;
      }
    }

    return null;
  }

  /**
   * Check if a package manager is available
   */
  private static async isManagerAvailable(manager: PackageManagerName): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync(`${manager} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get workspace root if in a workspace
   */
  static async detectWorkspaceRoot(cwd: string = process.cwd()): Promise<string | null> {
    let currentPath = cwd;
    const { parse } = await import('path');
    const root = parse(currentPath).root;

    while (currentPath !== root) {
      const packageJsonPath = join(currentPath, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        try {
          const { readFileSync } = await import('fs');
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          
          // Check for workspace configuration
          if (packageJson.workspaces || 
              (packageJson.pnpm && packageJson.pnpm.workspace) ||
              existsSync(join(currentPath, 'pnpm-workspace.yaml'))) {
            return currentPath;
          }
        } catch {
          // Ignore errors
        }
      }

      // Check for lockfiles that might indicate workspace root
      for (const filename of Object.keys(this.LOCKFILE_MAP)) {
        if (existsSync(join(currentPath, filename))) {
          return currentPath;
        }
      }

      currentPath = dirname(currentPath);
    }

    return null;
  }
}