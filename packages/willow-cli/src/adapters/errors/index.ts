/**
 * Adapter error handling system
 */

// Core error classes
export {
  AdapterError,
  AdapterInitializationError,
  AdapterConfigurationError,
  AdapterValidationError,
  AdapterMappingError,
  AdapterStyleError,
  AdapterTokenError,
  AdapterRegistryError,
  AdapterLifecycleError,
  AdapterDependencyError,
  AdapterPerformanceError,
  isAdapterError,
  isAdapterErrorType,
  getErrorCode,
  toAdapterError,
} from './AdapterError.js';

// Error handling
export {
  ErrorHandler,
  ErrorHandlerConfig,
  ErrorContext,
  ErrorHandlingResult,
  ErrorHandlingStrategy,
  globalErrorHandler,
  handleAsync,
  handleSync,
  withErrorHandling,
} from './ErrorHandler.js';

// Error recovery
export {
  ErrorRecovery,
  RecoveryStrategy,
  RecoveryContext,
  RecoveryResult,
  globalErrorRecovery,
  executeWithRecovery,
  withErrorRecovery,
} from './ErrorRecovery.js';

// Error reporting
export {
  ErrorReporter,
  ErrorReport,
  ErrorReportContext,
  ErrorReporterConfig,
  Breadcrumb,
  PerformanceInfo,
  EnvironmentInfo,
  ErrorFilter,
  ErrorTransformer,
  globalErrorReporter,
  reportError,
  addBreadcrumb,
  ErrorFilters,
} from './ErrorReporting.js';