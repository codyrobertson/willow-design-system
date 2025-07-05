/**
 * Migrate Command
 * Handles configuration and project migrations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseCommand } from '../../core/commands/BaseCommand.js';
import { CommandContext } from '../../core/commands/CommandRegistry.js';
import { 
  createDefaultMigrationManager,
  VersionDetector,
  getCompatibilityMode,
  ConfigMigrationError 
} from '../../core/compatibility/index.js';

export interface MigrateOptions {
  config?: string;
  target?: string;
  backup?: boolean;
  dryRun?: boolean;
  force?: boolean;
  auto?: boolean;
}

export class MigrateCommand extends BaseCommand<MigrateOptions> {
  constructor() {
    super({
      name: 'migrate',
      description: 'Migrate configuration and project structure to latest version',
      category: 'maintenance',
      aliases: ['upgrade'],
    });
  }

  configureOptions(command: Command): void {
    command
      .option('-c, --config <path>', 'path to configuration file')
      .option('-t, --target <version>', 'target version to migrate to')
      .option('--no-backup', 'skip creating backup')
      .option('-d, --dry-run', 'preview migration without applying changes')
      .option('-f, --force', 'force migration even if warnings exist')
      .option('-a, --auto', 'automatically migrate without prompts');
  }

  async execute(context: CommandContext, options: MigrateOptions): Promise<void> {
    const { logger, progress } = context;
    
    logger.info(chalk.bold('🔄 Willow CLI Migration'));
    
    // Find config file
    const configPath = options.config || await this.findConfigFile();
    if (!configPath) {
      throw new Error('No configuration file found');
    }

    logger.info(`Found config: ${chalk.cyan(configPath)}`);

    // Detect current version
    progress.start('Detecting configuration version...');
    const detector = new VersionDetector();
    const detection = await detector.detectVersion(path.dirname(configPath));
    progress.stop();
    
    if (!detection.success || !detection.versionInfo) {
      throw new Error('Failed to detect configuration version');
    }

    const versionInfo = detection.versionInfo;
    logger.info(`Current version: ${chalk.yellow(versionInfo.configVersion)}`);
    logger.info(`Config format: ${chalk.yellow(versionInfo.configFormat)}`);

    // Determine target version
    const targetVersion = options.target || await this.getLatestVersion();
    logger.info(`Target version: ${chalk.green(targetVersion)}`);

    // Check if migration is needed
    const migrationManager = createDefaultMigrationManager();
    if (!migrationManager.needsMigration(versionInfo.configVersion, targetVersion)) {
      logger.success('Configuration is already up to date');
      return;
    }

    // Get available migrations
    const availableMigrations = migrationManager.getAvailableMigrations()
      .filter(m => 
        migrationManager.needsMigration(versionInfo.configVersion, m.toVersion) &&
        migrationManager.needsMigration(m.fromVersion, targetVersion)
      );

    if (availableMigrations.length === 0) {
      logger.warn('No migration path available');
      return;
    }

    // Show migration plan
    logger.info(chalk.bold('\n📋 Migration Plan:'));
    availableMigrations.forEach(migration => {
      logger.info(chalk.gray(`  ${migration.fromVersion} → ${migration.toVersion}: ${migration.description}`));
    });

    // Confirm migration
    if (!options.auto && !options.dryRun) {
      const confirmed = await context.globalOptions.prompts?.confirm(
        'Do you want to proceed with the migration?',
        true
      );
      
      if (!confirmed) {
        logger.info('Migration cancelled');
        return;
      }
    }

    // Load current config
    progress.start('Loading configuration...');
    let currentConfig: any;
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      currentConfig = JSON.parse(configContent);
    } catch (error) {
      progress.stop();
      throw new Error(`Failed to read configuration file: ${error}`);
    }
    progress.stop();

    // Perform migration
    progress.start('Applying migrations...');
    
    try {
      const result = await migrationManager.migrate(
        currentConfig,
        versionInfo.configVersion,
        targetVersion,
        {
          createBackup: options.backup !== false,
          dryRun: options.dryRun,
          validateResult: true,
        }
      );

      progress.stop();

      if (!result.success) {
        throw new Error(`Migration failed: ${result.errors?.join(', ')}`);
      }

      // Show results
      logger.success('Migrations applied:');
      result.migrationsApplied.forEach(migration => {
        logger.info(chalk.gray(`  ✓ ${migration}`));
      });

      if (result.warnings.length > 0) {
        logger.warn('Warnings:');
        result.warnings.forEach(warning => {
          logger.warn(`  - ${warning}`);
        });
      }

      if (result.backupPath) {
        logger.info(chalk.gray(`\nBackup saved to: ${result.backupPath}`));
      }

      if (options.dryRun) {
        logger.warn('Dry run complete - no changes were made');
      } else {
        logger.success('Configuration migrated successfully');
        
        // Update compatibility mode
        const compatibilityMode = getCompatibilityMode();
        await compatibilityMode.initialize(path.dirname(configPath));
        
        // Show next steps
        logger.info(chalk.bold('\n📋 Next Steps:'));
        logger.info('1. Review the migrated configuration');
        logger.info('2. Test your setup with: willow validate');
        logger.info('3. If issues occur, restore from backup');
      }

    } catch (error) {
      progress.stop();
      if (error instanceof ConfigMigrationError) {
        throw new Error(error.toUserMessage());
      }
      throw error;
    }
  }

  private async findConfigFile(startPath: string = '.'): Promise<string | null> {
    const possibleFiles = [
      'willow.config.json',
      'willow.config.js',
      'willow.config.ts',
      '.willowrc.json',
      '.willowrc',
    ];

    for (const file of possibleFiles) {
      const filePath = path.join(startPath, file);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // File doesn't exist, continue
      }
    }

    return null;
  }

  private async getLatestVersion(): Promise<string> {
    // In a real implementation, this would fetch the latest version
    // from npm or a version manifest
    return '0.7.0';
  }
}