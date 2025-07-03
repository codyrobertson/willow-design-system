/**
 * Error Types and Interfaces
 */

export enum ErrorCode {
  // Validation Errors (1000-1999)
  VALIDATION_ERROR = 'E1000',
  INVALID_ARGUMENT = 'E1001',
  MISSING_REQUIRED_FIELD = 'E1002',
  INVALID_FORMAT = 'E1003',
  OUT_OF_RANGE = 'E1004',
  
  // File System Errors (2000-2999)
  FILE_NOT_FOUND = 'E2000',
  FILE_ACCESS_DENIED = 'E2001',
  FILE_ALREADY_EXISTS = 'E2002',
  DIRECTORY_NOT_EMPTY = 'E2003',
  DISK_FULL = 'E2004',
  
  // Network Errors (3000-3999)
  NETWORK_ERROR = 'E3000',
  TIMEOUT = 'E3001',
  CONNECTION_REFUSED = 'E3002',
  DNS_LOOKUP_FAILED = 'E3003',
  REGISTRY_UNAVAILABLE = 'E3004',
  
  // Component Errors (4000-4999)
  COMPONENT_NOT_FOUND = 'E4000',
  INCOMPATIBLE_VERSION = 'E4001',
  DEPENDENCY_CONFLICT = 'E4002',
  CIRCULAR_DEPENDENCY = 'E4003',
  COMPONENT_ALREADY_EXISTS = 'E4004',
  
  // Configuration Errors (5000-5999)
  CONFIG_ERROR = 'E5000',
  INVALID_CONFIG = 'E5001',
  MISSING_CONFIG = 'E5002',
  CONFIG_PARSE_ERROR = 'E5003',
  
  // Plugin Errors (6000-6999)
  PLUGIN_ERROR = 'E6000',
  PLUGIN_NOT_FOUND = 'E6001',
  PLUGIN_LOAD_FAILED = 'E6002',
  PLUGIN_INCOMPATIBLE = 'E6003',
  
  // System Errors (7000-7999)
  SYSTEM_ERROR = 'E7000',
  PERMISSION_DENIED = 'E7001',
  RESOURCE_EXHAUSTED = 'E7002',
  OPERATION_CANCELLED = 'E7003',
  
  // Unknown Errors (9000-9999)
  UNKNOWN_ERROR = 'E9000',
  INTERNAL_ERROR = 'E9001'
}

export interface ErrorContext {
  command?: string;
  component?: string;
  path?: string;
  url?: string;
  operation?: string;
  phase?: string;
  [key: string]: any;
}

export interface ErrorMetadata {
  httpStatus?: number;
  retryCount?: number;
  duration?: number;
  size?: number;
  [key: string]: any;
}

export interface ErrorRecoveryStrategy {
  retry?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    initialDelay: number;
    maxDelay?: number;
  };
  fallback?: () => Promise<any>;
  cleanup?: () => Promise<void>;
  notification?: {
    level: 'info' | 'warn' | 'error';
    message: string;
  };
}

export interface ErrorReport {
  error: {
    code: ErrorCode;
    message: string;
    userMessage: string;
    timestamp: string;
  };
  context?: ErrorContext;
  metadata?: ErrorMetadata;
  suggestions: string[];
  isRetryable: boolean;
}