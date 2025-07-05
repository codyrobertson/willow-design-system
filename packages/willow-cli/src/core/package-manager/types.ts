/**
 * Package Manager Types and Interfaces
 */

export type PackageManagerName = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface PackageInfo {
  name: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface InstallOptions {
  dev?: boolean;
  peer?: boolean;
  optional?: boolean;
  exact?: boolean;
  global?: boolean;
  force?: boolean;
  lockfileOnly?: boolean;
  workspace?: string;
  silent?: boolean;
}

export interface RunOptions {
  workspace?: string;
  silent?: boolean;
  env?: Record<string, string>;
}

export interface WorkspaceInfo {
  name: string;
  path: string;
  version?: string;
  private?: boolean;
}

export interface PackageManagerCapabilities {
  workspaces: boolean;
  lockfile: boolean;
  peerDependencies: boolean;
  resolutions: boolean;
  protocols: string[]; // workspace:, link:, file:, etc.
  offline: boolean;
  scripts: boolean;
}

export interface PackageManagerCommand {
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface PackageManagerDetectorOptions {
  cwd?: string;
  preferredManager?: PackageManagerName;
  detectWorkspaces?: boolean;
}

export interface LockfileInfo {
  manager: PackageManagerName;
  path: string;
  version?: string;
}