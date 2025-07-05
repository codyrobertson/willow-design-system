/**
 * Command interface definitions
 */

import { Command } from 'commander';
import { z } from 'zod';
import { CommandContext } from '../CommandRegistry.js';
import { CommandResult } from '../../types/cli.js';

/**
 * Core command interface that all commands must implement
 */
export interface ICommand<TOptions = any> {
  /**
   * Configure command options and arguments
   */
  configureOptions(command: Command): void;

  /**
   * Execute the command
   */
  execute(context: CommandContext, options: TOptions, ...args: any[]): Promise<CommandResult>;

  /**
   * Get command metadata
   */
  getMetadata(): ICommandMetadata;
}

/**
 * Command metadata interface
 */
export interface ICommandMetadata {
  name: string;
  description: string;
  aliases?: string[];
  category?: string;
  version?: string;
  deprecated?: boolean;
  experimental?: boolean;
  examples?: ICommandExample[];
}

/**
 * Command example interface
 */
export interface ICommandExample {
  description: string;
  command: string;
}

/**
 * Plugin command interface for extensibility
 */
export interface IPluginCommand extends ICommand {
  /**
   * Plugin metadata
   */
  pluginMetadata: IPluginMetadata;

  /**
   * Initialize the plugin
   */
  initialize?(): Promise<void>;

  /**
   * Cleanup resources
   */
  cleanup?(): Promise<void>;
}

/**
 * Plugin metadata interface
 */
export interface IPluginMetadata {
  name: string;
  version: string;
  author?: string;
  description?: string;
  homepage?: string;
  dependencies?: Record<string, string>;
}

/**
 * Command validation interface
 */
export interface ICommandValidator<TOptions = any> {
  /**
   * Validate command options
   */
  validate(options: any): Promise<TOptions>;

  /**
   * Get validation schema
   */
  getSchema(): z.ZodSchema<TOptions>;
}

/**
 * Command middleware interface
 */
export interface ICommandMiddleware {
  /**
   * Process before command execution
   */
  before?(context: CommandContext, options: any): Promise<void>;

  /**
   * Process after command execution
   */
  after?(context: CommandContext, options: any, result: CommandResult): Promise<CommandResult>;

  /**
   * Handle errors
   */
  error?(error: Error, context: CommandContext, options: any): Promise<void>;
}

/**
 * Command factory interface for creating commands
 */
export interface ICommandFactory<T extends ICommand = ICommand> {
  /**
   * Create a command instance
   */
  create(config?: any): T;

  /**
   * Get factory metadata
   */
  getMetadata(): ICommandFactoryMetadata;
}

/**
 * Command factory metadata
 */
export interface ICommandFactoryMetadata {
  commandType: string;
  version: string;
  supportedOptions?: string[];
}

/**
 * Async command interface for long-running operations
 */
export interface IAsyncCommand<TOptions = any> extends ICommand<TOptions> {
  /**
   * Check if the command supports cancellation
   */
  isCancellable(): boolean;

  /**
   * Cancel the command execution
   */
  cancel?(): Promise<void>;

  /**
   * Get execution progress
   */
  getProgress?(): ICommandProgress;
}

/**
 * Command progress interface
 */
export interface ICommandProgress {
  current: number;
  total: number;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Interactive command interface
 */
export interface IInteractiveCommand<TOptions = any> extends ICommand<TOptions> {
  /**
   * Run in interactive mode
   */
  runInteractive(context: CommandContext): Promise<TOptions>;

  /**
   * Check if interactive mode is supported
   */
  supportsInteractive(): boolean;
}

/**
 * Composite command interface for commands with subcommands
 */
export interface ICompositeCommand extends ICommand {
  /**
   * Register a subcommand
   */
  registerSubcommand(command: ICommand): void;

  /**
   * Get all subcommands
   */
  getSubcommands(): Map<string, ICommand>;

  /**
   * Get a specific subcommand
   */
  getSubcommand(name: string): ICommand | undefined;
}

/**
 * Command group interface for organizing related commands
 */
export interface ICommandGroup {
  name: string;
  description: string;
  commands: ICommand[];
}

/**
 * Type guards for command interfaces
 */
export const CommandTypeGuards = {
  isPluginCommand(command: ICommand): command is IPluginCommand {
    return 'pluginMetadata' in command;
  },

  isAsyncCommand(command: ICommand): command is IAsyncCommand {
    return 'isCancellable' in command && typeof command.isCancellable === 'function';
  },

  isInteractiveCommand(command: ICommand): command is IInteractiveCommand {
    return 'runInteractive' in command && typeof command.runInteractive === 'function';
  },

  isCompositeCommand(command: ICommand): command is ICompositeCommand {
    return 'registerSubcommand' in command && 'getSubcommands' in command;
  }
};