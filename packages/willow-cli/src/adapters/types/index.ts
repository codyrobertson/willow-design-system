/**
 * Adapter type definitions export index
 */

// Re-export all types from AdapterTypes
export * from './AdapterTypes';

// Re-export types with specific aliases for convenience
export type {
  AdapterConfig as Config,
  AdapterOptions as Options,
  ComponentConfig as Component,
  StyleConfig as Styles,
  TokenConfig as Tokens,
  ValidationResult as Validation,
  ComponentMapping as Mapping,
  AdapterInstance as Instance,
  AdapterPlugin as Plugin,
} from './AdapterTypes';

// Common type combinations for convenience
export type {
  RequireFields,
  OptionalFields,
  DeepPartial,
  KeysOfType,
  Brand,
  JSONSerializable,
  AsyncFunction,
  Callback,
  EventListener,
  Constructor,
  Mixin,
} from './AdapterTypes';

// Type guards for runtime validation
export {
  isAdapterConfig,
  isComponentMapping,
  isValidationResult,
  isAdapterInstance,
} from './AdapterTypes';