/**
 * Command infrastructure exports
 */

// Base classes
export { BaseCommand } from './BaseCommand.js';
export type { CommandMetadata, CommandLifecycleHooks } from './BaseCommand.js';

export { AsyncCommand } from './AsyncCommand.js';
export { InteractiveCommand } from './InteractiveCommand.js';
export type { InteractiveOptions } from './InteractiveCommand.js';

export { CompositeCommand } from './CompositeCommand.js';

// Interfaces
export type {
  ICommand,
  ICommandMetadata,
  ICommandExample,
  IPluginCommand,
  IPluginMetadata,
  ICommandValidator,
  ICommandMiddleware,
  ICommandFactory,
  ICommandFactoryMetadata,
  IAsyncCommand,
  ICommandProgress,
  IInteractiveCommand,
  ICompositeCommand,
  ICommandGroup
} from './CommandInterface.js';

export { CommandTypeGuards } from './CommandInterface.js';

// Registry and context
export { CommandRegistry, commandRegistry } from './CommandRegistry.js';
export type { CommandContext, CommandRegistrationOptions } from './CommandRegistry.js';

// Plugin manager
export { PluginManager } from './PluginManager.js';
export type { PluginConfig, PluginManifest, PluginLoadResult } from './PluginManager.js';

// Re-export commonly used types from cli types
export type { CommandResult, CLIError, CLIErrorCode } from '../../types/cli.js';