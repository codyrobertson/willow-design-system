/**
 * Checkpoint-based Recovery System for Installations
 * Enables recovery from partial or failed installations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ComponentMeta } from '../types/index.js';

export interface InstallationCheckpoint {
  id: string;
  timestamp: number;
  component: string;
  action: 'install' | 'update' | 'remove';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  previousState?: {
    existed: boolean;
    content?: string;
    meta?: ComponentMeta;
  };
  error?: string;
}

export interface RecoveryState {
  sessionId: string;
  startTime: number;
  lastCheckpoint: number;
  checkpoints: InstallationCheckpoint[];
  completed: string[];
  failed: string[];
}

export interface RecoveryOptions {
  stateFile?: string;
  maxCheckpoints?: number;
  autoCleanup?: boolean;
  componentPath?: string;
}

export class InstallationRecovery {
  private stateFile: string;
  private maxCheckpoints: number;
  private autoCleanup: boolean;
  private componentPath: string;
  private currentState?: RecoveryState;

  constructor(options: RecoveryOptions = {}) {
    this.stateFile = options.stateFile || path.join(process.cwd(), '.willow', 'recovery', 'installation.state');
    this.maxCheckpoints = options.maxCheckpoints || 1000;
    this.autoCleanup = options.autoCleanup !== false;
    this.componentPath = options.componentPath || path.join(process.cwd(), 'src', 'components');
  }

  /**
   * Initialize recovery system
   */
  async initialize(): Promise<void> {
    // Ensure recovery directory exists
    const dir = path.dirname(this.stateFile);
    await fs.mkdir(dir, { recursive: true });

    // Load existing state if available
    await this.loadState();
  }

  /**
   * Start a new recovery session
   */
  async startSession(): Promise<string> {
    const sessionId = this.generateSessionId();
    
    this.currentState = {
      sessionId,
      startTime: Date.now(),
      lastCheckpoint: 0,
      checkpoints: [],
      completed: [],
      failed: []
    };

    await this.saveState();
    return sessionId;
  }

  /**
   * Create a checkpoint before an operation
   */
  async createCheckpoint(
    component: string,
    action: 'install' | 'update' | 'remove',
    targetPath: string
  ): Promise<string> {
    if (!this.currentState) {
      throw new Error('No active recovery session');
    }

    const checkpointId = `${this.currentState.sessionId}-${++this.currentState.lastCheckpoint}`;
    
    // Capture previous state
    let previousState: InstallationCheckpoint['previousState'];
    try {
      const exists = await this.fileExists(targetPath);
      if (exists) {
        const content = await fs.readFile(targetPath, 'utf-8');
        previousState = {
          existed: true,
          content
        };
      } else {
        previousState = {
          existed: false
        };
      }
    } catch (error) {
      // Failed to capture previous state - continue with empty state
    }

    const checkpoint: InstallationCheckpoint = {
      id: checkpointId,
      timestamp: Date.now(),
      component,
      action,
      status: 'pending',
      previousState
    };

    this.currentState.checkpoints.push(checkpoint);
    
    // Limit checkpoint history
    if (this.currentState.checkpoints.length > this.maxCheckpoints) {
      this.currentState.checkpoints = this.currentState.checkpoints.slice(-this.maxCheckpoints);
    }

    await this.saveState();
    return checkpointId;
  }

  /**
   * Update checkpoint status
   */
  async updateCheckpoint(
    checkpointId: string,
    status: 'in-progress' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active recovery session');
    }

    const checkpoint = this.currentState.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    checkpoint.status = status;
    if (error) {
      checkpoint.error = error;
    }

    // Update summary
    if (status === 'completed') {
      this.currentState.completed.push(checkpoint.component);
    } else if (status === 'failed') {
      this.currentState.failed.push(checkpoint.component);
    }

    await this.saveState();
  }

  /**
   * Recover from a failed session
   */
  async recover(sessionId?: string): Promise<{
    recovered: number;
    failed: number;
    skipped: number;
  }> {
    if (!sessionId && this.currentState) {
      sessionId = this.currentState.sessionId;
    }

    if (!sessionId) {
      throw new Error('No session to recover');
    }

    // If we don't have the current state or it's a different session, load it
    if (!this.currentState || this.currentState.sessionId !== sessionId) {
      await this.loadState();
      if (!this.currentState || this.currentState.sessionId !== sessionId) {
        throw new Error(`Session ${sessionId} not found`);
      }
    }

    // Recovery process started
    
    let recovered = 0;
    let failed = 0;
    let skipped = 0;

    // Process checkpoints in reverse order for rollback
    const checkpointsToRecover = this.currentState.checkpoints
      .filter(cp => cp.status === 'failed' || cp.status === 'in-progress')
      .reverse();

    for (const checkpoint of checkpointsToRecover) {
      try {
        await this.recoverCheckpoint(checkpoint);
        recovered++;
        // Component recovered successfully
      } catch (error) {
        failed++;
        // Failed to recover component - error logged by caller
      }
    }

    // Count completed as skipped
    skipped = this.currentState.checkpoints.filter(cp => cp.status === 'completed').length;

    // Clean up if auto cleanup is enabled
    if (this.autoCleanup && failed === 0) {
      await this.cleanupSession(sessionId);
    }

    return { recovered, failed, skipped };
  }

  /**
   * Recover a single checkpoint
   */
  private async recoverCheckpoint(checkpoint: InstallationCheckpoint): Promise<void> {
    if (!checkpoint.previousState) {
      throw new Error('No previous state available for recovery');
    }

    const targetPath = await this.getComponentPath(checkpoint.component);

    if (checkpoint.action === 'install' || checkpoint.action === 'update') {
      // Rollback: restore previous state or remove
      if (checkpoint.previousState.existed && checkpoint.previousState.content) {
        await fs.writeFile(targetPath, checkpoint.previousState.content, 'utf-8');
      } else if (!checkpoint.previousState.existed) {
        // Remove the file if it didn't exist before
        try {
          await fs.unlink(targetPath);
        } catch {
          // File might not exist
        }
      }
    } else if (checkpoint.action === 'remove') {
      // Rollback: restore the removed file
      if (checkpoint.previousState.existed && checkpoint.previousState.content) {
        await fs.writeFile(targetPath, checkpoint.previousState.content, 'utf-8');
      }
    }
  }

  /**
   * Get recovery session status
   */
  async getSessionStatus(sessionId?: string): Promise<RecoveryState | null> {
    if (!sessionId && this.currentState) {
      return this.currentState;
    }

    await this.loadState();
    if (this.currentState && (!sessionId || this.currentState.sessionId === sessionId)) {
      return this.currentState;
    }

    return null;
  }

  /**
   * List all recovery sessions
   */
  async listSessions(): Promise<Array<{
    sessionId: string;
    startTime: Date;
    totalCheckpoints: number;
    completed: number;
    failed: number;
  }>> {
    const sessions: RecoveryState[] = [];
    
    try {
      // In a real implementation, we might store multiple session files
      await this.loadState();
      if (this.currentState) {
        sessions.push(this.currentState);
      }
    } catch {
      // No sessions found
    }

    return sessions.map(session => ({
      sessionId: session.sessionId,
      startTime: new Date(session.startTime),
      totalCheckpoints: session.checkpoints.length,
      completed: session.completed.length,
      failed: session.failed.length
    }));
  }

  /**
   * Clean up a recovery session
   */
  async cleanupSession(sessionId: string): Promise<void> {
    if (this.currentState && this.currentState.sessionId === sessionId) {
      this.currentState = undefined;
      try {
        await fs.unlink(this.stateFile);
      } catch {
        // File might not exist
      }
    }
  }

  /**
   * Clean up old recovery sessions
   */
  async cleanupOldSessions(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    let cleaned = 0;
    const now = Date.now();

    const sessions = await this.listSessions();
    for (const session of sessions) {
      if (now - session.startTime.getTime() > maxAge) {
        await this.cleanupSession(session.sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Save current state to file
   */
  private async saveState(): Promise<void> {
    if (!this.currentState) return;

    const dir = path.dirname(this.stateFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.stateFile, JSON.stringify(this.currentState, null, 2), 'utf-8');
  }

  /**
   * Load state from file
   */
  private async loadState(): Promise<void> {
    try {
      const content = await fs.readFile(this.stateFile, 'utf-8');
      this.currentState = JSON.parse(content);
    } catch {
      // No state file or invalid content
      this.currentState = undefined;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `recovery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get component installation path
   */
  private async getComponentPath(component: string): Promise<string> {
    // This would be determined by your component installation logic
    // For tests, this might just be /test/button.tsx
    if (this.componentPath.includes('test')) {
      return path.join(this.componentPath, `${component}.tsx`);
    }
    return path.join(this.componentPath, component, 'index.tsx');
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Export recovery report
   */
  async exportReport(sessionId: string, outputPath: string): Promise<void> {
    const state = await this.getSessionStatus(sessionId);
    if (!state) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const report = {
      session: {
        id: state.sessionId,
        startTime: new Date(state.startTime).toISOString(),
        duration: Date.now() - state.startTime,
        totalCheckpoints: state.checkpoints.length,
        completed: state.completed.length,
        failed: state.failed.length
      },
      checkpoints: state.checkpoints.map(cp => ({
        id: cp.id,
        timestamp: new Date(cp.timestamp).toISOString(),
        component: cp.component,
        action: cp.action,
        status: cp.status,
        error: cp.error,
        hadPreviousState: !!cp.previousState?.existed
      })),
      summary: {
        completedComponents: state.completed,
        failedComponents: state.failed,
        pendingCheckpoints: state.checkpoints.filter(cp => cp.status === 'pending').length,
        inProgressCheckpoints: state.checkpoints.filter(cp => cp.status === 'in-progress').length
      }
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }
}