/**
 * Markdown Formatter
 * 
 * Formats help documentation as Markdown
 */

import { ICommand, ICommandMetadata, ICommandExample } from '../commands/CommandInterface.js';

export class MarkdownFormatter {
  /**
   * Format a single command as Markdown
   */
  formatCommand(command: ICommand): string {
    const metadata = command.getMetadata();
    const sections: string[] = [];
    
    // Title
    sections.push(`# ${metadata.name}`);
    
    // Description
    if (metadata.description) {
      sections.push(metadata.description);
    }
    
    // Version and category badges
    const badges: string[] = [];
    if (metadata.version) {
      badges.push(`![Version](https://img.shields.io/badge/version-${metadata.version}-blue)`);
    }
    if (metadata.category) {
      badges.push(`![Category](https://img.shields.io/badge/category-${metadata.category}-green)`);
    }
    if (metadata.experimental) {
      badges.push(`![Experimental](https://img.shields.io/badge/status-experimental-yellow)`);
    }
    if (metadata.deprecated) {
      badges.push(`![Deprecated](https://img.shields.io/badge/status-deprecated-red)`);
    }
    
    if (badges.length > 0) {
      sections.push(badges.join(' '));
    }
    
    // Usage
    sections.push('## Usage');
    sections.push('```bash');
    sections.push(`willow ${metadata.usage || metadata.name}`);
    sections.push('```');
    
    // Options
    const options = this.extractOptions(command);
    if (options.length > 0) {
      sections.push('## Options');
      sections.push('| Flag | Description | Default |');
      sections.push('|------|-------------|---------|');
      
      for (const option of options) {
        const flags = `\`${option.flags}\``;
        const description = option.description || '';
        const defaultValue = option.defaultValue !== undefined 
          ? `\`${JSON.stringify(option.defaultValue)}\`` 
          : '-';
        
        sections.push(`| ${flags} | ${description} | ${defaultValue} |`);
      }
    }
    
    // Aliases
    if (metadata.aliases && metadata.aliases.length > 0) {
      sections.push('## Aliases');
      sections.push(metadata.aliases.map(alias => `- \`${alias}\``).join('\n'));
    }
    
    // Examples
    if (metadata.examples && metadata.examples.length > 0) {
      sections.push('## Examples');
      
      for (const example of metadata.examples) {
        sections.push(`### ${example.description}`);
        sections.push('```bash');
        sections.push(example.command);
        sections.push('```');
        
        if (example.output) {
          sections.push('Output:');
          sections.push('```');
          sections.push(example.output);
          sections.push('```');
        }
      }
    }
    
    // Notes
    if (metadata.notes) {
      sections.push('## Notes');
      sections.push(metadata.notes);
    }
    
    // See also
    if (metadata.seeAlso && metadata.seeAlso.length > 0) {
      sections.push('## See Also');
      sections.push(metadata.seeAlso.map(cmd => `- [\`${cmd}\`](${cmd}.md)`).join('\n'));
    }
    
    return sections.join('\n\n');
  }
  
  /**
   * Format a list of commands as Markdown
   */
  formatCommandList(commands: ICommand[]): string {
    const sections: string[] = [];
    
    sections.push('# Command Reference');
    
    // Group by category
    const grouped = this.groupByCategory(commands);
    
    // Table of contents
    sections.push('## Table of Contents');
    for (const [category, _] of grouped.entries()) {
      const anchor = category ? category.toLowerCase().replace(/\s+/g, '-') : 'uncategorized';
      sections.push(`- [${category || 'Uncategorized'}](#${anchor})`);
    }
    
    // Command sections
    for (const [category, cmds] of grouped.entries()) {
      const heading = category || 'Uncategorized';
      sections.push(`## ${heading}`);
      
      sections.push('| Command | Description |');
      sections.push('|---------|-------------|');
      
      for (const cmd of cmds) {
        const metadata = cmd.getMetadata();
        const name = `[\`${metadata.name}\`](commands/${metadata.name}.md)`;
        const description = metadata.description || '';
        
        sections.push(`| ${name} | ${description} |`);
      }
    }
    
    return sections.join('\n\n');
  }
  
  /**
   * Format full documentation with all commands
   */
  formatFullDocumentation(commands: ICommand[]): string {
    const sections: string[] = [];
    
    sections.push('# Willow CLI Documentation');
    sections.push('');
    sections.push('> Component management and development toolkit');
    sections.push('');
    
    // Installation
    sections.push('## Installation');
    sections.push('```bash');
    sections.push('npm install -g @willow/cli');
    sections.push('```');
    sections.push('');
    
    // Quick start
    sections.push('## Quick Start');
    sections.push('```bash');
    sections.push('# Initialize a new project');
    sections.push('willow init');
    sections.push('');
    sections.push('# Import a component');
    sections.push('willow import button');
    sections.push('');
    sections.push('# Generate a new component');
    sections.push('willow generate component MyComponent');
    sections.push('```');
    sections.push('');
    
    // Commands reference
    sections.push(this.formatCommandList(commands));
    
    // Global options
    sections.push('## Global Options');
    sections.push('These options are available for all commands:');
    sections.push('');
    sections.push('| Option | Description |');
    sections.push('|--------|-------------|');
    sections.push('| `-v, --verbose` | Enable verbose output |');
    sections.push('| `-q, --quiet` | Suppress non-error output |');
    sections.push('| `--no-color` | Disable colored output |');
    sections.push('| `--json` | Output in JSON format |');
    sections.push('| `--config <path>` | Specify config file location |');
    sections.push('');
    
    // Contributing
    sections.push('## Contributing');
    sections.push('Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) for details.');
    sections.push('');
    
    // License
    sections.push('## License');
    sections.push('MIT © Willow Design System');
    
    return sections.join('\n');
  }
  
  /**
   * Extract options from a command
   */
  private extractOptions(command: ICommand): any[] {
    const { Command } = require('commander');
    const tempCmd = new Command();
    command.configureOptions(tempCmd);
    
    return tempCmd.options.map(opt => ({
      flags: opt.flags,
      description: opt.description,
      defaultValue: opt.defaultValue,
      required: opt.required,
    }));
  }
  
  /**
   * Group commands by category
   */
  private groupByCategory(commands: ICommand[]): Map<string | undefined, ICommand[]> {
    const grouped = new Map<string | undefined, ICommand[]>();
    
    for (const cmd of commands) {
      const metadata = cmd.getMetadata();
      const category = metadata.category;
      
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      
      grouped.get(category)!.push(cmd);
    }
    
    // Sort categories
    const sorted = new Map<string | undefined, ICommand[]>();
    
    if (grouped.has(undefined)) {
      sorted.set(undefined, grouped.get(undefined)!);
    }
    
    const categories = Array.from(grouped.keys())
      .filter(cat => cat !== undefined)
      .sort() as string[];
    
    for (const category of categories) {
      sorted.set(category, grouped.get(category)!);
    }
    
    // Sort commands within each category
    for (const [category, cmds] of sorted.entries()) {
      cmds.sort((a, b) => a.getMetadata().name.localeCompare(b.getMetadata().name));
    }
    
    return sorted;
  }
}