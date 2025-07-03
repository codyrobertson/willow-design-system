import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface PackageManagerInfo {
  name: PackageManager;
  version: string;
  lockFile: string;
  installCommand: string;
  addCommand: string;
  removeCommand: string;
  runCommand: string;
}

export interface InstallOptions {
  dev?: boolean;
  peer?: boolean;
  optional?: boolean;
  exact?: boolean;
  global?: boolean;
}

/**
 * Detects the package manager being used in the current project
 * Priority: 1. Lock files, 2. Available binaries, 3. npm (fallback)
 */
export function detectPackageManager(projectPath = process.cwd()): PackageManagerInfo {
  // Check for lock files first (most reliable)
  const lockFileMap: Record<string, PackageManager> = {
    'bun.lockb': 'bun',
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm'
  };

  for (const [lockFile, manager] of Object.entries(lockFileMap)) {
    if (existsSync(join(projectPath, lockFile))) {
      return getPackageManagerInfo(manager);
    }
  }

  // Check for available binaries if no lock files
  const managers: PackageManager[] = ['bun', 'pnpm', 'yarn', 'npm'];
  for (const manager of managers) {
    if (isPackageManagerAvailable(manager)) {
      return getPackageManagerInfo(manager);
    }
  }

  // Fallback to npm
  return getPackageManagerInfo('npm');
}

/**
 * Checks if a package manager binary is available
 */
export function isPackageManagerAvailable(manager: PackageManager): boolean {
  try {
    execSync(`${manager} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets package manager information including commands and version
 */
export function getPackageManagerInfo(manager: PackageManager): PackageManagerInfo {
  const version = getPackageManagerVersion(manager);
  
  const configs: Record<PackageManager, Omit<PackageManagerInfo, 'version'>> = {
    npm: {
      name: 'npm',
      lockFile: 'package-lock.json',
      installCommand: 'npm install',
      addCommand: 'npm install',
      removeCommand: 'npm uninstall',
      runCommand: 'npm run'
    },
    yarn: {
      name: 'yarn',
      lockFile: 'yarn.lock',
      installCommand: 'yarn install',
      addCommand: 'yarn add',
      removeCommand: 'yarn remove',
      runCommand: 'yarn'
    },
    pnpm: {
      name: 'pnpm',
      lockFile: 'pnpm-lock.yaml',
      installCommand: 'pnpm install',
      addCommand: 'pnpm add',
      removeCommand: 'pnpm remove',
      runCommand: 'pnpm run'
    },
    bun: {
      name: 'bun',
      lockFile: 'bun.lockb',
      installCommand: 'bun install',
      addCommand: 'bun add',
      removeCommand: 'bun remove',
      runCommand: 'bun run'
    }
  };

  return {
    ...configs[manager],
    version
  };
}

/**
 * Gets the version of a package manager
 */
export function getPackageManagerVersion(manager: PackageManager): string {
  try {
    const output = execSync(`${manager} --version`, { encoding: 'utf-8' }).trim();
    return output;
  } catch {
    return 'unknown';
  }
}

/**
 * Builds install command with options
 */
export function buildInstallCommand(
  manager: PackageManagerInfo,
  packages: string | string[],
  options: InstallOptions = {}
): string {
  const pkgs = Array.isArray(packages) ? packages : [packages];
  let command = manager.addCommand;

  // Add package names
  command += ` ${pkgs.join(' ')}`;

  // Add flags based on package manager and options
  if (options.dev) {
    switch (manager.name) {
      case 'npm':
        command += ' --save-dev';
        break;
      case 'yarn':
        command += ' --dev';
        break;
      case 'pnpm':
      case 'bun':
        command += ' --dev';
        break;
    }
  }

  if (options.peer) {
    switch (manager.name) {
      case 'npm':
        command += ' --save-peer';
        break;
      case 'yarn':
        command += ' --peer';
        break;
      case 'pnpm':
      case 'bun':
        command += ' --save-peer';
        break;
    }
  }

  if (options.optional) {
    switch (manager.name) {
      case 'npm':
        command += ' --save-optional';
        break;
      case 'yarn':
        command += ' --optional';
        break;
      case 'pnpm':
      case 'bun':
        command += ' --save-optional';
        break;
    }
  }

  if (options.exact) {
    switch (manager.name) {
      case 'npm':
        command += ' --save-exact';
        break;
      case 'yarn':
        command += ' --exact';
        break;
      case 'pnpm':
      case 'bun':
        command += ' --save-exact';
        break;
    }
  }

  if (options.global) {
    switch (manager.name) {
      case 'npm':
      case 'pnpm':
      case 'bun':
        command += ' --global';
        break;
      case 'yarn':
        command += ' global';
        break;
    }
  }

  return command;
}

/**
 * Executes a package manager command
 */
export function executePackageManagerCommand(
  command: string,
  options: { cwd?: string; silent?: boolean } = {}
): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, {
      cwd: options.cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit'
    });

    return {
      success: true,
      output: output.toString()
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message
    };
  }
}

/**
 * Checks if packages are installed in the project
 */
export function arePackagesInstalled(packages: string[], projectPath = process.cwd()): boolean {
  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return false;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies
    };

    return packages.every(pkg => pkg in allDeps);
  } catch {
    return false;
  }
}

/**
 * Gets installed package versions
 */
export function getInstalledPackageVersions(packages: string[], projectPath = process.cwd()): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  
  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      packages.forEach(pkg => result[pkg] = null);
      return result;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies
    };

    packages.forEach(pkg => {
      result[pkg] = allDeps[pkg] || null;
    });
  } catch {
    packages.forEach(pkg => result[pkg] = null);
  }

  return result;
}