/**
 * Enhanced Command Registry with plugin support
 */

import { Command } from 'commander';
import { Logger } from '../../ui/Logger.js';
import { ProgressReporter } from '../../ui/ProgressReporter.js';
import { GlobalOptions, CommandResult, CLIError, CLIErrorCode } from '../../types/cli.js';
import { ICommand, ICommandGroup, IPluginCommand, CommandTypeGuards } from './CommandInterface.js';
import { BaseCommand } from './BaseCommand.js';

export interface CommandContext {
  logger: Logger;
  progress: ProgressReporter;
  globalOptions: GlobalOptions;
}

/**
 * Command registration options
 */
export interface CommandRegistrationOptions {
  override?: boolean;
  category?: string;
  priority?: number;
}

/**
 * Enhanced command registry with plugin and lifecycle support
 */
export class CommandRegistry {
  private commands = new Map<string, ICommand>();
  private commandCategories = new Map<string, Set<string>>();
  private pluginCommands = new Map<string, IPluginCommand>();
  private commandPriorities = new Map<string, number>();
  private commandAliases = new Map<string, string>();
  private middlewares: Array<(cmd: ICommand) => ICommand> = [];

  /**
   * Register a command
   */
  register(command: ICommand, options: CommandRegistrationOptions = {}): void {
    const metadata = command.getMetadata();
    const { override = false, category, priority = 0 } = options;

    // Check if command already exists
    if (this.commands.has(metadata.name) && !override) {
      throw new CLIError(
        CLIErrorCode.CONFIGURATION_ERROR,
        `Command '${metadata.name}' is already registered`
      );
    }

    // Apply middlewares
    let processedCommand = command;
    for (const middleware of this.middlewares) {
      processedCommand = middleware(processedCommand);
    }

    // Register the command
    this.commands.set(metadata.name, processedCommand);
    this.commandPriorities.set(metadata.name, priority);

    // Register aliases
    if (metadata.aliases) {
      for (const alias of metadata.aliases) {
        if (this.commandAliases.has(alias) && !override) {
          throw new CLIError(
            CLIErrorCode.CONFIGURATION_ERROR,
            `Command alias '${alias}' is already in use`
          );
        }
        this.commandAliases.set(alias, metadata.name);
      }
    }

    // Register in category
    const commandCategory = category || metadata.category || 'general';
    if (!this.commandCategories.has(commandCategory)) {
      this.commandCategories.set(commandCategory, new Set());
    }
    this.commandCategories.get(commandCategory)!.add(metadata.name);

    // Handle plugin commands
    if (CommandTypeGuards.isPluginCommand(processedCommand)) {
      this.pluginCommands.set(metadata.name, processedCommand);
    }
  }

  /**
   * Register a BaseCommand instance
   */
  registerCommand(CommandClass: typeof BaseCommand, options: CommandRegistrationOptions = {}): void {
    const instance = new CommandClass();
    this.register(instance as unknown as ICommand, options);
  }

  /**
   * Register multiple commands at once
   */
  registerCommands(commands: Array<ICommand | typeof BaseCommand>, options: CommandRegistrationOptions = {}): void {
    for (const command of commands) {
      if (command.prototype instanceof BaseCommand) {
        this.registerCommand(command as typeof BaseCommand, options);
      } else {
        this.register(command as ICommand, options);
      }
    }
  }

  /**
   * Register a command group
   */
  registerGroup(group: ICommandGroup): void {
    for (const command of group.commands) {
      this.register(command, { category: group.name });
    }
  }

  /**
   * Add middleware for command processing
   */
  use(middleware: (cmd: ICommand) => ICommand): void {
    this.middlewares.push(middleware);
  }

  /**
   * Get a command by name or alias
   */
  get(nameOrAlias: string): ICommand | undefined {
    // Check direct name first
    if (this.commands.has(nameOrAlias)) {
      return this.commands.get(nameOrAlias);
    }

    // Check aliases
    const commandName = this.commandAliases.get(nameOrAlias);
    if (commandName) {
      return this.commands.get(commandName);
    }

    return undefined;
  }

  /**
   * Get all commands
   */
  getAll(): ICommand[] {
    // Sort by priority
    return Array.from(this.commands.entries())
      .sort((a, b) => {
        const priorityA = this.commandPriorities.get(a[0]) || 0;
        const priorityB = this.commandPriorities.get(b[0]) || 0;
        return priorityB - priorityA;
      })
      .map(([_, command]) => command);
  }

  /**
   * Get commands by category
   */
  getByCategory(category: string): ICommand[] {
    const commandNames = this.commandCategories.get(category);
    if (!commandNames) {
      return [];
    }

    return Array.from(commandNames)
      .map(name => this.commands.get(name))
      .filter((cmd): cmd is ICommand => cmd !== undefined)
      .sort((a, b) => {
        const priorityA = this.commandPriorities.get(a.getMetadata().name) || 0;
        const priorityB = this.commandPriorities.get(b.getMetadata().name) || 0;
        return priorityB - priorityA;
      });
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.commandCategories.keys()).sort();
  }

  /**
   * Get plugin commands
   */
  getPluginCommands(): IPluginCommand[] {
    return Array.from(this.pluginCommands.values());
  }

  /**
   * Check if a command exists
   */
  has(nameOrAlias: string): boolean {
    return this.commands.has(nameOrAlias) || this.commandAliases.has(nameOrAlias);
  }

  /**
   * Remove a command
   */
  remove(name: string): boolean {
    const command = this.commands.get(name);
    if (!command) {
      return false;
    }

    const metadata = command.getMetadata();

    // Remove from main registry
    this.commands.delete(name);
    this.commandPriorities.delete(name);

    // Remove aliases
    if (metadata.aliases) {
      for (const alias of metadata.aliases) {
        this.commandAliases.delete(alias);
      }
    }

    // Remove from categories
    for (const [category, commands] of this.commandCategories) {
      commands.delete(name);
      if (commands.size === 0) {
        this.commandCategories.delete(category);
      }
    }

    // Remove from plugin commands
    this.pluginCommands.delete(name);

    return true;
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
    this.commandCategories.clear();
    this.pluginCommands.clear();
    this.commandPriorities.clear();
    this.commandAliases.clear();
  }

  /**
   * Apply commands to Commander program
   */
  applyToProgram(program: Command, contextFactory: () => CommandContext): void {
    // Group commands by category for better help output
    const categories = this.getCategories();

    for (const category of categories) {
      const categoryCommands = this.getByCategory(category);
      
      // Add category header in help
      if (category !== 'general' && categoryCommands.length > 0) {
        program.addHelpText('beforeAll', `\n${category.charAt(0).toUpperCase() + category.slice(1)} Commands:`);
      }

      for (const command of categoryCommands) {
        const metadata = command.getMetadata();

        // Skip deprecated commands unless explicitly requested
        if (metadata.deprecated && !process.env.SHOW_DEPRECATED) {
          continue;
        }

        // Create commander command
        const cmd = program
          .command(metadata.name)
          .description(metadata.description);

        // Add aliases
        if (metadata.aliases && metadata.aliases.length > 0) {
          cmd.aliases(metadata.aliases);
        }

        // Configure options
        command.configureOptions(cmd);

        // Add metadata indicators
        const indicators: string[] = [];
        if (metadata.deprecated) indicators.push('[DEPRECATED]');
        if (metadata.experimental) indicators.push('[EXPERIMENTAL]');
        if (indicators.length > 0) {
          cmd.description(`${indicators.join(' ')} ${metadata.description}`);
        }

        // Setup action handler
        cmd.action(async (...args) => {
          const context = contextFactory();

          try {
            // Initialize plugin if needed
            if (CommandTypeGuards.isPluginCommand(command) && command.initialize) {
              await command.initialize();
            }

            // Execute command
            const result = await command.execute(context, ...args);

            // Handle result
            if (!result.success && result.error) {
              context.logger.error(result.error.message);
              process.exit(1);
            }

            // Cleanup plugin if needed
            if (CommandTypeGuards.isPluginCommand(command) && command.cleanup) {
              await command.cleanup();
            }
          } catch (error) {
            context.logger.error('Command failed:', error);
            process.exit(1);
          }
        });
      }
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalCommands: number;
    totalCategories: number;
    totalPlugins: number;
    commandsByCategory: Record<string, number>;
  } {
    const commandsByCategory: Record<string, number> = {};
    
    for (const [category, commands] of this.commandCategories) {
      commandsByCategory[category] = commands.size;
    }

    return {
      totalCommands: this.commands.size,
      totalCategories: this.commandCategories.size,
      totalPlugins: this.pluginCommands.size,
      commandsByCategory
    };
  }
}

// Global registry instance
export const commandRegistry = new CommandRegistry();