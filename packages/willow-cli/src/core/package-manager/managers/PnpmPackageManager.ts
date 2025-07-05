/**
 * PNPM Package Manager Implementation
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

export class PnpmPackageManager extends BasePackageManager {
  readonly name: PackageManagerName = 'pnpm';
  readonly lockfileName = 'pnpm-lock.yaml';
  readonly capabilities: PackageManagerCapabilities = {
    workspaces: true,
    lockfile: true,
    peerDependencies: true,
    resolutions: true,
    protocols: ['file:', 'link:', 'workspace:', 'catalog:'],
    offline: true,
    scripts: true
  };

  async isAvailable(): Promise<boolean> {
    return this.commandExists('pnpm');
  }

  async getVersion(): Promise<string> {
    const result = await this.executeCommand({
      command: 'pnpm',
      args: ['--version']
    });
    return result.stdout.trim();
  }

  async install(options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['install'];
    
    if (options?.lockfileOnly) args.push('--lockfile-only');
    if (options?.force) args.push('--force');
    if (options?.workspace) args.push('--filter', options.workspace);
    if (options?.silent) args.push('--silent');

    return this.executeCommand(this.buildCommand('pnpm', args, options));
  }

  async add(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['add', ...packages];
    
    if (options?.dev) args.push('--save-dev');
    if (options?.peer) args.push('--save-peer');
    if (options?.optional) args.push('--save-optional');
    if (options?.exact) args.push('--save-exact');
    if (options?.global) args.push('--global');
    if (options?.workspace) args.push('--filter', options.workspace);

    return this.executeCommand(this.buildCommand('pnpm', args, options));
  }

  async remove(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['remove', ...packages];
    
    if (options?.workspace) args.push('--filter', options.workspace);
    if (options?.global) args.push('--global');

    return this.executeCommand(this.buildCommand('pnpm', args, options));
  }

  async update(packages?: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['update'];
    
    if (packages && packages.length > 0) {
      args.push(...packages);
    }
    
    if (options?.workspace) args.push('--filter', options.workspace);
    if (options?.global) args.push('--global');

    return this.executeCommand(this.buildCommand('pnpm', args, options));
  }

  async run(script: string, scriptArgs?: string[], options?: RunOptions): Promise<ExecutionResult> {
    const args = ['run', script];
    
    if (scriptArgs && scriptArgs.length > 0) {
      args.push(...scriptArgs);
    }
    
    if (options?.workspace) args.push('--filter', options.workspace);

    return this.executeCommand(this.buildCommand('pnpm', args, options));
  }

  async exec(command: string[], options?: RunOptions): Promise<ExecutionResult> {
    const args = ['exec', ...command];
    
    if (options?.workspace) args.push('--filter', options.workspace);

    return this.executeCommand(this.buildCommand('pnpm', args, options));
  }

  async list(options?: { depth?: number; dev?: boolean }): Promise<PackageInfo[]> {
    const args = ['list', '--json'];
    
    if (options?.depth !== undefined) args.push('--depth', options.depth.toString());
    if (options?.dev) args.push('--dev');

    const result = await this.executeCommand(this.buildCommand('pnpm', args));
    
    if (!result.success) return [];

    try {
      const data = JSON.parse(result.stdout);
      return this.parsePnpmList(data);
    } catch {
      return [];
    }
  }

  async getWorkspaces(): Promise<WorkspaceInfo[]> {
    const args = ['list', '--recursive', '--json', '--depth', '0'];
    const result = await this.executeCommand(this.buildCommand('pnpm', args));
    
    if (!result.success) return [];

    try {
      const data = JSON.parse(result.stdout);
      return data.map((ws: any) => ({
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
    return this.executeCommand(this.buildCommand('pnpm', ['store', 'prune']));
  }

  async getPackageInfo(packageName: string, version?: string): Promise<PackageInfo> {
    const args = ['view', version ? `${packageName}@${version}` : packageName, '--json'];
    const result = await this.executeCommand(this.buildCommand('pnpm', args));
    
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

  private parsePnpmList(data: any[]): PackageInfo[] {
    const packages: PackageInfo[] = [];
    
    for (const item of data) {
      if (item.dependencies) {
        for (const [name, info] of Object.entries(item.dependencies)) {
          packages.push({
            name,
            version: (info as any).version,
            dependencies: (info as any).dependencies
          });
        }
      }
      
      if (item.devDependencies) {
        for (const [name, info] of Object.entries(item.devDependencies)) {
          packages.push({
            name,
            version: (info as any).version,
            dependencies: (info as any).dependencies
          });
        }
      }
    }
    
    return packages;
  }
}