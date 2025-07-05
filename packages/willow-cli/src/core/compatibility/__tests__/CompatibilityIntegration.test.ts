/**
 * Tests for Compatibility Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { 
  createCompatibilityMiddleware,
  applyCompatibility,
  createCompatibilityProcessor 
} from '../CompatibilityIntegration.js';
import { 
  CompatibilityMode,
  resetCompatibilityMode 
} from '../CompatibilityMode.js';
import { ICommand } from '../../commands/CommandInterface.js';
import { CommandContext } from '../../commands/CommandRegistry.js';
import { Logger } from '../../../ui/Logger.js';
import { ProgressReporter } from '../../../ui/ProgressReporter.js';

// Mock command for testing
class MockCommand implements ICommand {
  execute = vi.fn().mockResolvedValue({ success: true });
  
  getMetadata() {
    return {
      name: 'test',
      description: 'Test command',
    };
  }
  
  configureOptions(command: Command): void {
    // No options
  }
}

describe('CompatibilityIntegration', () => {
  let mockCommand: MockCommand;
  let mockContext: CommandContext;
  
  beforeEach(() => {
    mockCommand = new MockCommand();
    mockContext = {
      logger: new Logger({ silent: true }),
      progress: new ProgressReporter({ quiet: true }),
      globalOptions: {},
    };
    resetCompatibilityMode();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    resetCompatibilityMode();
  });
  
  describe('createCompatibilityMiddleware', () => {
    it('should wrap command execution', async () => {
      const originalExecute = mockCommand.execute;
      const middleware = createCompatibilityMiddleware();
      const wrappedCommand = middleware(mockCommand);
      
      expect(wrappedCommand.execute).toBeDefined();
      // The wrapped execute function should be different from the original
      expect(wrappedCommand.execute).not.toBe(originalExecute);
    });
    
    it('should process command through compatibility layer', async () => {
      const originalExecute = vi.fn().mockResolvedValue({ success: true });
      mockCommand.execute = originalExecute;
      
      const middleware = createCompatibilityMiddleware();
      const wrappedCommand = middleware(mockCommand);
      
      const mockCommandInstance = new Command('install');
      await wrappedCommand.execute(mockContext, 'arg1', 'arg2', mockCommandInstance);
      
      // Check that the original execute was called (through the wrapper)
      expect(originalExecute).toHaveBeenCalledWith(mockContext, 'arg1', 'arg2', mockCommandInstance);
    });
    
    it('should handle aliased commands', async () => {
      const middleware = createCompatibilityMiddleware({
        enableAliases: true,
      });
      const wrappedCommand = middleware(mockCommand);
      
      const mockCommandInstance = new Command('install'); // Legacy command
      const debugSpy = vi.spyOn(mockContext.logger, 'debug');
      
      await wrappedCommand.execute(mockContext, mockCommandInstance);
      
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Command 'install' resolved to 'add'")
      );
    });
  });
  
  describe('applyCompatibility', () => {
    it('should add compatibility options to program', async () => {
      const program = new Command();
      await applyCompatibility(program);
      
      const options = program.opts();
      expect(program.options).toContainEqual(
        expect.objectContaining({
          long: '--compatibility-mode',
        })
      );
      expect(program.options).toContainEqual(
        expect.objectContaining({
          long: '--no-compat-warnings',
        })
      );
      expect(program.options).toContainEqual(
        expect.objectContaining({
          long: '--migrate-config',
        })
      );
    });
    
    it('should add compat:status command', async () => {
      const program = new Command();
      await applyCompatibility(program);
      
      const statusCommand = program.commands.find(cmd => cmd.name() === 'compat:status');
      expect(statusCommand).toBeDefined();
      expect(statusCommand?.description()).toContain('compatibility status');
    });
    
    it('should add compatibility help text', async () => {
      const program = new Command();
      await applyCompatibility(program);
      
      // Check that options are added
      const options = program.options;
      const hasCompatMode = options.some(opt => opt.long === '--compatibility-mode');
      const hasNoCompatWarnings = options.some(opt => opt.long === '--no-compat-warnings');
      const hasMigrateConfig = options.some(opt => opt.long === '--migrate-config');
      
      expect(hasCompatMode).toBe(true);
      expect(hasNoCompatWarnings).toBe(true);
      expect(hasMigrateConfig).toBe(true);
    });
  });
  
  describe('createCompatibilityProcessor', () => {
    it('should process command line arguments', () => {
      const processor = createCompatibilityProcessor();
      
      const args = ['node', 'cli.js', 'install', 'button', '--force'];
      const processed = processor.processCommandLine(args);
      
      expect(processed[2]).toBe('add'); // 'install' -> 'add'
      expect(processed[3]).toBe('button');
      expect(processed[4]).toBe('--force');
    });
    
    it('should detect deprecated commands', () => {
      const processor = createCompatibilityProcessor();
      
      expect(processor.isDeprecated('install')).toBe(true);
      expect(processor.isDeprecated('add')).toBe(false);
      expect(processor.isDeprecated('unknown')).toBe(false);
    });
    
    it('should get modern equivalent of commands', () => {
      const processor = createCompatibilityProcessor();
      
      expect(processor.getModernEquivalent('install')).toBe('add');
      expect(processor.getModernEquivalent('uninstall')).toBe('remove');
      expect(processor.getModernEquivalent('ls')).toBe('list');
      expect(processor.getModernEquivalent('add')).toBeUndefined();
    });
    
    it('should handle short command lines gracefully', () => {
      const processor = createCompatibilityProcessor();
      
      const args = ['node', 'cli.js'];
      const processed = processor.processCommandLine(args);
      
      expect(processed).toEqual(args);
    });
  });
  
  describe('Integration with CompatibilityMode', () => {
    it('should respect compatibility mode settings', async () => {
      const program = new Command();
      await applyCompatibility(program, {
        mode: 'strict',
        enableAliases: false,
      });
      
      const processor = createCompatibilityProcessor();
      const args = ['node', 'cli.js', 'install', 'button'];
      const processed = processor.processCommandLine(args);
      
      // In strict mode, aliases should not be processed
      expect(processed[2]).toBe('install');
    });
    
    it('should handle legacy mode with argument translation', async () => {
      const compatMode = new CompatibilityMode({ mode: 'legacy' });
      const processor = createCompatibilityProcessor(compatMode);
      
      const args = ['node', 'cli.js', 'add', 'button', '--save-dev'];
      const processed = processor.processCommandLine(args);
      
      // Legacy mode should translate arguments
      expect(processed).toContain('--dev');
      expect(processed).not.toContain('--save-dev');
    });
  });
});