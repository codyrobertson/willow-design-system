/**
 * Rollback handler for reverting transformations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { RollbackHandler, BackupInfo } from './index';

/**
 * Default implementation of rollback handler
 */
export class DefaultRollbackHandler implements RollbackHandler {
  private backupDir: string;
  private backups = new Map<string, BackupInfo>();

  constructor(backupDir: string = '.willow-backups') {
    this.backupDir = backupDir;
  }

  /**
   * Initialize the backup directory
   */
  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a backup before transformation
   */
  async createBackup(files: string[], description?: string): Promise<string> {
    await this.ensureBackupDir();

    const backupId = this.generateBackupId();
    const backupPath = path.join(this.backupDir, backupId);
    const timestamp = new Date();

    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true });

    // Copy files to backup
    const backedUpFiles: string[] = [];
    let totalSize = 0;

    for (const file of files) {
      try {
        // Read file content
        const content = await fs.readFile(file, 'utf-8');
        const stats = await fs.stat(file);
        totalSize += stats.size;

        // Create backup file path
        const relativePath = this.getRelativePath(file);
        const backupFilePath = path.join(backupPath, relativePath);

        // Ensure directory exists
        await fs.mkdir(path.dirname(backupFilePath), { recursive: true });

        // Write backup file
        await fs.writeFile(backupFilePath, content, 'utf-8');

        // Store metadata
        const metadataPath = `${backupFilePath}.meta`;
        await fs.writeFile(
          metadataPath,
          JSON.stringify({
            originalPath: file,
            permissions: stats.mode,
            timestamp: stats.mtime,
          }),
          'utf-8'
        );

        backedUpFiles.push(file);
      } catch (error) {
        console.error(`Failed to backup file ${file}:`, error);
      }
    }

    // Create backup info
    const backupInfo: BackupInfo = {
      id: backupId,
      timestamp,
      files: backedUpFiles,
      size: totalSize,
      description,
    };

    // Save backup metadata
    const metadataPath = path.join(backupPath, 'backup.json');
    await fs.writeFile(metadataPath, JSON.stringify(backupInfo, null, 2));

    // Store in memory
    this.backups.set(backupId, backupInfo);

    return backupId;
  }

  /**
   * Restore from a backup
   */
  async restore(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId);
    const metadataPath = path.join(backupPath, 'backup.json');

    // Load backup metadata
    let backupInfo: BackupInfo;
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      backupInfo = JSON.parse(metadataContent);
    } catch (error) {
      throw new Error(`Backup ${backupId} not found or corrupted`);
    }

    // Restore each file
    for (const originalPath of backupInfo.files) {
      try {
        const relativePath = this.getRelativePath(originalPath);
        const backupFilePath = path.join(backupPath, relativePath);

        // Read backup content
        const content = await fs.readFile(backupFilePath, 'utf-8');

        // Read file metadata
        const metadataPath = `${backupFilePath}.meta`;
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);

        // Ensure original directory exists
        await fs.mkdir(path.dirname(originalPath), { recursive: true });

        // Restore file
        await fs.writeFile(originalPath, content, 'utf-8');

        // Restore permissions
        if (metadata.permissions) {
          await fs.chmod(originalPath, metadata.permissions);
        }

        // Restore timestamp
        if (metadata.timestamp) {
          const timestamp = new Date(metadata.timestamp);
          await fs.utimes(originalPath, timestamp, timestamp);
        }
      } catch (error) {
        console.error(`Failed to restore file ${originalPath}:`, error);
        throw error;
      }
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    await this.ensureBackupDir();

    const backups: BackupInfo[] = [];
    
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const metadataPath = path.join(
              this.backupDir,
              entry.name,
              'backup.json'
            );
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const backupInfo = JSON.parse(metadataContent);
            backups.push(backupInfo);
          } catch {
            // Skip invalid backups
          }
        }
      }
    } catch (error) {
      console.error('Failed to list backups:', error);
    }

    // Sort by timestamp (newest first)
    backups.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return backups;
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId);

    try {
      await fs.rm(backupPath, { recursive: true, force: true });
      this.backups.delete(backupId);
    } catch (error) {
      throw new Error(`Failed to delete backup ${backupId}: ${error}`);
    }
  }

  /**
   * Delete old backups
   */
  async cleanupOldBackups(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const backups = await this.listBackups();
    const now = Date.now();

    for (const backup of backups) {
      const age = now - new Date(backup.timestamp).getTime();
      if (age > maxAge) {
        await this.deleteBackup(backup.id);
      }
    }
  }

  /**
   * Generate a unique backup ID
   */
  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const hash = createHash('sha256')
      .update(`${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 8);
    return `backup-${timestamp}-${hash}`;
  }

  /**
   * Get relative path for backup storage
   */
  private getRelativePath(filePath: string): string {
    // Get relative path from current working directory
    const relativePath = path.relative(process.cwd(), filePath);
    
    // If the file is outside cwd, use absolute path with drive letter replaced
    if (relativePath.startsWith('..')) {
      return filePath.replace(/^\//, '').replace(/^([A-Z]):/, '$1');
    }
    
    return relativePath;
  }
}

/**
 * Factory function to create a rollback handler
 */
export function createRollbackHandler(
  backupDir?: string
): RollbackHandler {
  return new DefaultRollbackHandler(backupDir);
}