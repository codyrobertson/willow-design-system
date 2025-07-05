/**
 * Package Manager Factory
 * Creates appropriate package manager instances
 */

import { PackageManagerInterface } from './PackageManagerInterface.js';
import { PackageManagerName, PackageManagerDetectorOptions } from './types.js';
import { PackageManagerDetector } from './PackageManagerDetector.js';
import { NpmPackageManager } from './managers/NpmPackageManager.js';
import { YarnPackageManager } from './managers/YarnPackageManager.js';
import { PnpmPackageManager } from './managers/PnpmPackageManager.js';
import { BunPackageManager } from './managers/BunPackageManager.js';

export class PackageManagerFactory {
  private static instances = new Map<string, PackageManagerInterface>();

  /**
   * Create a package manager instance
   */
  static create(
    manager: PackageManagerName,
    cwd?: string
  ): PackageManagerInterface {
    const key = `${manager}:${cwd || process.cwd()}`;
    
    // Return cached instance if available
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let instance: PackageManagerInterface;

    switch (manager) {
      case 'npm':
        instance = new NpmPackageManager(cwd);
        break;
      case 'yarn':
        instance = new YarnPackageManager(cwd);
        break;
      case 'pnpm':
        instance = new PnpmPackageManager(cwd);
        break;
      case 'bun':
        instance = new BunPackageManager(cwd);
        break;
      default:
        throw new Error(`Unsupported package manager: ${manager}`);
    }

    // Cache the instance
    this.instances.set(key, instance);
    return instance;
  }

  /**
   * Auto-detect and create appropriate package manager
   */
  static async createAuto(
    options: PackageManagerDetectorOptions = {}
  ): Promise<PackageManagerInterface> {
    const detectedManager = await PackageManagerDetector.detect(options);
    return this.create(detectedManager, options.cwd);
  }

  /**
   * Clear cached instances
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Get all available package managers
   */
  static async getAvailable(cwd?: string): Promise<PackageManagerName[]> {
    const managers: PackageManagerName[] = ['npm', 'yarn', 'pnpm', 'bun'];
    const available: PackageManagerName[] = [];

    for (const manager of managers) {
      const instance = this.create(manager, cwd);
      if (await instance.isAvailable()) {
        available.push(manager);
      }
    }

    return available;
  }
}