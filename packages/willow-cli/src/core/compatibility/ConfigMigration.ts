/**
 * Configuration Migration System
 * Handles migration of configuration files between versions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { BaseError } from '../../errors/BaseError.js';
import { ErrorCode } from '../../types/errors.js';
import { z } from 'zod';

export interface MigrationStep {
  /** Version this migration applies from */
  fromVersion: string;
  /** Version this migration migrates to */
  toVersion: string;
  /** Description of what this migration does */
  description: string;
  /** Migration function */
  migrate: (config: any) => any | Promise<any>;
  /** Optional validation schema for the result */
  resultSchema?: z.ZodSchema;
  /** Whether this migration is reversible */
  reversible?: boolean;
  /** Reverse migration function */
  reverse?: (config: any) => any | Promise<any>;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migrationsApplied: string[];
  warnings: string[];
  errors?: string[];
  backupPath?: string;
}

export class ConfigMigrationError extends BaseError {
  constructor(message: string, options?: { cause?: Error; context?: any }) {
    super(message, ErrorCode.CONFIGURATION_ERROR, options);
  }

  toUserMessage(): string {
    return `Configuration migration failed: ${this.message}`;
  }
}

/**
 * Configuration migration manager
 */
export class ConfigMigration {
  private migrations: MigrationStep[] = [];
  private backupDir: string;

  constructor(backupDir: string = '.willow/backups') {
    this.backupDir = backupDir;
  }

  /**
   * Register a migration step
   */
  registerMigration(migration: MigrationStep): void {
    this.migrations.push(migration);
    // Sort migrations by version
    this.migrations.sort((a, b) => 
      this.compareVersions(a.fromVersion, b.fromVersion)
    );
  }

  /**
   * Register multiple migrations
   */
  registerMigrations(migrations: MigrationStep[]): void {
    migrations.forEach(m => this.registerMigration(m));
  }

  /**
   * Migrate a configuration from one version to another
   */
  async migrate(
    config: any,
    fromVersion: string,
    toVersion: string,
    options: {
      createBackup?: boolean;
      dryRun?: boolean;
      validateResult?: boolean;
    } = {}
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion,
      migrationsApplied: [],
      warnings: [],
    };

    try {
      // Find migration path
      const migrationPath = this.findMigrationPath(fromVersion, toVersion);
      
      if (migrationPath.length === 0) {
        result.warnings.push(`No migration path found from ${fromVersion} to ${toVersion}`);
        result.success = true;
        return result;
      }

      // Create backup if requested
      if (options.createBackup && !options.dryRun) {
        result.backupPath = await this.createBackup(config, fromVersion);
      }

      // Apply migrations
      let currentConfig = { ...config };
      
      for (const migration of migrationPath) {
        try {
          if (!options.dryRun) {
            console.log(chalk.blue(`Applying migration: ${migration.description}`));
            currentConfig = await migration.migrate(currentConfig);
            
            // Validate result if schema provided
            if (options.validateResult && migration.resultSchema) {
              const validationResult = migration.resultSchema.safeParse(currentConfig);
              if (!validationResult.success) {
                throw new ConfigMigrationError(
                  `Migration validation failed: ${validationResult.error.message}`
                );
              }
            }
          }
          
          result.migrationsApplied.push(
            `${migration.fromVersion} → ${migration.toVersion}: ${migration.description}`
          );
          
        } catch (error) {
          throw new ConfigMigrationError(
            `Migration failed at step ${migration.fromVersion} → ${migration.toVersion}`,
            { cause: error instanceof Error ? error : undefined }
          );
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      result.success = false;
      result.errors = [error instanceof Error ? error.message : String(error)];
      return result;
    }
  }

  /**
   * Find migration path between versions
   */
  private findMigrationPath(fromVersion: string, toVersion: string): MigrationStep[] {
    const path: MigrationStep[] = [];
    let currentVersion = fromVersion;

    while (currentVersion !== toVersion) {
      const nextMigration = this.migrations.find(
        m => m.fromVersion === currentVersion && 
            this.compareVersions(m.toVersion, toVersion) <= 0
      );

      if (!nextMigration) {
        break;
      }

      path.push(nextMigration);
      currentVersion = nextMigration.toVersion;
    }

    return path;
  }

  /**
   * Create a backup of the configuration
   */
  private async createBackup(config: any, version: string): Promise<string> {
    await fs.mkdir(this.backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `willow-config-v${version}-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, filename);
    
    await fs.writeFile(
      backupPath, 
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    
    return backupPath;
  }

  /**
   * Compare version strings
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    
    return 0;
  }

  /**
   * Check if a version needs migration
   */
  needsMigration(currentVersion: string, targetVersion: string): boolean {
    return this.compareVersions(currentVersion, targetVersion) < 0;
  }

  /**
   * Get available migrations
   */
  getAvailableMigrations(): MigrationStep[] {
    return [...this.migrations];
  }

  /**
   * Rollback a migration (if reversible)
   */
  async rollback(
    config: any,
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion,
      migrationsApplied: [],
      warnings: [],
    };

    try {
      // Find reverse migration path
      const forwardPath = this.findMigrationPath(toVersion, fromVersion);
      const reversePath = forwardPath.reverse();

      // Check if all migrations are reversible
      const nonReversible = reversePath.filter(m => !m.reversible);
      if (nonReversible.length > 0) {
        throw new ConfigMigrationError(
          `Cannot rollback: ${nonReversible.length} migrations are not reversible`
        );
      }

      // Apply reverse migrations
      let currentConfig = { ...config };
      
      for (const migration of reversePath) {
        if (migration.reverse) {
          currentConfig = await migration.reverse(currentConfig);
          result.migrationsApplied.push(
            `Reversed: ${migration.toVersion} → ${migration.fromVersion}`
          );
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      result.success = false;
      result.errors = [error instanceof Error ? error.message : String(error)];
      return result;
    }
  }
}

/**
 * Default configuration migrations for Willow CLI
 */
export const DEFAULT_CONFIG_MIGRATIONS: MigrationStep[] = [
  {
    fromVersion: '0.4.0',
    toVersion: '0.5.0',
    description: 'Rename registry URL configuration',
    migrate: (config) => {
      if (config.registryUrl) {
        config.registry = { url: config.registryUrl };
        delete config.registryUrl;
      }
      return config;
    },
    reversible: true,
    reverse: (config) => {
      if (config.registry?.url) {
        config.registryUrl = config.registry.url;
        delete config.registry;
      }
      return config;
    },
  },
  {
    fromVersion: '0.5.0',
    toVersion: '0.6.0',
    description: 'Update component paths structure',
    migrate: (config) => {
      if (config.componentsPath && typeof config.componentsPath === 'string') {
        config.paths = {
          components: config.componentsPath,
          ui: config.uiPath || 'src/components/ui',
          lib: config.libPath || 'src/lib',
          utils: config.utilsPath || 'src/lib/utils',
        };
        delete config.componentsPath;
        delete config.uiPath;
        delete config.libPath;
        delete config.utilsPath;
      }
      return config;
    },
    reversible: true,
    reverse: (config) => {
      if (config.paths) {
        config.componentsPath = config.paths.components;
        config.uiPath = config.paths.ui;
        config.libPath = config.paths.lib;
        config.utilsPath = config.paths.utils;
        delete config.paths;
      }
      return config;
    },
  },
  {
    fromVersion: '0.6.0',
    toVersion: '0.7.0',
    description: 'Add TypeScript configuration defaults',
    migrate: (config) => {
      if (!config.typescript) {
        config.typescript = {
          config: 'tsconfig.json',
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
            '@/components/*': ['./src/components/*'],
            '@/lib/*': ['./src/lib/*'],
            '@/utils/*': ['./src/lib/utils/*'],
          },
        };
      }
      return config;
    },
    reversible: true,
    reverse: (config) => {
      delete config.typescript;
      return config;
    },
  },
];

/**
 * Create a pre-configured migration manager
 */
export function createDefaultMigrationManager(): ConfigMigration {
  const manager = new ConfigMigration();
  manager.registerMigrations(DEFAULT_CONFIG_MIGRATIONS);
  return manager;
}