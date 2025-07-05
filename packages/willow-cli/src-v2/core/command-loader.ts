/**
 * Command Loader for Willow CLI
 * Dynamically loads and registers all commands
 */

import { Command } from 'commander';
import { Logger } from './logger';
import { WillowConfig } from './config';

// Import all command modules
import { createAddCommand } from '../commands/add';
import { createRemoveCommand } from '../commands/remove';
import { createUpdateCommand } from '../commands/update';
import { createPublishCommand } from '../commands/publish';
import { createCreateCommand } from '../commands/create';
import { createImportCommand } from '../commands/import';
import { createSearchCommand } from '../commands/search';
import { createDocsCommand } from '../commands/docs';

export interface CommandContext {
  logger: Logger;
  config: WillowConfig;
}

export async function registerCommands(
  program: Command,
  context: CommandContext
): Promise<void> {
  // Register each command
  const commands = [
    createAddCommand,
    createRemoveCommand,
    createUpdateCommand,
    createPublishCommand,
    createCreateCommand,
    createImportCommand,
    createSearchCommand,
    createDocsCommand
  ];

  for (const createCommand of commands) {
    const command = createCommand(context);
    program.addCommand(command);
  }

  // Add global command hooks
  program.hook('preAction', (thisCommand) => {
    if (program.opts().verbose) {
      context.logger.setLevel('debug');
    }
    context.logger.debug(`Executing command: ${thisCommand.name()}`);
  });

  program.hook('postAction', (thisCommand) => {
    context.logger.debug(`Completed command: ${thisCommand.name()}`);
  });
}