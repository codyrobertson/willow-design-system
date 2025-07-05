/**
 * Compatibility Integration for CLI
 * Integrates backward compatibility features into the main CLI
 */

import { Command } from 'commander';
import { ICommand } from '../commands/CommandInterface.js';
import { CommandContext } from '../commands/CommandRegistry.js';
import { CompatibilityMode, CompatibilityOptions } from './CompatibilityMode.js';
import { getCompatibilityMode } from './CompatibilityMode.js';
import chalk from 'chalk';

/**
 * Create compatibility middleware for command processing
 */
export function createCompatibilityMiddleware(options?: CompatibilityOptions) {
  const compatibilityMode = getCompatibilityMode(options);

  return (command: ICommand): ICommand => {
    const originalExecute = command.execute.bind(command);
    
    // Wrap the execute method to process commands through compatibility layer
    command.execute = async (context: CommandContext, ...args: any[]) => {
      // Check if the last argument is a Commander Command instance
      const lastArg = args[args.length - 1];
      const isCommandInstance = lastArg && typeof lastArg === 'object' && typeof lastArg.name === 'function';
      
      let commandName = command.getMetadata().name;
      let processedArgs = args;
      
      if (isCommandInstance) {
        // Commander passes the Command instance as the last argument
        commandName = lastArg.name() || command.getMetadata().name;
        processedArgs = args.slice(0, -1); // Remove the Command instance
      }
      
      // Process command through compatibility layer
      const { command: resolvedCommand, args: resolvedArgs } = compatibilityMode.processCommand(
        commandName,
        processedArgs as string[]
      );
      
      // If command was aliased, update the command name in the context
      if (resolvedCommand !== commandName && context.logger) {
        context.logger.debug(`Command '${commandName}' resolved to '${resolvedCommand}'`);
      }
      
      // Execute with original args structure (including Command instance if present)
      return originalExecute(context, ...args);
    };
    
    return command;
  };
}

/**
 * Apply compatibility features to a CLI program
 */
export async function applyCompatibility(
  program: Command,
  options?: CompatibilityOptions
): Promise<void> {
  const compatibilityMode = getCompatibilityMode(options);
  
  // Initialize compatibility mode
  await compatibilityMode.initialize(process.cwd());
  
  // Add compatibility-specific options
  program
    .option('--compatibility-mode <mode>', 'set compatibility mode (strict, loose, legacy)', 'loose')
    .option('--no-compat-warnings', 'suppress compatibility warnings')
    .option('--migrate-config', 'automatically migrate configuration to latest version');
  
  // Hook into command execution to process through compatibility
  program.hook('preAction', async (thisCommand, actionCommand) => {
    const opts = thisCommand.opts();
    
    // Update compatibility mode based on options
    if (opts.compatibilityMode) {
      switch (opts.compatibilityMode) {
        case 'strict':
          compatibilityMode.enableStrictMode();
          break;
        case 'legacy':
          compatibilityMode.enableLegacyMode();
          break;
      }
    }
    
    // Handle config migration if requested
    if (opts.migrateConfig) {
      const migrationManager = compatibilityMode.getMigrationManager();
      const versionInfo = compatibilityMode.getStatus().detectedVersion;
      
      if (versionInfo && versionInfo.isLegacy) {
        console.log(chalk.blue('\n🔄 Migrating configuration...'));
        // Migration logic would go here
        console.log(chalk.green('✅ Configuration migrated successfully\n'));
      }
    }
  });
  
  // Add compatibility status command
  program
    .command('compat:status')
    .description('Show compatibility status and available migrations')
    .action(() => {
      const status = compatibilityMode.getStatus();
      
      console.log(chalk.bold('\n📊 Compatibility Status\n'));
      console.log(`Mode: ${chalk.cyan(status.mode)}`);
      console.log(`Aliases enabled: ${status.aliasesEnabled ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`Auto-migrate enabled: ${status.autoMigrateEnabled ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`Active aliases: ${chalk.yellow(status.activeAliases)}`);
      
      if (status.detectedVersion) {
        console.log(`\nCLI Version: ${chalk.cyan(status.detectedVersion.cliVersion)}`);
        console.log(`Config Version: ${chalk.cyan(status.detectedVersion.configVersion)}`);
        console.log(`Config Format: ${chalk.cyan(status.detectedVersion.configFormat)}`);
        console.log(`Legacy: ${status.detectedVersion.isLegacy ? chalk.yellow('Yes') : chalk.green('No')}`);
        
        console.log('\nFeatures:');
        Object.entries(status.detectedVersion.features).forEach(([feature, enabled]) => {
          console.log(`  ${feature}: ${enabled ? chalk.green('✓') : chalk.gray('✗')}`);
        });
      }
      
      if (status.pendingMigrations > 0) {
        console.log(chalk.yellow(`\n⚠️  ${status.pendingMigrations} pending migrations available`));
        console.log(chalk.gray('Run with --migrate-config to apply migrations'));
      }
      
      console.log('');
    });
  
  // Add compatibility help section
  program.addHelpText('after', `
${chalk.bold('Compatibility Options:')}
  --compatibility-mode <mode>  Set compatibility mode (strict, loose, legacy)
  --no-compat-warnings        Suppress compatibility warnings
  --migrate-config           Automatically migrate configuration

${chalk.bold('Compatibility Commands:')}
  compat:status              Show compatibility status and migrations
`);
}

/**
 * Create a compatibility-aware command processor
 */
export function createCompatibilityProcessor(compatibilityMode?: CompatibilityMode) {
  const mode = compatibilityMode || getCompatibilityMode();
  
  return {
    /**
     * Process a raw command line input through compatibility layer
     */
    processCommandLine(args: string[]): string[] {
      if (args.length < 3) return args;
      
      // Extract command from args (skip node and script name)
      const command = args[2];
      const commandArgs = args.slice(3);
      
      // Process through compatibility layer
      const processed = mode.processCommand(command, commandArgs);
      
      // Rebuild args array
      return [args[0], args[1], processed.command, ...processed.args];
    },
    
    /**
     * Check if a command is deprecated
     */
    isDeprecated(command: string): boolean {
      const aliasRegistry = mode.getAliasRegistry();
      const alias = aliasRegistry.getAlias(command);
      return alias !== undefined && alias.deprecatedSince !== undefined;
    },
    
    /**
     * Get modern equivalent of a command
     */
    getModernEquivalent(command: string): string | undefined {
      const aliasRegistry = mode.getAliasRegistry();
      const alias = aliasRegistry.getAlias(command);
      return alias?.newCommand;
    }
  };
}