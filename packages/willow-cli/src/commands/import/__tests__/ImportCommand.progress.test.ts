import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImportCommand } from '../ImportCommand.js';
import { CommandContext } from '../../../core/CommandRegistry.js';
import { ComponentFetcher } from '../../../utils/component-fetcher.js';
import { DependencyResolver } from '../../../utils/dependency-resolver.js';
import { ProgressFeedback } from '../../../utils/progress-feedback.js';
import { CLIErrorCode } from '../../../types/cli.js';
import * as fs from 'fs/promises';
import * as componentInstaller from '../../../utils/componentInstaller.js';

// Mock dependencies
vi.mock('../../../utils/component-fetcher.js', () => ({
  ComponentFetcher: vi.fn(),
  createComponentFetcherFunction: vi.fn(() => vi.fn().mockResolvedValue({
    name: 'test-component',
    version: '1.0.0',
    registryDependencies: []
  }))
}));
vi.mock('../../../utils/dependency-resolver.js');
vi.mock('../../../utils/progress-feedback.js');
vi.mock('fs/promises');
vi.mock('../../../utils/componentInstaller.js');

describe('ImportCommand - Progress Tracking', () => {
  let mockContext: CommandContext;
  let mockLogger: any;
  let mockProgress: any;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    // Remove test environment to test actual implementation
    delete process.env.NODE_ENV;

    // Setup mocks
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    };

    mockProgress = {
      start: vi.fn(),
      update: vi.fn(),
      complete: vi.fn(),
      info: vi.fn()
    };

    mockContext = {
      logger: mockLogger,
      progress: mockProgress,
      config: {},
      paths: {
        root: '/test/project',
        components: '/test/project/src/components'
      }
    };

    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock file system operations
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
    
    // Mock component installer
    vi.mocked(componentInstaller.installComponents).mockResolvedValue({
      success: true,
      installed: ['button', 'card'],
      failed: [],
      skipped: []
    });
  });

  afterEach(() => {
    // Restore NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it('should show progress during component import', async () => {
    // Mock progress feedback instance
    const mockProgressInstance = {
      start: vi.fn(),
      startStep: vi.fn(),
      completeStep: vi.fn(),
      complete: vi.fn(),
      createProgressBar: vi.fn().mockReturnValue({
        update: vi.fn(),
        complete: vi.fn()
      }),
      getElapsedTime: vi.fn().mockReturnValue(1234),
      getSteps: vi.fn().mockReturnValue([]),
      showSummary: vi.fn(),
      success: vi.fn(),
      error: vi.fn()
    };

    (ProgressFeedback as any).mockImplementation(() => mockProgressInstance);

    // Mock component fetcher
    const mockFetcherInstance = {
      fetchComponents: vi.fn().mockResolvedValue(new Map([
        ['button', { success: true, component: { name: 'button', version: '1.0.0' }, fromCache: false }],
        ['card', { success: true, component: { name: 'card', version: '1.0.0' }, fromCache: true }]
      ])),
      validateComponent: vi.fn().mockReturnValue(true),
      downloadComponentFiles: vi.fn().mockResolvedValue(undefined)
    };

    (ComponentFetcher as any).mockImplementation(() => mockFetcherInstance);

    // Mock dependency resolver
    const mockResolverInstance = {
      resolveDependencies: vi.fn().mockResolvedValue({
        success: true,
        installOrder: ['button', 'card'],
        stats: {
          totalComponents: 2,
          maxDepth: 1,
          resolutionTimeMs: 100
        },
        unresolvedDependencies: [],
        versionConflicts: [],
        circularDependencies: [],
        dependencyTree: {}
      }),
      getDependencyGraph: vi.fn().mockReturnValue({
        nodes: new Map(),
        edges: new Map()
      })
    };

    (DependencyResolver as any).mockImplementation(() => mockResolverInstance);

    const result = await ImportCommand.action(
      mockContext,
      ['button', 'card'],
      {}
    );

    // Verify progress tracking was used
    expect(ProgressFeedback).toHaveBeenCalledWith({
      showTime: true,
      showSteps: true,
      silent: undefined
    });

    // Verify progress steps - first we resolve dependencies
    expect(mockProgressInstance.start).toHaveBeenCalledWith('🔍 Resolving component dependencies...');
    expect(mockProgressInstance.startStep).toHaveBeenCalledWith('🔗 Analyzing component dependencies...');
    expect(mockProgressInstance.completeStep).toHaveBeenCalled();
    expect(mockProgressInstance.complete).toHaveBeenCalledWith('success', 'Import completed');

    // Verify progress bar was created
    expect(mockProgressInstance.createProgressBar).toHaveBeenCalledWith(2, 'Importing components');

    // Verify summary was shown
    expect(mockProgressInstance.showSummary).toHaveBeenCalled();

    expect(result.success).toBe(true);
  });

  it('should handle quiet mode', async () => {
    const mockProgressInstance = {
      start: vi.fn(),
      startStep: vi.fn(),
      completeStep: vi.fn(),
      complete: vi.fn(),
      createProgressBar: vi.fn().mockReturnValue({
        update: vi.fn(),
        complete: vi.fn()
      }),
      getElapsedTime: vi.fn().mockReturnValue(1234),
      getSteps: vi.fn().mockReturnValue([]),
      showSummary: vi.fn(),
      success: vi.fn(),
      error: vi.fn()
    };

    (ProgressFeedback as any).mockImplementation(() => mockProgressInstance);

    // Mock successful import
    const mockFetcherInstance = {
      fetchComponents: vi.fn().mockResolvedValue(new Map([
        ['button', { success: true, component: { name: 'button', version: '1.0.0' }, fromCache: false }]
      ])),
      validateComponent: vi.fn().mockReturnValue(true),
      downloadComponentFiles: vi.fn().mockResolvedValue(undefined)
    };

    (ComponentFetcher as any).mockImplementation(() => mockFetcherInstance);

    // Mock dependency resolver
    const mockResolverInstance = {
      resolveDependencies: vi.fn().mockResolvedValue({
        success: true,
        installOrder: ['button'],
        stats: {
          totalComponents: 1,
          maxDepth: 0,
          resolutionTimeMs: 50
        },
        unresolvedDependencies: [],
        versionConflicts: [],
        circularDependencies: [],
        dependencyTree: {}
      }),
      getDependencyGraph: vi.fn().mockReturnValue({
        nodes: new Map(),
        edges: new Map()
      })
    };

    (DependencyResolver as any).mockImplementation(() => mockResolverInstance);

    const result = await ImportCommand.action(
      mockContext,
      ['button'],
      { quiet: true }
    );

    // Verify progress was created with silent option
    expect(ProgressFeedback).toHaveBeenCalledWith({
      showTime: true,
      showSteps: true,
      silent: true
    });

    // Summary should not be shown in quiet mode
    expect(mockProgressInstance.showSummary).not.toHaveBeenCalled();

    expect(result.success).toBe(true);
  });

  it('should show progress for dependency resolution', async () => {
    // Mock progress instances
    const mockDependencyProgress = {
      start: vi.fn(),
      startStep: vi.fn(),
      completeStep: vi.fn(),
      complete: vi.fn()
    };

    const mockImportProgress = {
      start: vi.fn(),
      startStep: vi.fn(),
      completeStep: vi.fn(),
      complete: vi.fn(),
      createProgressBar: vi.fn().mockReturnValue({
        update: vi.fn(),
        complete: vi.fn()
      }),
      getElapsedTime: vi.fn().mockReturnValue(1234),
      getSteps: vi.fn().mockReturnValue([]),
      showSummary: vi.fn(),
      success: vi.fn(),
      error: vi.fn()
    };

    // Return different instances for dependency resolution vs import
    let callCount = 0;
    (ProgressFeedback as any).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockDependencyProgress : mockImportProgress;
    });

    // Mock successful dependency resolution
    const mockResolverInstance = {
      resolveDependencies: vi.fn().mockResolvedValue({
        success: true,
        installOrder: ['icon', 'button'],
        stats: {
          totalComponents: 2,
          maxDepth: 2,
          resolutionTimeMs: 150
        },
        unresolvedDependencies: [],
        versionConflicts: [],
        circularDependencies: [],
        dependencyTree: {}
      }),
      getDependencyGraph: vi.fn().mockReturnValue({
        nodes: new Map(),
        edges: new Map()
      })
    };

    (DependencyResolver as any).mockImplementation(() => mockResolverInstance);

    // Mock component fetcher
    const mockFetcherInstance = {
      fetchComponents: vi.fn().mockResolvedValue(new Map([
        ['icon', { success: true, component: { name: 'icon', version: '1.0.0' }, fromCache: false }],
        ['button', { success: true, component: { name: 'button', version: '1.0.0' }, fromCache: false }]
      ])),
      validateComponent: vi.fn().mockReturnValue(true),
      downloadComponentFiles: vi.fn().mockResolvedValue(undefined)
    };

    (ComponentFetcher as any).mockImplementation(() => mockFetcherInstance);

    const result = await ImportCommand.action(
      mockContext,
      ['button'],
      {}
    );

    // Verify dependency resolution progress
    expect(mockDependencyProgress.start).toHaveBeenCalledWith('🔍 Resolving component dependencies...');
    expect(mockDependencyProgress.startStep).toHaveBeenCalledWith('🔗 Analyzing component dependencies...');
    expect(mockDependencyProgress.completeStep).toHaveBeenCalledWith(
      'success',
      'Found 2 components in dependency tree'
    );
    expect(mockDependencyProgress.complete).toHaveBeenCalledWith(
      'success',
      'Resolved 2 components with max depth 2'
    );

    expect(result.success).toBe(true);
  });

  it('should handle import failures with progress', async () => {
    const mockProgressInstance = {
      start: vi.fn(),
      startStep: vi.fn(),
      completeStep: vi.fn(),
      complete: vi.fn(),
      createProgressBar: vi.fn().mockReturnValue({
        update: vi.fn(),
        complete: vi.fn()
      }),
      getElapsedTime: vi.fn().mockReturnValue(1234),
      getSteps: vi.fn().mockReturnValue([]),
      showSummary: vi.fn(),
      success: vi.fn(),
      error: vi.fn()
    };

    (ProgressFeedback as any).mockImplementation(() => mockProgressInstance);

    // Mock component fetcher with failures
    const mockFetcherInstance = {
      fetchComponents: vi.fn().mockResolvedValue(new Map([
        ['button', { success: false, error: 'Component not found' }],
        ['card', { success: true, component: { name: 'card', version: '1.0.0' }, fromCache: false }]
      ])),
      validateComponent: vi.fn().mockReturnValue(true),
      downloadComponentFiles: vi.fn().mockResolvedValue(undefined)
    };

    (ComponentFetcher as any).mockImplementation(() => mockFetcherInstance);

    // Mock dependency resolver
    const mockResolverInstance = {
      resolveDependencies: vi.fn().mockResolvedValue({
        success: true,
        installOrder: ['button', 'card'],
        stats: {
          totalComponents: 2,
          maxDepth: 1,
          resolutionTimeMs: 100
        },
        unresolvedDependencies: [],
        versionConflicts: [],
        circularDependencies: [],
        dependencyTree: {}
      }),
      getDependencyGraph: vi.fn().mockReturnValue({
        nodes: new Map(),
        edges: new Map()
      })
    };

    (DependencyResolver as any).mockImplementation(() => mockResolverInstance);

    const result = await ImportCommand.action(
      mockContext,
      ['button', 'card'],
      {}
    );

    // Verify error was shown in progress
    expect(mockProgressInstance.error).toHaveBeenCalledWith('button: Component not found');

    // Verify completion with warning status (second call is the import progress)
    expect(mockProgressInstance.complete).toHaveBeenNthCalledWith(
      2,
      'warning',
      'Import finished with issues'
    );

    // Verify summary was called (exact structure may vary)
    expect(mockProgressInstance.showSummary).toHaveBeenCalled();

    expect(result.success).toBe(false);
    expect(result.code).toBe(CLIErrorCode.COMPONENT_NOT_FOUND);
  });

  it('should show progress bar updates for batch processing', async () => {
    const mockProgressBar = {
      update: vi.fn(),
      complete: vi.fn()
    };

    const mockProgressInstance = {
      start: vi.fn(),
      startStep: vi.fn(),
      completeStep: vi.fn(),
      complete: vi.fn(),
      createProgressBar: vi.fn().mockReturnValue(mockProgressBar),
      getElapsedTime: vi.fn().mockReturnValue(1234),
      getSteps: vi.fn().mockReturnValue([]),
      showSummary: vi.fn(),
      success: vi.fn(),
      error: vi.fn()
    };

    (ProgressFeedback as any).mockImplementation(() => mockProgressInstance);

    // Mock multiple components
    const components = ['button', 'card', 'dialog', 'select', 'input'];
    const fetchResults = new Map(
      components.map(name => [
        name,
        { success: true, component: { name, version: '1.0.0' }, fromCache: false }
      ])
    );

    const mockFetcherInstance = {
      fetchComponents: vi.fn().mockResolvedValue(fetchResults),
      validateComponent: vi.fn().mockReturnValue(true),
      downloadComponentFiles: vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10))
      )
    };

    (ComponentFetcher as any).mockImplementation(() => mockFetcherInstance);

    // Mock dependency resolver to return all components
    const mockResolverInstance = {
      resolveDependencies: vi.fn().mockResolvedValue({
        success: true,
        installOrder: components,
        stats: {
          totalComponents: components.length,
          maxDepth: 1,
          resolutionTimeMs: 200
        },
        unresolvedDependencies: [],
        versionConflicts: [],
        circularDependencies: [],
        dependencyTree: {}
      }),
      getDependencyGraph: vi.fn().mockReturnValue({
        nodes: new Map(),
        edges: new Map()
      })
    };

    (DependencyResolver as any).mockImplementation(() => mockResolverInstance);

    const result = await ImportCommand.action(
      mockContext,
      components,
      { batchSize: '2' } // Process 2 at a time
    );

    // Verify progress bar was created with correct total
    expect(mockProgressInstance.createProgressBar).toHaveBeenCalledWith(5, 'Importing components');
    
    // Verify progress bar updates happened for all components
    expect(mockProgressBar.update).toHaveBeenCalledTimes(5);
    
    // Check that updates include progress info
    const updateCalls = mockProgressBar.update.mock.calls;
    expect(updateCalls[updateCalls.length - 1][0]).toBe(5);
    expect(updateCalls[updateCalls.length - 1][1]).toMatch(/5\/5 components/);

    expect(mockProgressBar.complete).toHaveBeenCalled();

    expect(result.success).toBe(true);
  });
});