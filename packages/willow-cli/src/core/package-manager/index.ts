/**
 * Package Manager Module
 * Comprehensive package manager abstraction layer
 */

export * from './types.js';
export * from './PackageManagerInterface.js';
export * from './BasePackageManager.js';
export * from './PackageManagerDetector.js';
export * from './PackageManagerFactory.js';
export * from './CommandTranslator.js';

// Export concrete implementations
export * from './managers/NpmPackageManager.js';
export * from './managers/YarnPackageManager.js';
export * from './managers/PnpmPackageManager.js';
export * from './managers/BunPackageManager.js';

// Convenience exports
import { PackageManagerFactory } from './PackageManagerFactory.js';
import { PackageManagerDetector } from './PackageManagerDetector.js';
import { CommandTranslator } from './CommandTranslator.js';

export const createPackageManager = PackageManagerFactory.create.bind(PackageManagerFactory);
export const createAutoPackageManager = PackageManagerFactory.createAuto.bind(PackageManagerFactory);
export const detectPackageManager = PackageManagerDetector.detect.bind(PackageManagerDetector);
export const translateCommand = CommandTranslator.translate.bind(CommandTranslator);