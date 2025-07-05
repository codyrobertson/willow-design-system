/**
 * Test helpers for command tests
 */

import { Command } from 'commander';
import { ICommand, ICommandMetadata } from '../commands/CommandInterface.js';
import { CommandContext } from '../commands/CommandRegistry.js';
import { CommandResult } from '../../types/cli.js';

/**
 * Mock command implementation for testing
 */
export class MockCommand implements ICommand {
  constructor(
    private metadata: ICommandMetadata,
    private options: {
      configureOptions?: (command: Command) => void;
      execute?: (context: CommandContext, options: any, ...args: any[]) => Promise<CommandResult>;
    } = {}
  ) {}

  configureOptions(command: Command): void {
    if (this.options.configureOptions) {
      this.options.configureOptions(command);
    }
  }

  async execute(context: CommandContext, options: any, ...args: any[]): Promise<CommandResult> {
    if (this.options.execute) {
      return this.options.execute(context, options, ...args);
    }
    return { success: true };
  }

  getMetadata(): ICommandMetadata {
    return this.metadata;
  }
}

/**
 * Create a mock command for testing
 */
export function createMockCommand(
  name: string,
  description: string,
  options?: {
    aliases?: string[];
    category?: string;
    examples?: Array<{ description: string; command: string }>;
    configureOptions?: (command: Command) => void;
    execute?: (context: CommandContext, options: any, ...args: any[]) => Promise<CommandResult>;
  }
): MockCommand {
  return new MockCommand(
    {
      name,
      description,
      aliases: options?.aliases,
      category: options?.category,
      examples: options?.examples
    },
    {
      configureOptions: options?.configureOptions,
      execute: options?.execute
    }
  );
}