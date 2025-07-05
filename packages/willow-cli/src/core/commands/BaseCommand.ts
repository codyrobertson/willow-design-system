/**
 * Base command class that all commands should extend
 */

import { Command } from 'commander';
import { z } from 'zod';
import { CommandContext } from '../CommandRegistry.js';
import { CommandResult, CLIError } from '../../types/cli.js';

/**
 * Lifecycle hook types
 */
export interface CommandLifecycleHooks<TOptions = any> {
  beforeValidate?: (rawOptions: any) => Promise<any>;
  afterValidate?: (options: TOptions) => Promise<TOptions>;
  beforeExecute?: (context: CommandContext, options: TOptions) => Promise<void>;
  afterExecute?: (context: CommandContext, options: TOptions, result: CommandResult) => Promise<CommandResult>;
  onError?: (error: Error, context: CommandContext, options: TOptions) => Promise<void>;
  onCleanup?: (context: CommandContext, options: TOptions) => Promise<void>;
}

/**
 * Command metadata for registration and help
 */
export interface CommandMetadata {
  name: string;
  description: string;
  aliases?: string[];
  category?: string;
  version?: string;
  deprecated?: boolean;
  experimental?: boolean;
  examples?: Array<{
    description: string;
    command: string;
  }>;
}

/**
 * Abstract base class for all commands
 */
export abstract class BaseCommand<TOptions = any> {
  protected metadata: CommandMetadata;
  protected optionsSchema?: z.ZodSchema<TOptions>;
  protected lifecycleHooks: CommandLifecycleHooks<TOptions> = {};

  constructor(metadata: CommandMetadata) {
    this.metadata = metadata;
  }

  /**
   * Get command metadata
   */
  getMetadata(): CommandMetadata {
    return this.metadata;
  }

  /**
   * Configure command options
   */
  abstract configureOptions(command: Command): void;

  /**
   * Execute the command
   */
  abstract execute(context: CommandContext, options: TOptions, ...args: any[]): Promise<CommandResult>;

  /**
   * Build the commander command
   */
  buildCommand(): [string, string, (cmd: Command) => void] {
    return [
      this.metadata.name,
      this.metadata.description,
      (cmd: Command) => {
        // Configure options
        this.configureOptions(cmd);

        // Add metadata as custom properties
        if (this.metadata.aliases) {
          cmd.aliases(this.metadata.aliases);
        }

        // Add examples to help
        if (this.metadata.examples && this.metadata.examples.length > 0) {
          cmd.addHelpText('after', '\nExamples:\n' + 
            this.metadata.examples.map(ex => `  ${ex.description}\n  $ ${ex.command}`).join('\n\n')
          );
        }

        // Add deprecation notice
        if (this.metadata.deprecated) {
          cmd.addHelpText('before', '\n⚠️  This command is deprecated and will be removed in a future version.\n');
        }

        // Add experimental notice
        if (this.metadata.experimental) {
          cmd.addHelpText('before', '\n🧪 This command is experimental and may change without notice.\n');
        }
      }
    ];
  }

  /**
   * Create action handler with lifecycle hooks
   */
  createAction() {
    return async (context: CommandContext, ...args: any[]): Promise<CommandResult> => {
      let options = args[args.length - 2]; // Commander passes options as second-to-last argument
      const commandArgs = args.slice(0, -2); // Actual command arguments

      try {
        // Before validate hook
        if (this.lifecycleHooks.beforeValidate) {
          options = await this.lifecycleHooks.beforeValidate(options);
        }

        // Validate options if schema is provided
        if (this.optionsSchema) {
          const validation = this.optionsSchema.safeParse(options);
          if (!validation.success) {
            throw new CLIError(
              'INVALID_ARGUMENTS',
              'Invalid command options',
              validation.error.errors
            );
          }
          options = validation.data;
        }

        // After validate hook
        if (this.lifecycleHooks.afterValidate) {
          options = await this.lifecycleHooks.afterValidate(options);
        }

        // Before execute hook
        if (this.lifecycleHooks.beforeExecute) {
          await this.lifecycleHooks.beforeExecute(context, options);
        }

        // Execute command
        let result = await this.execute(context, options, ...commandArgs);

        // After execute hook
        if (this.lifecycleHooks.afterExecute) {
          result = await this.lifecycleHooks.afterExecute(context, options, result);
        }

        return result;

      } catch (error) {
        // Error hook
        if (this.lifecycleHooks.onError) {
          await this.lifecycleHooks.onError(error as Error, context, options);
        }

        // Re-throw for global error handling
        throw error;

      } finally {
        // Cleanup hook
        if (this.lifecycleHooks.onCleanup) {
          await this.lifecycleHooks.onCleanup(context, options);
        }
      }
    };
  }

  /**
   * Set lifecycle hooks
   */
  setLifecycleHooks(hooks: Partial<CommandLifecycleHooks<TOptions>>): void {
    this.lifecycleHooks = { ...this.lifecycleHooks, ...hooks };
  }

  /**
   * Set options schema for validation
   */
  setOptionsSchema(schema: z.ZodSchema<TOptions>): void {
    this.optionsSchema = schema;
  }

  /**
   * Helper method to add common options
   */
  protected addCommonOptions(cmd: Command): void {
    cmd
      .option('--dry-run', 'preview changes without applying them')
      .option('--json', 'output results as JSON')
      .option('-v, --verbose', 'enable verbose logging');
  }

  /**
   * Helper method to validate required files/directories
   */
  protected async validateEnvironment(context: CommandContext, requirements: {
    files?: string[];
    directories?: string[];
    commands?: string[];
  }): Promise<void> {
    const { logger } = context;
    const errors: string[] = [];

    // Check files
    if (requirements.files) {
      const fs = await import('fs/promises');
      for (const file of requirements.files) {
        try {
          await fs.access(file);
        } catch {
          errors.push(`Required file not found: ${file}`);
        }
      }
    }

    // Check directories
    if (requirements.directories) {
      const fs = await import('fs/promises');
      for (const dir of requirements.directories) {
        try {
          const stat = await fs.stat(dir);
          if (!stat.isDirectory()) {
            errors.push(`Path is not a directory: ${dir}`);
          }
        } catch {
          errors.push(`Required directory not found: ${dir}`);
        }
      }
    }

    // Check commands
    if (requirements.commands) {
      const { execSync } = await import('child_process');
      for (const command of requirements.commands) {
        try {
          execSync(`which ${command}`, { stdio: 'ignore' });
        } catch {
          errors.push(`Required command not found: ${command}`);
        }
      }
    }

    if (errors.length > 0) {
      errors.forEach(error => logger.error(error));
      throw new CLIError(
        'VALIDATION_ERROR',
        'Environment validation failed',
        errors
      );
    }
  }
}