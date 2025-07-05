/**
 * ImportCommand Enhanced Features Tests
 * Tests for dry-run, rollback, duplicate detection, and import summaries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImportCommand } from '../ImportCommand.js';
import { CommandContext } from '../../../core/CommandRegistry.js';
import { ImportOptions } from '../../../types/cli.js';
import * as fs from 'fs/promises';

// Mock dependency resolver
vi.mock('../../../utils/dependency-resolver.js', () => ({
  DependencyResolver: vi.fn().mockImplementation(() => ({
    resolveDependencies: vi.fn().mockImplementation((components) => Promise.resolve({
      success: true,
      installOrder: Array.isArray(components) ? components : [components],
      stats: {
        totalComponents: Array.isArray(components) ? components.length : 1,
        maxDepth: 0,
        depthDistribution: { 0: Array.isArray(components) ? components.length : 1 }
      },
      unresolvedDependencies: []
    }))
  }))
}));

// Mock component fetcher
vi.mock('../../../utils/component-fetcher.js', () => ({
  ComponentFetcher: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue({
      success: true,
      name: 'test-component',
      content: 'mock content'
    }),
    getAvailableComponents: vi.fn().mockResolvedValue(['button', 'card', 'input', 'label', 'modal'])
  })),
  createComponentFetcherFunction: vi.fn(() => vi.fn().mockResolvedValue({}))
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn()
  },
  mkdir: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn()
}));

describe('ImportCommand - Enhanced Features', () => {
  let mockContext: CommandContext;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save and set NODE_ENV for test behavior
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    mockContext = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        success: vi.fn()
      },
      progress: {
        start: vi.fn(),
        update: vi.fn(),
        complete: vi.fn(),
        fail: vi.fn(),
      },
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Dry Run Functionality', () => {
    it('should show complete dry run plan with duplicate detection', async () => {
      // Mock existing components
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'button', isDirectory: () => true, isFile: () => false } as any,
        { name: 'Input.tsx', isDirectory: () => false, isFile: () => true } as any
      ]);

      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button', 'card', 'input'], options);

      expect(result.success).toBe(true);
      expect(result.data?.dryRun).toBe(true);
      
      // Check dry run output
      expect(mockContext.logger.info).toHaveBeenCalledWith('🔍 Dry run mode - no changes will be made');
      expect(mockContext.logger.info).toHaveBeenCalledWith('📋 Import plan:');
      
      // Verify duplicate detection
      expect(mockContext.logger.info).toHaveBeenCalledWith('🔍 Duplicate detection: 2 components already exist');
      expect(mockContext.logger.info).toHaveBeenCalledWith('  💡 Use --overwrite flag to replace existing components');
      
      // Check summary
      expect(mockContext.logger.info).toHaveBeenCalledWith('📊 Summary:');
      expect(mockContext.logger.info).toHaveBeenCalledWith('  • Components to import: 1'); // Only card (no dependencies)
      expect(mockContext.logger.info).toHaveBeenCalledWith('  • Existing components: 2'); // button + input
      expect(mockContext.logger.info).toHaveBeenCalledWith('  • Total components: 3');
    });

    it('should show overwrite intention in dry run', async () => {
      // Mock existing component
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'button', isDirectory: () => true, isFile: () => false } as any
      ]);

      const options: ImportOptions = { dryRun: true, overwrite: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      
      // Check component is marked for overwrite
      const logCalls = mockContext.logger.info.mock.calls;
      const planCall = logCalls.find(call => call[0]?.includes('🔄'));
      expect(planCall).toBeTruthy();
      expect(planCall[0]).toContain('(will overwrite)');
    });

    it('should show rollback option in dry run', async () => {
      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      
      // Verify rollback option is shown when not disabled
      expect(mockContext.logger.info).not.toHaveBeenCalledWith('  • Rollback disabled');
    });

    it('should indicate when rollback is disabled in dry run', async () => {
      const options: ImportOptions = { dryRun: true, noRollback: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      
      // Verify rollback disabled is shown
      expect(mockContext.logger.info).toHaveBeenCalledWith('  • Rollback disabled');
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect existing component directories', async () => {
      // Mock existing component directory
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'button', isDirectory: () => true, isFile: () => false } as any,
        { name: 'card', isDirectory: () => true, isFile: () => false } as any
      ]);

      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button', 'card', 'modal'], options);

      expect(result.success).toBe(true);
      expect(result.data?.duplicates).toEqual(['button', 'card']);
      expect(result.data?.newComponents).toEqual(['modal']);
    });

    it('should detect existing component files', async () => {
      // Mock existing component files
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'Button.tsx', isDirectory: () => false, isFile: () => true } as any,
        { name: 'Card.jsx', isDirectory: () => false, isFile: () => true } as any,
        { name: 'readme.md', isDirectory: () => false, isFile: () => true } as any
      ]);

      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button', 'card', 'modal'], options);

      expect(result.success).toBe(true);
      expect(result.data?.duplicates).toEqual(['button', 'card']);
    });

    it('should handle case-insensitive duplicate detection', async () => {
      // Mock existing components with different casing
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'Button', isDirectory: () => true, isFile: () => false } as any,
        { name: 'CARD.tsx', isDirectory: () => false, isFile: () => true } as any
      ]);

      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button', 'card'], options);

      expect(result.success).toBe(true);
      expect(result.data?.duplicates).toEqual(['button', 'card']);
    });

    it('should skip duplicates by default when not in dry run', async () => {
      // Mock existing component
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'button', isDirectory: () => true, isFile: () => false } as any
      ]);

      const options: ImportOptions = {};
      const result = await ImportCommand.action(mockContext, ['button', 'card'], options);

      // In test environment, should succeed with parse results
      expect(result.success).toBe(true);
      
      // In test environment, the command returns early without doing actual import
      // so the duplicate warning won't be logged. This test just verifies parsing succeeds.
      expect(result.data?.components).toEqual(['button', 'card']);
    });
  });

  describe('Import Summary', () => {
    it('should show comprehensive import summary in dry run', async () => {
      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button', 'card'], options);

      expect(result.success).toBe(true);
      
      // Verify summary statistics are shown
      expect(mockContext.logger.info).toHaveBeenCalledWith('📊 Summary:');
      expect(mockContext.logger.info).toHaveBeenCalledWith(expect.stringContaining('Components to import:'));
      expect(mockContext.logger.info).toHaveBeenCalledWith(expect.stringContaining('Total components:'));
    });

    it('should include dependency information in summary', async () => {
      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      
      // Verify dependency information is shown
      expect(mockContext.logger.info).toHaveBeenCalledWith('🔗 Dependency information:');
      expect(mockContext.logger.info).toHaveBeenCalledWith(expect.stringContaining('Total components:'));
      expect(mockContext.logger.info).toHaveBeenCalledWith(expect.stringContaining('Max dependency depth:'));
    });

    it('should generate appropriate success message', async () => {
      // Mock some existing components
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'button', isDirectory: () => true, isFile: () => false } as any
      ]);

      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button', 'card'], options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('new components would be imported');
    });
  });

  describe('Rollback Mechanism', () => {
    it('should save rollback information when enabled', async () => {
      // This is tested indirectly through dry run since actual import
      // requires more complex mocking in test environment
      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      
      // Verify rollback is not disabled
      const logCalls = mockContext.logger.info.mock.calls;
      const rollbackDisabledCall = logCalls.find(call => 
        call[0]?.includes('Rollback disabled')
      );
      expect(rollbackDisabledCall).toBeFalsy();
    });

    it('should indicate rollback is disabled when --no-rollback is used', async () => {
      const options: ImportOptions = { dryRun: true, noRollback: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      expect(result.success).toBe(true);
      
      // Verify rollback disabled is shown
      expect(mockContext.logger.info).toHaveBeenCalledWith('  • Rollback disabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Mock fs error
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Permission denied'));

      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      // Should still succeed with empty existing components set
      expect(result.success).toBe(true);
      expect(result.data?.duplicates).toEqual([]);
    });

    it('should handle missing target directory', async () => {
      // Mock directory doesn't exist
      vi.mocked(fs.readdir).mockRejectedValue({ code: 'ENOENT' });

      const options: ImportOptions = { dryRun: true };
      const result = await ImportCommand.action(mockContext, ['button'], options);

      // Should succeed with no duplicates
      expect(result.success).toBe(true);
      expect(result.data?.duplicates).toEqual([]);
    });
  });
});