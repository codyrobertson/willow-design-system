/**
 * Remove Command Implementation
 */

import { Command } from 'commander';
import { 
  RemoveOptions, 
  CommandResult,
  CLIError,
  CLIErrorCode 
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';

export class RemoveCommand {
  static command = 'remove <component...>';
  static description = 'Remove components from your project';

  static builder(cmd: Command): void {
    cmd
      .option('--keep-dependencies', 'keep shared dependencies')
      .option('-f, --force', 'remove without confirmation')
      .option('--clean', 'remove unused dependencies');
  }

  static async action(
    context: CommandContext,
    components: string[],
    options: RemoveOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;

    try {
      progress.start('Removing components...');

      // TODO: Implement component removal
      logger.info(`Removing components: ${components.join(', ')}`);

      progress.succeed('Components removed successfully!');

      return {
        success: true,
        data: { components },
      };
    } catch (error) {
      progress.fail('Failed to remove components');
      
      throw new CLIError(
        CLIErrorCode.UNKNOWN_ERROR,
        'Failed to remove components',
        error
      );
    }
  }
}