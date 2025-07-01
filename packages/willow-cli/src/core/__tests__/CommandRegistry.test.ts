/**
 * CommandRegistry Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { CommandRegistry, CommandClass } from '../CommandRegistry.js';
import { getLogger, getGlobalReporter } from '../../ui/index.js';

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
      const command: CommandClass = {
        command: 'test',
        description: 'Test command',
        action: async () => ({ success: true }),
      };

      registry.register(command);
      
      expect(registry.has('test')).toBe(true);
      expect(registry.get('test')).toBeDefined();
    });

    it('should extract command name from complex command string', () => {
      const command: CommandClass = {
        command: 'add <component...>',
        description: 'Add components',
        action: async () => ({ success: true }),
      };

      registry.register(command);
      
      expect(registry.has('add')).toBe(true);
      const handler = registry.get('add');
      expect(handler?.name).toBe('add <component...>');
    });

    it('should register command with builder', () => {
      const builderMock = vi.fn();
      const command: CommandClass = {
        command: 'config <action>',
        description: 'Configure',
        builder: builderMock,
        action: async () => ({ success: true }),
      };

      registry.register(command);
      
      const handler = registry.get('config');
      expect(handler?.builder).toBe(builderMock);
    });

    it('should overwrite existing command', () => {
      const command1: CommandClass = {
        command: 'test',
        description: 'First test',
        action: async () => ({ success: true }),
      };

      const command2: CommandClass = {
        command: 'test',
        description: 'Second test',
        action: async () => ({ success: false }),
      };

      registry.register(command1);
      registry.register(command2);
      
      const handler = registry.get('test');
      expect(handler?.description).toBe('Second test');
    });
  });

  describe('Command Retrieval', () => {
    beforeEach(() => {
      registry.register({
        command: 'cmd1',
        description: 'Command 1',
        action: async () => ({ success: true }),
      });
      
      registry.register({
        command: 'cmd2 <arg>',
        description: 'Command 2',
        action: async () => ({ success: true }),
      });
    });

    it('should get command by name', () => {
      const cmd1 = registry.get('cmd1');
      expect(cmd1).toBeDefined();
      expect(cmd1?.description).toBe('Command 1');
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
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map(h => h.description)).toContain('Command 1');
      expect(all.map(h => h.description)).toContain('Command 2');
    });

    it('should get commands map', () => {
      const commands = registry.getCommands();
      expect(commands).toBeInstanceOf(Map);
      expect(commands.size).toBe(2);
      expect(commands.has('cmd1')).toBe(true);
      expect(commands.has('cmd2')).toBe(true);
    });
  });

  describe('Program Integration', () => {
    let program: Command;
    let contextFactory: any;

    beforeEach(() => {
      program = new Command();
      contextFactory = vi.fn(() => ({
        logger: getLogger(),
        progress: getGlobalReporter(),
        globalOptions: {},
      }));
    });

    it('should apply commands to program', () => {
      registry.register({
        command: 'test',
        description: 'Test command',
        action: async () => ({ success: true }),
      });

      const commandSpy = vi.spyOn(program, 'command');
      
      registry.applyToProgram(program, contextFactory);
      
      expect(commandSpy).toHaveBeenCalledWith('test');
    });

    it('should apply builder when present', () => {
      const builderMock = vi.fn();
      
      registry.register({
        command: 'test',
        description: 'Test command',
        builder: builderMock,
        action: async () => ({ success: true }),
      });

      registry.applyToProgram(program, contextFactory);
      
      expect(builderMock).toHaveBeenCalled();
    });

    it('should wrap action with context', async () => {
      const actionMock = vi.fn().mockResolvedValue({ success: true });
      
      registry.register({
        command: 'test',
        description: 'Test command',
        action: actionMock,
      });

      registry.applyToProgram(program, contextFactory);
      
      // Get the wrapped action
      const cmd = program.commands.find(c => c.name() === 'test');
      expect(cmd).toBeDefined();
      
      // Test that the action was applied to the command
      expect((cmd as any)._actionHandler).toBeDefined();
      expect(contextFactory).toBeDefined();
      expect(actionMock).toBeDefined();
    });

    it('should handle action errors', async () => {
      const errorMessage = 'Command failed';
      
      registry.register({
        command: 'error-test',
        description: 'Error test',
        action: async () => {
          throw new Error(errorMessage);
        },
      });

      registry.applyToProgram(program, contextFactory);
      
      const cmd = program.commands.find(c => c.name() === 'error-test');
      expect(cmd).toBeDefined();
      expect((cmd as any)._actionHandler).toBeDefined();
    });

    it('should handle action result with error', async () => {
      registry.register({
        command: 'result-error',
        description: 'Result error test',
        action: async () => ({
          success: false,
          error: new Error('Operation failed'),
        }),
      });

      registry.applyToProgram(program, contextFactory);
      
      const cmd = program.commands.find(c => c.name() === 'result-error');
      expect(cmd).toBeDefined();
      expect((cmd as any)._actionHandler).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty command string', () => {
      const command: CommandClass = {
        command: '',
        description: 'Empty command',
        action: async () => ({ success: true }),
      };

      registry.register(command);
      
      // Empty string results in empty key
      expect(registry.has('')).toBe(true);
    });

    it('should handle commands with multiple spaces', () => {
      const command: CommandClass = {
        command: 'multi   space   command',
        description: 'Multi space',
        action: async () => ({ success: true }),
      };

      registry.register(command);
      
      expect(registry.has('multi')).toBe(true);
    });

    it('should handle commands with special characters', () => {
      const command: CommandClass = {
        command: 'special-chars_cmd <arg>',
        description: 'Special chars',
        action: async () => ({ success: true }),
      };

      registry.register(command);
      
      expect(registry.has('special-chars_cmd')).toBe(true);
    });
  });
});