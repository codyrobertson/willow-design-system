/**
 * Base Package Manager Implementation
 * Common functionality for all package managers
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ExecutionResult,
  PackageInfo,
  PackageManagerCommand,
  RunOptions
} from './types.js';
import { PackageManagerInterface } from './PackageManagerInterface.js';

const execAsync = promisify(exec);

export abstract class BasePackageManager extends PackageManagerInterface {
  /**
   * Execute a command
   */
  protected async executeCommand(
    command: PackageManagerCommand,
    options?: RunOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const cwd = command.cwd || this.cwd;
    const env = { ...process.env, ...command.env, ...options?.env };

    try {
      const fullCommand = `${command.command} ${command.args.join(' ')}`;
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd,
        env,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });

      return {
        success: true,
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check if command exists
   */
  protected async commandExists(command: string): Promise<boolean> {
    try {
      const { exitCode } = await this.executeCommand({
        command: process.platform === 'win32' ? 'where' : 'which',
        args: [command]
      });
      return exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * Read package.json
   */
  protected async readPackageJson(path?: string): Promise<PackageInfo | null> {
    const packagePath = join(path || this.cwd, 'package.json');
    
    if (!existsSync(packagePath)) {
      return null;
    }

    try {
      const content = readFileSync(packagePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Parse package list output (common format)
   */
  protected parsePackageList(output: string): PackageInfo[] {
    // This is a basic implementation; subclasses may override
    const packages: PackageInfo[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Basic parsing - subclasses should implement specific parsing
      const match = line.match(/^(\S+)@(\S+)/);
      if (match) {
        packages.push({
          name: match[1],
          version: match[2]
        });
      }
    }

    return packages;
  }

  /**
   * Check if package is installed
   */
  async isPackageInstalled(packageName: string): Promise<boolean> {
    const packageJson = await this.readPackageJson();
    if (!packageJson) return false;

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };

    return packageName in allDeps;
  }

  /**
   * Get installed package version
   */
  async getInstalledVersion(packageName: string): Promise<string | null> {
    const packageJson = await this.readPackageJson();
    if (!packageJson) return null;

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };

    return allDeps[packageName] || null;
  }

  /**
   * Check if in a workspace
   */
  async isWorkspace(): Promise<boolean> {
    if (!this.capabilities.workspaces) return false;

    // Check if current directory has a parent with workspaces
    let currentPath = this.cwd;
    const root = await this.getWorkspaceRoot();
    
    return root !== null && currentPath.startsWith(root);
  }

  /**
   * Get workspace root
   */
  async getWorkspaceRoot(): Promise<string | null> {
    if (!this.capabilities.workspaces) return null;

    // Search upwards for workspace root
    let currentPath = this.cwd;
    const { root } = require('path').parse(currentPath);

    while (currentPath !== root) {
      const packageJson = await this.readPackageJson(currentPath);
      if (packageJson && (packageJson as any).workspaces) {
        return currentPath;
      }

      // Check for lockfile
      if (existsSync(join(currentPath, this.lockfileName))) {
        return currentPath;
      }

      currentPath = join(currentPath, '..');
    }

    return null;
  }

  /**
   * Common command translations
   */
  translateCommand(genericCommand: string): string {
    const translations: Record<string, string> = {
      'install-deps': 'install',
      'add-dep': 'add',
      'remove-dep': 'remove',
      'run-script': 'run',
      'execute': 'exec',
      'clean-cache': 'clean'
    };

    return translations[genericCommand] || genericCommand;
  }
}