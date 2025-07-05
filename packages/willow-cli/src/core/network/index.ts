/**
 * Network Module Exports
 * Provides robust HTTP client with retry logic and circuit breaker
 */

export { HTTPClient } from './HTTPClient.js';
export type { 
  HTTPClientConfig, 
  RequestOptions, 
  RequestProgress, 
  HTTPResponse 
} from './HTTPClient.js';

export { HTTPClientFactory } from './HTTPClientFactory.js';
export type { ClientType, FactoryConfig } from './HTTPClientFactory.js';

export { CircuitBreaker, CircuitBreakerFactory, CircuitBreakerError } from './CircuitBreaker.js';
export type { 
  CircuitBreakerOptions, 
  CircuitBreakerStats, 
  CircuitState 
} from './CircuitBreaker.js';

export { 
  NetworkError,
  TimeoutError,
  ConnectionRefusedError,
  DNSLookupError,
  RegistryUnavailableError,
  HTTPError
} from './NetworkError.js';
export type { NetworkErrorOptions } from './NetworkError.js';

// Re-export commonly used error recovery utilities
export { ErrorRecovery } from '../../errors/ErrorRecovery.js';
export type { RetryOptions } from '../../errors/ErrorRecovery.js';