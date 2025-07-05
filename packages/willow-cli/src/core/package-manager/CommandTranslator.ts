/**
 * Command Translator
 * Translates generic commands to package-manager specific commands
 */

import { PackageManagerName } from './types.js';

export interface TranslatedCommand {
  command: string;
  args: string[];
  description: string;
}

export class CommandTranslator {
  private static readonly COMMAND_MAP: Record<string, Record<PackageManagerName, TranslatedCommand>> = {
    'install': {
      npm: { command: 'npm', args: ['install'], description: 'Install all dependencies' },
      yarn: { command: 'yarn', args: ['install'], description: 'Install all dependencies' },
      pnpm: { command: 'pnpm', args: ['install'], description: 'Install all dependencies' },
      bun: { command: 'bun', args: ['install'], description: 'Install all dependencies' }
    },
    'install-ci': {
      npm: { command: 'npm', args: ['ci'], description: 'Clean install from lockfile' },
      yarn: { command: 'yarn', args: ['install', '--frozen-lockfile'], description: 'Install with frozen lockfile' },
      pnpm: { command: 'pnpm', args: ['install', '--frozen-lockfile'], description: 'Install with frozen lockfile' },
      bun: { command: 'bun', args: ['install', '--frozen-lockfile'], description: 'Install with frozen lockfile' }
    },
    'add': {
      npm: { command: 'npm', args: ['install'], description: 'Add a package' },
      yarn: { command: 'yarn', args: ['add'], description: 'Add a package' },
      pnpm: { command: 'pnpm', args: ['add'], description: 'Add a package' },
      bun: { command: 'bun', args: ['add'], description: 'Add a package' }
    },
    'add-dev': {
      npm: { command: 'npm', args: ['install', '--save-dev'], description: 'Add a dev dependency' },
      yarn: { command: 'yarn', args: ['add', '--dev'], description: 'Add a dev dependency' },
      pnpm: { command: 'pnpm', args: ['add', '--save-dev'], description: 'Add a dev dependency' },
      bun: { command: 'bun', args: ['add', '--dev'], description: 'Add a dev dependency' }
    },
    'remove': {
      npm: { command: 'npm', args: ['uninstall'], description: 'Remove a package' },
      yarn: { command: 'yarn', args: ['remove'], description: 'Remove a package' },
      pnpm: { command: 'pnpm', args: ['remove'], description: 'Remove a package' },
      bun: { command: 'bun', args: ['remove'], description: 'Remove a package' }
    },
    'update': {
      npm: { command: 'npm', args: ['update'], description: 'Update packages' },
      yarn: { command: 'yarn', args: ['upgrade'], description: 'Upgrade packages' },
      pnpm: { command: 'pnpm', args: ['update'], description: 'Update packages' },
      bun: { command: 'bun', args: ['update'], description: 'Update packages' }
    },
    'run': {
      npm: { command: 'npm', args: ['run'], description: 'Run a script' },
      yarn: { command: 'yarn', args: [], description: 'Run a script' },
      pnpm: { command: 'pnpm', args: ['run'], description: 'Run a script' },
      bun: { command: 'bun', args: ['run'], description: 'Run a script' }
    },
    'test': {
      npm: { command: 'npm', args: ['test'], description: 'Run tests' },
      yarn: { command: 'yarn', args: ['test'], description: 'Run tests' },
      pnpm: { command: 'pnpm', args: ['test'], description: 'Run tests' },
      bun: { command: 'bun', args: ['test'], description: 'Run tests' }
    },
    'build': {
      npm: { command: 'npm', args: ['run', 'build'], description: 'Build the project' },
      yarn: { command: 'yarn', args: ['build'], description: 'Build the project' },
      pnpm: { command: 'pnpm', args: ['build'], description: 'Build the project' },
      bun: { command: 'bun', args: ['run', 'build'], description: 'Build the project' }
    },
    'publish': {
      npm: { command: 'npm', args: ['publish'], description: 'Publish package' },
      yarn: { command: 'yarn', args: ['publish'], description: 'Publish package' },
      pnpm: { command: 'pnpm', args: ['publish'], description: 'Publish package' },
      bun: { command: 'bun', args: ['publish'], description: 'Publish package' }
    },
    'cache-clean': {
      npm: { command: 'npm', args: ['cache', 'clean', '--force'], description: 'Clean cache' },
      yarn: { command: 'yarn', args: ['cache', 'clean'], description: 'Clean cache' },
      pnpm: { command: 'pnpm', args: ['store', 'prune'], description: 'Prune store' },
      bun: { command: 'echo', args: ['Bun manages cache automatically'], description: 'No cache clean needed' }
    },
    'init': {
      npm: { command: 'npm', args: ['init'], description: 'Initialize a new package' },
      yarn: { command: 'yarn', args: ['init'], description: 'Initialize a new package' },
      pnpm: { command: 'pnpm', args: ['init'], description: 'Initialize a new package' },
      bun: { command: 'bun', args: ['init'], description: 'Initialize a new package' }
    },
    'outdated': {
      npm: { command: 'npm', args: ['outdated'], description: 'Check for outdated packages' },
      yarn: { command: 'yarn', args: ['outdated'], description: 'Check for outdated packages' },
      pnpm: { command: 'pnpm', args: ['outdated'], description: 'Check for outdated packages' },
      bun: { command: 'bun', args: ['outdated'], description: 'Check for outdated packages' }
    },
    'audit': {
      npm: { command: 'npm', args: ['audit'], description: 'Audit for vulnerabilities' },
      yarn: { command: 'yarn', args: ['audit'], description: 'Audit for vulnerabilities' },
      pnpm: { command: 'pnpm', args: ['audit'], description: 'Audit for vulnerabilities' },
      bun: { command: 'echo', args: ['Bun audit not yet implemented'], description: 'Not available' }
    },
    'workspace-add': {
      npm: { command: 'npm', args: ['install', '-w'], description: 'Add to workspace' },
      yarn: { command: 'yarn', args: ['workspace'], description: 'Add to workspace' },
      pnpm: { command: 'pnpm', args: ['add', '--filter'], description: 'Add to workspace' },
      bun: { command: 'bun', args: ['add'], description: 'Add to workspace (run from workspace dir)' }
    },
    'workspace-run': {
      npm: { command: 'npm', args: ['run', '-w'], description: 'Run in workspace' },
      yarn: { command: 'yarn', args: ['workspace'], description: 'Run in workspace' },
      pnpm: { command: 'pnpm', args: ['run', '--filter'], description: 'Run in workspace' },
      bun: { command: 'bun', args: ['run'], description: 'Run in workspace (run from workspace dir)' }
    }
  };

  /**
   * Translate a generic command to package-manager specific
   */
  static translate(
    genericCommand: string,
    packageManager: PackageManagerName,
    additionalArgs: string[] = []
  ): TranslatedCommand {
    const translation = this.COMMAND_MAP[genericCommand]?.[packageManager];
    
    if (!translation) {
      // Return as-is if no translation found
      return {
        command: packageManager,
        args: [genericCommand, ...additionalArgs],
        description: `Run ${genericCommand}`
      };
    }

    return {
      ...translation,
      args: [...translation.args, ...additionalArgs]
    };
  }

  /**
   * Get all available generic commands
   */
  static getGenericCommands(): string[] {
    return Object.keys(this.COMMAND_MAP);
  }

  /**
   * Get command description
   */
  static getCommandDescription(genericCommand: string): string {
    const firstManager = Object.values(this.COMMAND_MAP[genericCommand] || {})[0];
    return firstManager?.description || `Execute ${genericCommand}`;
  }

  /**
   * Build full command string
   */
  static buildCommandString(
    genericCommand: string,
    packageManager: PackageManagerName,
    additionalArgs: string[] = []
  ): string {
    const translated = this.translate(genericCommand, packageManager, additionalArgs);
    return `${translated.command} ${translated.args.join(' ')}`.trim();
  }
}