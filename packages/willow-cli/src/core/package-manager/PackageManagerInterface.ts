/**
 * Package Manager Interface
 * Abstract interface for all package manager implementations
 */

import {
  PackageManagerName,
  PackageManagerCapabilities,
  InstallOptions,
  RunOptions,
  WorkspaceInfo,
  ExecutionResult,
  PackageInfo,
  PackageManagerCommand
} from './types.js';

export abstract class PackageManagerInterface {
  abstract readonly name: PackageManagerName;
  abstract readonly lockfileName: string;
  abstract readonly capabilities: PackageManagerCapabilities;
  
  constructor(protected readonly cwd: string = process.cwd()) {}

  /**
   * Check if this package manager is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get the version of the package manager
   */
  abstract getVersion(): Promise<string>;

  /**
   * Install dependencies
   */
  abstract install(options?: InstallOptions): Promise<ExecutionResult>;

  /**
   * Add packages
   */
  abstract add(packages: string[], options?: InstallOptions): Promise<ExecutionResult>;

  /**
   * Remove packages
   */
  abstract remove(packages: string[], options?: InstallOptions): Promise<ExecutionResult>;

  /**
   * Update packages
   */
  abstract update(packages?: string[], options?: InstallOptions): Promise<ExecutionResult>;

  /**
   * Run a script
   */
  abstract run(script: string, args?: string[], options?: RunOptions): Promise<ExecutionResult>;

  /**
   * Execute arbitrary command
   */
  abstract exec(command: string[], options?: RunOptions): Promise<ExecutionResult>;

  /**
   * List installed packages
   */
  abstract list(options?: { depth?: number; dev?: boolean }): Promise<PackageInfo[]>;

  /**
   * Get workspace information
   */
  abstract getWorkspaces(): Promise<WorkspaceInfo[]>;

  /**
   * Check if in a workspace
   */
  abstract isWorkspace(): Promise<boolean>;

  /**
   * Get root workspace path
   */
  abstract getWorkspaceRoot(): Promise<string | null>;

  /**
   * Clean cache
   */
  abstract clean(): Promise<ExecutionResult>;

  /**
   * Get lockfile path
   */
  getLockfilePath(): string {
    return `${this.cwd}/${this.lockfileName}`;
  }

  /**
   * Build command for execution
   */
  protected abstract buildCommand(
    command: string,
    args?: string[],
    options?: Record<string, any>
  ): PackageManagerCommand;

  /**
   * Translate generic command to package-manager specific
   */
  abstract translateCommand(genericCommand: string): string;

  /**
   * Get package info from registry
   */
  abstract getPackageInfo(packageName: string, version?: string): Promise<PackageInfo>;

  /**
   * Check if package is installed
   */
  abstract isPackageInstalled(packageName: string): Promise<boolean>;

  /**
   * Get installed package version
   */
  abstract getInstalledVersion(packageName: string): Promise<string | null>;
}