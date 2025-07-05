/**
 * NPM Package Manager Implementation
 */

import { BasePackageManager } from '../BasePackageManager.js';
import {
  PackageManagerName,
  PackageManagerCapabilities,
  InstallOptions,
  RunOptions,
  WorkspaceInfo,
  ExecutionResult,
  PackageInfo,
  PackageManagerCommand
} from '../types.js';

export class NpmPackageManager extends BasePackageManager {
  readonly name: PackageManagerName = 'npm';
  readonly lockfileName = 'package-lock.json';
  readonly capabilities: PackageManagerCapabilities = {
    workspaces: true,
    lockfile: true,
    peerDependencies: true,
    resolutions: false,
    protocols: ['file:', 'link:', 'git:', 'github:', 'npm:'],
    offline: true,
    scripts: true
  };

  async isAvailable(): Promise<boolean> {
    return this.commandExists('npm');
  }

  async getVersion(): Promise<string> {
    const result = await this.executeCommand({
      command: 'npm',
      args: ['--version']
    });
    return result.stdout.trim();
  }

  async install(options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['install'];
    
    if (options?.lockfileOnly) args.push('--package-lock-only');
    if (options?.force) args.push('--force');
    if (options?.workspace) args.push('-w', options.workspace);
    if (options?.silent) args.push('--silent');

    return this.executeCommand(this.buildCommand('npm', args, options));
  }

  async add(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['install', ...packages];
    
    if (options?.dev) args.push('--save-dev');
    if (options?.peer) args.push('--save-peer');
    if (options?.optional) args.push('--save-optional');
    if (options?.exact) args.push('--save-exact');
    if (options?.global) args.push('--global');
    if (options?.workspace) args.push('-w', options.workspace);

    return this.executeCommand(this.buildCommand('npm', args, options));
  }

  async remove(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['uninstall', ...packages];
    
    if (options?.workspace) args.push('-w', options.workspace);
    if (options?.global) args.push('--global');

    return this.executeCommand(this.buildCommand('npm', args, options));
  }

  async update(packages?: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['update'];
    
    if (packages && packages.length > 0) {
      args.push(...packages);
    }
    
    if (options?.workspace) args.push('-w', options.workspace);
    if (options?.global) args.push('--global');

    return this.executeCommand(this.buildCommand('npm', args, options));
  }

  async run(script: string, scriptArgs?: string[], options?: RunOptions): Promise<ExecutionResult> {
    const args = ['run', script];
    
    if (scriptArgs && scriptArgs.length > 0) {
      args.push('--', ...scriptArgs);
    }
    
    if (options?.workspace) args.push('-w', options.workspace);

    return this.executeCommand(this.buildCommand('npm', args, options));
  }

  async exec(command: string[], options?: RunOptions): Promise<ExecutionResult> {
    const args = ['exec', '--', ...command];
    
    if (options?.workspace) args.push('-w', options.workspace);

    return this.executeCommand(this.buildCommand('npm', args, options));
  }

  async list(options?: { depth?: number; dev?: boolean }): Promise<PackageInfo[]> {
    const args = ['list', '--json'];
    
    if (options?.depth !== undefined) args.push('--depth', options.depth.toString());
    if (options?.dev) args.push('--dev');

    const result = await this.executeCommand(this.buildCommand('npm', args));
    
    if (!result.success) return [];

    try {
      const data = JSON.parse(result.stdout);
      return this.parseNpmList(data);
    } catch {
      return [];
    }
  }

  async getWorkspaces(): Promise<WorkspaceInfo[]> {
    const args = ['query', '.workspace'];
    const result = await this.executeCommand(this.buildCommand('npm', args));
    
    if (!result.success) return [];

    try {
      const workspaces = JSON.parse(result.stdout);
      return workspaces.map((ws: any) => ({
        name: ws.name,
        path: ws.path,
        version: ws.version,
        private: ws.private
      }));
    } catch {
      return [];
    }
  }

  async clean(): Promise<ExecutionResult> {
    return this.executeCommand(this.buildCommand('npm', ['cache', 'clean', '--force']));
  }

  async getPackageInfo(packageName: string, version?: string): Promise<PackageInfo> {
    const args = ['view', version ? `${packageName}@${version}` : packageName, '--json'];
    const result = await this.executeCommand(this.buildCommand('npm', args));
    
    if (!result.success) {
      throw new Error(`Failed to get package info for ${packageName}`);
    }

    return JSON.parse(result.stdout);
  }

  protected buildCommand(
    command: string,
    args: string[] = [],
    options?: Record<string, any>
  ): PackageManagerCommand {
    return {
      command,
      args,
      cwd: this.cwd,
      env: options?.env
    };
  }

  private parseNpmList(data: any): PackageInfo[] {
    const packages: PackageInfo[] = [];
    
    function traverse(obj: any, depth = 0) {
      if (obj.dependencies) {
        for (const [name, info] of Object.entries(obj.dependencies)) {
          packages.push({
            name,
            version: (info as any).version,
            dependencies: (info as any).dependencies
          });
          
          if ((info as any).dependencies) {
            traverse(info, depth + 1);
          }
        }
      }
    }
    
    traverse(data);
    return packages;
  }
}