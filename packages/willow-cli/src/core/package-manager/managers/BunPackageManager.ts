/**
 * Bun Package Manager Implementation
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

export class BunPackageManager extends BasePackageManager {
  readonly name: PackageManagerName = 'bun';
  readonly lockfileName = 'bun.lockb';
  readonly capabilities: PackageManagerCapabilities = {
    workspaces: true,
    lockfile: true,
    peerDependencies: true,
    resolutions: true,
    protocols: ['file:', 'link:', 'workspace:', 'git:', 'github:'],
    offline: true,
    scripts: true
  };

  async isAvailable(): Promise<boolean> {
    return this.commandExists('bun');
  }

  async getVersion(): Promise<string> {
    const result = await this.executeCommand({
      command: 'bun',
      args: ['--version']
    });
    return result.stdout.trim();
  }

  async install(options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['install'];
    
    if (options?.lockfileOnly) args.push('--frozen-lockfile');
    if (options?.force) args.push('--force');
    if (options?.silent) args.push('--silent');

    // Bun doesn't have direct workspace filter in install
    // Need to run from workspace directory
    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('bun', args, options),
      cwd
    });
  }

  async add(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['add', ...packages];
    
    if (options?.dev) args.push('--dev');
    if (options?.peer) args.push('--peer');
    if (options?.optional) args.push('--optional');
    if (options?.exact) args.push('--exact');
    if (options?.global) args.push('--global');

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('bun', args, options),
      cwd
    });
  }

  async remove(packages: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['remove', ...packages];
    
    if (options?.global) args.push('--global');

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('bun', args, options),
      cwd
    });
  }

  async update(packages?: string[], options?: InstallOptions): Promise<ExecutionResult> {
    const args = ['update'];
    
    if (packages && packages.length > 0) {
      args.push(...packages);
    }
    
    if (options?.global) args.push('--global');

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('bun', args, options),
      cwd
    });
  }

  async run(script: string, scriptArgs?: string[], options?: RunOptions): Promise<ExecutionResult> {
    const args = ['run', script];
    
    if (scriptArgs && scriptArgs.length > 0) {
      args.push(...scriptArgs);
    }

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('bun', args, options),
      cwd
    });
  }

  async exec(command: string[], options?: RunOptions): Promise<ExecutionResult> {
    // Bun uses 'x' for exec
    const args = ['x', ...command];

    const cwd = options?.workspace ? 
      `${this.cwd}/${options.workspace}` : 
      this.cwd;

    return this.executeCommand({
      ...this.buildCommand('bun', args, options),
      cwd
    });
  }

  async list(options?: { depth?: number; dev?: boolean }): Promise<PackageInfo[]> {
    // Bun doesn't have a direct list command with JSON output
    // Parse package.json instead
    const packageJson = await this.readPackageJson();
    if (!packageJson) return [];

    const packages: PackageInfo[] = [];
    const deps = options?.dev ? 
      packageJson.devDependencies : 
      { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const [name, version] of Object.entries(deps || {})) {
      packages.push({
        name,
        version: version as string
      });
    }

    return packages;
  }

  async getWorkspaces(): Promise<WorkspaceInfo[]> {
    // Read workspace configuration from package.json
    const rootPackageJson = await this.readPackageJson();
    if (!rootPackageJson || !(rootPackageJson as any).workspaces) {
      return [];
    }

    const workspaces: WorkspaceInfo[] = [];
    const workspacePatterns = (rootPackageJson as any).workspaces;
    
    // This is a simplified implementation
    // In a real implementation, you'd need to resolve glob patterns
    // and read each workspace's package.json
    
    return workspaces;
  }

  async clean(): Promise<ExecutionResult> {
    // Bun doesn't have a cache clean command yet
    // Return success with a message
    return {
      success: true,
      stdout: 'Bun manages cache automatically',
      stderr: '',
      exitCode: 0,
      duration: 0
    };
  }

  async getPackageInfo(packageName: string, version?: string): Promise<PackageInfo> {
    // Bun doesn't have a view command, use npm registry API
    const packageSpec = version ? `${packageName}@${version}` : packageName;
    const registryUrl = `https://registry.npmjs.org/${packageName}`;
    
    try {
      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch package info: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (version && data.versions && data.versions[version]) {
        return data.versions[version];
      }
      
      return {
        name: data.name,
        version: data['dist-tags']?.latest || '',
        description: data.description,
        dependencies: data.dependencies,
        devDependencies: data.devDependencies,
        peerDependencies: data.peerDependencies
      };
    } catch (error) {
      throw new Error(`Failed to get package info for ${packageSpec}: ${error}`);
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
}