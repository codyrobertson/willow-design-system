/**
 * Legacy Command Adapter
 * Adapts old-style static command classes to ICommand interface
 */

import { Command } from 'commander';
import { ICommand, ICommandMetadata } from './CommandInterface.js';
import { CommandContext } from './CommandRegistry.js';
import { CommandResult } from '../../types/cli.js';

export interface LegacyCommand {
  command: string;
  description: string;
  aliases?: string[];
  builder?: (cmd: Command) => void;
  action: (context: CommandContext, options: any, ...args: any[]) => Promise<CommandResult>;
}

export class LegacyCommandAdapter implements ICommand {
  private name: string;
  
  constructor(private legacyCommand: LegacyCommand) {
    // Extract command name from command string
    this.name = this.extractCommandName(legacyCommand.command);
  }

  configureOptions(command: Command): void {
    if (this.legacyCommand.builder) {
      this.legacyCommand.builder(command);
    }
  }

  async execute(context: CommandContext, options: any, ...args: any[]): Promise<CommandResult> {
    return this.legacyCommand.action(context, options, ...args);
  }

  getMetadata(): ICommandMetadata {
    return {
      name: this.name,
      description: this.legacyCommand.description,
      aliases: this.legacyCommand.aliases
    };
  }

  private extractCommandName(commandString: string): string {
    // Extract the first word before any space or angle bracket
    const match = commandString.match(/^(\S+)/);
    return match ? match[1] : commandString;
  }
}

/**
 * Create an ICommand from a legacy command object
 */
export function fromLegacyCommand(legacyCommand: LegacyCommand): ICommand {
  return new LegacyCommandAdapter(legacyCommand);
}

/**
 * Register a legacy command with the registry
 */
export function registerLegacyCommand(registry: any, commandClass: any, options?: any): void {
  const adapter = new LegacyCommandAdapter(commandClass);
  registry.register(adapter, options);
}