#!/usr/bin/env node

/**
 * Configuration Migration Script
 * Automatically migrates Willow CLI configurations to the latest version
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { program } from 'commander';
import { 
  createDefaultMigrationManager,
  VersionDetector,
  ConfigMigrationError 
} from '../core/compatibility/index.js';

interface MigrationOptions {
  config?: string;
  target?: string;
  backup?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

async function findConfigFile(startPath: string = '.'): Promise<string | null> {
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

async function migrateConfig(options: MigrationOptions): Promise<void> {
  console.log(chalk.bold('\n🔄 Willow CLI Configuration Migration\n'));

  // Find config file
  const configPath = options.config || await findConfigFile();
  if (!configPath) {
    console.error(chalk.red('❌ No configuration file found'));
    console.log(chalk.gray('\nSearched for:'));
    console.log(chalk.gray('  - willow.config.json'));
    console.log(chalk.gray('  - willow.config.js'));
    console.log(chalk.gray('  - willow.config.ts'));
    console.log(chalk.gray('  - .willowrc.json'));
    console.log(chalk.gray('  - .willowrc\n'));
    process.exit(1);
  }

  console.log(`Found config: ${chalk.cyan(configPath)}`);

  // Detect current version
  const detector = new VersionDetector();
  const detection = await detector.detectVersion(path.dirname(configPath));
  
  if (!detection.success || !detection.versionInfo) {
    console.error(chalk.red('❌ Failed to detect configuration version'));
    if (detection.errors.length > 0) {
      detection.errors.forEach(err => console.error(chalk.red(`   ${err}`)));
    }
    process.exit(1);
  }

  const versionInfo = detection.versionInfo;
  console.log(`Current version: ${chalk.yellow(versionInfo.configVersion)}`);
  console.log(`Config format: ${chalk.yellow(versionInfo.configFormat)}`);

  // Determine target version
  const targetVersion = options.target || '0.7.0';
  console.log(`Target version: ${chalk.green(targetVersion)}`);

  // Check if migration is needed
  const migrationManager = createDefaultMigrationManager();
  if (!migrationManager.needsMigration(versionInfo.configVersion, targetVersion)) {
    console.log(chalk.green('\n✅ Configuration is already up to date'));
    return;
  }

  // Load current config
  let currentConfig: any;
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    currentConfig = JSON.parse(configContent);
  } catch (error) {
    console.error(chalk.red('❌ Failed to read configuration file'));
    console.error(chalk.red(`   ${error}`));
    process.exit(1);
  }

  // Perform migration
  console.log(chalk.blue('\n🔨 Applying migrations...'));
  
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

    if (!result.success) {
      console.error(chalk.red('\n❌ Migration failed'));
      if (result.errors) {
        result.errors.forEach(err => console.error(chalk.red(`   ${err}`)));
      }
      process.exit(1);
    }

    // Show applied migrations
    console.log(chalk.green('\n✅ Migrations applied:'));
    result.migrationsApplied.forEach(migration => {
      console.log(chalk.gray(`   - ${migration}`));
    });

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warning => {
        console.log(chalk.yellow(`   - ${warning}`));
      });
    }

    if (result.backupPath) {
      console.log(chalk.gray(`\nBackup saved to: ${result.backupPath}`));
    }

    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 Dry run complete - no changes were made'));
    } else {
      console.log(chalk.green('\n✅ Configuration migrated successfully'));
      
      // Provide next steps
      console.log(chalk.bold('\n📋 Next Steps:'));
      console.log('1. Review the migrated configuration');
      console.log('2. Test your setup with: willow validate');
      console.log('3. If issues occur, restore from backup');
    }

  } catch (error) {
    if (error instanceof ConfigMigrationError) {
      console.error(chalk.red(`\n❌ ${error.toUserMessage()}`));
    } else {
      console.error(chalk.red('\n❌ Unexpected error during migration'));
      console.error(error);
    }
    process.exit(1);
  }
}

// CLI setup
program
  .name('migrate-config')
  .description('Migrate Willow CLI configuration to the latest version')
  .option('-c, --config <path>', 'path to configuration file')
  .option('-t, --target <version>', 'target version to migrate to', '0.7.0')
  .option('--no-backup', 'skip creating backup')
  .option('-d, --dry-run', 'preview migration without applying changes')
  .option('-f, --force', 'force migration even if warnings exist')
  .action(migrateConfig);

program.parse();

// Show help if no command provided
if (process.argv.length === 2) {
  program.outputHelp();
}