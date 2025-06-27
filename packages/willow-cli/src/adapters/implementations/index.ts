/**
 * UI Kit Adapter Implementations
 * 
 * Export all available adapter implementations for different UI frameworks
 */

// Material-UI Adapter
export { MaterialUIAdapter, createMaterialUIAdapter } from './MaterialUIAdapter';

// Radix UI Adapter
export { RadixAdapter, createRadixAdapter } from './RadixAdapter';

// Shadcn UI Adapter
export { ShadcnAdapter, createShadcnAdapter } from './ShadcnAdapter';

// Ant Design Adapter
export { AntDesignAdapter, createAntDesignAdapter } from './AntDesignAdapter';

// Aria Kit Adapter
export { AriaKitAdapter, createAriaKitAdapter } from './AriaKitAdapter';

// Base UI Adapter
export { BaseUIAdapter, createBaseUIAdapter } from './BaseUIAdapter';

// Bootstrap Adapter
export { BootstrapAdapter, createBootstrapAdapter } from './BootstrapAdapter';

// Adapter type exports for convenience
export type {
  AdapterInstance,
  AdapterConfig,
  ComponentMapping,
  StyleConfig,
  TokenConfig,
  ValidationResult,
} from '../types';

/**
 * Default adapter instances
 * These can be used directly without instantiation
 */
export { default as materialUIAdapter } from './MaterialUIAdapter';
export { default as radixAdapter } from './RadixAdapter';
export { default as shadcnAdapter } from './ShadcnAdapter';
export { default as antDesignAdapter } from './AntDesignAdapter';
export { default as ariaKitAdapter } from './AriaKitAdapter';
export { default as baseUIAdapter } from './BaseUIAdapter';
export { default as bootstrapAdapter } from './BootstrapAdapter';

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