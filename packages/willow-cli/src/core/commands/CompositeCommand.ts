/**
 * Base class for composite commands with subcommands
 */

import { Command } from 'commander';
import { BaseCommand, CommandMetadata } from './BaseCommand.js';
import { ICompositeCommand, ICommand } from './CommandInterface.js';
import { CommandContext } from './CommandRegistry.js';
import { CommandResult, CLIError, CLIErrorCode } from '../../types/cli.js';

/**
 * Composite command that can have subcommands
 */
export abstract class CompositeCommand<TOptions = any> 
  extends BaseCommand<TOptions> 
  implements ICompositeCommand {
  
  private subcommands = new Map<string, ICommand>();
  private defaultSubcommand: string | null = null;

  constructor(metadata: CommandMetadata) {
    super(metadata);
  }

  /**
   * Register a subcommand
   */
  registerSubcommand(command: ICommand): void {
    const metadata = command.getMetadata();
    
    if (this.subcommands.has(metadata.name)) {
      throw new CLIError(
        CLIErrorCode.CONFIGURATION_ERROR,
        `Subcommand '${metadata.name}' is already registered`
      );
    }

    this.subcommands.set(metadata.name, command);

    // Register aliases
    if (metadata.aliases) {
      for (const alias of metadata.aliases) {
        if (this.subcommands.has(alias)) {
          throw new CLIError(
            CLIErrorCode.CONFIGURATION_ERROR,
            `Subcommand alias '${alias}' is already in use`
          );
        }
        this.subcommands.set(alias, command);
      }
    }
  }

  /**
   * Set default subcommand
   */
  setDefaultSubcommand(name: string): void {
    if (!this.subcommands.has(name)) {
      throw new CLIError(
        CLIErrorCode.CONFIGURATION_ERROR,
        `Default subcommand '${name}' is not registered`
      );
    }
    this.defaultSubcommand = name;
  }

  /**
   * Get all subcommands
   */
  getSubcommands(): Map<string, ICommand> {
    // Filter out aliases, return only actual commands
    const actualCommands = new Map<string, ICommand>();
    const seen = new Set<ICommand>();

    for (const [name, command] of this.subcommands) {
      if (!seen.has(command)) {
        actualCommands.set(command.getMetadata().name, command);
        seen.add(command);
      }
    }

    return actualCommands;
  }

  /**
   * Get a specific subcommand
   */
  getSubcommand(name: string): ICommand | undefined {
    return this.subcommands.get(name);
  }

  /**
   * Configure options - sets up subcommands
   */
  configureOptions(command: Command): void {
    // First, let subclass configure any parent command options
    this.configureParentOptions(command);

    // Then add subcommands
    for (const [name, subcommand] of this.getSubcommands()) {
      const metadata = subcommand.getMetadata();
      
      const subCmd = command
        .command(metadata.name)
        .description(metadata.description);

      // Add aliases
      if (metadata.aliases && metadata.aliases.length > 0) {
        subCmd.aliases(metadata.aliases);
      }

      // Configure subcommand options
      subcommand.configureOptions(subCmd);

      // Set up action
      subCmd.action(async (...args) => {
        // Create a new context for the subcommand
        const context = args[args.length - 1] as CommandContext;
        await subcommand.execute(context, ...args.slice(0, -1));
      });
    }

    // Add help for listing subcommands
    command.addHelpText('after', this.generateSubcommandsHelp());
  }

  /**
   * Configure parent command options - to be implemented by subclasses
   */
  protected abstract configureParentOptions(command: Command): void;

  /**
   * Execute the composite command
   */
  async execute(context: CommandContext, options: TOptions, ...args: any[]): Promise<CommandResult> {
    const { logger } = context;

    // If a subcommand was provided in args, it should be handled by Commander
    // This execute method is called when no subcommand is provided

    if (this.defaultSubcommand) {
      // Execute default subcommand
      const subcommand = this.subcommands.get(this.defaultSubcommand);
      if (!subcommand) {
        throw new CLIError(
          CLIErrorCode.CONFIGURATION_ERROR,
          `Default subcommand '${this.defaultSubcommand}' not found`
        );
      }

      logger.debug(`Executing default subcommand: ${this.defaultSubcommand}`);
      return await subcommand.execute(context, options, ...args);
    }

    // No default subcommand, show help or execute parent command logic
    return await this.executeParent(context, options, ...args);
  }

  /**
   * Execute parent command logic - to be implemented by subclasses
   */
  protected abstract executeParent(
    context: CommandContext,
    options: TOptions,
    ...args: any[]
  ): Promise<CommandResult>;

  /**
   * Generate help text for subcommands
   */
  private generateSubcommandsHelp(): string {
    const subcommands = this.getSubcommands();
    if (subcommands.size === 0) {
      return '';
    }

    let help = '\nSubcommands:\n';
    const maxNameLength = Math.max(...Array.from(subcommands.values()).map(cmd => {
      const metadata = cmd.getMetadata();
      const name = metadata.aliases && metadata.aliases.length > 0
        ? `${metadata.name}, ${metadata.aliases.join(', ')}`
        : metadata.name;
      return name.length;
    }));

    for (const subcommand of subcommands.values()) {
      const metadata = subcommand.getMetadata();
      const name = metadata.aliases && metadata.aliases.length > 0
        ? `${metadata.name}, ${metadata.aliases.join(', ')}`
        : metadata.name;
      const paddedName = name.padEnd(maxNameLength + 2);
      help += `  ${paddedName} ${metadata.description}\n`;
    }

    if (this.defaultSubcommand) {
      help += `\nDefault subcommand: ${this.defaultSubcommand}\n`;
    }

    return help;
  }

  /**
   * Helper to create a subcommand group
   */
  protected createSubcommandGroup(
    name: string,
    description: string,
    commands: ICommand[]
  ): void {
    // This is a helper method for organizing subcommands conceptually
    // The actual registration still happens through registerSubcommand
    for (const command of commands) {
      this.registerSubcommand(command);
    }
  }

  /**
   * Validate subcommand exists
   */
  protected validateSubcommand(name: string): ICommand {
    const subcommand = this.subcommands.get(name);
    if (!subcommand) {
      const available = Array.from(this.getSubcommands().keys());
      throw new CLIError(
        CLIErrorCode.INVALID_ARGUMENTS,
        `Unknown subcommand: ${name}. Available subcommands: ${available.join(', ')}`
      );
    }
    return subcommand;
  }

  /**
   * Execute a specific subcommand programmatically
   */
  protected async executeSubcommand(
    name: string,
    context: CommandContext,
    options: any,
    ...args: any[]
  ): Promise<CommandResult> {
    const subcommand = this.validateSubcommand(name);
    return await subcommand.execute(context, options, ...args);
  }
}