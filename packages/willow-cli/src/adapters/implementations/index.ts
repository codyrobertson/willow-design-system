/**
 * UI Kit Adapter Implementations
 * 
 * Export all available adapter implementations for different UI frameworks
 */

// Material-UI Adapter
export { MaterialUIAdapter, createMaterialUIAdapter } from './MaterialUIAdapter.js';

// Radix UI Adapter
export { RadixAdapter, createRadixAdapter } from './RadixAdapter.js';

// Shadcn UI Adapter
export { ShadcnAdapter, createShadcnAdapter } from './ShadcnAdapter.js';

// Ant Design Adapter
export { AntDesignAdapter, createAntDesignAdapter } from './AntDesignAdapter.js';

// Aria Kit Adapter
export { AriaKitAdapter, createAriaKitAdapter } from './AriaKitAdapter.js';

// Base UI Adapter
export { BaseUIAdapter, createBaseUIAdapter } from './BaseUIAdapter.js';

// Bootstrap Adapter
export { BootstrapAdapter, createBootstrapAdapter } from './BootstrapAdapter.js';

// Adapter type exports for convenience
export type {
  AdapterInstance,
  AdapterConfig,
  ComponentMapping,
  StyleConfig,
  TokenConfig,
  ValidationResult,
} from '../types/index.js';

/**
 * Default adapter instances
 * These can be used directly without instantiation
 */
export { default as materialUIAdapter } from './MaterialUIAdapter.js';
export { default as radixAdapter } from './RadixAdapter.js';
export { default as shadcnAdapter } from './ShadcnAdapter.js';
export { default as antDesignAdapter } from './AntDesignAdapter.js';
export { default as ariaKitAdapter } from './AriaKitAdapter.js';
export { default as baseUIAdapter } from './BaseUIAdapter.js';
export { default as bootstrapAdapter } from './BootstrapAdapter.js';

/**
 * Adapter registry for dynamic adapter discovery
 */
export const adapterRegistry = {
  'material-ui': MaterialUIAdapter,
  'radix-ui': RadixAdapter,
  'shadcn-ui': ShadcnAdapter,
  'ant-design': AntDesignAdapter,
  'aria-kit': AriaKitAdapter,
  'base-ui': BaseUIAdapter,
  'bootstrap': BootstrapAdapter,
} as const;

/**
 * Get adapter by name
 */
export function getAdapterByName(name: keyof typeof adapterRegistry): typeof adapterRegistry[typeof name] {
  return adapterRegistry[name];
}

/**
 * List all available adapters
 */
export function listAvailableAdapters(): string[] {
  return Object.keys(adapterRegistry);
}