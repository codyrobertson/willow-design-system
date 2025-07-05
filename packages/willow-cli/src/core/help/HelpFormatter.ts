/**
 * Help text formatter for CLI commands
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { ICommand, ICommandMetadata, ICommandExample } from '../commands/CommandInterface.js';
import { stripAnsi } from './utils.js';

export interface HelpFormatterOptions {
  maxWidth?: number;
  indentSize?: number;
  showExamples?: boolean;
  showAliases?: boolean;
  showCategories?: boolean;
  colorize?: boolean;
}

export interface FormattedSection {
  title: string;
  content: string;
  raw?: string; // Version without ANSI codes
}

export class HelpFormatter {
  private options: Required<HelpFormatterOptions>;

  constructor(options: HelpFormatterOptions = {}) {
    this.options = {
      maxWidth: options.maxWidth ?? 80,
      indentSize: options.indentSize ?? 2,
      showExamples: options.showExamples ?? true,
      showAliases: options.showAliases ?? true,
      showCategories: options.showCategories ?? true,
      colorize: options.colorize ?? true,
    };
  }

  /**
   * Format complete help text for a command
   */
  formatHelp(command: Command, metadata?: ICommandMetadata): string {
    const sections: FormattedSection[] = [];

    // Header
    sections.push(this.formatHeader(command, metadata));

    // Usage
    sections.push(this.formatUsage(command));

    // Description
    if (command.description()) {
      sections.push(this.formatDescription(command.description()));
    }

    // Arguments
    const args = this.formatArguments(command);
    if (args) sections.push(args);

    // Options
    const options = this.formatOptions(command);
    if (options) sections.push(options);

    // Commands (for parent commands)
    const commands = this.formatCommands(command);
    if (commands) sections.push(commands);

    // Examples
    if (metadata?.examples && this.options.showExamples) {
      sections.push(this.formatExamples(metadata.examples));
    }

    // Aliases
    if (metadata?.aliases && this.options.showAliases && metadata.aliases.length > 0) {
      sections.push(this.formatAliases(metadata.aliases));
    }

    // Additional info
    const additionalInfo = this.formatAdditionalInfo(metadata);
    if (additionalInfo) sections.push(additionalInfo);

    return sections.map(s => s.content).join('\n\n');
  }

  /**
   * Format command header
   */
  private formatHeader(command: Command, metadata?: ICommandMetadata): FormattedSection {
    const name = command.name();
    const version = command.version();
    const category = metadata?.category;

    let header = this.colorize(name.toUpperCase(), 'cyan', true);
    
    if (version) {
      header += this.colorize(` v${version}`, 'gray');
    }

    if (category && this.options.showCategories) {
      header += this.colorize(` [${category}]`, 'yellow');
    }

    return {
      title: 'Header',
      content: header,
      raw: stripAnsi(header),
    };
  }

  /**
   * Format usage section
   */
  private formatUsage(command: Command): FormattedSection {
    const usage = command.usage() || this.buildUsage(command);
    
    return {
      title: 'Usage',
      content: this.colorize('Usage:', 'yellow', true) + '\n' + 
               this.indent('$ ' + this.colorize(usage, 'green')),
      raw: 'Usage:\n' + this.indent('$ ' + usage),
    };
  }

  /**
   * Build usage string from command
   */
  private buildUsage(command: Command): string {
    const commandPath = this.getCommandPath(command);
    const args = command.args.map(arg => {
      if (arg.required) return `<${arg.name}>`;
      return `[${arg.name}]`;
    }).join(' ');
    
    const optionsHint = command.options.length > 0 ? ' [options]' : '';
    const commandsHint = command.commands.length > 0 ? ' [command]' : '';
    
    return `${commandPath}${args ? ' ' + args : ''}${optionsHint}${commandsHint}`;
  }

  /**
   * Get full command path
   */
  private getCommandPath(command: Command): string {
    const parts: string[] = [];
    let current: Command | null = command;
    
    while (current) {
      if (current.name()) {
        parts.unshift(current.name());
      }
      current = current.parent || null;
    }
    
    return parts.join(' ');
  }

  /**
   * Format description section
   */
  private formatDescription(description: string): FormattedSection {
    const wrapped = this.wrapText(description, this.options.maxWidth);
    
    return {
      title: 'Description',
      content: this.colorize('Description:', 'yellow', true) + '\n' +
               this.indent(wrapped),
      raw: 'Description:\n' + this.indent(wrapped),
    };
  }

  /**
   * Format arguments section
   */
  private formatArguments(command: Command): FormattedSection | null {
    if (command.args.length === 0) return null;

    const lines: string[] = [];
    const maxArgLength = Math.max(...command.args.map(a => a.name.length));

    command.args.forEach(arg => {
      const name = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
      const paddedName = name.padEnd(maxArgLength + 4);
      const description = arg.description || '';
      
      lines.push(
        this.indent(
          this.colorize(paddedName, 'green') +
          '  ' +
          this.wrapText(description, this.options.maxWidth - maxArgLength - 6, maxArgLength + 6)
        )
      );
    });

    return {
      title: 'Arguments',
      content: this.colorize('Arguments:', 'yellow', true) + '\n' + lines.join('\n'),
      raw: 'Arguments:\n' + lines.map(l => stripAnsi(l)).join('\n'),
    };
  }

  /**
   * Format options section
   */
  private formatOptions(command: Command): FormattedSection | null {
    const visibleOptions = command.options.filter(o => !o.hidden);
    if (visibleOptions.length === 0) return null;

    const lines: string[] = [];
    const maxFlagsLength = Math.max(...visibleOptions.map(o => o.flags.length));

    visibleOptions.forEach(option => {
      const paddedFlags = option.flags.padEnd(maxFlagsLength + 2);
      const description = option.description || '';
      const defaultValue = option.defaultValue !== undefined ? 
        ` ${this.colorize(`(default: ${JSON.stringify(option.defaultValue)})`, 'gray')}` : '';
      
      lines.push(
        this.indent(
          this.colorize(paddedFlags, 'green') +
          '  ' +
          this.wrapText(
            description + defaultValue,
            this.options.maxWidth - maxFlagsLength - 4,
            maxFlagsLength + 4
          )
        )
      );
    });

    return {
      title: 'Options',
      content: this.colorize('Options:', 'yellow', true) + '\n' + lines.join('\n'),
      raw: 'Options:\n' + lines.map(l => stripAnsi(l)).join('\n'),
    };
  }

  /**
   * Format subcommands section
   */
  private formatCommands(command: Command): FormattedSection | null {
    const visibleCommands = command.commands.filter(cmd => !cmd.hidden);
    if (visibleCommands.length === 0) return null;

    // Group commands by category if available
    const groups = new Map<string, Command[]>();
    const uncategorized: Command[] = [];

    visibleCommands.forEach(cmd => {
      const category = (cmd as any).category || 'Commands';
      if (category === 'Commands') {
        uncategorized.push(cmd);
      } else {
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category)!.push(cmd);
      }
    });

    const lines: string[] = [];
    
    // Format categorized commands
    if (this.options.showCategories) {
      groups.forEach((cmds, category) => {
        lines.push(this.colorize(`${category}:`, 'cyan', true));
        lines.push(...this.formatCommandList(cmds));
        lines.push(''); // Empty line between categories
      });
    }

    // Format uncategorized commands
    if (uncategorized.length > 0) {
      if (groups.size > 0 && this.options.showCategories) {
        lines.push(this.colorize('Other Commands:', 'cyan', true));
      }
      lines.push(...this.formatCommandList(uncategorized));
    }

    return {
      title: 'Commands',
      content: this.colorize('Commands:', 'yellow', true) + '\n' + lines.join('\n').trim(),
      raw: 'Commands:\n' + lines.map(l => stripAnsi(l)).join('\n').trim(),
    };
  }

  /**
   * Format a list of commands
   */
  private formatCommandList(commands: Command[]): string[] {
    const maxNameLength = Math.max(...commands.map(c => c.name().length));
    
    return commands.map(cmd => {
      const paddedName = cmd.name().padEnd(maxNameLength + 2);
      const description = cmd.description() || '';
      const aliases = cmd.aliases().length > 0 ? 
        ` ${this.colorize(`(alias: ${cmd.aliases().join(', ')})`, 'gray')}` : '';
      
      return this.indent(
        this.colorize(paddedName, 'green') +
        '  ' +
        this.wrapText(
          description + aliases,
          this.options.maxWidth - maxNameLength - 4,
          maxNameLength + 4
        )
      );
    });
  }

  /**
   * Format examples section
   */
  private formatExamples(examples: ICommandExample[]): FormattedSection {
    const lines: string[] = [];

    examples.forEach((example, index) => {
      if (index > 0) lines.push(''); // Empty line between examples
      lines.push(this.indent(this.colorize(example.description, 'gray')));
      lines.push(this.indent('$ ' + this.colorize(example.command, 'green')));
    });

    return {
      title: 'Examples',
      content: this.colorize('Examples:', 'yellow', true) + '\n' + lines.join('\n'),
      raw: 'Examples:\n' + lines.map(l => stripAnsi(l)).join('\n'),
    };
  }

  /**
   * Format aliases section
   */
  private formatAliases(aliases: string[]): FormattedSection {
    const content = this.indent(aliases.join(', '));
    
    return {
      title: 'Aliases',
      content: this.colorize('Aliases:', 'yellow', true) + '\n' + 
               this.colorize(content, 'green'),
      raw: 'Aliases:\n' + content,
    };
  }

  /**
   * Format additional info section
   */
  private formatAdditionalInfo(metadata?: ICommandMetadata): FormattedSection | null {
    if (!metadata) return null;

    const info: string[] = [];

    if (metadata.deprecated) {
      info.push(this.colorize('⚠️  This command is deprecated', 'red', true));
    }

    if (metadata.experimental) {
      info.push(this.colorize('🧪 This command is experimental', 'yellow', true));
    }

    if (info.length === 0) return null;

    return {
      title: 'Additional Info',
      content: info.join('\n'),
      raw: info.map(i => stripAnsi(i)).join('\n'),
    };
  }

  /**
   * Wrap text to specified width
   */
  private wrapText(text: string, maxWidth: number, indent: number = 0): string {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);

    return lines
      .map((line, index) => index > 0 ? ' '.repeat(indent) + line : line)
      .join('\n');
  }

  /**
   * Indent text
   */
  private indent(text: string, level: number = 1): string {
    const indent = ' '.repeat(this.options.indentSize * level);
    return text.split('\n').map(line => indent + line).join('\n');
  }

  /**
   * Apply color if enabled
   */
  private colorize(text: string, color: string, bold: boolean = false): string {
    if (!this.options.colorize) return text;

    let colored = (chalk as any)[color](text);
    if (bold) colored = chalk.bold(colored);
    
    return colored;
  }
}