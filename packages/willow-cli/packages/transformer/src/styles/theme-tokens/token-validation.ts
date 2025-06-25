import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenValue,
  TokenValidationRule,
  TokenConflict,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
  TokenSemanticContext,
  TokenMigrationContext,
} from '../../types/theme-tokens.types';

/**
 * Token validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Validation result interface
 */
export interface TokenValidationResult {
  /** Token being validated */
  token: DesignToken;
  
  /** Overall validation status */
  valid: boolean;
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Validation info messages */
  info: ValidationInfo[];
  
  /** Performance metrics */
  metrics?: ValidationMetrics;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error category */
  category: 'syntax' | 'semantic' | 'value' | 'reference' | 'constraint';
  
  /** Suggested fix */
  suggestion?: string;
  
  /** Auto-fixable */
  autoFixable: boolean;
  
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Warning category */
  category: 'deprecated' | 'convention' | 'performance' | 'accessibility';
  
  /** Suggested improvement */
  suggestion?: string;
  
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Validation info details
 */
export interface ValidationInfo {
  /** Info code */
  code: string;
  
  /** Info message */
  message: string;
  
  /** Info category */
  category: 'optimization' | 'enhancement' | 'migration' | 'usage';
  
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Validation performance metrics
 */
export interface ValidationMetrics {
  /** Validation time in milliseconds */
  validationTime: number;
  
  /** Number of rules applied */
  rulesApplied: number;
  
  /** Cache hits */
  cacheHits: number;
  
  /** Cache misses */
  cacheMisses: number;
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  /** All detected conflicts */
  conflicts: TokenConflict[];
  
  /** Conflicts by severity */
  conflictsBySeverity: Record<ValidationSeverity, TokenConflict[]>;
  
  /** Conflicts by category */
  conflictsByCategory: Record<string, TokenConflict[]>;
  
  /** Resolution suggestions */
  resolutionSuggestions: ConflictResolution[];
  
  /** Detection metrics */
  metrics: ConflictDetectionMetrics;
}

/**
 * Conflict resolution suggestion
 */
export interface ConflictResolution {
  /** Conflict being resolved */
  conflict: TokenConflict;
  
  /** Resolution strategy */
  strategy: 'merge' | 'rename' | 'remove' | 'transform' | 'manual';
  
  /** Confidence score */
  confidence: number;
  
  /** Steps to resolve */
  steps: ResolutionStep[];
  
  /** Expected outcome */
  expectedOutcome: string;
}

/**
 * Resolution step
 */
export interface ResolutionStep {
  /** Step description */
  description: string;
  
  /** Action to take */
  action: 'rename' | 'modify' | 'remove' | 'add' | 'transform';
  
  /** Target token */
  target: string;
  
  /** New value or transformation */
  value?: any;
  
  /** Step priority */
  priority: number;
}

/**
 * Conflict detection metrics
 */
export interface ConflictDetectionMetrics {
  /** Detection time in milliseconds */
  detectionTime: number;
  
  /** Number of tokens analyzed */
  tokensAnalyzed: number;
  
  /** Number of comparisons made */
  comparisons: number;
  
  /** Performance score */
  performanceScore: number;
}

/**
 * Advanced token validator
 */
export interface TokenValidator {
  /**
   * Validate a single token
   */
  validateToken(token: DesignToken, context?: TokenSemanticContext): TokenValidationResult;
  
  /**
   * Validate multiple tokens
   */
  validateTokens(tokens: DesignToken[], context?: TokenSemanticContext): TokenValidationResult[];
  
  /**
   * Detect conflicts between tokens
   */
  detectConflicts(tokens: DesignToken[], context?: TokenSemanticContext): ConflictDetectionResult;
  
  /**
   * Add custom validation rule
   */
  addValidationRule(rule: TokenValidationRule): void;
  
  /**
   * Remove validation rule
   */
  removeValidationRule(ruleId: string): void;
  
  /**
   * Get all validation rules
   */
  getValidationRules(): TokenValidationRule[];
}

/**
 * Base token validator implementation
 */
export class BaseTokenValidator implements TokenValidator {
  private validationRules = new Map<string, TokenValidationRule>();
  private validationCache = new Map<string, TokenValidationResult>();
  private conflictCache = new Map<string, ConflictDetectionResult>();

  constructor() {
    this.initializeDefaultRules();
  }

  validateToken(token: DesignToken, context?: TokenSemanticContext): TokenValidationResult {
    const cacheKey = this.getCacheKey(token, context);
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];
    let rulesApplied = 0;

    // Apply all relevant validation rules
    for (const rule of this.validationRules.values()) {
      if (this.isRuleApplicable(rule, token, context)) {
        rulesApplied++;
        const ruleResult = this.applyValidationRule(rule, token, context);
        
        if (!ruleResult.valid) {
          if (rule.severity === ValidationSeverity.ERROR) {
            errors.push({
              code: rule.name,
              message: ruleResult.message || `Validation failed: ${rule.name}`,
              category: this.categorizeError(rule, token),
              autoFixable: this.isAutoFixable(rule, token),
              suggestion: this.generateSuggestion(rule, token),
              context: { rule: rule.name, token: token.name },
            });
          } else if (rule.severity === ValidationSeverity.WARNING) {
            warnings.push({
              code: rule.name,
              message: ruleResult.message || `Validation warning: ${rule.name}`,
              category: this.categorizeWarning(rule, token),
              suggestion: this.generateSuggestion(rule, token),
              context: { rule: rule.name, token: token.name },
            });
          } else {
            info.push({
              code: rule.name,
              message: ruleResult.message || `Validation info: ${rule.name}`,
              category: this.categorizeInfo(rule, token),
              context: { rule: rule.name, token: token.name },
            });
          }
        }
      }
    }

    // Additional validations
    this.validateTokenStructure(token, errors, warnings);
    this.validateTokenValue(token, errors, warnings);
    this.validateTokenReferences(token, errors, warnings);
    this.validateTokenConstraints(token, context, errors, warnings);

    const endTime = performance.now();
    const result: TokenValidationResult = {
      token,
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      metrics: {
        validationTime: endTime - startTime,
        rulesApplied,
        cacheHits: 0,
        cacheMisses: 1,
      },
    };

    this.validationCache.set(cacheKey, result);
    return result;
  }

  validateTokens(tokens: DesignToken[], context?: TokenSemanticContext): TokenValidationResult[] {
    return tokens.map(token => this.validateToken(token, context));
  }

  detectConflicts(tokens: DesignToken[], context?: TokenSemanticContext): ConflictDetectionResult {
    const cacheKey = this.getConflictCacheKey(tokens, context);
    
    if (this.conflictCache.has(cacheKey)) {
      return this.conflictCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const conflicts: TokenConflict[] = [];
    let comparisons = 0;

    // Detect naming conflicts
    const namingConflicts = this.detectNamingConflicts(tokens);
    conflicts.push(...namingConflicts);
    comparisons += tokens.length * (tokens.length - 1) / 2;

    // Detect value conflicts
    const valueConflicts = this.detectValueConflicts(tokens);
    conflicts.push(...valueConflicts);
    comparisons += tokens.length * (tokens.length - 1) / 2;

    // Detect semantic conflicts
    const semanticConflicts = this.detectSemanticConflicts(tokens, context);
    conflicts.push(...semanticConflicts);
    comparisons += tokens.length;

    // Detect category conflicts
    const categoryConflicts = this.detectCategoryConflicts(tokens);
    conflicts.push(...categoryConflicts);
    comparisons += tokens.length;

    // Detect reference conflicts
    const referenceConflicts = this.detectReferenceConflicts(tokens);
    conflicts.push(...referenceConflicts);
    comparisons += this.countReferences(tokens);

    // Detect constraint conflicts
    const constraintConflicts = this.detectConstraintConflicts(tokens, context);
    conflicts.push(...constraintConflicts);
    comparisons += tokens.length;

    // Generate resolution suggestions
    const resolutionSuggestions = this.generateResolutionSuggestions(conflicts, tokens);

    const endTime = performance.now();
    const conflictsBySeverity = this.groupConflictsBySeverity(conflicts);
    const conflictsByCategory = this.groupConflictsByCategory(conflicts);

    const result: ConflictDetectionResult = {
      conflicts,
      conflictsBySeverity,
      conflictsByCategory,
      resolutionSuggestions,
      metrics: {
        detectionTime: endTime - startTime,
        tokensAnalyzed: tokens.length,
        comparisons,
        performanceScore: this.calculatePerformanceScore(endTime - startTime, tokens.length),
      },
    };

    this.conflictCache.set(cacheKey, result);
    return result;
  }

  addValidationRule(rule: TokenValidationRule): void {
    this.validationRules.set(rule.name, rule);
    this.clearCache();
  }

  removeValidationRule(ruleId: string): void {
    this.validationRules.delete(ruleId);
    this.clearCache();
  }

  getValidationRules(): TokenValidationRule[] {
    return Array.from(this.validationRules.values());
  }

  private initializeDefaultRules(): void {
    // Core validation rules
    this.addValidationRule({
      name: 'token-name-required',
      types: Object.values(TokenType),
      validate: (token) => ({
        valid: Boolean(token.name && token.name.trim()),
        message: 'Token name is required',
      }),
      severity: ValidationSeverity.ERROR,
    });

    this.addValidationRule({
      name: 'token-value-required',
      types: Object.values(TokenType),
      validate: (token) => ({
        valid: token.value !== null && token.value !== undefined,
        message: 'Token value is required',
      }),
      severity: ValidationSeverity.ERROR,
    });

    this.addValidationRule({
      name: 'token-type-required',
      types: Object.values(TokenType),
      validate: (token) => ({
        valid: Boolean(token.type),
        message: 'Token type is required',
      }),
      severity: ValidationSeverity.ERROR,
    });

    // Naming convention rules
    this.addValidationRule({
      name: 'naming-kebab-case',
      types: Object.values(TokenType),
      validate: (token) => ({
        valid: /^[a-z][a-z0-9]*(-[a-z0-9]+)*(\.[a-z][a-z0-9]*(-[a-z0-9]+)*)*$/.test(token.name),
        message: 'Token name should use kebab-case with dot notation',
      }),
      severity: ValidationSeverity.WARNING,
    });

    this.addValidationRule({
      name: 'naming-no-reserved-words',
      types: Object.values(TokenType),
      validate: (token) => {
        const reservedWords = ['default', 'initial', 'inherit', 'unset', 'none', 'auto'];
        const nameParts = token.name.split('.');
        const hasReserved = nameParts.some(part => reservedWords.includes(part));
        return {
          valid: !hasReserved,
          message: 'Token name contains reserved words',
        };
      },
      severity: ValidationSeverity.WARNING,
    });

    // Value validation rules
    this.addValidationRule({
      name: 'color-hex-format',
      types: [TokenType.COLOR],
      validate: (token) => {
        if (typeof token.value === 'string') {
          const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(token.value);
          const isRgb = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(token.value);
          const isRgba = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(token.value);
          const isHsl = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/.test(token.value);
          const isHsla = /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/.test(token.value);
          
          return {
            valid: isHex || isRgb || isRgba || isHsl || isHsla,
            message: 'Color value must be valid hex, rgb, rgba, hsl, or hsla format',
          };
        }
        return { valid: true };
      },
      severity: ValidationSeverity.ERROR,
    });

    this.addValidationRule({
      name: 'dimension-unit-format',
      types: [TokenType.DIMENSION],
      validate: (token) => {
        if (typeof token.value === 'string') {
          const validUnits = ['px', 'rem', 'em', '%', 'vh', 'vw', 'pt', 'pc', 'in', 'cm', 'mm'];
          const hasUnit = validUnits.some(unit => token.value.toString().endsWith(unit));
          const isNumber = /^\d+(\.\d+)?$/.test(token.value);
          
          // For unitless numbers, we want to generate a warning (not be valid)
          if (isNumber && !hasUnit) {
            return {
              valid: false, // Generate warning for unitless numbers
              message: 'Dimension value should include a valid unit (px, rem, em, %, etc.)',
            };
          }
          
          return {
            valid: hasUnit,
            message: 'Dimension value must include a valid unit',
          };
        }
        return { valid: typeof token.value === 'number' };
      },
      severity: ValidationSeverity.WARNING,
    });

    this.addValidationRule({
      name: 'font-family-array',
      types: [TokenType.FONT_FAMILY],
      validate: (token) => {
        if (token.value && typeof token.value === 'object' && '$array' in token.value) {
          const array = token.value as TokenArray;
          return {
            valid: Array.isArray(array.$array) && array.$array.length > 0,
            message: 'Font family should be an array with at least one font',
          };
        }
        return {
          valid: typeof token.value === 'string',
          message: 'Font family must be a string or array',
        };
      },
      severity: ValidationSeverity.WARNING,
    });

    // Accessibility rules
    this.addValidationRule({
      name: 'color-contrast-consideration',
      types: [TokenType.COLOR],
      validate: (token) => {
        // Basic check for potentially low contrast colors
        if (typeof token.value === 'string' && token.value.startsWith('#')) {
          const hex = token.value.substring(1);
          if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            
            // Flag colors that might have contrast issues
            const isPotentiallyLowContrast = brightness > 200 && brightness < 240;
            
            return {
              valid: !isPotentiallyLowContrast,
              message: 'Color might have contrast accessibility issues',
            };
          }
        }
        return { valid: true };
      },
      severity: ValidationSeverity.INFO,
    });

    // Performance rules
    this.addValidationRule({
      name: 'avoid-expensive-gradients',
      types: [TokenType.GRADIENT],
      validate: (token) => {
        if (typeof token.value === 'string') {
          const colorStops = (token.value.match(/#[0-9a-fA-F]{6}/g) || []).length;
          return {
            valid: colorStops <= 5,
            message: 'Gradients with many color stops can impact performance',
          };
        }
        return { valid: true };
      },
      severity: ValidationSeverity.INFO,
    });

    // Deprecated token detection
    this.addValidationRule({
      name: 'deprecated-token-warning',
      types: Object.values(TokenType),
      validate: (token) => ({
        valid: !token.deprecated,
        message: `Token is deprecated${token.replacement ? `. Use ${token.replacement} instead` : ''}`,
      }),
      severity: ValidationSeverity.WARNING,
    });
  }

  private validateTokenStructure(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check for circular references in composite values
    if (this.hasCircularReferences(token)) {
      errors.push({
        code: 'circular-reference',
        message: 'Token contains circular references',
        category: 'reference',
        autoFixable: false,
      });
    }

    // Check for deep nesting
    const depth = this.calculateTokenDepth(token);
    if (depth > 5) {
      warnings.push({
        code: 'deep-nesting',
        message: 'Token has deeply nested structure that may impact performance',
        category: 'performance',
      });
    }
  }

  private validateTokenValue(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Type-specific value validation
    switch (token.type) {
      case TokenType.COLOR:
        this.validateColorValue(token, errors, warnings);
        break;
      case TokenType.DIMENSION:
        this.validateDimensionValue(token, errors, warnings);
        break;
      case TokenType.DURATION:
        this.validateDurationValue(token, errors, warnings);
        break;
      case TokenType.CUBIC_BEZIER:
        this.validateCubicBezierValue(token, errors, warnings);
        break;
    }
  }

  private validateTokenReferences(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const references = this.extractReferences(token);
    
    for (const ref of references) {
      if (!this.isValidReferenceFormat(ref)) {
        errors.push({
          code: 'invalid-reference-format',
          message: `Invalid reference format: ${ref}`,
          category: 'reference',
          autoFixable: true,
          suggestion: 'Use dot notation for token references',
        });
      }
    }
  }

  private validateTokenConstraints(
    token: DesignToken,
    context: TokenSemanticContext | undefined,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!context) return;

    // Framework-specific constraints
    if (context.framework === 'tailwind') {
      this.validateTailwindConstraints(token, errors, warnings);
    } else if (context.framework === 'chakra') {
      this.validateChakraConstraints(token, errors, warnings);
    } else if (context.framework === 'mui') {
      this.validateMUIConstraints(token, errors, warnings);
    }
  }

  private detectNamingConflicts(tokens: DesignToken[]): TokenConflict[] {
    const conflicts: TokenConflict[] = [];
    const nameMap = new Map<string, DesignToken[]>();

    // Group tokens by name
    for (const token of tokens) {
      const name = token.name.toLowerCase();
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(token);
    }

    // Find duplicates
    for (const [name, duplicateTokens] of nameMap) {
      if (duplicateTokens.length > 1) {
        conflicts.push({
          type: 'name',
          tokens: duplicateTokens.map(t => t.name),
          description: `Multiple tokens with the same name: ${name}`,
          severity: ValidationSeverity.ERROR,
          resolution: 'Rename one or more tokens to ensure uniqueness',
          autoResolvable: false,
        });
      }
    }

    // Find similar names (potential typos)
    const names = Array.from(nameMap.keys());
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const similarity = this.calculateStringSimilarity(names[i], names[j]);
        if (similarity > 0.8 && similarity < 1.0) {
          conflicts.push({
            type: 'name',
            tokens: [names[i], names[j]],
            description: `Similar token names detected (possible typo): ${names[i]} and ${names[j]}`,
            severity: ValidationSeverity.WARNING,
            resolution: 'Review token names for potential typos',
            autoResolvable: false,
          });
        }
      }
    }

    return conflicts;
  }

  private detectValueConflicts(tokens: DesignToken[]): TokenConflict[] {
    const conflicts: TokenConflict[] = [];
    const valueMap = new Map<string, DesignToken[]>();

    // Group tokens by value and type
    for (const token of tokens) {
      const valueKey = `${token.type}:${JSON.stringify(token.value)}`;
      if (!valueMap.has(valueKey)) {
        valueMap.set(valueKey, []);
      }
      valueMap.get(valueKey)!.push(token);
    }

    // Find duplicate values
    for (const [valueKey, duplicateTokens] of valueMap) {
      if (duplicateTokens.length > 1) {
        const [type, value] = valueKey.split(':');
        conflicts.push({
          type: 'value',
          tokens: duplicateTokens.map(t => t.name),
          description: `Multiple tokens with the same value: ${value}`,
          severity: ValidationSeverity.WARNING,
          resolution: 'Consider consolidating tokens with identical values',
          autoResolvable: true,
        });
      }
    }

    return conflicts;
  }

  private detectSemanticConflicts(tokens: DesignToken[], context?: TokenSemanticContext): TokenConflict[] {
    const conflicts: TokenConflict[] = [];

    // Detect category mismatches
    for (const token of tokens) {
      const expectedCategory = this.inferCategoryFromName(token.name);
      if (expectedCategory && expectedCategory !== token.category) {
        conflicts.push({
          type: 'semantic',
          tokens: [token.name],
          description: `Token category mismatch: expected ${expectedCategory}, got ${token.category}`,
          severity: ValidationSeverity.WARNING,
          resolution: `Consider changing category to ${expectedCategory}`,
          autoResolvable: true,
        });
      }
    }

    // Detect inconsistent naming patterns
    const patterns = this.analyzeNamingPatterns(tokens);
    for (const pattern of patterns.inconsistent) {
      conflicts.push({
        type: 'semantic',
        tokens: pattern.tokens,
        description: `Inconsistent naming pattern: ${pattern.description}`,
        severity: ValidationSeverity.INFO,
        resolution: 'Consider standardizing naming patterns',
        autoResolvable: false,
      });
    }

    return conflicts;
  }

  private detectCategoryConflicts(tokens: DesignToken[]): TokenConflict[] {
    const conflicts: TokenConflict[] = [];

    // Check for missing categories
    const uncategorizedTokens = tokens.filter(t => !t.category || t.category === TokenCategory.CUSTOM);
    if (uncategorizedTokens.length > 0) {
      conflicts.push({
        type: 'category',
        tokens: uncategorizedTokens.map(t => t.name),
        description: 'Tokens without proper categorization',
        severity: ValidationSeverity.WARNING,
        resolution: 'Assign appropriate categories to tokens',
        autoResolvable: true,
      });
    }

    return conflicts;
  }

  private detectReferenceConflicts(tokens: DesignToken[]): TokenConflict[] {
    const conflicts: TokenConflict[] = [];
    const tokenMap = new Map(tokens.map(t => [t.name, t]));

    for (const token of tokens) {
      const references = this.extractReferences(token);
      
      for (const ref of references) {
        if (!tokenMap.has(ref)) {
          conflicts.push({
            type: 'semantic',
            tokens: [token.name],
            description: `Broken reference: ${ref} does not exist`,
            severity: ValidationSeverity.ERROR,
            resolution: 'Fix reference or create missing token',
            autoResolvable: false,
          });
        }
      }
    }

    // Check for circular references
    const circularRefs = this.findCircularReferences(tokens);
    for (const cycle of circularRefs) {
      conflicts.push({
        type: 'semantic',
        tokens: cycle,
        description: `Circular reference detected: ${cycle.join(' -> ')}`,
        severity: ValidationSeverity.ERROR,
        resolution: 'Break circular reference chain',
        autoResolvable: false,
      });
    }

    return conflicts;
  }

  private detectConstraintConflicts(tokens: DesignToken[], context?: TokenSemanticContext): TokenConflict[] {
    const conflicts: TokenConflict[] = [];

    if (!context) return conflicts;

    // Framework-specific constraint validation
    for (const token of tokens) {
      const constraintViolations = this.checkFrameworkConstraints(token, context);
      
      for (const violation of constraintViolations) {
        conflicts.push({
          type: 'semantic',
          tokens: [token.name],
          description: violation.message,
          severity: violation.severity,
          resolution: violation.resolution,
          autoResolvable: violation.autoResolvable,
        });
      }
    }

    return conflicts;
  }

  private generateResolutionSuggestions(conflicts: TokenConflict[], tokens: DesignToken[]): ConflictResolution[] {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      const resolution = this.createResolutionSuggestion(conflict, tokens);
      if (resolution) {
        resolutions.push(resolution);
      }
    }

    return resolutions.sort((a, b) => b.confidence - a.confidence);
  }

  private createResolutionSuggestion(conflict: TokenConflict, tokens: DesignToken[]): ConflictResolution | null {
    switch (conflict.type) {
      case 'name':
        return this.createNamingResolution(conflict, tokens);
      case 'value':
        return this.createValueResolution(conflict, tokens);
      case 'semantic':
        return this.createSemanticResolution(conflict, tokens);
      case 'category':
        return this.createCategoryResolution(conflict, tokens);
      default:
        return null;
    }
  }

  private createNamingResolution(conflict: TokenConflict, tokens: DesignToken[]): ConflictResolution {
    const steps: ResolutionStep[] = [];
    
    // For duplicate names, suggest renaming all but the first
    for (let i = 1; i < conflict.tokens.length; i++) {
      const tokenName = conflict.tokens[i];
      const newName = this.generateUniqueName(tokenName, tokens);
      
      steps.push({
        description: `Rename ${tokenName} to ${newName}`,
        action: 'rename',
        target: tokenName,
        value: newName,
        priority: i,
      });
    }

    return {
      conflict,
      strategy: 'rename',
      confidence: 0.9,
      steps,
      expectedOutcome: 'All tokens will have unique names',
    };
  }

  private createValueResolution(conflict: TokenConflict, tokens: DesignToken[]): ConflictResolution {
    const steps: ResolutionStep[] = [];
    
    // For duplicate values, suggest merging or renaming
    if (conflict.tokens.length === 2) {
      steps.push({
        description: `Consider merging ${conflict.tokens.join(' and ')} as they have identical values`,
        action: 'remove',
        target: conflict.tokens[1],
        priority: 1,
      });
    }

    return {
      conflict,
      strategy: 'merge',
      confidence: 0.7,
      steps,
      expectedOutcome: 'Duplicate tokens will be consolidated',
    };
  }

  private createSemanticResolution(conflict: TokenConflict, tokens: DesignToken[]): ConflictResolution {
    const steps: ResolutionStep[] = [];
    
    // Generic semantic fix
    steps.push({
      description: `Review and fix semantic issue: ${conflict.description}`,
      action: 'modify',
      target: conflict.tokens[0],
      priority: 1,
    });

    return {
      conflict,
      strategy: 'manual',
      confidence: 0.5,
      steps,
      expectedOutcome: 'Semantic consistency will be improved',
    };
  }

  private createCategoryResolution(conflict: TokenConflict, tokens: DesignToken[]): ConflictResolution {
    const steps: ResolutionStep[] = [];
    
    for (const tokenName of conflict.tokens) {
      const suggestedCategory = this.inferCategoryFromName(tokenName);
      if (suggestedCategory) {
        steps.push({
          description: `Set category of ${tokenName} to ${suggestedCategory}`,
          action: 'modify',
          target: tokenName,
          value: { category: suggestedCategory },
          priority: 1,
        });
      }
    }

    return {
      conflict,
      strategy: 'transform',
      confidence: 0.8,
      steps,
      expectedOutcome: 'All tokens will have appropriate categories',
    };
  }

  // Helper methods
  private isRuleApplicable(rule: TokenValidationRule, token: DesignToken, context?: TokenSemanticContext): boolean {
    return rule.types.includes(token.type);
  }

  private applyValidationRule(rule: TokenValidationRule, token: DesignToken, context?: TokenSemanticContext) {
    return rule.validate(token);
  }

  private categorizeError(rule: TokenValidationRule, token: DesignToken): ValidationError['category'] {
    // Special cases for specific rules
    if (rule.name === 'token-value-required' || rule.name === 'token-name-required' || rule.name === 'token-type-required') {
      return 'syntax';
    }
    
    if (rule.name.includes('name') || rule.name.includes('naming')) return 'syntax';
    if (rule.name.includes('value') || rule.name.includes('format')) return 'value';
    if (rule.name.includes('reference') || rule.name.includes('ref')) return 'reference';
    if (rule.name.includes('semantic') || rule.name.includes('category')) return 'semantic';
    return 'constraint';
  }

  private categorizeWarning(rule: TokenValidationRule, token: DesignToken): ValidationWarning['category'] {
    if (rule.name.includes('deprecated')) return 'deprecated';
    if (rule.name.includes('naming') || rule.name.includes('convention')) return 'convention';
    if (rule.name.includes('performance')) return 'performance';
    if (rule.name.includes('accessibility') || rule.name.includes('contrast')) return 'accessibility';
    return 'convention';
  }

  private categorizeInfo(rule: TokenValidationRule, token: DesignToken): ValidationInfo['category'] {
    if (rule.name.includes('optimization')) return 'optimization';
    if (rule.name.includes('migration')) return 'migration';
    if (rule.name.includes('usage')) return 'usage';
    return 'enhancement';
  }

  private isAutoFixable(rule: TokenValidationRule, token: DesignToken): boolean {
    const autoFixableRules = ['naming-kebab-case', 'token-category-assignment'];
    return autoFixableRules.includes(rule.name);
  }

  private generateSuggestion(rule: TokenValidationRule, token: DesignToken): string | undefined {
    switch (rule.name) {
      case 'naming-kebab-case':
        return `Convert "${token.name}" to kebab-case format`;
      case 'color-hex-format':
        return 'Use valid color format (hex, rgb, rgba, hsl, hsla)';
      case 'dimension-unit-format':
        return 'Add a valid unit (px, rem, em, %, etc.)';
      default:
        return undefined;
    }
  }

  private getCacheKey(token: DesignToken, context?: TokenSemanticContext): string {
    return `${token.name}:${JSON.stringify(token.value)}:${context?.framework || 'none'}`;
  }

  private getConflictCacheKey(tokens: DesignToken[], context?: TokenSemanticContext): string {
    const tokenSignature = tokens.map(t => `${t.name}:${t.type}`).sort().join('|');
    return `${tokenSignature}:${context?.framework || 'none'}`;
  }

  private clearCache(): void {
    this.validationCache.clear();
    this.conflictCache.clear();
  }

  private hasCircularReferences(token: DesignToken): boolean {
    const visited = new Set<string>();
    return this.checkCircularRef(token, visited);
  }

  private checkCircularRef(value: any, visited: Set<string>, path: string[] = []): boolean {
    if (value && typeof value === 'object') {
      if ('$ref' in value) {
        const ref = value.$ref;
        if (visited.has(ref) || path.includes(ref)) {
          return true;
        }
        visited.add(ref);
        path.push(ref);
      } else if ('$array' in value) {
        return value.$array.some((item: any) => this.checkCircularRef(item, visited, path));
      } else {
        return Object.values(value).some(v => this.checkCircularRef(v, visited, path));
      }
    }
    return false;
  }

  private calculateTokenDepth(token: DesignToken): number {
    return this.getValueDepth(token.value);
  }

  private getValueDepth(value: any, depth = 0): number {
    if (value && typeof value === 'object') {
      if ('$array' in value) {
        return Math.max(...value.$array.map((item: any) => this.getValueDepth(item, depth + 1)));
      } else {
        return Math.max(...Object.values(value).map(v => this.getValueDepth(v, depth + 1)));
      }
    }
    return depth;
  }

  private validateColorValue(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Additional color-specific validation
    if (typeof token.value === 'string' && token.value.startsWith('#')) {
      const hex = token.value.substring(1);
      if (hex.length !== 3 && hex.length !== 6 && hex.length !== 8) {
        errors.push({
          code: 'invalid-hex-length',
          message: 'Hex color must be 3, 6, or 8 characters',
          category: 'value',
          autoFixable: false,
        });
      }
    }
  }

  private validateDimensionValue(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (typeof token.value === 'string') {
      const numericValue = parseFloat(token.value);
      if (numericValue < 0 && !token.name.includes('margin')) {
        warnings.push({
          code: 'negative-dimension',
          message: 'Negative dimensions may cause layout issues',
          category: 'convention',
        });
      }
    }
  }

  private validateDurationValue(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (typeof token.value === 'string') {
      const hasDurationUnit = /\d+(ms|s)$/.test(token.value);
      if (!hasDurationUnit) {
        errors.push({
          code: 'invalid-duration-unit',
          message: 'Duration must have ms or s unit',
          category: 'value',
          autoFixable: true,
          suggestion: 'Add ms or s unit to duration value',
        });
      }
    }
  }

  private validateCubicBezierValue(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (typeof token.value === 'string') {
      const cubicBezierPattern = /^cubic-bezier\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\)$/;
      if (!cubicBezierPattern.test(token.value)) {
        errors.push({
          code: 'invalid-cubic-bezier',
          message: 'Invalid cubic-bezier format',
          category: 'value',
          autoFixable: false,
          suggestion: 'Use format: cubic-bezier(x1, y1, x2, y2)',
        });
      }
    }
  }

  private extractReferences(token: DesignToken): string[] {
    const references: string[] = [];
    this.collectReferences(token.value, references);
    return references;
  }

  private collectReferences(value: any, references: string[]): void {
    if (value && typeof value === 'object') {
      if ('$ref' in value) {
        references.push(value.$ref);
      } else if ('$array' in value) {
        value.$array.forEach((item: any) => this.collectReferences(item, references));
      } else {
        Object.values(value).forEach(v => this.collectReferences(v, references));
      }
    }
  }

  private isValidReferenceFormat(ref: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(ref);
  }

  private validateTailwindConstraints(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Tailwind-specific validation
    if (token.category === TokenCategory.SPACING && typeof token.value === 'string') {
      const hasRemUnit = token.value.includes('rem');
      if (!hasRemUnit && !token.value.includes('px') && !token.value.includes('%')) {
        warnings.push({
          code: 'tailwind-spacing-unit',
          message: 'Tailwind prefers rem units for spacing',
          category: 'convention',
        });
      }
    }
  }

  private validateChakraConstraints(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Chakra UI-specific validation
    if (token.category === TokenCategory.COLOR && typeof token.value === 'string') {
      // Chakra prefers specific color scale values
      if (token.name.includes('.') && !/\.(50|100|200|300|400|500|600|700|800|900)$/.test(token.name)) {
        warnings.push({
          code: 'chakra-color-scale',
          message: 'Chakra UI uses 50-900 scale for colors',
          category: 'convention',
        });
      }
    }
  }

  private validateMUIConstraints(token: DesignToken, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Material-UI specific validation
    if (token.category === TokenCategory.TYPOGRAPHY && token.name.includes('fontSize')) {
      const validSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption', 'overline'];
      const hasValidSize = validSizes.some(size => token.name.includes(size));
      if (!hasValidSize) {
        warnings.push({
          code: 'mui-typography-variant',
          message: 'MUI uses specific typography variant names',
          category: 'convention',
        });
      }
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private inferCategoryFromName(name: string): TokenCategory | null {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('color') || nameLower.includes('bg') || nameLower.includes('text')) {
      return TokenCategory.COLOR;
    }
    if (nameLower.includes('spacing') || nameLower.includes('margin') || nameLower.includes('padding')) {
      return TokenCategory.SPACING;
    }
    if (nameLower.includes('font') || nameLower.includes('text') || nameLower.includes('typography')) {
      return TokenCategory.TYPOGRAPHY;
    }
    if (nameLower.includes('border') || nameLower.includes('radius')) {
      return TokenCategory.BORDER;
    }
    if (nameLower.includes('shadow') || nameLower.includes('elevation')) {
      return TokenCategory.SHADOW;
    }
    if (nameLower.includes('width') || nameLower.includes('height') || nameLower.includes('size')) {
      return TokenCategory.SIZING;
    }
    
    return null;
  }

  private analyzeNamingPatterns(tokens: DesignToken[]): { consistent: any[]; inconsistent: any[] } {
    // Simplified pattern analysis
    const patterns = {
      consistent: [],
      inconsistent: [],
    };

    // Check for mixed naming conventions
    const kebabCaseTokens = tokens.filter(t => /^[a-z][a-z0-9]*(-[a-z0-9]+)*(\.[a-z][a-z0-9]*(-[a-z0-9]+)*)*$/.test(t.name));
    const camelCaseTokens = tokens.filter(t => /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/.test(t.name));
    
    if (kebabCaseTokens.length > 0 && camelCaseTokens.length > 0) {
      patterns.inconsistent.push({
        description: 'Mixed naming conventions (kebab-case and camelCase)',
        tokens: [...kebabCaseTokens.slice(0, 3).map(t => t.name), ...camelCaseTokens.slice(0, 3).map(t => t.name)],
      });
    }

    return patterns;
  }

  private countReferences(tokens: DesignToken[]): number {
    return tokens.reduce((count, token) => count + this.extractReferences(token).length, 0);
  }

  private findCircularReferences(tokens: DesignToken[]): string[][] {
    const cycles: string[][] = [];
    const tokenMap = new Map(tokens.map(t => [t.name, t]));
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (tokenName: string, path: string[]): void => {
      if (recursionStack.has(tokenName)) {
        const cycleStart = path.indexOf(tokenName);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(tokenName)) return;

      visited.add(tokenName);
      recursionStack.add(tokenName);

      const token = tokenMap.get(tokenName);
      if (token) {
        const references = this.extractReferences(token);
        for (const ref of references) {
          dfs(ref, [...path, ref]);
        }
      }

      recursionStack.delete(tokenName);
    };

    for (const token of tokens) {
      if (!visited.has(token.name)) {
        dfs(token.name, [token.name]);
      }
    }

    return cycles;
  }

  private checkFrameworkConstraints(token: DesignToken, context: TokenSemanticContext): Array<{
    message: string;
    severity: ValidationSeverity;
    resolution: string;
    autoResolvable: boolean;
  }> {
    const violations = [];

    // Framework-specific constraint checking
    switch (context.framework) {
      case 'tailwind':
        // Add Tailwind-specific constraints
        break;
      case 'chakra':
        // Add Chakra-specific constraints
        break;
      case 'mui':
        // Add MUI-specific constraints
        break;
    }

    return violations;
  }

  private groupConflictsBySeverity(conflicts: TokenConflict[]): Record<ValidationSeverity, TokenConflict[]> {
    return {
      [ValidationSeverity.ERROR]: conflicts.filter(c => c.severity === ValidationSeverity.ERROR),
      [ValidationSeverity.WARNING]: conflicts.filter(c => c.severity === ValidationSeverity.WARNING),
      [ValidationSeverity.INFO]: conflicts.filter(c => c.severity === ValidationSeverity.INFO),
    };
  }

  private groupConflictsByCategory(conflicts: TokenConflict[]): Record<string, TokenConflict[]> {
    const groups: Record<string, TokenConflict[]> = {};
    
    for (const conflict of conflicts) {
      if (!groups[conflict.type]) {
        groups[conflict.type] = [];
      }
      groups[conflict.type].push(conflict);
    }
    
    return groups;
  }

  private calculatePerformanceScore(timeMs: number, tokenCount: number): number {
    const timeScore = Math.max(0, 100 - (timeMs / 10)); // Penalty for time > 1s
    const complexityScore = Math.max(0, 100 - (tokenCount / 100)); // Penalty for > 10k tokens
    return (timeScore + complexityScore) / 2;
  }

  private generateUniqueName(baseName: string, tokens: DesignToken[]): string {
    const existingNames = new Set(tokens.map(t => t.name));
    let counter = 1;
    let newName = `${baseName}-${counter}`;
    
    while (existingNames.has(newName)) {
      counter++;
      newName = `${baseName}-${counter}`;
    }
    
    return newName;
  }
}

/**
 * Token validator registry
 */
export class TokenValidatorRegistry {
  private validators = new Map<string, TokenValidator>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.validators.set('base', new BaseTokenValidator());
  }

  register(name: string, validator: TokenValidator): void {
    this.validators.set(name, validator);
  }

  getValidator(name: string): TokenValidator | undefined {
    return this.validators.get(name);
  }

  getAvailableValidators(): string[] {
    return Array.from(this.validators.keys());
  }

  validateTokens(
    tokens: DesignToken[],
    context?: TokenSemanticContext,
    validatorName: string = 'base'
  ): TokenValidationResult[] {
    const validator = this.getValidator(validatorName);
    
    if (!validator) {
      throw new Error(`No validator available: ${validatorName}`);
    }

    return validator.validateTokens(tokens, context);
  }

  detectConflicts(
    tokens: DesignToken[],
    context?: TokenSemanticContext,
    validatorName: string = 'base'
  ): ConflictDetectionResult {
    const validator = this.getValidator(validatorName);
    
    if (!validator) {
      throw new Error(`No validator available: ${validatorName}`);
    }

    return validator.detectConflicts(tokens, context);
  }
}