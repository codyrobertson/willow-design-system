/**
 * Error System Exports
 * Central export point for all error-related modules
 */

// Base classes
export { BaseError } from './BaseError.js';
export { ValidationError } from './ValidationError.js';
export { NetworkError } from './NetworkError.js';
export { FileSystemError } from './FileSystemError.js';
export { ComponentError } from './ComponentError.js';
export { ConfigurationError } from './ConfigurationError.js';

// Error handling
export { ErrorHandler, errorHandler, ScopedErrorHandler } from './ErrorHandler.js';
export { ErrorRecovery } from './ErrorRecovery.js';
export { ErrorReporter, errorReporter } from './ErrorReporter.js';

// Types
export * from '../types/errors.js';

// Utility functions
export { isBaseError, isOperationalError, createErrorFromCode } from './utils.js';

// Error middleware
export { errorMiddleware } from './middleware.js';