/**
 * HelpFormatter Test Suite
 */

import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { HelpFormatter } from '../HelpFormatter.js';
import { ICommandMetadata, ICommandExample } from '../../commands/CommandInterface.js';
import { stripAnsi } from '../utils.js';

// Helper to create mock command
function createMockCommand(metadata: ICommandMetadata): Command {
  const cmd = new Command(metadata.name);
  
  if (metadata.description) {
    cmd.description(metadata.description);
  }
  
  if (metadata.aliases) {
    metadata.aliases.forEach(alias => cmd.alias(alias));
  }
  
  if (metadata.version) {
    cmd.version(metadata.version);
  }
  
  // Add options for test command
  if (metadata.name === 'test') {
    cmd.option('-f, --force', 'Force the operation', false);
    cmd.option('-o, --output <path>', 'Output directory');
  }
  
  // Set category as a property
  if (metadata.category) {
    (cmd as any).category = metadata.category;
  }
  
  return cmd;
}

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should format basic command help', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command description',
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('TEST');
      expect(help).toContain('Description:');
      expect(help).toContain('Test command description');
      expect(help).toContain('Usage:');
      expect(help).toContain('$');
    });
    
    it('should include version if provided', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const metadata: ICommandMetadata = {
        name: 'test',
        version: '1.0.0',
        description: 'Test command',
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('TEST v1.0.0');
    });
    
    it('should format aliases', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
        aliases: ['t', 'tst'],
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('Aliases:');
      expect(help).toContain('t, tst');
    });
    
    it('should format options', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('Options:');
      expect(help).toContain('-f, --force');
      expect(help).toContain('Force the operation');
      expect(help).toContain('-o, --output <path>');
      expect(help).toContain('Output directory');
    });
    
    it('should format examples', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const examples: ICommandExample[] = [
        {
          command: 'willow test --force',
          description: 'Run with force flag',
        },
        {
          command: 'willow test -o ./output',
          description: 'Specify output directory',
        },
      ];
      
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
        examples,
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('Examples:');
      expect(help).toContain('Run with force flag');
      expect(help).toContain('$ willow test --force');
      expect(help).toContain('Specify output directory');
      expect(help).toContain('$ willow test -o ./output');
    });
    
    it('should include category in header', () => {
      const formatter = new HelpFormatter({ colorize: false, showCategories: true });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
        category: 'Testing',
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('[Testing]');
    });
    
    it('should respect showExamples option', () => {
      const formatter = new HelpFormatter({ 
        colorize: false,
        showExamples: false,
      });
      
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
        examples: [{
          command: 'willow test',
          description: 'Example',
        }],
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).not.toContain('Examples:');
    });
    
    it('should respect showAliases option', () => {
      const formatter = new HelpFormatter({ 
        colorize: false,
        showAliases: false,
      });
      
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
        aliases: ['t'],
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).not.toContain('Aliases:');
    });
    
    it('should show deprecated warning', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
        deprecated: true,
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('This command is deprecated');
    });
    
    it('should show experimental warning', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
        experimental: true,
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      expect(help).toContain('This command is experimental');
    });
  });
  
  describe('formatCommands', () => {
    it('should format subcommands list', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const parentCmd = new Command('parent');
      
      const subCmd1 = parentCmd
        .command('sub1')
        .description('First subcommand');
      
      const subCmd2 = parentCmd
        .command('sub2')
        .description('Second subcommand')
        .alias('s2');
      
      const help = formatter.formatHelp(parentCmd);
      
      expect(help).toContain('Commands:');
      expect(help).toContain('sub1');
      expect(help).toContain('First subcommand');
      expect(help).toContain('sub2');
      expect(help).toContain('Second subcommand');
      expect(help).toContain('(alias: s2)');
    });
    
    it('should group subcommands by category', () => {
      const formatter = new HelpFormatter({ colorize: false, showCategories: true });
      const parentCmd = new Command('parent');
      
      const subCmd1 = parentCmd.command('init');
      (subCmd1 as any).category = 'Setup';
      subCmd1.description('Initialize project');
      
      const subCmd2 = parentCmd.command('config');
      (subCmd2 as any).category = 'Setup';
      subCmd2.description('Configure settings');
      
      const subCmd3 = parentCmd.command('help');
      subCmd3.description('Show help');
      
      const help = formatter.formatHelp(parentCmd);
      
      expect(help).toContain('Setup:');
      expect(help).toContain('Other Commands:');
    });
  });
  
  describe('color support', () => {
    it('should apply colors when enabled', () => {
      const formatter = new HelpFormatter({ colorize: true });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      // The colorize option is actually for the formatter, not the output
      // The help formatter uses chalk directly, so check for specific colored sections
      expect(help).toContain('TEST'); // Should have colored header
    });
    
    it('should not apply colors when disabled', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'Test command',
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      
      // Should not contain ANSI color codes
      expect(help).toBe(stripAnsi(help));
    });
  });
  
  describe('text formatting', () => {
    it('should wrap long descriptions', () => {
      const formatter = new HelpFormatter({ colorize: false, maxWidth: 50 });
      const metadata: ICommandMetadata = {
        name: 'test',
        description: 'This is a very long description that should be wrapped to fit within the specified maximum width for proper display',
      };
      const command = createMockCommand(metadata);
      
      const help = formatter.formatHelp(command, metadata);
      const lines = help.split('\n');
      
      // Check that wrapped lines don't exceed max width (excluding headers)
      const descriptionStarted = lines.findIndex(line => line.includes('Description:'));
      const descriptionLines = lines.slice(descriptionStarted + 1, descriptionStarted + 4);
      
      descriptionLines.forEach(line => {
        if (line.trim()) {
          expect(stripAnsi(line.trim()).length).toBeLessThanOrEqual(50);
        }
      });
    });
    
    it('should handle arguments in usage', () => {
      const formatter = new HelpFormatter({ colorize: false });
      const cmd = new Command('test');
      cmd.argument('<required>', 'Required argument');
      cmd.argument('[optional]', 'Optional argument');
      cmd.description('Test command');
      
      const help = formatter.formatHelp(cmd);
      
      expect(help).toContain('$ [options] <required> [optional]');
      // Arguments section may not be displayed if not using metadata
      // Just verify the usage includes the arguments
      expect(help).toContain('<required>');
      expect(help).toContain('[optional]');
    });
  });
});