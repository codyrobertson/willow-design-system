/**
 * Parse and analyze command usage patterns
 */

import { Command } from 'commander';
import { ICommand, ICommandMetadata } from '../commands/CommandInterface.js';
import { CommandRegistry } from '../commands/CommandRegistry.js';

export interface UsagePattern {
  command: string;
  arguments: ArgumentPattern[];
  options: OptionPattern[];
  examples: string[];
  description: string;
}

export interface ArgumentPattern {
  name: string;
  required: boolean;
  variadic: boolean;
  description?: string;
  type?: string;
  defaultValue?: any;
}

export interface OptionPattern {
  flags: string;
  short?: string;
  long?: string;
  required: boolean;
  description?: string;
  type?: string;
  defaultValue?: any;
  choices?: string[];
}

export class UsageParser {
  private registry: CommandRegistry;

  constructor(registry: CommandRegistry) {
    this.registry = registry;
  }

  /**
   * Parse usage patterns from a command
   */
  parseCommand(command: Command): UsagePattern {
    const pattern: UsagePattern = {
      command: this.getCommandPath(command),
      arguments: this.parseArguments(command),
      options: this.parseOptions(command),
      examples: this.extractExamples(command),
      description: command.description() || '',
    };

    return pattern;
  }

  /**
   * Parse usage patterns from registered command
   */
  parseRegisteredCommand(commandName: string): UsagePattern | null {
    const commandClass = this.registry.getCommand(commandName);
    if (!commandClass) return null;

    const metadata = commandClass.getMetadata();
    const tempCommand = new Command(metadata.name);
    commandClass.configureOptions(tempCommand);

    const pattern = this.parseCommand(tempCommand);
    
    // Add metadata examples
    if (metadata.examples) {
      pattern.examples.push(...metadata.examples.map(e => e.command));
    }

    return pattern;
  }

  /**
   * Parse all registered commands
   */
  parseAllCommands(): Map<string, UsagePattern> {
    const patterns = new Map<string, UsagePattern>();

    this.registry.getAllCommands().forEach((commandClass, name) => {
      const pattern = this.parseRegisteredCommand(name);
      if (pattern) {
        patterns.set(name, pattern);
      }
    });

    return patterns;
  }

  /**
   * Get command path including parent commands
   */
  private getCommandPath(command: Command): string {
    const parts: string[] = [];
    let current: Command | null = command;

    while (current) {
      if (current.name() && current.name() !== '') {
        parts.unshift(current.name());
      }
      current = current.parent || null;
    }

    return parts.join(' ');
  }

  /**
   * Parse command arguments
   */
  private parseArguments(command: Command): ArgumentPattern[] {
    return command.args.map(arg => ({
      name: arg.name,
      required: arg.required,
      variadic: arg.variadic || false,
      description: arg.description,
      defaultValue: arg.defaultValue,
      type: this.inferArgumentType(arg),
    }));
  }

  /**
   * Parse command options
   */
  private parseOptions(command: Command): OptionPattern[] {
    return command.options.map(option => {
      const flags = option.flags;
      const parts = flags.split(/[\s,]+/);
      const short = parts.find(p => p.startsWith('-') && !p.startsWith('--'));
      const long = parts.find(p => p.startsWith('--'));

      return {
        flags: option.flags,
        short: short?.replace(/^-/, ''),
        long: long?.replace(/^--/, '').replace(/\s+.*/, ''),
        required: option.mandatory || false,
        description: option.description,
        defaultValue: option.defaultValue,
        type: this.inferOptionType(option),
        choices: this.extractChoices(option),
      };
    });
  }

  /**
   * Extract examples from command help text
   */
  private extractExamples(command: Command): string[] {
    const examples: string[] = [];
    
    // Try to extract from help text
    const helpInfo = (command as any)._helpInformation;
    if (helpInfo) {
      const exampleRegex = /\$\s+([^\n]+)/g;
      let match;
      while ((match = exampleRegex.exec(helpInfo)) !== null) {
        examples.push(match[1].trim());
      }
    }

    return examples;
  }

  /**
   * Infer argument type from its configuration
   */
  private inferArgumentType(arg: any): string {
    if (arg.defaultValue !== undefined) {
      return typeof arg.defaultValue;
    }
    
    // Try to infer from name
    if (arg.name.toLowerCase().includes('path') || 
        arg.name.toLowerCase().includes('file') ||
        arg.name.toLowerCase().includes('dir')) {
      return 'path';
    }
    
    if (arg.name.toLowerCase().includes('count') || 
        arg.name.toLowerCase().includes('number')) {
      return 'number';
    }
    
    return 'string';
  }

  /**
   * Infer option type from its configuration
   */
  private inferOptionType(option: any): string {
    const flags = option.flags;
    
    // Boolean flags (no value)
    if (!flags.includes('<') && !flags.includes('[')) {
      return 'boolean';
    }
    
    // Extract value placeholder
    const valueMatch = flags.match(/[<\[]([^>\]]+)[>\]]/);
    if (valueMatch) {
      const valueName = valueMatch[1].toLowerCase();
      
      if (valueName.includes('number') || valueName.includes('count')) {
        return 'number';
      }
      
      if (valueName.includes('path') || valueName.includes('file')) {
        return 'path';
      }
      
      if (valueName.includes('json')) {
        return 'json';
      }
    }
    
    if (option.defaultValue !== undefined) {
      return typeof option.defaultValue;
    }
    
    return 'string';
  }

  /**
   * Extract choices from option configuration
   */
  private extractChoices(option: any): string[] | undefined {
    // Try to extract from description
    const choiceMatch = option.description?.match(/\(choices?:\s*([^)]+)\)/i);
    if (choiceMatch) {
      return choiceMatch[1].split(/[,|]/).map((s: string) => s.trim());
    }
    
    // Check for argChoices property (commander.js feature)
    if (option.argChoices) {
      return option.argChoices;
    }
    
    return undefined;
  }

  /**
   * Generate usage examples based on patterns
   */
  generateExamples(pattern: UsagePattern): string[] {
    const examples: string[] = [];
    const baseCommand = pattern.command;

    // Basic usage
    examples.push(this.generateBasicExample(pattern));

    // With required options
    const requiredOptions = pattern.options.filter(o => o.required);
    if (requiredOptions.length > 0) {
      examples.push(this.generateExampleWithOptions(pattern, requiredOptions));
    }

    // With common options
    const commonOptions = pattern.options.filter(o => 
      ['verbose', 'quiet', 'json', 'dry-run'].includes(o.long || '')
    );
    if (commonOptions.length > 0) {
      examples.push(this.generateExampleWithOptions(pattern, commonOptions));
    }

    // Complex example with multiple options
    if (pattern.options.length > 3) {
      examples.push(this.generateComplexExample(pattern));
    }

    return examples.filter((e, i, arr) => arr.indexOf(e) === i); // Remove duplicates
  }

  /**
   * Generate basic usage example
   */
  private generateBasicExample(pattern: UsagePattern): string {
    let example = pattern.command;

    // Add required arguments
    pattern.arguments.forEach(arg => {
      if (arg.required) {
        example += ` <${arg.name}>`;
      }
    });

    return example;
  }

  /**
   * Generate example with specific options
   */
  private generateExampleWithOptions(
    pattern: UsagePattern, 
    options: OptionPattern[]
  ): string {
    let example = this.generateBasicExample(pattern);

    options.forEach(opt => {
      const flag = opt.short ? `-${opt.short}` : `--${opt.long}`;
      
      if (opt.type === 'boolean') {
        example += ` ${flag}`;
      } else {
        const value = this.getExampleValue(opt);
        example += ` ${flag} ${value}`;
      }
    });

    return example;
  }

  /**
   * Generate complex example
   */
  private generateComplexExample(pattern: UsagePattern): string {
    let example = pattern.command;

    // Add all arguments
    pattern.arguments.forEach(arg => {
      if (arg.required) {
        example += ` <${arg.name}>`;
      } else if (Math.random() > 0.5) { // Randomly include optional args
        example += ` [${arg.name}]`;
      }
    });

    // Add a mix of options
    const selectedOptions = pattern.options
      .filter(() => Math.random() > 0.6)
      .slice(0, 3);

    selectedOptions.forEach(opt => {
      const flag = opt.long ? `--${opt.long}` : `-${opt.short}`;
      
      if (opt.type === 'boolean') {
        example += ` ${flag}`;
      } else {
        const value = this.getExampleValue(opt);
        example += ` ${flag} ${value}`;
      }
    });

    return example;
  }

  /**
   * Get example value for an option
   */
  private getExampleValue(option: OptionPattern): string {
    if (option.choices && option.choices.length > 0) {
      return option.choices[0];
    }

    switch (option.type) {
      case 'number':
        return '10';
      case 'path':
        return './path/to/file';
      case 'json':
        return '\'{"key": "value"}\'';
      default:
        return 'value';
    }
  }
}