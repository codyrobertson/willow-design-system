/**
 * Willow CLI v2.0 - Package Exports
 * Main entry point for programmatic usage
 */

// Core functionality
export { ComponentInstaller } from './core/component-installer';
export { DependencyResolver } from './core/dependency-resolver';
export { PackageManager } from './core/package-manager';
export { createLogger } from './core/logger';
export { HTTPClient } from './core/http-client';

// Registry
export { RegistryClient } from './registry/client';
export { ComponentPublisher } from './registry/publisher';
export { SearchEngine } from './registry/search-engine';

// Documentation
export { ASTParser } from './docs/ast-parser';
export { StoryGenerator } from './docs/story-generator';
export { DocumentationGenerator } from './docs/doc-generator';

// Types
export * from './types';

// Utilities
export { detectFramework } from './utils/framework-detector';
export { FileManager } from './utils/file-manager';
export { ProgressTracker } from './utils/progress-tracker';

// CLI entry point
export { default as cli } from './cli';