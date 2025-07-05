/**
 * Base class for interactive commands
 */

import { Command } from 'commander';
import { BaseCommand, CommandMetadata } from './BaseCommand.js';
import { IInteractiveCommand } from './CommandInterface.js';
import { CommandContext } from './CommandRegistry.js';
import { CommandResult } from '../../types/cli.js';
import { InteractivePrompts } from '../../ui/InteractivePrompts.js';

/**
 * Interactive command options
 */
export interface InteractiveOptions {
  interactive?: boolean;
  yes?: boolean;
  defaults?: boolean;
}

/**
 * Base class for commands that support interactive mode
 */
export abstract class InteractiveCommand<TOptions extends InteractiveOptions = InteractiveOptions> 
  extends BaseCommand<TOptions> 
  implements IInteractiveCommand<TOptions> {
  
  protected prompts: InteractivePrompts;

  constructor(metadata: CommandMetadata) {
    super(metadata);
    this.prompts = new InteractivePrompts();
  }

  /**
   * Configure common interactive options
   */
  configureOptions(command: Command): void {
    command
      .option('-i, --interactive', 'run in interactive mode', true)
      .option('-y, --yes', 'answer yes to all prompts')
      .option('--defaults', 'use default values for all prompts');
    
    // Allow subclasses to add their own options
    this.configureAdditionalOptions(command);
  }

  /**
   * Configure additional options - to be implemented by subclasses
   */
  protected abstract configureAdditionalOptions(command: Command): void;

  /**
   * Check if interactive mode is supported
   */
  supportsInteractive(): boolean {
    return true;
  }

  /**
   * Run in interactive mode
   */
  abstract runInteractive(context: CommandContext): Promise<TOptions>;

  /**
   * Execute the command with interactive support
   */
  async execute(context: CommandContext, options: TOptions, ...args: any[]): Promise<CommandResult> {
    const { logger } = context;

    // Check if running in CI/non-TTY environment
    const isCI = process.env.CI === 'true';
    const isTTY = process.stdin.isTTY;

    if (options.interactive && !options.yes && !options.defaults && isTTY && !isCI) {
      // Run in interactive mode
      try {
        const interactiveOptions = await this.runInteractive(context);
        // Merge interactive options with command line options
        options = { ...options, ...interactiveOptions };
      } catch (error) {
        if (error instanceof Error && error.message === 'User cancelled') {
          logger.info('Operation cancelled by user');
          return { success: false };
        }
        throw error;
      }
    } else if (!isTTY || isCI) {
      // Non-interactive environment
      logger.debug('Running in non-interactive mode (CI or non-TTY environment)');
      
      // Validate required options
      const validation = await this.validateNonInteractiveOptions(options, context);
      if (!validation.valid) {
        logger.error('Missing required options for non-interactive mode:');
        validation.errors.forEach(error => logger.error(`  - ${error}`));
        logger.info('\nRun with --help to see available options');
        return { 
          success: false, 
          error: new Error('Missing required options for non-interactive mode') 
        };
      }
    }

    // Execute with final options
    return await this.executeCommand(context, options, ...args);
  }

  /**
   * Validate options for non-interactive mode
   */
  protected abstract validateNonInteractiveOptions(
    options: TOptions,
    context: CommandContext
  ): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Execute the command - to be implemented by subclasses
   */
  protected abstract executeCommand(
    context: CommandContext,
    options: TOptions,
    ...args: any[]
  ): Promise<CommandResult>;

  /**
   * Helper method to confirm action
   */
  protected async confirmAction(
    message: string,
    options: TOptions,
    defaultValue: boolean = false
  ): Promise<boolean> {
    if (options.yes) {
      return true;
    }

    if (options.defaults) {
      return defaultValue;
    }

    if (!options.interactive) {
      return defaultValue;
    }

    return await this.prompts.confirm(message, defaultValue);
  }

  /**
   * Helper method to select from list
   */
  protected async selectOption<T>(
    message: string,
    choices: Array<{ title: string; value: T; description?: string }>,
    options: TOptions,
    defaultValue?: T
  ): Promise<T | null> {
    if (options.defaults && defaultValue !== undefined) {
      return defaultValue;
    }

    if (!options.interactive && defaultValue !== undefined) {
      return defaultValue;
    }

    const result = await this.prompts.select(message, choices);
    return result;
  }

  /**
   * Helper method to get text input
   */
  protected async getInput(
    message: string,
    options: TOptions,
    defaultValue?: string,
    validate?: (value: string) => string | boolean
  ): Promise<string | null> {
    if (options.defaults && defaultValue !== undefined) {
      return defaultValue;
    }

    if (!options.interactive && defaultValue !== undefined) {
      return defaultValue;
    }

    return await this.prompts.text(message, defaultValue, validate);
  }

  /**
   * Helper method to get multiple selections
   */
  protected async multiSelect<T>(
    message: string,
    choices: Array<{ title: string; value: T; selected?: boolean }>,
    options: TOptions,
    defaultSelections?: T[]
  ): Promise<T[]> {
    if (options.defaults && defaultSelections !== undefined) {
      return defaultSelections;
    }

    if (!options.interactive && defaultSelections !== undefined) {
      return defaultSelections;
    }

    return await this.prompts.multiselect(message, choices) || [];
  }

  /**
   * Show a summary and confirm
   */
  protected async showSummaryAndConfirm(
    title: string,
    items: Array<{ label: string; value: string }>,
    options: TOptions
  ): Promise<boolean> {
    if (options.yes || options.defaults) {
      return true;
    }

    if (!options.interactive) {
      return true;
    }

    // Display summary
    console.log(`\n${title}:`);
    const maxLabelLength = Math.max(...items.map(item => item.label.length));
    items.forEach(item => {
      const paddedLabel = item.label.padEnd(maxLabelLength);
      console.log(`  ${paddedLabel} : ${item.value}`);
    });
    console.log();

    return await this.confirmAction('Proceed with these settings?', options, true);
  }

  /**
   * Helper for step-by-step interactive flows
   */
  protected async runInteractiveWizard<T>(
    steps: Array<{
      name: string;
      message: string;
      action: () => Promise<T>;
      skip?: (previousResults: T[]) => boolean;
    }>,
    context: CommandContext
  ): Promise<T[]> {
    const { logger, progress } = context;
    const results: T[] = [];

    progress.start(`Running interactive setup (${steps.length} steps)`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Check if step should be skipped
      if (step.skip && step.skip(results)) {
        logger.debug(`Skipping step: ${step.name}`);
        continue;
      }

      progress.progress(`Step ${i + 1}/${steps.length}: ${step.message}`);

      try {
        const result = await step.action();
        results.push(result);
      } catch (error) {
        progress.fail(`Failed at step: ${step.name}`);
        throw error;
      }
    }

    progress.succeed('Interactive setup completed');
    return results;
  }
}