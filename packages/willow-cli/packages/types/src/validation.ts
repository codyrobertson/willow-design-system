/**
 * Validation types
 */

export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;
  
  /**
   * Validation errors
   */
  errors: ValidationError[];
  
  /**
   * Validation warnings
   */
  warnings: ValidationWarning[];
  
  /**
   * Additional information
   */
  info?: ValidationInfo[];
  
  /**
   * Performance metrics
   */
  metrics?: ValidationMetrics;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error';
  location?: ValidationLocation;
  suggestions?: string[];
  rule?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'warning';
  location?: ValidationLocation;
  suggestions?: string[];
  rule?: string;
}

export interface ValidationInfo {
  code: string;
  message: string;
  severity: 'info';
  location?: ValidationLocation;
}

export interface ValidationLocation {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface ValidationMetrics {
  duration: number;
  filesChecked: number;
  rulesApplied: number;
  errorsFound: number;
  warningsFound: number;
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  /**
   * Rule identifier
   */
  id: string;
  
  /**
   * Rule name
   */
  name: string;
  
  /**
   * Rule description
   */
  description: string;
  
  /**
   * Rule category
   */
  category: ValidationCategory;
  
  /**
   * Default severity
   */
  severity: 'error' | 'warning' | 'info';
  
  /**
   * Whether the rule is enabled by default
   */
  enabled: boolean;
  
  /**
   * Rule implementation
   */
  validate: (context: ValidationContext) => ValidationResult | Promise<ValidationResult>;
  
  /**
   * Rule options schema
   */
  options?: any;
}

export type ValidationCategory = 
  | 'design-system'
  | 'accessibility'
  | 'performance'
  | 'security'
  | 'best-practices'
  | 'compatibility'
  | 'style';

export interface ValidationContext {
  /**
   * File being validated
   */
  filename: string;
  
  /**
   * File content
   */
  content: string;
  
  /**
   * AST if available
   */
  ast?: any;
  
  /**
   * UI Kit being used
   */
  uiKit: string;
  
  /**
   * Configuration
   */
  config: any;
  
  /**
   * Rule options
   */
  options?: any;
}

/**
 * Validation report format
 */
export interface ValidationReport {
  /**
   * Report timestamp
   */
  timestamp: string;
  
  /**
   * Total files validated
   */
  totalFiles: number;
  
  /**
   * Files with errors
   */
  filesWithErrors: number;
  
  /**
   * Files with warnings
   */
  filesWithWarnings: number;
  
  /**
   * Total errors
   */
  totalErrors: number;
  
  /**
   * Total warnings
   */
  totalWarnings: number;
  
  /**
   * Results by file
   */
  results: Map<string, ValidationResult>;
  
  /**
   * Summary by rule
   */
  rulesSummary: Map<string, RuleSummary>;
}

export interface RuleSummary {
  rule: string;
  errors: number;
  warnings: number;
  files: string[];
}