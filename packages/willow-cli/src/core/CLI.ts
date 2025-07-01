/**
 * Core CLI Framework
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import { 
  GlobalOptions, 
  CLIError, 
  CLIErrorCode,
  ExitCodes 
} from '../types/cli.js';
import { 
  Logger, 
  ProgressReporter, 
  InteractivePrompts,
  setLoggerOptions,
  setGlobalReporterOptions
} from '../ui/index.js';
import { configManager } from '../config/index.js';
import { CommandRegistry, CommandContext } from './CommandRegistry.js';
import { terminalManager } from '../ui/TerminalManager.js';

export interface CLIOptions {
  name: string;
  description: string;
  version?: string;
  registry?: CommandRegistry;
}

export class CLI {
  private program: Command;
  private logger: Logger;
  private progress: ProgressReporter;
  private prompts: InteractivePrompts;
  private registry: CommandRegistry;
  private globalOptions: GlobalOptions = {};

  constructor(options: CLIOptions) {
    this.program = new Command();
    this.program
      .name(options.name)
      .description(options.description);
    
    if (options.version) {
      this.program.version(options.version);
    }
    
    this.registry = options.registry || new CommandRegistry();
    this.logger = new Logger();
    this.progress = new ProgressReporter();
    this.prompts = new InteractivePrompts();
    
    this.setupGlobalOptions();
    this.setupErrorHandling();
    
    // Register cleanup handlers
    terminalManager.registerCleanupHandler(() => {
      this.progress.stop();
    });
  }

  /**
   * Setup global options
   */
  private setupGlobalOptions(): void {
    this.program
      .option('-c, --config <path>', 'specify config file location')
      .option('-v, --verbose', 'enable verbose output')
      .option('-q, --quiet', 'suppress non-error output')
      .option('--no-color', 'disable colored output')
      .option('--dry-run', 'preview changes without applying')
      .option('--json', 'output in JSON format')
      .hook('preAction', (thisCommand) => {
        // Store global options
        this.globalOptions = thisCommand.opts();
        
        // Configure logger and progress reporter
        setLoggerOptions({
          level: this.globalOptions.verbose ? 'debug' : 'info',
          colors: this.globalOptions.color !== false,
        });
        
        setGlobalReporterOptions({
          verbose: this.globalOptions.verbose,
          quiet: this.globalOptions.quiet,
          noColor: this.globalOptions.color === false,
          json: this.globalOptions.json,
        });
        
        // Update instances
        this.logger = new Logger({
          level: this.globalOptions.verbose ? 'debug' : 'info',
          colors: this.globalOptions.color !== false,
        });
        
        this.progress = new ProgressReporter({
          verbose: this.globalOptions.verbose,
          quiet: this.globalOptions.quiet,
          noColor: this.globalOptions.color === false,
          json: this.globalOptions.json,
        });
      });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      process.exit(ExitCodes.UNKNOWN_ERROR);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(ExitCodes.UNKNOWN_ERROR);
    });
    
    // Handle unknown commands
    this.program.on('command:*', (operands: string[]) => {
      this.logger.errorWithCode(
        CLIErrorCode.INVALID_ARGUMENTS,
        `Unknown command: ${operands[0]}`
      );
      this.program.outputHelp();
      process.exit(ExitCodes.INVALID_ARGUMENTS);
    });
  }

  /**
   * Create command context
   */
  private createContext(): CommandContext {
    return {
      logger: this.logger,
      progress: this.progress,
      globalOptions: this.globalOptions,
    };
  }

  /**
   * Register a command
   */
  command(
    name: string,
    description: string,
    builder?: (cmd: Command) => void
  ): Command {
    const cmd = this.program
      .command(name)
      .description(description);
    
    if (builder) {
      builder(cmd);
    }
    
    return cmd;
  }

  /**
   * Apply registered commands
   */
  private applyRegisteredCommands(): void {
    this.registry.applyToProgram(this.program, () => this.createContext());
  }

  /**
   * Load configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      await configManager.load(this.globalOptions.config);
      this.logger.debug('Configuration loaded from:', configManager.getConfigPath());
    } catch (error) {
      this.logger.debug('No configuration file found, using defaults');
    }
  }

  /**
   * Parse command line arguments
   */
  async parse(argv: string[] = process.argv): Promise<void> {
    // Load configuration before parsing
    await this.loadConfiguration();
    
    // Apply registered commands
    this.applyRegisteredCommands();
    
    // Show ASCII art on help
    this.program.configureHelp({
      formatHelp: (cmd, helper) => {
        const logo = chalk.cyan(`
╦ ╦┬┬  ┬  ┌─┐┬ ┬
║║║││  │  │ ││││
╚╩╝┴┴─┘┴─┘└─┘└┴┘
        `);
        return logo + '\n' + helper.formatHelp(cmd, helper);
      },
    });
    
    // Parse arguments
    await this.program.parseAsync(argv);
    
    // Show help if no command provided
    if (argv.length === 2) {
      this.program.outputHelp();
    }
  }

  /**
   * Add a custom help section
   */
  addHelpText(position: 'before' | 'after', text: string): void {
    this.program.addHelpText(position, text);
  }

  /**
   * Get the Commander program instance
   */
  getProgram(): Command {
    return this.program;
  }

  /**
   * Get the logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get the progress reporter instance
   */
  getProgress(): ProgressReporter {
    return this.progress;
  }

  /**
   * Get the prompts instance
   */
  getPrompts(): InteractivePrompts {
    return this.prompts;
  }
}

/**
 * Create a new CLI instance with automatic version detection
 */
export function createCLI(
  name: string,
  description: string,
  registry?: CommandRegistry
): CLI {
  // Get version from package.json
  let version = '0.0.0';
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8')
    );
    version = packageJson.version;
  } catch {
    // Ignore errors
  }
  
  return new CLI({
    name,
    description,
    version,
    registry,
  });
}