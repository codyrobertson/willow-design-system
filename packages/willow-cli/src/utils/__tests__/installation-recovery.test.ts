/**
 * Installation Recovery Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstallationRecovery } from '../installation-recovery.js';
import * as fs from 'fs/promises';
import * as path from 'path';

vi.mock('fs/promises');

describe('InstallationRecovery', () => {
  let recovery: InstallationRecovery;
  const mockStateFile = '/test/.willow/recovery/installation.state';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up all filesystem mocks with defaults
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
    vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));
    
    recovery = new InstallationRecovery({
      stateFile: mockStateFile,
      maxCheckpoints: 10,
      autoCleanup: true,
      componentPath: '/test'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create recovery directory on initialization', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('Not found'));
      
      await recovery.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.dirname(mockStateFile),
        { recursive: true }
      );
    });

    it('should load existing state if available', async () => {
      const existingState = {
        sessionId: 'existing-session',
        startTime: Date.now() - 1000,
        lastCheckpoint: 2,
        checkpoints: [],
        completed: ['button'],
        failed: []
      };
      
      // Clear default mock and set specific one
      vi.mocked(fs.readFile).mockClear();
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingState));

      await recovery.initialize();
      
      const status = await recovery.getSessionStatus('existing-session');
      expect(status).not.toBeNull();
      expect(status?.sessionId).toBe('existing-session');
      expect(status?.completed).toEqual(['button']);
    });
  });

  describe('session management', () => {
    it('should start a new recovery session', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const sessionId = await recovery.startSession();

      expect(sessionId).toMatch(/^recovery-\d+-[a-z0-9]+$/);
      expect(fs.writeFile).toHaveBeenCalledWith(
        mockStateFile,
        expect.stringContaining(sessionId),
        'utf-8'
      );
    });

    it('should get current session status', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const sessionId = await recovery.startSession();
      const status = await recovery.getSessionStatus();

      expect(status).toBeDefined();
      expect(status?.sessionId).toBe(sessionId);
      expect(status?.checkpoints).toEqual([]);
      expect(status?.completed).toEqual([]);
      expect(status?.failed).toEqual([]);
    });
  });

  describe('checkpoint creation', () => {
    beforeEach(async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      await recovery.startSession();
    });

    it('should create checkpoint for install action', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('Not found'));
      
      const checkpointId = await recovery.createCheckpoint(
        'button',
        'install',
        '/test/components/button/index.tsx'
      );

      expect(checkpointId).toMatch(/^recovery-\d+-[a-z0-9]+-1$/);
      expect(fs.writeFile).toHaveBeenLastCalledWith(
        mockStateFile,
        expect.stringContaining('"component": "button"'),
        'utf-8'
      );
    });

    it('should capture previous state for existing files', async () => {
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);
      vi.mocked(fs.readFile).mockResolvedValueOnce('existing content');

      const checkpointId = await recovery.createCheckpoint(
        'button',
        'update',
        '/test/components/button/index.tsx'
      );

      const writeCall = vi.mocked(fs.writeFile).mock.calls[1]; // Use second call which has the checkpoint
      const state = JSON.parse(writeCall[1] as string);
      const checkpoint = state.checkpoints[0];

      expect(checkpoint.previousState.existed).toBe(true);
      expect(checkpoint.previousState.content).toBe('existing content');
    });

    it('should handle non-existent files', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('Not found'));

      const checkpointId = await recovery.createCheckpoint(
        'newComponent',
        'install',
        '/test/components/newComponent/index.tsx'
      );

      const writeCall = vi.mocked(fs.writeFile).mock.calls[1]; // Use second call which has the checkpoint
      const state = JSON.parse(writeCall[1] as string);
      const checkpoint = state.checkpoints[0];

      expect(checkpoint.previousState.existed).toBe(false);
      expect(checkpoint.previousState.content).toBeUndefined();
    });

    it('should limit checkpoint history', async () => {
      // Create recovery with max 3 checkpoints
      recovery = new InstallationRecovery({
        stateFile: mockStateFile,
        maxCheckpoints: 3,
        autoCleanup: true
      });
      
      await recovery.startSession();

      // Create 4 checkpoints
      for (let i = 0; i < 4; i++) {
        await recovery.createCheckpoint(
          `component-${i}`,
          'install',
          `/test/components/component-${i}/index.tsx`
        );
      }

      const writeCall = vi.mocked(fs.writeFile).mock.lastCall;
      const state = JSON.parse(writeCall![1] as string);

      expect(state.checkpoints).toHaveLength(3);
      expect(state.checkpoints[0].component).toBe('component-1');
      expect(state.checkpoints[2].component).toBe('component-3');
    });
  });

  describe('checkpoint updates', () => {
    let checkpointId: string;

    beforeEach(async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      await recovery.startSession();
      checkpointId = await recovery.createCheckpoint('button', 'install', '/test/button.tsx');
    });

    it('should update checkpoint to in-progress', async () => {
      await recovery.updateCheckpoint(checkpointId, 'in-progress');

      const writeCall = vi.mocked(fs.writeFile).mock.lastCall;
      const state = JSON.parse(writeCall![1] as string);
      
      expect(state.checkpoints[0].status).toBe('in-progress');
    });

    it('should update checkpoint to completed', async () => {
      await recovery.updateCheckpoint(checkpointId, 'completed');

      const writeCall = vi.mocked(fs.writeFile).mock.lastCall;
      const state = JSON.parse(writeCall![1] as string);
      
      expect(state.checkpoints[0].status).toBe('completed');
      expect(state.completed).toContain('button');
    });

    it('should update checkpoint to failed with error', async () => {
      await recovery.updateCheckpoint(checkpointId, 'failed', 'Network error');

      const writeCall = vi.mocked(fs.writeFile).mock.lastCall;
      const state = JSON.parse(writeCall![1] as string);
      
      expect(state.checkpoints[0].status).toBe('failed');
      expect(state.checkpoints[0].error).toBe('Network error');
      expect(state.failed).toContain('button');
    });

    it('should throw error for non-existent checkpoint', async () => {
      await expect(
        recovery.updateCheckpoint('invalid-id', 'completed')
      ).rejects.toThrow('Checkpoint invalid-id not found');
    });
  });

  describe('recovery process', () => {
    beforeEach(async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      await recovery.startSession();
    });

    it('should recover failed checkpoints', async () => {
      // Create checkpoints
      const checkpoint1 = await recovery.createCheckpoint('button', 'install', '/test/button.tsx');
      const checkpoint2 = await recovery.createCheckpoint('input', 'install', '/test/input.tsx');
      
      // Mark one as failed
      await recovery.updateCheckpoint(checkpoint1, 'failed');
      await recovery.updateCheckpoint(checkpoint2, 'completed');

      // Mock file operations for recovery
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const result = await recovery.recover();

      expect(result.recovered).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should rollback installations during recovery', async () => {
      // Create checkpoint for install with no previous state
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('Not found'));
      const checkpointId = await recovery.createCheckpoint('button', 'install', '/test/button.tsx');
      await recovery.updateCheckpoint(checkpointId, 'failed');

      // Mock recovery operations
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await recovery.recover();

      // Should remove the installed file
      expect(fs.unlink).toHaveBeenCalledWith('/test/button.tsx');
    });

    it('should restore previous content during recovery', async () => {
      // Create checkpoint for update with previous content
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);
      vi.mocked(fs.readFile).mockResolvedValueOnce('old content');
      
      const checkpointId = await recovery.createCheckpoint('button', 'update', '/test/button.tsx');
      await recovery.updateCheckpoint(checkpointId, 'failed');

      // Mock recovery operations
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await recovery.recover();

      // Should restore old content
      expect(fs.writeFile).toHaveBeenCalledWith('/test/button.tsx', 'old content', 'utf-8');
    });

    it('should handle recovery errors gracefully', async () => {
      const checkpointId = await recovery.createCheckpoint('button', 'install', '/test/button.tsx');
      await recovery.updateCheckpoint(checkpointId, 'failed');

      // Mock recovery failure
      vi.mocked(fs.unlink).mockRejectedValueOnce(new Error('Permission denied'));

      const result = await recovery.recover();

      expect(result.recovered).toBe(1); // Recovery succeeds even if fs.unlink fails (it's caught)
      expect(result.failed).toBe(0);
    });

    it('should clean up session after successful recovery', async () => {
      const sessionId = await recovery.getSessionStatus()?.then(s => s?.sessionId);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await recovery.recover();

      expect(fs.unlink).toHaveBeenCalledWith(mockStateFile);
    });
  });

  describe('session listing and cleanup', () => {
    it('should list recovery sessions', async () => {
      const mockState = {
        sessionId: 'test-session',
        startTime: Date.now() - 1000,
        lastCheckpoint: 2,
        checkpoints: [
          { status: 'completed' },
          { status: 'failed' }
        ],
        completed: ['button'],
        failed: ['input']
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(mockState));

      const sessions = await recovery.listSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        sessionId: 'test-session',
        totalCheckpoints: 2,
        completed: 1,
        failed: 1
      });
    });

    it('should clean up old sessions', async () => {
      const oldSession = {
        sessionId: 'old-session',
        startTime: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days old
        checkpoints: [],
        completed: [],
        failed: []
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(oldSession));
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const cleaned = await recovery.cleanupOldSessions();

      expect(cleaned).toBe(1);
      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('recovery reports', () => {
    it('should export recovery report', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      const sessionId = await recovery.startSession();
      await recovery.createCheckpoint('button', 'install', '/test/button.tsx');
      
      // Mock reading the session state for export
      const lastWriteCall = vi.mocked(fs.writeFile).mock.lastCall;
      vi.mocked(fs.readFile).mockResolvedValueOnce(lastWriteCall![1] as string);
      
      await recovery.exportReport(sessionId, '/tmp/report.json');

      const writeCall = vi.mocked(fs.writeFile).mock.lastCall;
      const report = JSON.parse(writeCall![1] as string);

      expect(report.session.id).toBe(sessionId);
      expect(report.checkpoints).toHaveLength(1);
      expect(report.summary).toBeDefined();
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        recovery.exportReport('invalid-session', '/tmp/report.json')
      ).rejects.toThrow('Session invalid-session not found');
    });
  });

  describe('edge cases', () => {
    it('should handle operations without active session', async () => {
      await expect(
        recovery.createCheckpoint('button', 'install', '/test/button.tsx')
      ).rejects.toThrow('No active recovery session');
    });

    it('should handle empty recovery', async () => {
      await recovery.startSession();
      const result = await recovery.recover();

      expect(result.recovered).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should handle concurrent checkpoints', async () => {
      await recovery.startSession();
      
      const promises = Array.from({ length: 5 }, (_, i) =>
        recovery.createCheckpoint(`component-${i}`, 'install', `/test/component-${i}.tsx`)
      );

      const checkpointIds = await Promise.all(promises);

      expect(checkpointIds).toHaveLength(5);
      expect(new Set(checkpointIds).size).toBe(5); // All unique
    });
  });
});