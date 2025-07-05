/**
 * Command Alias Registry
 * Manages command aliases for backward compatibility
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';

export interface CommandAlias {
  /** The old/legacy command name */
  oldCommand: string;
  /** The new command name it maps to */
  newCommand: string;
  /** Optional deprecation message */
  deprecationMessage?: string;
  /** Version when this alias was deprecated */
  deprecatedSince?: string;
  /** Version when this alias will be removed */
  removalVersion?: string;
  /** Whether to show deprecation warning */
  showWarning?: boolean;
}

export interface AliasOptions {
  /** Whether to suppress deprecation warnings */
  suppressWarnings?: boolean;
  /** Whether to track alias usage */
  trackUsage?: boolean;
}

/**
 * Registry for managing command aliases
 */
export class CommandAliasRegistry extends EventEmitter {
  private aliases = new Map<string, CommandAlias>();
  private usageStats = new Map<string, number>();
  private options: AliasOptions;

  constructor(options: AliasOptions = {}) {
    super();
    this.options = {
      suppressWarnings: options.suppressWarnings ?? false,
      trackUsage: options.trackUsage ?? true,
    };
  }

  /**
   * Register a command alias
   */
  registerAlias(alias: CommandAlias): void {
    this.aliases.set(alias.oldCommand, alias);
    this.emit('alias:registered', alias);
  }

  /**
   * Register multiple aliases at once
   */
  registerAliases(aliases: CommandAlias[]): void {
    aliases.forEach(alias => this.registerAlias(alias));
  }

  /**
   * Resolve a command name, returning the modern equivalent if aliased
   */
  resolveCommand(command: string): string {
    const alias = this.aliases.get(command);
    
    if (alias) {
      // Track usage
      if (this.options.trackUsage) {
        this.usageStats.set(command, (this.usageStats.get(command) || 0) + 1);
      }

      // Show deprecation warning
      if (alias.showWarning !== false && !this.options.suppressWarnings) {
        this.showDeprecationWarning(alias);
      }

      this.emit('alias:used', alias);
      return alias.newCommand;
    }

    return command;
  }

  /**
   * Check if a command is aliased
   */
  isAliased(command: string): boolean {
    return this.aliases.has(command);
  }

  /**
   * Get alias information for a command
   */
  getAlias(command: string): CommandAlias | undefined {
    return this.aliases.get(command);
  }

  /**
   * Get all registered aliases
   */
  getAllAliases(): CommandAlias[] {
    return Array.from(this.aliases.values());
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Map<string, number> {
    return new Map(this.usageStats);
  }

  /**
   * Clear usage statistics
   */
  clearUsageStats(): void {
    this.usageStats.clear();
  }

  /**
   * Show deprecation warning for an alias
   */
  private showDeprecationWarning(alias: CommandAlias): void {
    console.warn(chalk.yellow('\n⚠️  Deprecation Warning:'));
    
    if (alias.deprecationMessage) {
      console.warn(chalk.yellow(`   ${alias.deprecationMessage}`));
    } else {
      console.warn(chalk.yellow(`   The command '${alias.oldCommand}' is deprecated.`));
      console.warn(chalk.yellow(`   Please use '${alias.newCommand}' instead.`));
    }

    if (alias.deprecatedSince) {
      console.warn(chalk.yellow(`   Deprecated since: v${alias.deprecatedSince}`));
    }

    if (alias.removalVersion) {
      console.warn(chalk.red(`   Will be removed in: v${alias.removalVersion}`));
    }

    console.warn('');
  }

  /**
   * Load aliases from a configuration object
   */
  loadFromConfig(config: Record<string, Omit<CommandAlias, 'oldCommand'>>): void {
    Object.entries(config).forEach(([oldCommand, aliasConfig]) => {
      this.registerAlias({
        oldCommand,
        ...aliasConfig,
      });
    });
  }

  /**
   * Export aliases to a configuration object
   */
  exportToConfig(): Record<string, Omit<CommandAlias, 'oldCommand'>> {
    const config: Record<string, Omit<CommandAlias, 'oldCommand'>> = {};
    
    this.aliases.forEach((alias, oldCommand) => {
      const { oldCommand: _, ...rest } = alias;
      config[oldCommand] = rest;
    });

    return config;
  }
}

/**
 * Default command aliases for Willow CLI
 */
export const DEFAULT_COMMAND_ALIASES: CommandAlias[] = [
  // Legacy command names
  {
    oldCommand: 'install',
    newCommand: 'add',
    deprecationMessage: "The 'install' command has been renamed to 'add' for consistency.",
    deprecatedSince: '0.5.0',
    removalVersion: '1.0.0',
  },
  {
    oldCommand: 'uninstall',
    newCommand: 'remove',
    deprecationMessage: "The 'uninstall' command has been renamed to 'remove' for consistency.",
    deprecatedSince: '0.5.0',
    removalVersion: '1.0.0',
  },
  {
    oldCommand: 'ls',
    newCommand: 'list',
    deprecationMessage: "The 'ls' command has been renamed to 'list' for clarity.",
    deprecatedSince: '0.6.0',
    removalVersion: '1.0.0',
  },
  {
    oldCommand: 'check',
    newCommand: 'validate',
    deprecationMessage: "The 'check' command has been renamed to 'validate'.",
    deprecatedSince: '0.6.0',
    removalVersion: '1.0.0',
  },
  {
    oldCommand: 'configure',
    newCommand: 'config',
    deprecationMessage: "The 'configure' command has been shortened to 'config'.",
    deprecatedSince: '0.6.0',
    removalVersion: '1.0.0',
  },
  
  // Shadcn compatibility aliases
  {
    oldCommand: 'shadcn',
    newCommand: 'willow',
    showWarning: false, // Don't warn for this common alias
  },
  {
    oldCommand: 'shadcn-ui',
    newCommand: 'willow',
    showWarning: false,
  },
  
  // Common typos and variations
  {
    oldCommand: 'instal',
    newCommand: 'add',
    deprecationMessage: "Did you mean 'add'? The 'install' command has been renamed to 'add'.",
    showWarning: true,
  },
  {
    oldCommand: 'rmv',
    newCommand: 'remove',
    deprecationMessage: "Did you mean 'remove'?",
    showWarning: true,
  },
];

/**
 * Create a pre-configured alias registry
 */
export function createDefaultAliasRegistry(options?: AliasOptions): CommandAliasRegistry {
  const registry = new CommandAliasRegistry(options);
  registry.registerAliases(DEFAULT_COMMAND_ALIASES);
  return registry;
}