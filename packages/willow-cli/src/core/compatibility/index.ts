/**
 * Compatibility System Exports
 */

export {
  CommandAlias,
  CommandAliasRegistry,
  AliasOptions,
  DEFAULT_COMMAND_ALIASES,
  createDefaultAliasRegistry,
} from './CommandAliasRegistry.js';

export {
  MigrationStep,
  MigrationResult,
  ConfigMigration,
  ConfigMigrationError,
  DEFAULT_CONFIG_MIGRATIONS,
  createDefaultMigrationManager,
} from './ConfigMigration.js';

export {
  VersionInfo,
  DetectionResult,
  VersionDetector,
} from './VersionDetector.js';

export {
  CompatibilityOptions,
  CompatibilityStatus,
  CompatibilityMode,
  getCompatibilityMode,
  resetCompatibilityMode,
} from './CompatibilityMode.js';

export {
  createCompatibilityMiddleware,
  applyCompatibility,
  createCompatibilityProcessor,
} from './CompatibilityIntegration.js';