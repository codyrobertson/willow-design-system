/**
 * ImportCommand Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportCommand } from '../ImportCommand.js';
import { CommandContext } from '../../../core/CommandRegistry.js';
import { ImportOptions } from '../../../types/cli.js';

describe('ImportCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
      progress: {
        start: vi.fn(),
        update: vi.fn(),
        complete: vi.fn(),
        fail: vi.fn(),
      },
    };
  });

  describe('argument parsing', () => {
    it('should handle --all flag', async () => {
      const options: ImportOptions = { all: true };
      const result = await ImportCommand.action(mockContext, [], options);

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('all');
      expect(mockContext.logger.info).toHaveBeenCalledWith('🎯 Import mode: All components');
    });

    it('should handle --essential flag', async () => {
      const options: ImportOptions = { essential: true };
      const result = await ImportCommand.action(mockContext, [], options);

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('essential');
      expect(mockContext.logger.info).toHaveBeenCalledWith('🎯 Import mode: Essential components');
    });

    it('should handle --category flag', async () => {
      const options: ImportOptions = { category: 'ui' };
      const result = await ImportCommand.action(mockContext, [], options);

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('category:ui');
      expect(mockContext.logger.info).toHaveBeenCalledWith("🎯 Import mode: Category 'ui'");
    });

    it('should handle explicit component list', async () => {
      const options: ImportOptions = {};
      const result = await ImportCommand.action(mockContext, ['button', 'input'], options);

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('explicit');
      expect(result.data?.components).toEqual(['button', 'input']);
      expect(mockContext.logger.info).toHaveBeenCalledWith('🎯 Import mode: Explicit component list');
    });

    it('should fail when no components specified', async () => {
      const options: ImportOptions = {};
      const result = await ImportCommand.action(mockContext, [], options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No components specified');
    });

    it('should validate component names', async () => {
      const options: ImportOptions = {};
      const result = await ImportCommand.action(mockContext, ['invalid@name', 'valid-name'], options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid component names');
    });
  });

  describe('dry run functionality', () => {
    it('should perform dry run without making changes', async () => {
      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      expect(result.data?.dryRun).toBe(true);
      expect(mockContext.logger.info).toHaveBeenCalledWith('🔍 Dry run mode - no changes will be made');
    });

    it('should show import plan in dry run', async () => {
      const options: ImportOptions = { dryRun: true, overwrite: true };
      const result = await ImportCommand.action(mockContext, ['button', 'input'], options);

      expect(result.success).toBe(true);
      expect(mockContext.logger.info).toHaveBeenCalledWith('📋 Import plan:');
      // With dependency resolution, dependencies come first
      expect(mockContext.logger.info).toHaveBeenCalledWith('1. label');
      expect(mockContext.logger.info).toHaveBeenCalledWith('2. input');
      expect(mockContext.logger.info).toHaveBeenCalledWith('3. button');
      expect(mockContext.logger.info).toHaveBeenCalledWith('  • Overwrite existing files');
    });
  });

  describe('category handling', () => {
    it('should return components for valid category', async () => {
      const options: ImportOptions = { category: 'ui' };
      const result = await ImportCommand.action(mockContext, [], options);

      expect(result.success).toBe(true);
      expect(result.data?.components).toEqual(['button', 'input', 'card', 'modal']);
    });

    it('should return empty list for invalid category', async () => {
      const options: ImportOptions = { category: 'nonexistent' };
      const result = await ImportCommand.action(mockContext, [], options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No components found matching the specified criteria');
    });
  });

  describe('option validation', () => {
    it('should validate registry URL format', async () => {
      const options: ImportOptions = { registry: 'invalid-url' };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid url');
    });

    it('should accept valid registry URL', async () => {
      const options: ImportOptions = { registry: 'https://registry.example.com' };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      expect(result.data?.options.registry).toBe('https://registry.example.com');
    });
  });

  describe('filter handling', () => {
    it('should apply filters when specified', async () => {
      const options: ImportOptions = { filter: 'react' };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      // Filter functionality will be implemented in later subtasks
    });
  });

  describe('error handling', () => {
    it('should return success for valid basic import', async () => {
      const options: ImportOptions = {};
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      expect(result.data?.components).toEqual(['button']);
    });
  });
});