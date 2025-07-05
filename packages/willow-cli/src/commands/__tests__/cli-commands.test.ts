/**
 * CLI Commands Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { CommandRegistry } from '../../core/commands/CommandRegistry.js';
import { fromLegacyCommand } from '../../core/commands/LegacyCommandAdapter.js';
import { InitCommand } from '../init/InitCommand.js';
import { AddCommand } from '../add/AddCommand.js';
import { ConfigCommand } from '../config/ConfigCommand.js';
import { DoctorCommand } from '../doctor/DoctorCommand.js';
import { GenerateCommand } from '../generate/GenerateCommand.js';
import { TransformCommand } from '../transform/TransformCommand.js';
import { ValidateCommand } from '../validate/ValidateCommand.js';

describe('CLI Commands', () => {
  let registry: CommandRegistry;
  let program: Command;

  beforeEach(() => {
    registry = new CommandRegistry();
    program = new Command();
  });

  describe('Command Registration', () => {
    it('should register all core commands', () => {
      const commands = [
        InitCommand,
        AddCommand,
        ConfigCommand,
        DoctorCommand,
        GenerateCommand,
        TransformCommand,
        ValidateCommand,
      ];

      commands.forEach(cmd => {
        registry.register(fromLegacyCommand(cmd));
      });

      expect(registry.getAll().length).toBe(commands.length);
    });

    it('should have correct command metadata', () => {
      registry.register(fromLegacyCommand(InitCommand));
      
      expect(registry.has('init')).toBe(true);
      const initCmd = registry.get('init');
      expect(initCmd?.getMetadata().description).toBe('Initialize Willow in your project');
    });
  });

  describe('InitCommand', () => {
    it('should have correct command structure', () => {
      expect(InitCommand.command).toBe('init');
      expect(InitCommand.description).toBe('Initialize Willow in your project');
      expect(InitCommand.builder).toBeDefined();
      expect(InitCommand.action).toBeDefined();
    });
  });

  describe('AddCommand', () => {
    it('should have correct command structure', () => {
      expect(AddCommand.command).toBe('add <component...>');
      expect(AddCommand.description).toBe('Add components to your project');
      expect(AddCommand.builder).toBeDefined();
      expect(AddCommand.action).toBeDefined();
    });
  });

  describe('ConfigCommand', () => {
    it('should have correct command structure', () => {
      expect(ConfigCommand.command).toBe('config <action> [key] [value]');
      expect(ConfigCommand.description).toBe('Manage Willow configuration');
      expect(ConfigCommand.builder).toBeDefined();
      expect(ConfigCommand.action).toBeDefined();
    });
  });

  describe('GenerateCommand', () => {
    it('should have correct command structure', () => {
      expect(GenerateCommand.command).toBe('generate <type> <name>');
      expect(GenerateCommand.description).toBe('Generate component scaffolding');
      expect(GenerateCommand.builder).toBeDefined();
      expect(GenerateCommand.action).toBeDefined();
    });
  });

  describe('TransformCommand', () => {
    it('should have correct command structure', () => {
      expect(TransformCommand.command).toBe('transform <source> [destination]');
      expect(TransformCommand.description).toBe('Transform components between UI frameworks');
      expect(TransformCommand.builder).toBeDefined();
      expect(TransformCommand.action).toBeDefined();
    });
  });

  describe('DoctorCommand', () => {
    it('should have correct command structure', () => {
      expect(DoctorCommand.command).toBe('doctor');
      expect(DoctorCommand.description).toBe('Diagnose and fix common issues');
      expect(DoctorCommand.builder).toBeDefined();
      expect(DoctorCommand.action).toBeDefined();
    });
  });

  describe('ValidateCommand', () => {
    it('should have correct command structure', () => {
      expect(ValidateCommand.command).toBe('validate [component...]');
      expect(ValidateCommand.description).toBe('Validate components and configuration');
      expect(ValidateCommand.builder).toBeDefined();
      expect(ValidateCommand.action).toBeDefined();
    });
  });

  describe('Command Help Text', () => {
    it('should add help text with examples', () => {
      const mockCmd = {
        option: vi.fn().mockReturnThis(),
        addHelpText: vi.fn().mockReturnThis(),
      };
      
      TransformCommand.builder(mockCmd as any);

      expect(mockCmd.addHelpText).toHaveBeenCalledWith(
        'after',
        expect.stringContaining('Examples:')
      );
      expect(mockCmd.option).toHaveBeenCalledWith('-f, --from <framework>', 'source framework (react, vue, angular)');
    });
  });
});