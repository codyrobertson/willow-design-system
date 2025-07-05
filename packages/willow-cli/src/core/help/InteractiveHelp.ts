/**
 * Interactive Help System
 * 
 * Provides an interactive help experience with search and navigation
 */

import { ICommand } from '../commands/CommandInterface.js';
import { CommandRegistry } from '../commands/CommandRegistry.js';
import { HelpFormatter } from './HelpFormatter.js';
import { InteractivePrompts } from '../../ui/InteractivePrompts.js';
import { Logger } from '../../ui/Logger.js';
import chalk from 'chalk';

export interface InteractiveHelpOptions {
  /**
   * Whether to show search hints
   */
  showSearchHints?: boolean;
  
  /**
   * Maximum search results to display
   */
  maxSearchResults?: number;
  
  /**
   * Whether to enable command history
   */
  enableHistory?: boolean;
}

export class InteractiveHelp {
  private registry: CommandRegistry;
  private formatter: HelpFormatter;
  private prompts: InteractivePrompts;
  private logger: Logger;
  private options: Required<InteractiveHelpOptions>;
  private history: string[] = [];
  
  constructor(
    registry: CommandRegistry, 
    options: InteractiveHelpOptions = {}
  ) {
    this.registry = registry;
    this.formatter = new HelpFormatter();
    this.prompts = new InteractivePrompts();
    this.logger = new Logger();
    this.options = {
      showSearchHints: options.showSearchHints ?? true,
      maxSearchResults: options.maxSearchResults ?? 10,
      enableHistory: options.enableHistory ?? true,
    };
  }
  
  /**
   * Start interactive help session
   */
  async start(): Promise<void> {
    this.logger.section('Interactive Help');
    this.logger.info('Welcome to Willow CLI interactive help!');
    this.logger.info('Type a command name to see its help, or use the search feature.\n');
    
    if (this.options.showSearchHints) {
      this.showHints();
    }
    
    let running = true;
    
    while (running) {
      const action = await this.promptAction();
      
      switch (action.type) {
        case 'command':
          await this.showCommand(action.value);
          break;
        case 'search':
          await this.searchCommands(action.value);
          break;
        case 'list':
          await this.listCommands(action.value);
          break;
        case 'back':
          await this.goBack();
          break;
        case 'exit':
          running = false;
          break;
      }
    }
    
    this.logger.info('\nThank you for using Willow CLI help!');
  }
  
  /**
   * Show help for a specific command
   */
  async showCommand(command: ICommand | string): Promise<void> {
    const cmd = typeof command === 'string' 
      ? this.registry.get(command)
      : command;
    
    if (!cmd) {
      this.logger.error(`Command '${command}' not found`);
      return;
    }
    
    const metadata = cmd.getMetadata();
    
    if (this.options.enableHistory) {
      this.history.push(metadata.name);
    }
    
    console.clear();
    console.log(this.formatter.formatCommand(cmd));
    console.log();
    
    // Show related commands
    if (metadata.seeAlso && metadata.seeAlso.length > 0) {
      this.logger.section('Related Commands');
      for (const related of metadata.seeAlso) {
        const relatedCmd = this.registry.get(related);
        if (relatedCmd) {
          const relatedMeta = relatedCmd.getMetadata();
          console.log(`  ${chalk.green(related.padEnd(20))} ${relatedMeta.description}`);
        }
      }
      console.log();
    }
    
    // Show navigation options
    const choices = [
      { value: 'back', label: 'Back to menu' },
      { value: 'exit', label: 'Exit help' },
    ];
    
    if (metadata.seeAlso && metadata.seeAlso.length > 0) {
      choices.unshift(
        { value: 'related', label: 'View related command' }
      );
    }
    
    const next = await this.prompts.select({
      message: 'What would you like to do?',
      choices,
    });
    
    if (next === 'related' && metadata.seeAlso) {
      const related = await this.prompts.select({
        message: 'Select a related command:',
        choices: metadata.seeAlso.map(cmd => ({
          value: cmd,
          label: cmd,
        })),
      });
      
      await this.showCommand(related);
    } else if (next === 'exit') {
      process.exit(0);
    }
  }
  
  /**
   * Search for commands
   */
  private async searchCommands(query: string): Promise<void> {
    const results = await this.search(query);
    
    if (results.length === 0) {
      this.logger.warn(`No commands found matching '${query}'`);
      return;
    }
    
    this.logger.section(`Search Results (${results.length} found)`);
    
    const limited = results.slice(0, this.options.maxSearchResults);
    
    for (const cmd of limited) {
      const metadata = cmd.getMetadata();
      console.log(`  ${chalk.green(metadata.name.padEnd(20))} ${metadata.description}`);
    }
    
    if (results.length > this.options.maxSearchResults) {
      console.log(chalk.gray(`\n  ... and ${results.length - this.options.maxSearchResults} more results`));
    }
    
    console.log();
    
    if (results.length === 1) {
      await this.showCommand(results[0]);
    } else {
      const selected = await this.prompts.select({
        message: 'Select a command to view:',
        choices: limited.map(cmd => ({
          value: cmd.getMetadata().name,
          label: cmd.getMetadata().name,
        })),
      });
      
      await this.showCommand(selected);
    }
  }
  
  /**
   * List all commands
   */
  private async listCommands(category?: string): Promise<void> {
    const commands = category 
      ? this.registry.getByCategory(category)
      : this.registry.getAll();
    
    console.clear();
    console.log(this.formatter.formatCommandList(commands));
    console.log();
    
    const selected = await this.prompts.select({
      message: 'Select a command to view:',
      choices: [
        ...commands.map(cmd => ({
          value: cmd.getMetadata().name,
          label: cmd.getMetadata().name,
        })),
        { value: 'back', label: 'Back to menu' },
      ],
    });
    
    if (selected !== 'back') {
      await this.showCommand(selected);
    }
  }
  
  /**
   * Go back in history
   */
  private async goBack(): Promise<void> {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current
      const previous = this.history.pop(); // Get previous
      if (previous) {
        await this.showCommand(previous);
      }
    }
  }
  
  /**
   * Prompt for action
   */
  private async promptAction(): Promise<{ type: string; value?: string }> {
    const choices = [
      { value: 'search', label: 'Search commands' },
      { value: 'list', label: 'List all commands' },
      { value: 'category', label: 'Browse by category' },
    ];
    
    if (this.history.length > 0) {
      choices.push({ value: 'back', label: 'Go back' });
    }
    
    choices.push({ value: 'exit', label: 'Exit help' });
    
    const action = await this.prompts.select({
      message: 'How can I help you?',
      choices,
    });
    
    switch (action) {
      case 'search': {
        const query = await this.prompts.text({
          message: 'Enter search term:',
          placeholder: 'e.g., import, generate, config',
        });
        return { type: 'search', value: query };
      }
      
      case 'list':
        return { type: 'list' };
      
      case 'category': {
        const categories = this.registry.getCategories();
        const category = await this.prompts.select({
          message: 'Select a category:',
          choices: categories.map(cat => ({
            value: cat,
            label: cat,
          })),
        });
        return { type: 'list', value: category };
      }
      
      case 'back':
        return { type: 'back' };
      
      case 'exit':
        return { type: 'exit' };
      
      default:
        return { type: 'command', value: action };
    }
  }
  
  /**
   * Show hints
   */
  private showHints(): void {
    console.log(chalk.gray('Tips:'));
    console.log(chalk.gray('  • Use search to find commands by keyword'));
    console.log(chalk.gray('  • Browse commands by category for better organization'));
    console.log(chalk.gray('  • Press Ctrl+C at any time to exit'));
    console.log();
  }
  
  /**
   * Search for commands
   */
  private async search(query: string): Promise<ICommand[]> {
    const results: ICommand[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const command of this.registry.getAll()) {
      const metadata = command.getMetadata();
      let score = 0;
      
      // Exact name match
      if (metadata.name.toLowerCase() === lowerQuery) {
        score += 100;
      }
      // Name contains query
      else if (metadata.name.toLowerCase().includes(lowerQuery)) {
        score += 50;
      }
      
      // Alias match
      if (metadata.aliases?.some(alias => 
        alias.toLowerCase() === lowerQuery
      )) {
        score += 90;
      } else if (metadata.aliases?.some(alias => 
        alias.toLowerCase().includes(lowerQuery)
      )) {
        score += 40;
      }
      
      // Description contains query
      if (metadata.description?.toLowerCase().includes(lowerQuery)) {
        score += 20;
      }
      
      // Category match
      if (metadata.category?.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }
      
      // Example contains query
      if (metadata.examples?.some(ex => 
        ex.command.toLowerCase().includes(lowerQuery) ||
        ex.description.toLowerCase().includes(lowerQuery)
      )) {
        score += 5;
      }
      
      if (score > 0) {
        results.push({ command, score } as any);
      }
    }
    
    // Sort by score
    return results
      .sort((a: any, b: any) => b.score - a.score)
      .map((r: any) => r.command);
  }
}