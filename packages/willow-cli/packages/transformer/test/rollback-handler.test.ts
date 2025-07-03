/**
 * Tests for rollback handler
 * Task 5.6: Develop rollback mechanism
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DefaultRollbackHandler } from '../src/rollback-handler';
import { BackupInfo } from '../src/index';

describe('DefaultRollbackHandler', () => {
  let handler: DefaultRollbackHandler;
  const testDir = path.join(process.cwd(), '.test-backups');
  const testFilesDir = path.join(process.cwd(), '.test-files');

  beforeEach(async () => {
    // Create test handler
    handler = new DefaultRollbackHandler(testDir);

    // Create test files directory
    await fs.mkdir(testFilesDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.rm(testFilesDir, { recursive: true, force: true });
    } catch {
      // Ignore errors during cleanup
    }
  });

  describe('createBackup', () => {
    it('should create a backup of specified files', async () => {
      // Create test files
      const file1 = path.join(testFilesDir, 'file1.ts');
      const file2 = path.join(testFilesDir, 'subdir/file2.ts');

      await fs.writeFile(file1, 'export const a = 1;');
      await fs.mkdir(path.dirname(file2), { recursive: true });
      await fs.writeFile(file2, 'export const b = 2;');

      // Create backup
      const backupId = await handler.createBackup([file1, file2], 'Test backup');

      expect(backupId).toMatch(/^backup-\d+-[a-f0-9]{8}$/);

      // Verify backup directory exists
      const backupPath = path.join(testDir, backupId);
      const stats = await fs.stat(backupPath);
      expect(stats.isDirectory()).toBe(true);

      // Verify backup metadata exists
      const metadataPath = path.join(backupPath, 'backup.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupInfo = JSON.parse(metadataContent);

      expect(metadata.id).toBe(backupId);
      expect(metadata.files).toHaveLength(2);
      expect(metadata.files).toContain(file1);
      expect(metadata.files).toContain(file2);
      expect(metadata.description).toBe('Test backup');
    });

    it('should handle empty file list', async () => {
      const backupId = await handler.createBackup([], 'Empty backup');

      expect(backupId).toMatch(/^backup-\d+-[a-f0-9]{8}$/);

      const metadataPath = path.join(testDir, backupId, 'backup.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupInfo = JSON.parse(metadataContent);

      expect(metadata.files).toHaveLength(0);
    });

    it('should handle non-existent files gracefully', async () => {
      const existingFile = path.join(testFilesDir, 'exists.ts');
      const nonExistentFile = path.join(testFilesDir, 'does-not-exist.ts');

      await fs.writeFile(existingFile, 'export const x = 1;');

      const backupId = await handler.createBackup(
        [existingFile, nonExistentFile],
        'Partial backup'
      );

      const metadataPath = path.join(testDir, backupId, 'backup.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupInfo = JSON.parse(metadataContent);

      // Should only backup the existing file
      expect(metadata.files).toHaveLength(1);
      expect(metadata.files).toContain(existingFile);
    });

    it('should preserve file metadata', async () => {
      const testFile = path.join(testFilesDir, 'metadata.ts');
      await fs.writeFile(testFile, 'export const meta = true;');

      // Set specific permissions
      await fs.chmod(testFile, 0o644);

      const backupId = await handler.createBackup([testFile]);

      // Check that metadata was saved
      const relativePath = path.relative(process.cwd(), testFile);
      const metadataPath = path.join(testDir, backupId, relativePath + '.meta');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);

      expect(metadata.originalPath).toBe(testFile);
      expect(metadata.permissions).toBeDefined();
      expect(metadata.timestamp).toBeDefined();
    });
  });

  describe('restore', () => {
    it('should restore files from backup', async () => {
      // Create test files
      const file1 = path.join(testFilesDir, 'restore1.ts');
      const file2 = path.join(testFilesDir, 'restore2.ts');

      await fs.writeFile(file1, 'original content 1');
      await fs.writeFile(file2, 'original content 2');

      // Create backup
      const backupId = await handler.createBackup([file1, file2]);

      // Modify files
      await fs.writeFile(file1, 'modified content 1');
      await fs.writeFile(file2, 'modified content 2');

      // Restore from backup
      await handler.restore(backupId);

      // Verify files were restored
      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');

      expect(content1).toBe('original content 1');
      expect(content2).toBe('original content 2');
    });

    it('should restore deleted files', async () => {
      const testFile = path.join(testFilesDir, 'to-delete.ts');
      await fs.writeFile(testFile, 'will be deleted');

      // Create backup
      const backupId = await handler.createBackup([testFile]);

      // Delete file
      await fs.unlink(testFile);

      // Verify file is gone
      await expect(fs.access(testFile)).rejects.toThrow();

      // Restore from backup
      await handler.restore(backupId);

      // Verify file was restored
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('will be deleted');
    });

    it('should recreate directory structure', async () => {
      const deepFile = path.join(testFilesDir, 'deep/nested/dir/file.ts');
      await fs.mkdir(path.dirname(deepFile), { recursive: true });
      await fs.writeFile(deepFile, 'deep content');

      // Create backup
      const backupId = await handler.createBackup([deepFile]);

      // Delete entire directory structure
      await fs.rm(path.join(testFilesDir, 'deep'), { recursive: true });

      // Restore from backup
      await handler.restore(backupId);

      // Verify file and directory structure were restored
      const content = await fs.readFile(deepFile, 'utf-8');
      expect(content).toBe('deep content');
    });

    it('should throw error for non-existent backup', async () => {
      await expect(handler.restore('non-existent-backup')).rejects.toThrow(
        'Backup non-existent-backup not found or corrupted'
      );
    });
  });

  describe('listBackups', () => {
    it('should list all backups sorted by timestamp', async () => {
      const testFile = path.join(testFilesDir, 'list-test.ts');
      await fs.writeFile(testFile, 'content');

      // Create multiple backups with delays
      const backup1 = await handler.createBackup([testFile], 'First backup');
      await new Promise(resolve => setTimeout(resolve, 10));
      const backup2 = await handler.createBackup([testFile], 'Second backup');
      await new Promise(resolve => setTimeout(resolve, 10));
      const backup3 = await handler.createBackup([testFile], 'Third backup');

      // List backups
      const backups = await handler.listBackups();

      expect(backups).toHaveLength(3);
      // Should be sorted newest first
      expect(backups[0].id).toBe(backup3);
      expect(backups[1].id).toBe(backup2);
      expect(backups[2].id).toBe(backup1);
    });

    it('should handle empty backup directory', async () => {
      const backups = await handler.listBackups();
      expect(backups).toHaveLength(0);
    });

    it('should skip invalid backups', async () => {
      // Create a valid backup
      const testFile = path.join(testFilesDir, 'valid.ts');
      await fs.writeFile(testFile, 'content');
      await handler.createBackup([testFile], 'Valid backup');

      // Create an invalid backup directory
      const invalidBackupPath = path.join(testDir, 'invalid-backup');
      await fs.mkdir(invalidBackupPath, { recursive: true });
      await fs.writeFile(
        path.join(invalidBackupPath, 'backup.json'),
        'invalid json content'
      );

      // List should only return valid backups
      const backups = await handler.listBackups();
      expect(backups).toHaveLength(1);
      expect(backups[0].description).toBe('Valid backup');
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup', async () => {
      const testFile = path.join(testFilesDir, 'delete-test.ts');
      await fs.writeFile(testFile, 'content');

      // Create backup
      const backupId = await handler.createBackup([testFile]);

      // Verify backup exists
      const backupPath = path.join(testDir, backupId);
      await expect(fs.access(backupPath)).resolves.not.toThrow();

      // Delete backup
      await handler.deleteBackup(backupId);

      // Verify backup is gone
      await expect(fs.access(backupPath)).rejects.toThrow();
    });

    it('should handle non-existent backup deletion gracefully', async () => {
      // With force: true, fs.rm doesn't throw for non-existent paths
      // This is actually the desired behavior - idempotent deletion
      await expect(handler.deleteBackup('non-existent')).resolves.not.toThrow();
    });
  });

  describe('cleanupOldBackups', () => {
    it('should delete backups older than specified age', async () => {
      const testFile = path.join(testFilesDir, 'cleanup-test.ts');
      await fs.writeFile(testFile, 'content');

      // Create multiple backups
      const backup1 = await handler.createBackup([testFile], 'Old backup');
      await new Promise(resolve => setTimeout(resolve, 10));
      const backup2 = await handler.createBackup([testFile], 'Recent backup');

      // Manually modify the timestamp of the first backup to make it old
      const metadataPath1 = path.join(testDir, backup1, 'backup.json');
      const metadata1 = JSON.parse(await fs.readFile(metadataPath1, 'utf-8'));
      metadata1.timestamp = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days old
      await fs.writeFile(metadataPath1, JSON.stringify(metadata1, null, 2));

      // Cleanup backups older than 7 days
      await handler.cleanupOldBackups(7 * 24 * 60 * 60 * 1000);

      // List remaining backups
      const backups = await handler.listBackups();
      expect(backups).toHaveLength(1);
      expect(backups[0].id).toBe(backup2);
    });

    it('should not delete recent backups', async () => {
      const testFile = path.join(testFilesDir, 'keep-test.ts');
      await fs.writeFile(testFile, 'content');

      // Create recent backups
      await handler.createBackup([testFile], 'Backup 1');
      await handler.createBackup([testFile], 'Backup 2');

      // Cleanup with default age (7 days)
      await handler.cleanupOldBackups();

      // All backups should remain
      const backups = await handler.listBackups();
      expect(backups).toHaveLength(2);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle backup and restore workflow', async () => {
      // Create multiple files
      const files = [
        path.join(testFilesDir, 'src/index.ts'),
        path.join(testFilesDir, 'src/utils.ts'),
        path.join(testFilesDir, 'tests/index.test.ts'),
      ];

      for (const file of files) {
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, `// Original content of ${path.basename(file)}`);
      }

      // Create backup
      const backupId = await handler.createBackup(files, 'Pre-transformation backup');

      // Simulate transformation
      for (const file of files) {
        await fs.writeFile(file, `// Transformed content of ${path.basename(file)}`);
      }

      // Verify transformation
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).toContain('Transformed content');
      }

      // Restore from backup
      await handler.restore(backupId);

      // Verify restoration
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).toContain('Original content');
      }
    });

    it('should handle concurrent backups', async () => {
      const file1 = path.join(testFilesDir, 'concurrent1.ts');
      const file2 = path.join(testFilesDir, 'concurrent2.ts');

      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');

      // Create concurrent backups
      const [backup1, backup2] = await Promise.all([
        handler.createBackup([file1], 'Backup 1'),
        handler.createBackup([file2], 'Backup 2'),
      ]);

      expect(backup1).toBeDefined();
      expect(backup2).toBeDefined();
      expect(backup1).not.toBe(backup2);

      // Verify both backups exist
      const backups = await handler.listBackups();
      expect(backups).toHaveLength(2);
    });
  });
});