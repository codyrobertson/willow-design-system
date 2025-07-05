/**
 * Compatibility Mode Manager
 * Manages backward compatibility features and modes
 */

import chalk from 'chalk';
import { EventEmitter } from 'events';
import { CommandAliasRegistry, createDefaultAliasRegistry } from './CommandAliasRegistry.js';
import { ConfigMigration, createDefaultMigrationManager } from './ConfigMigration.js';
import { VersionDetector, VersionInfo } from './VersionDetector.js';

export interface CompatibilityOptions {
  /** Enable legacy command aliases */
  enableAliases?: boolean;
  /** Enable automatic config migration */
  autoMigrate?: boolean;
  /** Show compatibility warnings */
  showWarnings?: boolean;
  /** Compatibility mode level */
  mode?: 'strict' | 'loose' | 'legacy';
  /** Custom alias registry */
  aliasRegistry?: CommandAliasRegistry;
  /** Custom migration manager */
  migrationManager?: ConfigMigration;
}

export interface CompatibilityStatus {
  mode: 'strict' | 'loose' | 'legacy';
  aliasesEnabled: boolean;
  autoMigrateEnabled: boolean;
  warningsEnabled: boolean;
  detectedVersion?: VersionInfo;
  activeAliases: number;
  pendingMigrations: number;
}

/**
 * Compatibility mode manager for Willow CLI
 */
export class CompatibilityMode extends EventEmitter {
  private options: Required<CompatibilityOptions>;
  private aliasRegistry: CommandAliasRegistry;
  private migrationManager: ConfigMigration;
  private versionDetector: VersionDetector;
  private detectedVersion?: VersionInfo;

  constructor(options: CompatibilityOptions = {}) {
    super();
    
    this.options = {
      enableAliases: options.enableAliases ?? true,
      autoMigrate: options.autoMigrate ?? false,
      showWarnings: options.showWarnings ?? true,
      mode: options.mode ?? 'loose',
      aliasRegistry: options.aliasRegistry!,
      migrationManager: options.migrationManager!,
    };

    // Use provided or create default registries
    this.aliasRegistry = this.options.aliasRegistry || createDefaultAliasRegistry({
      suppressWarnings: !this.options.showWarnings,
    });
    
    this.migrationManager = this.options.migrationManager || createDefaultMigrationManager();
    this.versionDetector = new VersionDetector();

    // Setup event forwarding
    this.setupEventForwarding();
  }

  /**
   * Initialize compatibility mode
   */
  async initialize(projectPath: string = '.'): Promise<void> {
    // Detect version
    const detection = await this.versionDetector.detectVersion(projectPath);
    
    if (detection.success && detection.versionInfo) {
      this.detectedVersion = detection.versionInfo;
      this.emit('version:detected', detection.versionInfo);

      // Show compatibility status
      if (this.options.showWarnings) {
        this.showCompatibilityStatus();
      }

      // Check for required migrations
      if (this.detectedVersion.isLegacy && this.options.autoMigrate) {
        const migration = this.versionDetector.getRecommendedMigration(this.detectedVersion);
        if (migration) {
          this.emit('migration:recommended', migration);
        }
      }
    }

    // Log detection warnings
    detection.warnings.forEach(warning => {
      if (this.options.showWarnings) {
        console.warn(chalk.yellow(`⚠️  ${warning}`));
      }
    });
  }

  /**
   * Process a command through compatibility layer
   */
  processCommand(command: string, args: string[]): { command: string; args: string[] } {
    // Skip processing in strict mode
    if (this.options.mode === 'strict') {
      return { command, args };
    }

    // Process command aliases
    let processedCommand = command;
    if (this.options.enableAliases) {
      processedCommand = this.aliasRegistry.resolveCommand(command);
    }

    // Process argument compatibility
    const processedArgs = this.processArguments(processedCommand, args);

    return { command: processedCommand, args: processedArgs };
  }

  /**
   * Process arguments for compatibility
   */
  private processArguments(command: string, args: string[]): string[] {
    // In legacy mode, translate old argument formats
    if (this.options.mode === 'legacy') {
      return this.translateLegacyArguments(command, args);
    }

    return args;
  }

  /**
   * Translate legacy argument formats
   */
  private translateLegacyArguments(command: string, args: string[]): string[] {
    const translated = [...args];

    // Command-specific translations
    switch (command) {
      case 'add':
      case 'install':
        // Translate old --save-dev to --dev
        const saveDevIndex = translated.indexOf('--save-dev');
        if (saveDevIndex !== -1) {
          translated[saveDevIndex] = '--dev';
        }
        break;

      case 'init':
        // Translate old --skip-install to --no-install
        const skipInstallIndex = translated.indexOf('--skip-install');
        if (skipInstallIndex !== -1) {
          translated[skipInstallIndex] = '--no-install';
        }
        break;
    }

    // Global argument translations
    // --yes to -y
    const yesIndex = translated.indexOf('--yes');
    if (yesIndex !== -1) {
      translated[yesIndex] = '-y';
    }

    // --force to -f
    const forceIndex = translated.indexOf('--force');
    if (forceIndex !== -1) {
      translated[forceIndex] = '-f';
    }

    return translated;
  }

  /**
   * Get compatibility status
   */
  getStatus(): CompatibilityStatus {
    return {
      mode: this.options.mode,
      aliasesEnabled: this.options.enableAliases,
      autoMigrateEnabled: this.options.autoMigrate,
      warningsEnabled: this.options.showWarnings,
      detectedVersion: this.detectedVersion,
      activeAliases: this.aliasRegistry.getAllAliases().length,
      pendingMigrations: this.getPendingMigrations().length,
    };
  }

  /**
   * Get pending migrations
   */
  private getPendingMigrations(): string[] {
    if (!this.detectedVersion) return [];

    const migrations = this.migrationManager.getAvailableMigrations();
    const pending = migrations.filter(m => 
      this.migrationManager.needsMigration(
        this.detectedVersion!.configVersion,
        m.toVersion
      )
    );

    return pending.map(m => `${m.fromVersion} → ${m.toVersion}: ${m.description}`);
  }

  /**
   * Show compatibility status
   */
  private showCompatibilityStatus(): void {
    if (!this.detectedVersion) return;

    if (this.detectedVersion.isLegacy) {
      console.log(chalk.yellow('\n🔄 Compatibility Mode Active'));
      console.log(chalk.gray(`   Mode: ${this.options.mode}`));
      console.log(chalk.gray(`   CLI Version: ${this.detectedVersion.cliVersion}`));
      console.log(chalk.gray(`   Config Version: ${this.detectedVersion.configVersion}`));
      
      const pendingMigrations = this.getPendingMigrations();
      if (pendingMigrations.length > 0) {
        console.log(chalk.yellow(`   Pending Migrations: ${pendingMigrations.length}`));
      }
      
      console.log('');
    }
  }

  /**
   * Setup event forwarding from sub-components
   */
  private setupEventForwarding(): void {
    // Forward alias events
    this.aliasRegistry.on('alias:used', (alias) => {
      this.emit('compatibility:alias-used', alias);
    });

    this.aliasRegistry.on('alias:registered', (alias) => {
      this.emit('compatibility:alias-registered', alias);
    });
  }

  /**
   * Enable strict mode (no compatibility features)
   */
  enableStrictMode(): void {
    this.options.mode = 'strict';
    this.options.enableAliases = false;
    this.options.autoMigrate = false;
    this.emit('mode:changed', 'strict');
  }

  /**
   * Enable legacy mode (maximum compatibility)
   */
  enableLegacyMode(): void {
    this.options.mode = 'legacy';
    this.options.enableAliases = true;
    this.options.showWarnings = true;
    this.emit('mode:changed', 'legacy');
  }

  /**
   * Get the alias registry
   */
  getAliasRegistry(): CommandAliasRegistry {
    return this.aliasRegistry;
  }

  /**
   * Get the migration manager
   */
  getMigrationManager(): ConfigMigration {
    return this.migrationManager;
  }

  /**
   * Check if a feature is supported in current mode
   */
  isFeatureSupported(feature: string): boolean {
    if (this.options.mode === 'strict') {
      // In strict mode, only modern features are supported
      const modernFeatures = ['typescript', 'cssVariables', 'registry', 'workspaces'];
      return modernFeatures.includes(feature);
    }

    // In other modes, all features are supported
    return true;
  }
}

/**
 * Global compatibility mode instance
 */
let globalCompatibilityMode: CompatibilityMode | null = null;

/**
 * Get or create global compatibility mode
 */
export function getCompatibilityMode(options?: CompatibilityOptions): CompatibilityMode {
  if (!globalCompatibilityMode) {
    globalCompatibilityMode = new CompatibilityMode(options);
  }
  return globalCompatibilityMode;
}

/**
 * Reset global compatibility mode
 */
export function resetCompatibilityMode(): void {
  globalCompatibilityMode = null;
}