/**
 * Add Command Implementation
 */

import { Command } from 'commander';
import { 
  AddOptions,
  AddOptionsSchema,
  CommandResult,
  CLIError,
  CLIErrorCode 
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { argumentParser } from '../../core/ArgumentParser.js';

export class AddCommand {
  static command = 'add <component...>';
  static description = 'Add components to your project';

  static builder(cmd: Command): void {
    cmd
      .option('--all', 'add all available components')
      .option('-d, --dependencies', 'also add component dependencies')
      .option('--overwrite', 'overwrite existing components')
      .option('--path <path>', 'custom installation path')
      .option('--registry <url>', 'use custom registry')
      .option('--example', 'include example usage files')
      .option('--skip-validation', 'skip component validation');
  }

  static async action(
    context: CommandContext,
    components: string[],
    options: AddOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;

    // Validate options
    const validatedOptions = argumentParser.parse(
      options,
      AddOptionsSchema,
      'add options'
    );

    // Validate component names if available components list exists
    // TODO: Get available components from registry
    const availableComponents: string[] = [];
    if (availableComponents.length > 0) {
      const validation = argumentParser.validateComponentNames(
        components,
        availableComponents
      );
      
      if (validation.invalid.length > 0) {
        logger.error('Invalid components:');
        validation.invalid.forEach(name => {
          const suggestion = validation.suggestions.get(name);
          if (suggestion) {
            logger.error(`  ${name} - did you mean "${suggestion}"?`);
          } else {
            logger.error(`  ${name}`);
          }
        });
        
        throw new CLIError(
          CLIErrorCode.INVALID_ARGUMENTS,
          'Invalid component names'
        );
      }
    }

    try {
      progress.start('Adding components...');

      // TODO: Implement component installation
      logger.info(`Installing components: ${components.join(', ')}`);
      if (validatedOptions.all) {
        logger.info('Installing all available components');
      }
      if (validatedOptions.dependencies) {
        logger.info('Including component dependencies');
      }
      if (validatedOptions.overwrite) {
        logger.info('Overwriting existing components');
      }

      progress.succeed('Components added successfully!');

      return {
        success: true,
        data: { components },
      };
    } catch (error) {
      progress.fail('Failed to add components');
      
      throw new CLIError(
        CLIErrorCode.UNKNOWN_ERROR,
        'Failed to add components',
        error
      );
    }
  }
}