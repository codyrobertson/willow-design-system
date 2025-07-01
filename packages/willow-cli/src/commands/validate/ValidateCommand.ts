/**
 * Validate Command Implementation
 */

import { Command } from 'commander';
import { 
  ValidateOptions,
  ValidateOptionsSchema,
  CommandResult,
  CLIError,
  CLIErrorCode 
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { configValidator } from '../../config/index.js';
import { argumentParser } from '../../core/ArgumentParser.js';

export class ValidateCommand {
  static command = 'validate [component...]';
  static description = 'Validate components and configuration';

  static builder(cmd: Command): void {
    cmd
      .option('--fix', 'auto-fix issues when possible')
      .option('--config', 'validate configuration only')
      .option('--accessibility', 'run accessibility checks')
      .option('--performance', 'run performance checks')
      .option('--strict', 'use strict validation rules');
  }

  static async action(
    context: CommandContext,
    components: string[],
    options: ValidateOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;

    // Validate options
    const validatedOptions = argumentParser.parse(
      options,
      ValidateOptionsSchema,
      'validate options'
    );

    try {
      progress.start('Running validation...');

      if (validatedOptions.config) {
        const { configManager } = await import('../../config/index.js');
        const config = await configManager.load();
        const result = await configValidator.validate(config);
        
        if (!result.valid) {
          logger.error('Configuration validation failed:');
          result.errors.forEach(err => {
            logger.error(`  ${err.path}: ${err.message}`);
          });
          
          throw new CLIError(
            CLIErrorCode.VALIDATION_ERROR,
            'Configuration validation failed'
          );
        }
        
        logger.success('Configuration is valid!');
      }

      // TODO: Implement component validation

      progress.succeed('Validation complete!');

      return {
        success: true,
      };
    } catch (error) {
      progress.fail('Validation failed');
      
      if (error instanceof CLIError) {
        throw error;
      }
      
      throw new CLIError(
        CLIErrorCode.VALIDATION_ERROR,
        'Validation failed',
        error
      );
    }
  }
}