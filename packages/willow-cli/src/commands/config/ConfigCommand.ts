/**
 * Config Command Implementation
 */

import { Command } from 'commander';
import { 
  ConfigOptions,
  ConfigOptionsSchema,
  ConfigAction,
  CommandResult,
  CLIError,
  CLIErrorCode 
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { configManager } from '../../config/index.js';
import { argumentParser } from '../../core/ArgumentParser.js';

export class ConfigCommand {
  static command = 'config <action> [key] [value]';
  static description = 'Manage Willow configuration';

  static builder(cmd: Command): void {
    cmd
      .option('--global', 'use global config')
      .option('--local', 'use local config (default)')
      .addHelpText('after', `
Actions:
  get <key>            Get configuration value
  set <key> <value>    Set configuration value
  list                 List all configuration
  reset                Reset to defaults
  edit                 Open config in editor
      `);
  }

  static async action(
    context: CommandContext,
    action: ConfigAction,
    key?: string,
    value?: string,
    options?: ConfigOptions
  ): Promise<CommandResult> {
    const { logger } = context;

    // Validate options if provided
    const validatedOptions = options ? argumentParser.parse(
      options,
      ConfigOptionsSchema,
      'config options'
    ) : undefined;

    try {
      switch (action) {
        case 'get':
          if (!key) {
            throw new CLIError(
              CLIErrorCode.INVALID_ARGUMENTS,
              'Key is required for get action'
            );
          }
          const val = configManager.getNestedValue(key);
          if (val === undefined) {
            logger.warn(`Configuration key "${key}" not found`);
          } else {
            logger.info(`${key}: ${JSON.stringify(val, null, 2)}`);
          }
          break;

        case 'set':
          if (!key || value === undefined) {
            throw new CLIError(
              CLIErrorCode.INVALID_ARGUMENTS,
              'Key and value are required for set action'
            );
          }
          await configManager.setNestedValue(key, value);
          logger.success(`Configuration updated: ${key} = ${value}`);
          break;

        case 'list':
          const config = configManager.get();
          logger.info(JSON.stringify(config, null, 2));
          break;

        case 'reset':
          const { getPrompts } = await import('../../ui/index.js');
          const prompts = getPrompts();
          const confirm = await prompts.confirm(
            'Reset configuration to defaults?',
            false
          );
          if (confirm) {
            await configManager.reset();
            logger.success('Configuration reset to defaults');
          }
          break;

        case 'edit':
          const configPath = configManager.getConfigPath();
          if (!configPath) {
            logger.error('No configuration file found');
            break;
          }
          logger.info(`Opening ${configPath} in editor...`);
          // TODO: Open in editor
          break;

        default:
          throw new CLIError(
            CLIErrorCode.INVALID_ARGUMENTS,
            `Unknown action: ${action}. Valid actions: get, set, list, reset, edit`
          );
      }

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      }
      
      throw new CLIError(
        CLIErrorCode.CONFIGURATION_ERROR,
        'Configuration operation failed',
        error
      );
    }
  }
}