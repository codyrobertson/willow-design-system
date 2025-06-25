import { z } from 'zod';

/**
 * Semantic versioning support for components and packages
 */

/**
 * Semantic version schema
 */
export const SemverSchema = z.string().regex(
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  'Invalid semantic version format'
);

/**
 * Component version information
 */
export interface ComponentVersion {
  /**
   * Component name
   */
  name: string;
  
  /**
   * Current version
   */
  version: string;
  
  /**
   * Previous versions
   */
  previousVersions: string[];
  
  /**
   * Deprecation information
   */
  deprecated?: DeprecationInfo;
  
  /**
   * Breaking changes
   */
  breaking?: BreakingChange[];
  
  /**
   * Release date
   */
  releaseDate: string;
  
  /**
   * Changelog
   */
  changelog?: ChangelogEntry[];
  
  /**
   * Dependencies with version ranges
   */
  dependencies?: Record<string, string>;
  
  /**
   * Peer dependencies
   */
  peerDependencies?: Record<string, string>;
}

/**
 * Deprecation information
 */
export interface DeprecationInfo {
  /**
   * Whether the component is deprecated
   */
  deprecated: boolean;
  
  /**
   * Deprecation message
   */
  message?: string;
  
  /**
   * Version when deprecated
   */
  since?: string;
  
  /**
   * Suggested alternative
   */
  alternative?: string;
  
  /**
   * Removal version
   */
  removalVersion?: string;
}

/**
 * Breaking change information
 */
export interface BreakingChange {
  /**
   * Version introducing the breaking change
   */
  version: string;
  
  /**
   * Description of the change
   */
  description: string;
  
  /**
   * Migration guide
   */
  migration?: string;
  
  /**
   * Affected APIs
   */
  affectedAPIs?: string[];
  
  /**
   * Codemod available
   */
  codemod?: string;
}

/**
 * Changelog entry
 */
export interface ChangelogEntry {
  /**
   * Version
   */
  version: string;
  
  /**
   * Release date
   */
  date: string;
  
  /**
   * Changes by category
   */
  changes: {
    added?: string[];
    changed?: string[];
    deprecated?: string[];
    removed?: string[];
    fixed?: string[];
    security?: string[];
  };
}

/**
 * Version compatibility checker
 */
export interface VersionCompatibility {
  /**
   * Check if versions are compatible
   */
  isCompatible(current: string, required: string): boolean;
  
  /**
   * Get migration path between versions
   */
  getMigrationPath(from: string, to: string): MigrationStep[];
  
  /**
   * Check for breaking changes
   */
  hasBreakingChanges(from: string, to: string): boolean;
  
  /**
   * Get deprecation warnings
   */
  getDeprecationWarnings(version: string): DeprecationInfo[];
}

/**
 * Migration step
 */
export interface MigrationStep {
  /**
   * From version
   */
  from: string;
  
  /**
   * To version
   */
  to: string;
  
  /**
   * Migration type
   */
  type: 'automatic' | 'manual' | 'codemod';
  
  /**
   * Migration script or instructions
   */
  migration: string | (() => Promise<void>);
  
  /**
   * Description
   */
  description?: string;
  
  /**
   * Estimated complexity
   */
  complexity?: 'low' | 'medium' | 'high';
}

/**
 * Version range utilities
 */
export interface VersionRange {
  /**
   * Parse version range
   */
  parse(range: string): ParsedRange;
  
  /**
   * Check if version satisfies range
   */
  satisfies(version: string, range: string): boolean;
  
  /**
   * Get minimum version from range
   */
  minVersion(range: string): string;
  
  /**
   * Get maximum version from range
   */
  maxVersion(range: string): string | null;
  
  /**
   * Intersect two ranges
   */
  intersect(range1: string, range2: string): string | null;
}

/**
 * Parsed version range
 */
export interface ParsedRange {
  /**
   * Original range string
   */
  raw: string;
  
  /**
   * Range type
   */
  type: 'exact' | 'range' | 'tilde' | 'caret' | 'wildcard' | 'custom';
  
  /**
   * Minimum version
   */
  min: string;
  
  /**
   * Maximum version
   */
  max?: string;
  
  /**
   * Include prerelease
   */
  includePrerelease?: boolean;
}

/**
 * Component registry with versioning
 */
export interface VersionedComponentRegistry {
  /**
   * Register a component version
   */
  register(component: ComponentVersion): void;
  
  /**
   * Get component by version
   */
  get(name: string, version?: string): ComponentVersion | undefined;
  
  /**
   * Get all versions of a component
   */
  getVersions(name: string): string[];
  
  /**
   * Get latest version
   */
  getLatest(name: string): ComponentVersion | undefined;
  
  /**
   * Check compatibility
   */
  checkCompatibility(components: Record<string, string>): CompatibilityReport;
}

/**
 * Compatibility report
 */
export interface CompatibilityReport {
  /**
   * Whether all components are compatible
   */
  compatible: boolean;
  
  /**
   * Conflicts found
   */
  conflicts: VersionConflict[];
  
  /**
   * Suggested resolutions
   */
  resolutions: Record<string, string>;
  
  /**
   * Warnings
   */
  warnings: string[];
}

/**
 * Version conflict
 */
export interface VersionConflict {
  /**
   * Component name
   */
  component: string;
  
  /**
   * Required versions
   */
  required: string[];
  
  /**
   * Conflict reason
   */
  reason: string;
  
  /**
   * Suggested resolution
   */
  suggestion?: string;
}

/**
 * Version update strategy
 */
export type UpdateStrategy = 'major' | 'minor' | 'patch' | 'prerelease';

/**
 * Version bumper utility
 */
export interface VersionBumper {
  /**
   * Bump version
   */
  bump(version: string, strategy: UpdateStrategy): string;
  
  /**
   * Suggest next version based on changes
   */
  suggestVersion(current: string, changes: ChangeType[]): string;
  
  /**
   * Validate version
   */
  validate(version: string): boolean;
}

/**
 * Change types for version suggestions
 */
export type ChangeType = 
  | 'breaking'
  | 'feature'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'test'
  | 'chore';

/**
 * Component version manifest
 */
export interface ComponentManifest {
  /**
   * Manifest version
   */
  version: '1.0';
  
  /**
   * Components and their versions
   */
  components: Record<string, ComponentVersion>;
  
  /**
   * Update timestamp
   */
  updated: string;
  
  /**
   * Registry URL
   */
  registry?: string;
  
  /**
   * Integrity hash
   */
  integrity?: string;
}