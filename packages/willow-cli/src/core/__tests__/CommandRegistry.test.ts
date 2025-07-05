/**
 * CommandRegistry Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { CommandRegistry } from '../commands/CommandRegistry.js';
import { getLogger, getGlobalReporter } from '../../ui/index.js';
import { createMockCommand, MockCommand } from './test-helpers.js';
import { CLIError } from '../../types/cli.js';

// Mock UI modules
vi.mock('../../ui/index.js', () => ({
  getLogger: vi.fn(() => ({
    error: vi.fn(),
  })),
  getGlobalReporter: vi.fn(() => ({
    stop: vi.fn(),
  })),
}));

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
    vi.clearAllMocks();
  });

  describe('Command Registration', () => {
    it('should register a command', () => {
      const command = createMockCommand('test', 'Test command');

      registry.register(command);
      
      expect(registry.has('test')).toBe(true);
      expect(registry.get('test')).toBeDefined();
    });

    it('should register command with aliases', () => {
      const command = createMockCommand('test', 'Test command', {
        aliases: ['t', 'tst']
      });

      registry.register(command);
      
      expect(registry.has('test')).toBe(true);
      expect(registry.get('t')).toBeDefined();
      expect(registry.get('tst')).toBeDefined();
      expect(registry.get('t')).toBe(registry.get('test'));
    });

    it('should register command with options configuration', () => {
      const configureOptionsMock = vi.fn((cmd: Command) => {
        cmd.option('-f, --force', 'Force action');
      });
      
      const command = createMockCommand('config', 'Configure', {
        configureOptions: configureOptionsMock
      });

      registry.register(command);
      
      const handler = registry.get('config');
      expect(handler).toBeDefined();
      
      // Test that configureOptions is called
      const cmd = new Command();
      handler?.configureOptions(cmd);
      expect(configureOptionsMock).toHaveBeenCalledWith(cmd);
    });

    it('should throw error when registering duplicate command without override', () => {
      const command1 = createMockCommand('test', 'First test');
      const command2 = createMockCommand('test', 'Second test');

      registry.register(command1);
      
      expect(() => registry.register(command2)).toThrow('Command \'test\' is already registered');
    });

    it('should overwrite existing command with override option', () => {
      const command1 = createMockCommand('test', 'First test');
      const command2 = createMockCommand('test', 'Second test');

      registry.register(command1);
      registry.register(command2, { override: true });
      
      const handler = registry.get('test');
      expect(handler?.getMetadata().description).toBe('Second test');
    });

    it('should register command with category', () => {
      const command = createMockCommand('test', 'Test command');
      
      registry.register(command, { category: 'Testing' });
      
      const categoryCommands = registry.getByCategory('Testing');
      expect(categoryCommands.some(cmd => cmd.getMetadata().name === 'test')).toBe(true);
    });
  });

  describe('Command Retrieval', () => {
    beforeEach(() => {
      registry.register(createMockCommand('cmd1', 'Command 1'));
      registry.register(createMockCommand('cmd2', 'Command 2'));
    });

    it('should get command by name', () => {
      const cmd1 = registry.get('cmd1');
      expect(cmd1).toBeDefined();
      expect(cmd1?.getMetadata().description).toBe('Command 1');
    });

    it('should return undefined for non-existent command', () => {
      const cmd = registry.get('nonexistent');
      expect(cmd).toBeUndefined();
    });

    it('should check if command exists', () => {
      expect(registry.has('cmd1')).toBe(true);
      expect(registry.has('cmd2')).toBe(true);
      expect(registry.has('cmd3')).toBe(false);
    });

    it('should get all commands', () => {
      const commands = registry.getAll();
      expect(commands).toHaveLength(2);
      expect(commands.some(cmd => cmd.getMetadata().name === 'cmd1')).toBe(true);
      expect(commands.some(cmd => cmd.getMetadata().name === 'cmd2')).toBe(true);
    });

    it('should get all commands as array', () => {
      const commands = registry.getAll();
      expect(commands).toHaveLength(2);
      expect(commands.some(cmd => cmd.getMetadata().name === 'cmd1')).toBe(true);
      expect(commands.some(cmd => cmd.getMetadata().name === 'cmd2')).toBe(true);
    });
  });

  describe('Program Integration', () => {
    it('should apply commands to program', () => {
      const command1 = createMockCommand('test1', 'Test 1', {
        configureOptions: (cmd) => {
          cmd.option('-a, --all', 'All flag');
        }
      });
      
      const command2 = createMockCommand('test2', 'Test 2');

      registry.register(command1);
      registry.register(command2);

      const program = new Command();
      const contextFactory = () => ({
        logger: getLogger(),
        progress: getGlobalReporter(),
        globalOptions: {}
      });
      registry.applyToProgram(program, contextFactory);

      // Check that commands were added
      const commands = program.commands;
      expect(commands).toHaveLength(2);
      expect(commands.some(cmd => cmd.name() === 'test1')).toBe(true);
      expect(commands.some(cmd => cmd.name() === 'test2')).toBe(true);
    });

    it('should wrap action with context', async () => {
      const executeMock = vi.fn().mockResolvedValue({ success: true });
      const command = createMockCommand('test', 'Test command', {
        execute: executeMock
      });

      registry.register(command);

      const program = new Command();
      const contextFactory = () => ({
        logger: getLogger(),
        progress: getGlobalReporter(),
        globalOptions: {}
      });
      registry.applyToProgram(program, contextFactory);

      // Get the command and simulate execution
      const testCmd = program.commands.find(cmd => cmd.name() === 'test');
      expect(testCmd).toBeDefined();

      // Simulate command execution with global options
      const globalOptions = { verbose: true };
      await testCmd!.parseAsync(['node', 'test'], { from: 'user' });

      // Verify execute was called with context
      expect(executeMock).toHaveBeenCalled();
    });

    it('should handle action errors', async () => {
      const error = new Error('Command failed');
      const command = createMockCommand('test', 'Test command', {
        execute: vi.fn().mockRejectedValue(error)
      });

      registry.register(command);

      const program = new Command();
      const contextFactory = () => ({
        logger: getLogger(),
        progress: getGlobalReporter(),
        globalOptions: {}
      });
      registry.applyToProgram(program, contextFactory);

      const testCmd = program.commands.find(cmd => cmd.name() === 'test');
      
      // Mock process.exit to prevent it from actually exiting
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      // The command should handle the error and call process.exit
      await expect(testCmd!.parseAsync(['node', 'test'], { from: 'user' })).rejects.toThrow('process.exit called');
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      processExitSpy.mockRestore();
    });
  });

  describe('Categories and Groups', () => {
    it('should organize commands by category', () => {
      const cmd1 = createMockCommand('init', 'Initialize');
      const cmd2 = createMockCommand('config', 'Configure');
      const cmd3 = createMockCommand('add', 'Add component');

      registry.register(cmd1, { category: 'Setup' });
      registry.register(cmd2, { category: 'Setup' });
      registry.register(cmd3, { category: 'Components' });

      const categories = registry.getCategories();
      expect(categories).toContain('Setup');
      expect(categories).toContain('Components');
      
      const setupCommands = registry.getByCategory('Setup');
      expect(setupCommands.some(cmd => cmd.getMetadata().name === 'init')).toBe(true);
      expect(setupCommands.some(cmd => cmd.getMetadata().name === 'config')).toBe(true);
      
      const componentCommands = registry.getByCategory('Components');
      expect(componentCommands.some(cmd => cmd.getMetadata().name === 'add')).toBe(true);
    });

    it('should get commands by category', () => {
      const cmd1 = createMockCommand('init', 'Initialize');
      const cmd2 = createMockCommand('config', 'Configure');

      registry.register(cmd1, { category: 'Setup' });
      registry.register(cmd2, { category: 'Setup' });

      const setupCommands = registry.getByCategory('Setup');
      expect(setupCommands).toHaveLength(2);
      expect(setupCommands.some(cmd => cmd.getMetadata().name === 'init')).toBe(true);
      expect(setupCommands.some(cmd => cmd.getMetadata().name === 'config')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle commands with empty names gracefully', () => {
      const command = new MockCommand(
        { name: '', description: 'Empty name' },
        {}
      );

      // Registry doesn't validate empty names, it just registers them
      registry.register(command);
      expect(registry.has('')).toBe(true);
    });

    it('should handle alias conflicts', () => {
      const cmd1 = createMockCommand('test1', 'Test 1', {
        aliases: ['t']
      });
      const cmd2 = createMockCommand('test2', 'Test 2', {
        aliases: ['t']
      });

      registry.register(cmd1);
      
      // Should throw because alias 't' is already taken
      expect(() => registry.register(cmd2)).toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide registry statistics', () => {
      const cmd1 = createMockCommand('init', 'Initialize');
      const cmd2 = createMockCommand('config', 'Configure');
      const cmd3 = createMockCommand('add', 'Add');

      registry.register(cmd1, { category: 'Setup' });
      registry.register(cmd2, { category: 'Setup' });
      registry.register(cmd3, { category: 'Components' });

      const stats = registry.getStats();
      expect(stats.totalCommands).toBe(3);
      expect(stats.totalCategories).toBe(2);
      expect(stats.commandsByCategory['Setup']).toBe(2);
      expect(stats.commandsByCategory['Components']).toBe(1);
    });
  });
});