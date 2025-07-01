/**
 * Adapter Factory for creating UI Kit adapters
 */

import { UIKit } from '../types/cli.js';
import { UIKitAdapter } from './types/AdapterTypes.js';
import { MaterialUIAdapter } from './implementations/MaterialUIAdapter.js';
import { ShadcnAdapter } from './implementations/ShadcnAdapter.js';
import { BootstrapAdapter } from './implementations/BootstrapAdapter.js';
import { AntDesignAdapter } from './implementations/AntDesignAdapter.js';
import { CLIError, CLIErrorCode } from '../types/cli.js';

export class AdapterFactory {
  private static adapters = new Map<UIKit, () => UIKitAdapter>();

  static {
    // Register built-in adapters
    this.register('material-ui', () => new MaterialUIAdapter());
    this.register('shadcn', () => new ShadcnAdapter());
    this.register('bootstrap', () => new BootstrapAdapter());
    this.register('ant-design', () => new AntDesignAdapter());
  }

  /**
   * Register a UI kit adapter
   */
  static register(uiKit: UIKit, factory: () => UIKitAdapter): void {
    this.adapters.set(uiKit, factory);
  }

  /**
   * Get an adapter instance
   */
  static async getAdapter(uiKit: UIKit): Promise<UIKitAdapter> {
    const factory = this.adapters.get(uiKit);
    
    if (!factory) {
      throw new CLIError(
        CLIErrorCode.COMPONENT_NOT_FOUND,
        `No adapter found for UI kit: ${uiKit}`
      );
    }

    return factory();
  }

  /**
   * Get all registered UI kits
   */
  static getRegisteredUIKits(): UIKit[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a UI kit is supported
   */
  static isSupported(uiKit: UIKit): boolean {
    return this.adapters.has(uiKit);
  }
}