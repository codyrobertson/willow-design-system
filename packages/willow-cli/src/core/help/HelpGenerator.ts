/**
 * Help Generator
 * 
 * Generates help documentation in various formats (CLI, Markdown, JSON)
 */

import { ICommand } from '../commands/CommandInterface.js';
import { CommandRegistry } from '../commands/CommandRegistry.js';
import { HelpFormatter, type HelpFormatterOptions } from './HelpFormatter.js';
import { MarkdownFormatter } from './MarkdownFormatter.js';
import { InteractiveHelp } from './InteractiveHelp.js';

export type HelpFormat = 'cli' | 'markdown' | 'json' | 'interactive';

export interface HelpGeneratorOptions {
  /**
   * Default format for help output
   */
  defaultFormat?: HelpFormat;
  
  /**
   * Options for the help formatter
   */
  formatterOptions?: HelpFormatterOptions;
  
  /**
   * Whether to include hidden commands
   */
  includeHidden?: boolean;
  
  /**
   * Custom help templates
   */
  templates?: {
    [key: string]: string;
  };
}

export interface HelpOutput {
  format: HelpFormat;
  content: string;
  metadata?: any;
}

export class HelpGenerator {
  private registry: CommandRegistry;
  private formatter: HelpFormatter;
  private markdownFormatter: MarkdownFormatter;
  private interactiveHelp: InteractiveHelp;
  private options: Required<HelpGeneratorOptions>;
  
  constructor(registry: CommandRegistry, options: HelpGeneratorOptions = {}) {
    this.registry = registry;
    this.options = {
      defaultFormat: options.defaultFormat ?? 'cli',
      formatterOptions: options.formatterOptions ?? {},
      includeHidden: options.includeHidden ?? false,
      templates: options.templates ?? {},
    };
    
    this.formatter = new HelpFormatter(this.options.formatterOptions);
    this.markdownFormatter = new MarkdownFormatter();
    this.interactiveHelp = new InteractiveHelp(registry);
  }
  
  /**
   * Generate help for a specific command
   */
  async generateCommandHelp(
    commandName: string, 
    format: HelpFormat = this.options.defaultFormat
  ): Promise<HelpOutput> {
    const command = this.registry.get(commandName);
    
    if (!command) {
      throw new Error(`Command '${commandName}' not found`);
    }
    
    switch (format) {
      case 'cli':
        return this.generateCLIHelp(command);
      case 'markdown':
        return this.generateMarkdownHelp(command);
      case 'json':
        return this.generateJSONHelp(command);
      case 'interactive':
        return this.generateInteractiveHelp(command);
      default:
        throw new Error(`Unknown help format: ${format}`);
    }
  }
  
  /**
   * Generate help for all commands
   */
  async generateAllCommandsHelp(
    format: HelpFormat = this.options.defaultFormat
  ): Promise<HelpOutput> {
    const commands = this.registry.getAll();
    const visibleCommands = this.options.includeHidden 
      ? commands 
      : commands.filter(cmd => !cmd.getMetadata().hidden);
    
    switch (format) {
      case 'cli':
        return {
          format: 'cli',
          content: this.formatter.formatCommandList(visibleCommands),
        };
      case 'markdown':
        return {
          format: 'markdown',
          content: this.markdownFormatter.formatCommandList(visibleCommands),
        };
      case 'json':
        return {
          format: 'json',
          content: JSON.stringify(
            visibleCommands.map(cmd => cmd.getMetadata()),
            null,
            2
          ),
        };
      case 'interactive':
        await this.interactiveHelp.start();
        return {
          format: 'interactive',
          content: 'Interactive help session completed',
        };
      default:
        throw new Error(`Unknown help format: ${format}`);
    }
  }
  
  /**
   * Generate CLI-formatted help
   */
  private generateCLIHelp(command: ICommand): HelpOutput {
    return {
      format: 'cli',
      content: this.formatter.formatCommand(command),
    };
  }
  
  /**
   * Generate Markdown-formatted help
   */
  private generateMarkdownHelp(command: ICommand): HelpOutput {
    return {
      format: 'markdown',
      content: this.markdownFormatter.formatCommand(command),
    };
  }
  
  /**
   * Generate JSON-formatted help
   */
  private generateJSONHelp(command: ICommand): HelpOutput {
    const metadata = command.getMetadata();
    
    // Extract options by creating a temporary commander command
    const { Command } = require('commander');
    const tempCmd = new Command();
    command.configureOptions(tempCmd);
    
    const options = tempCmd.options.map(opt => ({
      flags: opt.flags,
      description: opt.description,
      defaultValue: opt.defaultValue,
      required: opt.required,
    }));
    
    const helpData = {
      ...metadata,
      options,
    };
    
    return {
      format: 'json',
      content: JSON.stringify(helpData, null, 2),
      metadata: helpData,
    };
  }
  
  /**
   * Generate interactive help
   */
  private async generateInteractiveHelp(command: ICommand): Promise<HelpOutput> {
    await this.interactiveHelp.showCommand(command);
    
    return {
      format: 'interactive',
      content: 'Interactive help session completed',
    };
  }
  
  /**
   * Generate help documentation files
   */
  async generateDocumentation(outputDir: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate README.md with all commands
    const readmeContent = this.markdownFormatter.formatFullDocumentation(
      this.registry.getAll()
    );
    await fs.writeFile(
      path.join(outputDir, 'README.md'),
      readmeContent,
      'utf-8'
    );
    
    // Generate individual command documentation
    const commandsDir = path.join(outputDir, 'commands');
    await fs.mkdir(commandsDir, { recursive: true });
    
    for (const command of this.registry.getAll()) {
      const metadata = command.getMetadata();
      const content = this.markdownFormatter.formatCommand(command);
      const filename = `${metadata.name}.md`;
      
      await fs.writeFile(
        path.join(commandsDir, filename),
        content,
        'utf-8'
      );
    }
    
    // Generate JSON schema
    const schema = {
      commands: this.registry.getAll().map(cmd => {
        const metadata = cmd.getMetadata();
        const { Command } = require('commander');
        const tempCmd = new Command();
        command.configureOptions(tempCmd);
        
        return {
          ...metadata,
          options: tempCmd.options.map(opt => ({
            flags: opt.flags,
            description: opt.description,
            defaultValue: opt.defaultValue,
            required: opt.required,
          })),
        };
      }),
    };
    
    await fs.writeFile(
      path.join(outputDir, 'commands.json'),
      JSON.stringify(schema, null, 2),
      'utf-8'
    );
  }
  
  /**
   * Search help content
   */
  async searchHelp(query: string): Promise<ICommand[]> {
    const results: ICommand[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const command of this.registry.getAll()) {
      const metadata = command.getMetadata();
      
      // Search in command name
      if (metadata.name.toLowerCase().includes(lowerQuery)) {
        results.push(command);
        continue;
      }
      
      // Search in aliases
      if (metadata.aliases?.some(alias => 
        alias.toLowerCase().includes(lowerQuery)
      )) {
        results.push(command);
        continue;
      }
      
      // Search in description
      if (metadata.description?.toLowerCase().includes(lowerQuery)) {
        results.push(command);
        continue;
      }
      
      // Search in examples
      if (metadata.examples?.some(example => 
        example.command.toLowerCase().includes(lowerQuery) ||
        example.description.toLowerCase().includes(lowerQuery)
      )) {
        results.push(command);
      }
    }
    
    return results;
  }
  
  /**
   * Get context-sensitive help suggestions
   */
  getSuggestions(context: string): string[] {
    const suggestions: string[] = [];
    
    // Parse context to understand what user might need
    const words = context.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    // Suggest commands that start with the typed prefix
    if (words.length === 1) {
      for (const command of this.registry.getAll()) {
        const metadata = command.getMetadata();
        if (metadata.name.startsWith(lastWord)) {
          suggestions.push(metadata.name);
        }
      }
    }
    
    // Suggest options for a command
    if (words.length >= 2 && lastWord.startsWith('-')) {
      const commandName = words[0];
      const command = this.registry.get(commandName);
      
      if (command) {
        const { Command } = require('commander');
        const tempCmd = new Command();
        command.configureOptions(tempCmd);
        
        for (const option of tempCmd.options) {
          if (option.flags.includes(lastWord)) {
            suggestions.push(option.flags);
          }
        }
      }
    }
    
    return suggestions;
  }
}