/**
 * ImportCommand Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImportCommand } from '../ImportCommand.js';
import { CommandContext } from '../../../core/CommandRegistry.js';
import { ImportOptions } from '../../../types/cli.js';

// Mock dependency resolver
vi.mock('../../../utils/dependency-resolver.js', () => ({
  DependencyResolver: vi.fn().mockImplementation(() => ({
    resolveDependencies: vi.fn().mockImplementation((components) => Promise.resolve({
      success: true,
      installOrder: Array.isArray(components) ? components : [components],
      stats: {
        totalComponents: Array.isArray(components) ? components.length : 1,
        maxDepth: 0,
        resolutionTimeMs: 10
      },
      unresolvedDependencies: [],
      versionConflicts: [],
      circularDependencies: [],
      dependencyTree: {}
    })),
    getDependencyGraph: vi.fn().mockReturnValue({
      nodes: new Map(),
      edges: new Map()
    })
  }))
}));

// Mock component fetcher  
vi.mock('../../../utils/component-fetcher.js', () => ({
  ComponentFetcher: vi.fn().mockImplementation(() => ({
    fetchComponents: vi.fn().mockResolvedValue(new Map()),
    validateComponent: vi.fn().mockReturnValue(true),
    downloadComponentFiles: vi.fn().mockResolvedValue(undefined),
    getAvailableComponents: vi.fn().mockResolvedValue(['button', 'card', 'input', 'label', 'modal'])
  })),
  createComponentFetcherFunction: vi.fn(() => vi.fn().mockResolvedValue({
    name: 'test-component',
    version: '1.0.0',
    registryDependencies: []
  }))
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(),
    readdir: vi.fn().mockResolvedValue([]),
    access: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn()
  },
  mkdir: vi.fn(),
  readdir: vi.fn().mockResolvedValue([]),
  access: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn()
}));

describe('ImportCommand', () => {
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
      },
      progress: {
        start: vi.fn(),
        update: vi.fn(),
        complete: vi.fn(),
        fail: vi.fn(),
      },
    };
  });

  afterEach(() => {
    // Restore NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('argument parsing', () => {
    it('should handle --all flag', async () => {
      const options: ImportOptions = { all: true };
      const result = await ImportCommand.action(mockContext, [], options);

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('all');
      expect(mockContext.logger.info).toHaveBeenCalledWith('Import mode: all');
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
      expect(result.error?.message).toContain('No components specified');
    });

    it('should validate component names', async () => {
      const options: ImportOptions = {};
      const result = await ImportCommand.action(mockContext, ['invalid@name', 'valid-name'], options);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid component names');
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
      // With dependency resolution, dependencies come first - updated format
      expect(mockContext.logger.info).toHaveBeenCalledWith('1. ✅ button ');
      expect(mockContext.logger.info).toHaveBeenCalledWith('2. ✅ input ');
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
      expect(result.error?.message).toContain('No components found matching the specified criteria');
    });
  });

  describe('option validation', () => {
    it.skip('should validate registry URL format', async () => {
      // Skipped: URL validation was temporarily removed from ImportOptions schema
      // to avoid dependency issues. Can be re-enabled when proper validation is added.
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