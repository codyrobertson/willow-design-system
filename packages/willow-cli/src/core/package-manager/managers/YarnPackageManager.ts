/**
 * Yarn Package Manager Implementation
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

export class YarnPackageManager extends BasePackageManager {
  readonly name: PackageManagerName = 'yarn';
  readonly lockfileName = 'yarn.lock';
  readonly capabilities: PackageManagerCapabilities = {
    workspaces: true,
    lockfile: true,
    peerDependencies: true,
    resolutions: true,
    protocols: ['file:', 'link:', 'portal:', 'workspace:', 'patch:'],
    offline: true,
    scripts: true
  };

  async isAvailable(): Promise<boolean> {
    return this.commandExists('yarn');
  }

  async getVersion(): Promise<string> {
    const result = await this.executeCommand({
      command: 'yarn',
      args: ['--version']
    });
    return result.stdout.trim();
  }

  async install(options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['install'];
    
    if (options?.lockfileOnly) args.push('--frozen-lockfile');
    if (options?.force) args.push('--force');
    if (options?.silent) args.push('--silent');

    return this.executeCommand(this.buildCommand('yarn', args, options));
  }

  async add(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['add', ...packages];
    
    if (options?.dev) args.push('--dev');
    if (options?.peer) args.push('--peer');
    if (options?.optional) args.push('--optional');
    if (options?.exact) args.push('--exact');

    // Yarn 1.x doesn't support workspace flag in add command directly
    // Need to run from workspace directory
    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('yarn', args, options),
      cwd
    });
  }

  async remove(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['remove', ...packages];

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('yarn', args, options),
      cwd
    });
  }

  async update(packages?: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['upgrade'];
    
    if (packages && packages.length > 0) {
      args.push(...packages);
    }

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('yarn', args, options),
      cwd
    });
  }

  async run(script: string, scriptArgs?: string[], options?: RunOptions): Promise<ExecutionResult> {
    const args = [script];
    
    if (scriptArgs && scriptArgs.length > 0) {
      args.push(...scriptArgs);
    }

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('yarn', args, options),
      cwd
    });
  }

  async exec(command: string[], options?: RunOptions): Promise<ExecutionResult> {
    // Yarn 1.x doesn't have exec command, use run instead
    const args = ['run', ...command];

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('yarn', args, options),
      cwd
    });
  }

  async list(options?: { depth?: number; dev?: boolean }): Promise<PackageInfo[]> {
    const args = ['list', '--json'];
    
    if (options?.depth !== undefined) args.push('--depth', options.depth.toString());
    if (options?.dev) args.push('--dev');

    const result = await this.executeCommand(this.buildCommand('yarn', args));
    
    if (!result.success) return [];

    try {
      // Yarn outputs multiple JSON objects, one per line
      const lines = result.stdout.trim().split('\n');
      const packages: PackageInfo[] = [];

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'tree') {
            packages.push(...this.parseYarnList(data.data));
          }
        } catch {
          // Skip invalid JSON lines
        }
      }

      return packages;
    } catch {
      return [];
    }
  }

  async getWorkspaces(): Promise<WorkspaceInfo[]> {
    const args = ['workspaces', 'info', '--json'];
    const result = await this.executeCommand(this.buildCommand('yarn', args));
    
    if (!result.success) return [];

    try {
      // Parse yarn workspaces output
      const lines = result.stdout.trim().split('\n');
      let workspacesData: any = null;

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'info' && data.data) {
            workspacesData = JSON.parse(data.data);
            break;
          }
        } catch {
          // Try parsing the whole output as JSON
          try {
            workspacesData = JSON.parse(result.stdout);
          } catch {
            // Skip
          }
        }
      }

      if (!workspacesData) return [];

      return Object.entries(workspacesData).map(([name, info]: [string, any]) => ({
        name,
        path: info.location,
        version: info.version,
        private: info.private
      }));
    } catch {
      return [];
    }
  }

  async clean(): Promise<ExecutionResult> {
    return this.executeCommand(this.buildCommand('yarn', ['cache', 'clean']));
  }

  async getPackageInfo(packageName: string, version?: string): Promise<PackageInfo> {
    const args = ['info', version ? `${packageName}@${version}` : packageName, '--json'];
    const result = await this.executeCommand(this.buildCommand('yarn', args));
    
    if (!result.success) {
      throw new Error(`Failed to get package info for ${packageName}`);
    }

    try {
      const lines = result.stdout.trim().split('\n');
      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.type === 'inspect' && data.data) {
          return data.data;
        }
      }
      throw new Error('No package data found');
    } catch {
      throw new Error(`Failed to parse package info for ${packageName}`);
    }
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

  private parseYarnList(data: any): PackageInfo[] {
    const packages: PackageInfo[] = [];
    
    function traverse(nodes: any[]) {
      for (const node of nodes) {
        if (node.name) {
          const [name, version] = node.name.split('@').filter(Boolean);
          packages.push({
            name: name.startsWith('@') ? `@${name}` : name,
            version
          });
        }
        
        if (node.children) {
          traverse(node.children);
        }
      }
    }
    
    if (Array.isArray(data)) {
      traverse(data);
    } else if (data.trees) {
      traverse(data.trees);
    }
    
    return packages;
  }
}