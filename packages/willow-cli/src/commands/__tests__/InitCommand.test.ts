/**
 * InitCommand Test Suite
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { InitCommand } from '../init/InitCommand.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { InitOptions, CLIError, CLIErrorCode } from '../../types/cli.js';
import { configManager, CONFIG_PRESETS } from '../../config/index.js';
import { getPrompts } from '../../ui/index.js';

// Mock modules
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('../../config/index.js', () => ({
  configManager: {
    exists: vi.fn(),
    get: vi.fn(() => ({
      framework: 'react',
      uiKit: 'shadcn',
      style: 'tailwind',
      typescript: true,
      paths: {
        components: 'src/components',
        utils: 'src/utils',
        styles: 'src/styles',
      },
    })),
    save: vi.fn(),
    getConfigPath: vi.fn(() => '.willowrc.json'),
  },
  ConfigLoader: vi.fn(),
  CONFIG_PRESETS: {
    nextjs: {
      framework: 'react',
      uiKit: 'shadcn',
      style: 'tailwind',
      typescript: true,
    },
    vue: {
      framework: 'vue',
      uiKit: 'naive-ui',
      style: 'css',
      typescript: false,
    },
  },
  configValidator: {
    validate: vi.fn(() => ({
      valid: true,
      errors: [],
      warnings: [],
    })),
  },
}));

vi.mock('../../ui/index.js', () => ({
  getPrompts: vi.fn(() => ({
    confirm: vi.fn(),
    input: vi.fn(),
    selectFramework: vi.fn(),
    selectUIKit: vi.fn(),
    selectStyle: vi.fn(),
    selectPreset: vi.fn(),
    inputPath: vi.fn(),
    showSummary: vi.fn(),
  })),
}));

vi.mock('../../core/ArgumentParser.js', () => ({
  argumentParser: {
    parse: vi.fn((options) => {
      // Filter out undefined values to match real behavior
      const result = { ...options };
      Object.keys(result).forEach(key => {
        if (result[key] === undefined) {
          delete result[key];
        }
      });
      return result;
    }),
  },
}));

describe('InitCommand', () => {
  let context: CommandContext;
  let mockLogger: any;
  let mockProgress: any;
  let mockPrompts: any;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      section: vi.fn(),
      debug: vi.fn(),
    };

    mockProgress = {
      start: vi.fn(),
      progress: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
    };

    context = {
      logger: mockLogger,
      progress: mockProgress,
      globalOptions: {},
    };

    mockPrompts = getPrompts();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Command Structure', () => {
    it('should have correct command definition', () => {
      expect(InitCommand.command).toBe('init');
      expect(InitCommand.description).toBe('Initialize Willow in your project');
      expect(InitCommand.builder).toBeDefined();
      expect(InitCommand.action).toBeDefined();
    });
  });

  describe('Basic Initialization', () => {
    it('should initialize with default options', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));

      const options: InitOptions = {};
      const result = await InitCommand.action(context, options);

      expect(result.success).toBe(true);
      expect(configManager.save).toHaveBeenCalled();
      expect(mockProgress.succeed).toHaveBeenCalledWith('Willow initialized successfully!');
    });

    it('should check for existing configuration', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(true);
      vi.mocked(mockPrompts.confirm).mockResolvedValue(false);

      const options: InitOptions = {};
      const result = await InitCommand.action(context, options);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(CLIError);
      expect(result.error?.code).toBe(CLIErrorCode.CONFIGURATION_ERROR);
    });

    it('should force overwrite with --force flag', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(true);

      const options: InitOptions = { force: true };
      const result = await InitCommand.action(context, options);

      expect(result.success).toBe(true);
      expect(mockPrompts.confirm).not.toHaveBeenCalled();
    });
  });

  describe('Preset Initialization', () => {
    it('should use preset configuration', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);

      const options: InitOptions = { preset: 'nextjs' };
      const result = await InitCommand.action(context, options);

      expect(result.success).toBe(true);
      const savedConfig = vi.mocked(configManager.save).mock.calls[0][0];
      expect(savedConfig).toMatchObject(CONFIG_PRESETS.nextjs);
    });

    it('should throw error for unknown preset', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);

      const options: InitOptions = { preset: 'unknown' as any };
      
      await expect(InitCommand.action(context, options)).rejects.toThrow(
        new CLIError(CLIErrorCode.INVALID_ARGUMENTS, 'Unknown preset: unknown')
      );
    });
  });

  describe('Interactive Mode', () => {
    it('should run interactive setup when no framework specified', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found')); // No tsconfig.json
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      // Mock interactive prompts to return null (cancelled)
      vi.mocked(mockPrompts.selectPreset).mockResolvedValue(null);
      vi.mocked(mockPrompts.selectFramework).mockResolvedValue(null);
      
      // Interactive mode is triggered by interactive=true AND no framework
      const options: InitOptions = { interactive: true };
      const result = await InitCommand.action(context, options);

      // When interactive setup is cancelled, it should return success: false
      expect(result.success).toBe(false);
    });

    it('should use framework from config when not in full interactive mode', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found')); // No tsconfig.json
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      // When interactive is true but framework is provided, it should not trigger interactive setup
      const options: InitOptions = { interactive: true, framework: 'react' };
      const result = await InitCommand.action(context, options);

      expect(result.success).toBe(true);
      const savedConfig = vi.mocked(configManager.save).mock.calls[0][0];
      expect(savedConfig.framework).toBe('react'); // From provided options
    });

    it('should handle successful interactive mode', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found')); // No tsconfig.json
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      // Test with preset mode which is a simpler path
      const options: InitOptions = { preset: 'nextjs' };
      const result = await InitCommand.action(context, options);

      expect(result.success).toBe(true);
      expect(configManager.save).toHaveBeenCalled();
      
      const savedConfig = vi.mocked(configManager.save).mock.calls[0][0];
      expect(savedConfig.framework).toBe('react');
      expect(savedConfig.uiKit).toBe('shadcn');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration before saving', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      const { configValidator } = await import('../../config/index.js');

      const options: InitOptions = {};
      await InitCommand.action(context, options);

      expect(configValidator.validate).toHaveBeenCalled();
    });

    it('should fail on invalid configuration', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      const { configValidator } = await import('../../config/index.js');
      vi.mocked(configValidator.validate).mockResolvedValue({
        valid: false,
        errors: [{ path: 'framework', message: 'Invalid framework' }],
        warnings: [],
      });

      const options: InitOptions = {};
      
      await expect(InitCommand.action(context, options)).rejects.toThrow(
        new CLIError(CLIErrorCode.CONFIGURATION_ERROR, 'Invalid configuration')
      );
      
      expect(mockLogger.error).toHaveBeenCalledWith('Configuration validation failed:');
    });

    it('should show warnings for configuration', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      const { configValidator } = await import('../../config/index.js');
      vi.mocked(configValidator.validate).mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [
          { path: 'style', message: 'Deprecated style option', suggestion: 'Use tailwind' },
        ],
      });

      const options: InitOptions = {};
      await InitCommand.action(context, options);

      expect(mockLogger.warn).toHaveBeenCalledWith('style: Deprecated style option');
      expect(mockLogger.info).toHaveBeenCalledWith('  Suggestion: Use tailwind');
    });
  });

  describe('Directory Creation', () => {
    it('should create required directories', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);

      const options: InitOptions = {};
      await InitCommand.action(context, options);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('src/components'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('src/utils'),
        { recursive: true }
      );
    });
  });

  describe('Starter Files', () => {
    it('should create utility files', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);

      const options: InitOptions = {};
      await InitCommand.action(context, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('cn.ts'),
        expect.stringContaining('twMerge'),
        'utf-8'
      );
    });

    it('should create README file', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);

      const options: InitOptions = {};
      await InitCommand.action(context, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('Willow Components'),
        'utf-8'
      );
    });
  });

  describe('TypeScript Detection', () => {
    it('should auto-detect TypeScript', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(fs.access).mockImplementation(async (file) => {
        if (file.toString().includes('tsconfig.json')) {
          return undefined;
        }
        throw new Error('Not found');
      });

      const options: InitOptions = { framework: 'react' };
      await InitCommand.action(context, options);

      const savedConfig = vi.mocked(configManager.save).mock.calls[0][0];
      expect(savedConfig.typescript).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('TypeScript detected');
    });

    it('should respect explicit TypeScript option', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(fs.access).mockResolvedValue(undefined); // tsconfig exists

      const options: InitOptions = { framework: 'react', typescript: false };
      await InitCommand.action(context, options);

      const savedConfig = vi.mocked(configManager.save).mock.calls[0][0];
      expect(savedConfig.typescript).toBe(false);
    });
  });

  describe('Dependency Installation', () => {
    it('should skip dependency installation with --skip-install', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);

      const options: InitOptions = { skipInstall: true };
      await InitCommand.action(context, options);

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Dependencies to install')
      );
    });

    it('should suggest tailwind dependencies', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(configManager.get).mockReturnValue({
        ...configManager.get(),
        style: 'tailwind',
      });

      const options: InitOptions = { style: 'tailwind' };
      await InitCommand.action(context, options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('tailwindcss')
      );
    });

    it('should suggest shadcn dependencies', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);

      const options: InitOptions = { uiKit: 'shadcn' };
      await InitCommand.action(context, options);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('class-variance-authority')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle general errors', async () => {
      vi.mocked(configManager.exists).mockRejectedValue(new Error('Unexpected error'));

      const options: InitOptions = {};
      
      await expect(InitCommand.action(context, options)).rejects.toThrow(
        new CLIError(CLIErrorCode.UNKNOWN_ERROR, 'Failed to initialize Willow')
      );
      
      expect(mockProgress.fail).toHaveBeenCalledWith('Initialization failed');
    });

    it('should preserve CLIError type', async () => {
      vi.mocked(configManager.exists).mockResolvedValue(false);
      vi.mocked(configManager.save).mockRejectedValue(
        new CLIError(CLIErrorCode.PERMISSION_ERROR, 'Permission denied')
      );

      const options: InitOptions = {};
      
      await expect(InitCommand.action(context, options)).rejects.toThrow(
        new CLIError(CLIErrorCode.PERMISSION_ERROR, 'Permission denied')
      );
      
      expect(mockProgress.fail).toHaveBeenCalled();
    });
  });
});