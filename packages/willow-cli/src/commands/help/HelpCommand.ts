/**
 * Help Command
 * 
 * Provides comprehensive help documentation for CLI commands
 */

import { Command } from 'commander';
import { BaseCommand } from '../base/BaseCommand.js';
import { CommandContext } from '../../core/commands/CommandRegistry.js';
import { HelpGenerator, HelpFormat } from '../../core/help/HelpGenerator.js';
import { InteractiveHelp } from '../../core/help/InteractiveHelp.js';
import { Logger } from '../../ui/Logger.js';

export interface HelpCommandOptions {
  format?: HelpFormat;
  interactive?: boolean;
  output?: string;
  search?: string;
  list?: boolean;
  category?: string;
}

export class HelpCommand extends BaseCommand {
  name = 'help';
  description = 'Get help for commands';
  category = 'Core';
  aliases = ['h', '?'];
  usage = 'help [command] [options]';
  
  examples = [
    {
      command: 'willow help',
      description: 'Show general help and list all commands',
    },
    {
      command: 'willow help import',
      description: 'Show help for the import command',
    },
    {
      command: 'willow help --interactive',
      description: 'Start interactive help mode',
    },
    {
      command: 'willow help --search "component"',
      description: 'Search for commands containing "component"',
    },
    {
      command: 'willow help --format markdown --output docs/',
      description: 'Generate markdown documentation',
    },
  ];
  
  configureOptions(command: Command): void {
    command
      .argument('[command]', 'Command to get help for')
      .option('-f, --format <format>', 'output format (cli, markdown, json)', 'cli')
      .option('-i, --interactive', 'start interactive help mode')
      .option('-o, --output <path>', 'output documentation to directory')
      .option('-s, --search <query>', 'search for commands')
      .option('-l, --list', 'list all available commands')
      .option('-c, --category <category>', 'filter by category');
  }
  
  async execute(
    context: CommandContext,
    commandName?: string
  ): Promise<void> {
    const options = context.globalOptions as HelpCommandOptions;
    const { logger, registry } = context;
    
    const generator = new HelpGenerator(registry, {
      defaultFormat: options.format,
    });
    
    // Interactive mode
    if (options.interactive) {
      const interactive = new InteractiveHelp(registry);
      await interactive.start();
      return;
    }
    
    // Search mode
    if (options.search) {
      await this.searchCommands(generator, options.search, logger);
      return;
    }
    
    // Generate documentation
    if (options.output) {
      await this.generateDocumentation(generator, options.output, logger);
      return;
    }
    
    // List commands
    if (options.list || (!commandName && !options.category)) {
      const output = await generator.generateAllCommandsHelp(options.format);
      console.log(output.content);
      return;
    }
    
    // Show help for specific command
    if (commandName) {
      try {
        const output = await generator.generateCommandHelp(commandName, options.format);
        console.log(output.content);
      } catch (error) {
        logger.error(`Command '${commandName}' not found`);
        logger.info('\nAvailable commands:');
        
        const commands = registry.getAll()
          .filter(cmd => !cmd.getMetadata().hidden)
          .sort((a, b) => 
            a.getMetadata().name.localeCompare(b.getMetadata().name)
          );
        
        for (const cmd of commands) {
          const metadata = cmd.getMetadata();
          logger.info(`  ${metadata.name.padEnd(20)} ${metadata.description}`);
        }
      }
      return;
    }
    
    // Filter by category
    if (options.category) {
      const commands = registry.getByCategory(options.category);
      if (commands.length === 0) {
        logger.error(`No commands found in category '${options.category}'`);
        logger.info('\nAvailable categories:');
        
        const categories = registry.getCategories();
        for (const cat of categories) {
          logger.info(`  - ${cat}`);
        }
        return;
      }
      
      const formatter = generator['formatter'];
      console.log(formatter.formatCommandList(commands, `${options.category} Commands`));
    }
  }
  
  /**
   * Search for commands
   */
  private async searchCommands(
    generator: HelpGenerator,
    query: string,
    logger: Logger
  ): Promise<void> {
    const results = await generator.searchHelp(query);
    
    if (results.length === 0) {
      logger.warn(`No commands found matching '${query}'`);
      return;
    }
    
    logger.section(`Search Results (${results.length} found)`);
    
    for (const cmd of results) {
      const metadata = cmd.getMetadata();
      logger.info(`  ${metadata.name.padEnd(20)} ${metadata.description}`);
      
      // Show matched context
      const matches: string[] = [];
      
      if (metadata.name.toLowerCase().includes(query.toLowerCase())) {
        matches.push('name');
      }
      if (metadata.aliases?.some(a => a.toLowerCase().includes(query.toLowerCase()))) {
        matches.push('alias');
      }
      if (metadata.description?.toLowerCase().includes(query.toLowerCase())) {
        matches.push('description');
      }
      if (metadata.examples?.some(e => 
        e.command.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase())
      )) {
        matches.push('examples');
      }
      
      if (matches.length > 0) {
        logger.debug(`    Matched in: ${matches.join(', ')}`);
      }
    }
  }
  
  /**
   * Generate documentation files
   */
  private async generateDocumentation(
    generator: HelpGenerator,
    outputDir: string,
    logger: Logger
  ): Promise<void> {
    logger.section('Generating Documentation');
    logger.info(`Output directory: ${outputDir}`);
    
    try {
      await generator.generateDocumentation(outputDir);
      
      logger.success('Documentation generated successfully!');
      logger.info('\nGenerated files:');
      logger.info('  - README.md (main documentation)');
      logger.info('  - commands/ (individual command docs)');
      logger.info('  - commands.json (command schema)');
    } catch (error) {
      logger.error('Failed to generate documentation');
      throw error;
    }
  }
}

// Static command definition for backward compatibility
export const HelpCommandDef = {
  command: 'help [command]',
  description: 'Get help for commands',
  category: 'Core',
  aliases: ['h', '?'],
  builder: (cmd: Command) => {
    const command = new HelpCommand();
    command.configureOptions(cmd);
  },
  action: async (commandName: string | undefined, options: any, cmd: Command) => {
    const command = new HelpCommand();
    const context: CommandContext = {
      logger: new Logger(),
      globalOptions: { ...options, ...cmd.parent?.opts() },
      registry: (global as any).__commandRegistry,
    };
    
    await command.execute(context, commandName);
  },
};