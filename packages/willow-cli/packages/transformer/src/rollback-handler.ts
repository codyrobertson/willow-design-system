/**
 * Rollback Handler Implementation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { RollbackHandler, BackupInfo } from './index';

/**
 * Default implementation of rollback handler
 */
export class DefaultRollbackHandler implements RollbackHandler {
  constructor(private backupDir: string) {}

  /**
   * Create a backup before transformation
   */
  async createBackup(files: string[], description?: string): Promise<string> {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString('hex');
    const backupId = `backup-${timestamp}-${hash}`;
    const backupPath = path.join(this.backupDir, backupId);

    // Ensure backup directory exists
    await fs.mkdir(backupPath, { recursive: true });

    const backupInfo: BackupInfo = {
      id: backupId,
      timestamp: new Date(),
      files: [],
      size: 0,
      description,
    };

    // Backup each file
    for (const filePath of files) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const content = await fs.readFile(filePath);
          const relativePath = path.relative(process.cwd(), filePath);
          const backupFilePath = path.join(backupPath, relativePath);
          
          // Ensure directory structure exists
          await fs.mkdir(path.dirname(backupFilePath), { recursive: true });
          
          // Save file content
          await fs.writeFile(backupFilePath, content);
          
          // Save file metadata
          const metadataPath = backupFilePath + '.meta';
          const metadata = {
            originalPath: filePath,
            permissions: stats.mode,
            timestamp: stats.mtime,
            size: stats.size,
          };
          await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
          
          backupInfo.files.push(filePath);
          backupInfo.size += stats.size;
        }
      } catch (error) {
        // Skip files that don't exist or can't be read
        console.warn(`Failed to backup ${filePath}:`, error);
      }
    }

    // Save backup metadata
    const metadataPath = path.join(backupPath, 'backup.json');
    await fs.writeFile(metadataPath, JSON.stringify(backupInfo, null, 2));

    return backupId;
  }

  /**
   * Restore from a backup
   */
  async restore(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId);
    const metadataPath = path.join(backupPath, 'backup.json');

    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const backupInfo: BackupInfo = JSON.parse(metadataContent);

      for (const originalPath of backupInfo.files) {
        const relativePath = path.relative(process.cwd(), originalPath);
        const backupFilePath = path.join(backupPath, relativePath);
        const metadataFilePath = backupFilePath + '.meta';

        try {
          // Restore file content
          const content = await fs.readFile(backupFilePath);
          
          // Ensure directory exists
          await fs.mkdir(path.dirname(originalPath), { recursive: true });
          
          // Write file
          await fs.writeFile(originalPath, content);

          // Restore file metadata if available
          try {
            const metadataContent = await fs.readFile(metadataFilePath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            await fs.chmod(originalPath, metadata.permissions);
            await fs.utimes(originalPath, new Date(), new Date(metadata.timestamp));
          } catch {
            // Ignore metadata restore errors
          }
        } catch (error) {
          console.warn(`Failed to restore ${originalPath}:`, error);
        }
      }
    } catch (error) {
      throw new Error(`Backup ${backupId} not found or corrupted`);
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backups: BackupInfo[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = path.join(this.backupDir, entry.name, 'backup.json');
          
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const backupInfo: BackupInfo = JSON.parse(metadataContent);
            backups.push(backupInfo);
          } catch {
            // Skip invalid backups
          }
        }
      }

      // Sort by timestamp, newest first
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId);
    await fs.rm(backupPath, { recursive: true, force: true });
  }

  /**
   * Cleanup old backups
   */
  async cleanupOldBackups(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const backups = await this.listBackups();
    const cutoffTime = Date.now() - maxAge;

    for (const backup of backups) {
      if (new Date(backup.timestamp).getTime() < cutoffTime) {
        await this.deleteBackup(backup.id);
      }
    }
  }
}

/**
 * Factory function to create a rollback handler
 */
export function createRollbackHandler(backupDir: string): DefaultRollbackHandler {
  return new DefaultRollbackHandler(backupDir);
}