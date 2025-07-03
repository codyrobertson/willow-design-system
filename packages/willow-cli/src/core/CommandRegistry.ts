/**
 * Command Registry for CLI
 */

import { Command } from 'commander';
import { Logger } from '../ui/Logger.js';
import { ProgressReporter } from '../ui/ProgressReporter.js';
import { GlobalOptions, CommandResult } from '../types/cli.js';

export interface CommandContext {
  logger: Logger;
  progress: ProgressReporter;
  globalOptions: GlobalOptions;
}

export interface CommandHandler {
  name: string;
  description: string;
  builder?: (cmd: Command) => void;
  action: (context: CommandContext, ...args: any[]) => Promise<CommandResult>;
}

export interface CommandClass {
  command: string;
  description: string;
  builder?: (cmd: Command) => void;
  action: (context: CommandContext, ...args: any[]) => Promise<CommandResult>;
}

export class CommandRegistry {
  private commands = new Map<string, CommandHandler>();
  
  /**
   * Register a command handler
   */
  register(commandClass: CommandClass): void {
    // Extract command name from the command string (e.g., "add <component...>" -> "add")
    const name = commandClass.command.split(' ')[0];
    
    const handler: CommandHandler = {
      name: commandClass.command,
      description: commandClass.description,
      builder: commandClass.builder,
      action: commandClass.action,
    };
    
    this.commands.set(name, handler);
  }

  /**
   * Get a command handler
   */
  get(name: string): CommandHandler | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all registered commands
   */
  getAll(): CommandHandler[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands map
   */
  getCommands(): Map<string, CommandHandler> {
    return this.commands;
  }

  /**
   * Check if a command exists
   */
  has(name: string): boolean {
    return this.commands.has(name);
  }

  /**
   * Apply commands to Commander program
   */
  applyToProgram(program: Command, contextFactory: () => CommandContext): void {
    for (const handler of this.commands.values()) {
      const cmd = program
        .command(handler.name)
        .description(handler.description);
      
      // Apply builder if available
      if (handler.builder) {
        handler.builder(cmd);
      }
      
      // Wrap action to provide context
      cmd.action(async (...args) => {
        const context = contextFactory();
        
        try {
          const result = await handler.action(context, ...args);
          
          if (!result.success && result.error) {
            context.logger.error(result.error.message);
            process.exit(1);
          }
        } catch (error) {
          context.logger.error('Command failed:', error);
          process.exit(1);
        }
      });
    }
  }
}

// Global registry instance
export const commandRegistry = new CommandRegistry();