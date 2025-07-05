import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenFormat,
  TokenValue,
  TokenMigrationStrategy,
  TokenMigrationContext,
  TokenTransformationResult,
  TokenValidationRule,
  TokenSemanticMapping,
  TokenSemanticContext,
  TokenCompositeValue,
  TokenReference,
  TokenArray,
} from '../../types/theme-tokens.types';

/**
 * Semantic token migration interface
 */
export interface SemanticTokenMigrator {
  /**
   * Migrate tokens using semantic understanding
   */
  migrate(
    tokens: DesignToken[],
    sourceContext: TokenSemanticContext,
    targetContext: TokenSemanticContext
  ): Promise<TokenTransformationResult>;

  /**
   * Analyze semantic relationships between tokens
   */
  analyzeSemanticRelationships(tokens: DesignToken[]): SemanticRelationshipMap;

  /**
   * Generate semantic mappings between frameworks
   */
  generateSemanticMappings(
    sourceFramework: string,
    targetFramework: string
  ): TokenSemanticMapping[];

  /**
   * Resolve semantic conflicts during migration
   */
  resolveSemanticConflicts(
    conflicts: SemanticConflict[],
    context: TokenMigrationContext
  ): ConflictResolution[];
}

/**
 * Semantic relationship types
 */
export enum SemanticRelationshipType {
  HIERARCHY = 'hierarchy',
  VARIANT = 'variant',
  STATE = 'state',
  CONTEXT = 'context',
  SCALE = 'scale',
  COMPOSITE = 'composite',
}

/**
 * Semantic relationship between tokens
 */
export interface SemanticRelationship {
  type: SemanticRelationshipType;
  sourceToken: string;
  targetToken: string;
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Semantic relationship map
 */
export interface SemanticRelationshipMap {
  relationships: SemanticRelationship[];
  hierarchies: TokenHierarchy[];
  scales: TokenScale[];
  variants: TokenVariant[];
}

/**
 * Token hierarchy representation
 */
export interface TokenHierarchy {
  base: string;
  children: string[];
  level: number;
  category: TokenCategory;
}

/**
 * Token scale representation
 */
export interface TokenScale {
  name: string;
  tokens: string[];
  scaleType: 'linear' | 'exponential' | 'categorical';
  values: (string | number)[];
}

/**
 * Token variant representation
 */
export interface TokenVariant {
  base: string;
  variants: Record<string, string>;
  category: TokenCategory;
}

/**
 * Semantic conflict representation
 */
export interface SemanticConflict {
  type: 'naming' | 'value' | 'mapping' | 'hierarchy';
  sourceToken: string;
  targetCandidates: string[];
  confidence: number[];
  reason: string;
}

/**
 * Conflict resolution
 */
export interface ConflictResolution {
  conflict: SemanticConflict;
  resolution: 'auto' | 'manual' | 'skip';
  selectedTarget?: string;
  transformedValue?: TokenValue;
  reasoning: string;
}

/**
 * Semantic token patterns
 */
export interface SemanticPattern {
  name: string;
  pattern: RegExp;
  category: TokenCategory;
  semanticRole: string;
  extractMetadata: (match: RegExpMatchArray) => Record<string, any>;
}

/**
 * Framework semantic rules
 */
export interface FrameworkSemanticRules {
  framework: string;
  patterns: SemanticPattern[];
  namingConventions: Record<TokenCategory, string[]>;
  semanticHierarchy: Record<string, string[]>;
  valueSemantics: Record<TokenType, (value: TokenValue) => SemanticValueInfo>;
}

/**
 * Semantic value information
 */
export interface SemanticValueInfo {
  role: string;
  unit?: string;
  scale?: 'relative' | 'absolute';
  constraints?: Record<string, any>;
}

/**
 * Base semantic token migrator implementation
 */
export class BaseSemanticTokenMigrator implements SemanticTokenMigrator {
  private frameworkRules = new Map<string, FrameworkSemanticRules>();
  private semanticMappings = new Map<string, TokenSemanticMapping[]>();

  constructor() {
    this.initializeFrameworkRules();
  }

  async migrate(
    tokens: DesignToken[],
    sourceContext: TokenSemanticContext,
    targetContext: TokenSemanticContext
  ): Promise<TokenTransformationResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let transformedCount = 0;

    try {
      // Analyze semantic relationships
      const relationships = this.analyzeSemanticRelationships(tokens);

      // Generate semantic mappings
      const mappings = this.generateSemanticMappings(
        sourceContext.framework,
        targetContext.framework
      );

      // Apply semantic transformations
      let migratedTokens = await this.applySemanticTransformations(
        tokens,
        mappings,
        sourceContext,
        targetContext
      );

      // Detect and resolve conflicts
      const conflicts = this.detectSemanticConflicts(migratedTokens, targetContext);
      const resolutions = this.resolveSemanticConflicts(conflicts, {
        sourceFramework: sourceContext.framework,
        targetFramework: targetContext.framework,
        preserveSemantics: true,
        strictValidation: false,
        styleType: 'tokens' as any,
        filePath: 'semantic-migration',
      });

      // Apply conflict resolutions
      migratedTokens = this.applyConflictResolutions(migratedTokens, resolutions);

      // Validate semantic consistency
      const validation = this.validateSemanticConsistency(migratedTokens, targetContext);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      transformedCount = migratedTokens.length;
      const endTime = performance.now();

      return {
        success: errors.length === 0,
        tokens: migratedTokens,
        output: this.generateSemanticOutput(migratedTokens, targetContext),
        warnings,
        errors,
        metadata: {
          transformedCount,
          skippedCount: 0,
          processingTime: endTime - startTime,
          strategy: `${sourceContext.framework}-to-${targetContext.framework}-semantic`,
          semanticRelationships: relationships,
          conflictResolutions: resolutions,
        },
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        success: false,
        tokens: [],
        output: '',
        warnings,
        errors: [error instanceof Error ? error.message : 'Semantic migration failed'],
        metadata: {
          transformedCount: 0,
          skippedCount: tokens.length,
          processingTime: endTime - startTime,
          strategy: `${sourceContext.framework}-to-${targetContext.framework}-semantic`,
        },
      };
    }
  }

  analyzeSemanticRelationships(tokens: DesignToken[]): SemanticRelationshipMap {
    const relationships: SemanticRelationship[] = [];
    const hierarchies: TokenHierarchy[] = [];
    const scales: TokenScale[] = [];
    const variants: TokenVariant[] = [];

    // Group tokens by category
    const tokensByCategory = this.groupTokensByCategory(tokens);

    // Analyze hierarchical relationships
    for (const [category, categoryTokens] of tokensByCategory) {
      const categoryHierarchies = this.analyzeHierarchy(categoryTokens, category);
      hierarchies.push(...categoryHierarchies);

      const categoryScales = this.analyzeScales(categoryTokens, category);
      scales.push(...categoryScales);

      const categoryVariants = this.analyzeVariants(categoryTokens, category);
      variants.push(...categoryVariants);
    }

    // Analyze cross-category relationships
    relationships.push(...this.analyzeCrossCategory(tokens));

    return {
      relationships,
      hierarchies,
      scales,
      variants,
    };
  }

  generateSemanticMappings(
    sourceFramework: string,
    targetFramework: string
  ): TokenSemanticMapping[] {
    const cacheKey = `${sourceFramework}-to-${targetFramework}`;
    
    if (this.semanticMappings.has(cacheKey)) {
      return this.semanticMappings.get(cacheKey)!;
    }

    const sourceRules = this.frameworkRules.get(sourceFramework);
    const targetRules = this.frameworkRules.get(targetFramework);

    if (!sourceRules || !targetRules) {
      throw new Error(`Framework rules not found for ${sourceFramework} or ${targetFramework}`);
    }

    const mappings = this.computeSemanticMappings(sourceRules, targetRules);
    this.semanticMappings.set(cacheKey, mappings);

    return mappings;
  }

  resolveSemanticConflicts(
    conflicts: SemanticConflict[],
    context: TokenMigrationContext
  ): ConflictResolution[] {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      const resolution = this.resolveConflict(conflict, context);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  private initializeFrameworkRules(): void {
    // Tailwind CSS semantic rules
    this.frameworkRules.set('tailwind', {
      framework: 'tailwind',
      patterns: [
        {
          name: 'color-scale',
          pattern: /^colors\.(\w+)\.(\d+)$/,
          category: TokenCategory.COLOR,
          semanticRole: 'color-scale-value',
          extractMetadata: (match) => ({
            colorName: match[1],
            scaleValue: parseInt(match[2]),
            intensity: this.getColorIntensity(parseInt(match[2])),
          }),
        },
        {
          name: 'spacing-scale',
          pattern: /^spacing\.(\w+)$/,
          category: TokenCategory.SPACING,
          semanticRole: 'spacing-value',
          extractMetadata: (match) => ({
            size: match[1],
            relative: this.isRelativeSize(match[1]),
          }),
        },
        {
          name: 'font-size',
          pattern: /^fontSize\.(\w+)$/,
          category: TokenCategory.TYPOGRAPHY,
          semanticRole: 'font-size',
          extractMetadata: (match) => ({
            size: match[1],
            scale: this.getFontScale(match[1]),
          }),
        },
      ],
      namingConventions: {
        [TokenCategory.COLOR]: ['colors', 'bg', 'text', 'border'],
        [TokenCategory.SPACING]: ['spacing', 'margin', 'padding', 'gap'],
        [TokenCategory.TYPOGRAPHY]: ['fontSize', 'fontWeight', 'fontFamily', 'lineHeight'],
        [TokenCategory.BORDER]: ['borderWidth', 'borderRadius', 'borderColor'],
        [TokenCategory.SHADOW]: ['boxShadow', 'dropShadow'],
        [TokenCategory.SIZING]: ['width', 'height', 'maxWidth', 'maxHeight'],
        [TokenCategory.LAYOUT]: ['container', 'screens'],
        [TokenCategory.MOTION]: ['transitionDuration', 'transitionTimingFunction'],
        [TokenCategory.TIMING]: ['transitionDuration', 'animationDuration'],
        [TokenCategory.OPACITY]: ['opacity'],
        [TokenCategory.Z_INDEX]: ['zIndex'],
        [TokenCategory.BREAKPOINT]: ['screens', 'breakpoints'],
        [TokenCategory.TRANSITION]: ['transition'],
        [TokenCategory.ANIMATION]: ['animation'],
        [TokenCategory.GRADIENT]: ['gradient'],
        [TokenCategory.ASSET]: ['asset'],
        [TokenCategory.CUSTOM]: ['extend'],
      } as Record<TokenCategory, string[]>,
      semanticHierarchy: {
        color: ['primary', 'secondary', 'accent', 'neutral', 'semantic'],
        spacing: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        typography: ['heading', 'body', 'caption', 'overline'],
      },
      valueSemantics: Object.fromEntries(
        Object.values(TokenType).map(type => [
          type,
          (value: TokenValue) => {
            switch (type) {
              case TokenType.COLOR:
                return {
                  role: 'visual-identifier',
                  constraints: { format: 'hex|rgb|hsl' },
                };
              case TokenType.DIMENSION:
                return {
                  role: 'measurement',
                  unit: this.extractUnit(value as string),
                  scale: 'absolute' as const,
                };
              default:
                return {
                  role: 'token-value',
                  scale: 'absolute' as const,
                };
            }
          }
        ])
      ) as Record<TokenType, (value: TokenValue) => SemanticValueInfo>,
    });

    // Chakra UI semantic rules
    this.frameworkRules.set('chakra', {
      framework: 'chakra',
      patterns: [
        {
          name: 'color-palette',
          pattern: /^colors\.(\w+)\.(\d+)$/,
          category: TokenCategory.COLOR,
          semanticRole: 'color-palette-value',
          extractMetadata: (match) => ({
            palette: match[1],
            shade: parseInt(match[2]),
            intensity: this.getColorIntensity(parseInt(match[2])),
          }),
        },
        {
          name: 'space-scale',
          pattern: /^space\.(\w+)$/,
          category: TokenCategory.SPACING,
          semanticRole: 'space-value',
          extractMetadata: (match) => ({
            size: match[1],
            semanticSize: this.getSemanticSize(match[1]),
          }),
        },
      ],
      namingConventions: {
        [TokenCategory.COLOR]: ['colors'],
        [TokenCategory.SPACING]: ['space', 'sizes'],
        [TokenCategory.TYPOGRAPHY]: ['fontSizes', 'fontWeights', 'fonts', 'lineHeights'],
        [TokenCategory.BORDER]: ['radii', 'borders'],
        [TokenCategory.SHADOW]: ['shadows'],
        [TokenCategory.SIZING]: ['sizes'],
        [TokenCategory.LAYOUT]: ['breakpoints'],
        [TokenCategory.MOTION]: ['transition'],
        [TokenCategory.TIMING]: ['transition'],
        [TokenCategory.OPACITY]: ['opacity'],
        [TokenCategory.Z_INDEX]: ['zIndices'],
        [TokenCategory.BREAKPOINT]: ['breakpoints'],
        [TokenCategory.TRANSITION]: ['transition'],
        [TokenCategory.ANIMATION]: ['animation'],
        [TokenCategory.GRADIENT]: ['gradient'],
        [TokenCategory.ASSET]: ['asset'],
        [TokenCategory.CUSTOM]: ['components', 'layerStyles', 'textStyles'],
      } as Record<TokenCategory, string[]>,
      semanticHierarchy: {
        color: ['brand', 'accent', 'neutral', 'success', 'warning', 'error'],
        space: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
        typography: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
      },
      valueSemantics: Object.fromEntries(
        Object.values(TokenType).map(type => [
          type,
          (value: TokenValue) => {
            switch (type) {
              case TokenType.COLOR:
                return {
                  role: 'brand-color',
                  constraints: { accessibility: 'wcag-aa' },
                };
              case TokenType.DIMENSION:
                return {
                  role: 'spacing-unit',
                  unit: this.extractUnit(value as string),
                  scale: 'relative' as const,
                };
              default:
                return {
                  role: 'token-value',
                  scale: 'relative' as const,
                };
            }
          }
        ])
      ) as Record<TokenType, (value: TokenValue) => SemanticValueInfo>,
    });

    // Material-UI semantic rules
    this.frameworkRules.set('mui', {
      framework: 'mui',
      patterns: [
        {
          name: 'palette-color',
          pattern: /^palette\.(\w+)\.(\w+)$/,
          category: TokenCategory.COLOR,
          semanticRole: 'theme-color',
          extractMetadata: (match) => ({
            role: match[1],
            variant: match[2],
            semantic: this.getSemanticRole(match[1]),
          }),
        },
        {
          name: 'typography-variant',
          pattern: /^typography\.(\w+)\.(\w+)$/,
          category: TokenCategory.TYPOGRAPHY,
          semanticRole: 'typography-style',
          extractMetadata: (match) => ({
            variant: match[1],
            property: match[2],
            hierarchy: this.getTypographyHierarchy(match[1]),
          }),
        },
      ],
      namingConventions: {
        [TokenCategory.COLOR]: ['palette'],
        [TokenCategory.SPACING]: ['spacing'],
        [TokenCategory.TYPOGRAPHY]: ['typography'],
        [TokenCategory.BORDER]: ['shape'],
        [TokenCategory.SHADOW]: ['shadows'],
        [TokenCategory.SIZING]: ['breakpoints'],
        [TokenCategory.LAYOUT]: ['mixins'],
        [TokenCategory.MOTION]: ['transitions'],
        [TokenCategory.TIMING]: ['transitions'],
        [TokenCategory.OPACITY]: ['opacity'],
        [TokenCategory.Z_INDEX]: ['zIndex'],
        [TokenCategory.BREAKPOINT]: ['breakpoints'],
        [TokenCategory.TRANSITION]: ['transitions'],
        [TokenCategory.ANIMATION]: ['transitions'],
        [TokenCategory.GRADIENT]: ['palette'],
        [TokenCategory.ASSET]: ['assets'],
        [TokenCategory.CUSTOM]: ['components', 'props'],
      } as Record<TokenCategory, string[]>,
      semanticHierarchy: {
        color: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
        typography: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption'],
        elevation: ['0', '1', '2', '3', '4', '6', '8', '12', '16', '24'],
      },
      valueSemantics: Object.fromEntries(
        Object.values(TokenType).map(type => [
          type,
          (value: TokenValue) => {
            switch (type) {
              case TokenType.COLOR:
                return {
                  role: 'material-color',
                  constraints: { elevation: 'material-design' },
                };
              case TokenType.DIMENSION:
                return {
                  role: 'layout-unit',
                  unit: this.extractUnit(value as string),
                  scale: 'relative' as const,
                };
              default:
                return {
                  role: 'token-value',
                  scale: 'relative' as const,
                };
            }
          }
        ])
      ) as Record<TokenType, (value: TokenValue) => SemanticValueInfo>,
    });
  }

  private async applySemanticTransformations(
    tokens: DesignToken[],
    mappings: TokenSemanticMapping[],
    sourceContext: TokenSemanticContext,
    targetContext: TokenSemanticContext
  ): Promise<DesignToken[]> {
    const transformedTokens: DesignToken[] = [];

    for (const token of tokens) {
      const semanticInfo = this.extractSemanticInfo(token, sourceContext);
      const mapping = this.findBestSemanticMapping(semanticInfo, mappings);

      if (mapping) {
        const transformedToken = await this.applySemanticMapping(
          token,
          mapping,
          targetContext
        );
        transformedTokens.push(transformedToken);
      } else {
        // No direct mapping found, try semantic inference
        const inferredToken = await this.inferSemanticMapping(
          token,
          sourceContext,
          targetContext
        );
        transformedTokens.push(inferredToken);
      }
    }

    return transformedTokens;
  }

  private detectSemanticConflicts(
    tokens: DesignToken[],
    context: TokenSemanticContext
  ): SemanticConflict[] {
    const conflicts: SemanticConflict[] = [];

    // Check for naming conflicts
    const nameMap = new Map<string, DesignToken[]>();
    for (const token of tokens) {
      const name = token.name;
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(token);
    }

    for (const [name, duplicateTokens] of nameMap) {
      if (duplicateTokens.length > 1) {
        conflicts.push({
          type: 'naming',
          sourceToken: name,
          targetCandidates: duplicateTokens.map(t => t.name),
          confidence: [0.8, 0.6, 0.4].slice(0, duplicateTokens.length),
          reason: 'Multiple tokens map to same target name',
        });
      }
    }

    // Check for value conflicts
    const valueConflicts = this.detectValueConflicts(tokens, context);
    conflicts.push(...valueConflicts);

    // Check for hierarchy conflicts
    const hierarchyConflicts = this.detectHierarchyConflicts(tokens, context);
    conflicts.push(...hierarchyConflicts);

    return conflicts;
  }

  private resolveConflict(
    conflict: SemanticConflict,
    context: TokenMigrationContext
  ): ConflictResolution {
    switch (conflict.type) {
      case 'naming':
        return this.resolveNamingConflict(conflict, context);
      case 'value':
        return this.resolveValueConflict(conflict, context);
      case 'mapping':
        return this.resolveMappingConflict(conflict, context);
      case 'hierarchy':
        return this.resolveHierarchyConflict(conflict, context);
      default:
        return {
          conflict,
          resolution: 'skip',
          reasoning: 'Unknown conflict type',
        };
    }
  }

  private resolveNamingConflict(
    conflict: SemanticConflict,
    context: TokenMigrationContext
  ): ConflictResolution {
    if (conflict.confidence[0] > 0.8) {
      return {
        conflict,
        resolution: 'auto',
        selectedTarget: conflict.targetCandidates[0],
        reasoning: 'High confidence automatic resolution',
      };
    }

    return {
      conflict,
      resolution: 'manual',
      reasoning: 'Requires manual review due to low confidence',
    };
  }

  private resolveValueConflict(
    conflict: SemanticConflict,
    context: TokenMigrationContext
  ): ConflictResolution {
    // Try to resolve based on semantic equivalence
    const semanticEquivalent = this.findSemanticEquivalent(
      conflict.sourceToken,
      conflict.targetCandidates,
      context
    );

    if (semanticEquivalent) {
      return {
        conflict,
        resolution: 'auto',
        selectedTarget: semanticEquivalent,
        reasoning: 'Resolved using semantic equivalence',
      };
    }

    return {
      conflict,
      resolution: 'manual',
      reasoning: 'No clear semantic equivalent found',
    };
  }

  private resolveMappingConflict(
    conflict: SemanticConflict,
    context: TokenMigrationContext
  ): ConflictResolution {
    return {
      conflict,
      resolution: 'manual',
      reasoning: 'Mapping conflicts require manual intervention',
    };
  }

  private resolveHierarchyConflict(
    conflict: SemanticConflict,
    context: TokenMigrationContext
  ): ConflictResolution {
    return {
      conflict,
      resolution: 'auto',
      reasoning: 'Hierarchy conflicts can be auto-resolved by flattening',
    };
  }

  private validateSemanticConsistency(
    tokens: DesignToken[],
    context: TokenSemanticContext
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const rules = this.frameworkRules.get(context.framework);
    if (!rules) {
      errors.push(`No semantic rules found for framework: ${context.framework}`);
      return { errors, warnings };
    }

    // Validate naming conventions
    for (const token of tokens) {
      const conventionViolations = this.checkNamingConventions(token, rules);
      warnings.push(...conventionViolations);
    }

    // Validate semantic hierarchies
    const hierarchyViolations = this.checkSemanticHierarchies(tokens, rules);
    warnings.push(...hierarchyViolations);

    // Validate value semantics
    const valueViolations = this.checkValueSemantics(tokens, rules);
    errors.push(...valueViolations);

    return { errors, warnings };
  }

  private generateSemanticOutput(
    tokens: DesignToken[],
    context: TokenSemanticContext
  ): string {
    const output = {
      framework: context.framework,
      version: context.version,
      tokens: tokens.map(token => ({
        name: token.name,
        value: token.value,
        type: token.type,
        category: token.category,
        semanticInfo: this.extractSemanticInfo(token, context),
      })),
      metadata: {
        migrationTimestamp: new Date().toISOString(),
        sourceFramework: context.sourceFramework,
        targetFramework: context.framework,
      },
    };

    return JSON.stringify(output, null, 2);
  }

  // Helper methods
  private groupTokensByCategory(tokens: DesignToken[]): Map<TokenCategory, DesignToken[]> {
    const groups = new Map<TokenCategory, DesignToken[]>();

    for (const token of tokens) {
      const category = token.category || TokenCategory.CUSTOM;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(token);
    }

    return groups;
  }

  private analyzeHierarchy(tokens: DesignToken[], category: TokenCategory): TokenHierarchy[] {
    const hierarchies: TokenHierarchy[] = [];
    const tokenNames = tokens.map(t => t.name);

    // Group by base name (everything before the last dot)
    const baseGroups = new Map<string, string[]>();
    
    for (const name of tokenNames) {
      const parts = name.split('.');
      if (parts.length > 1) {
        const base = parts.slice(0, -1).join('.');
        if (!baseGroups.has(base)) {
          baseGroups.set(base, []);
        }
        baseGroups.get(base)!.push(name);
      }
    }

    for (const [base, children] of baseGroups) {
      if (children.length > 1) {
        hierarchies.push({
          base,
          children,
          level: base.split('.').length,
          category,
        });
      }
    }

    return hierarchies;
  }

  private analyzeScales(tokens: DesignToken[], category: TokenCategory): TokenScale[] {
    const scales: TokenScale[] = [];
    
    // Look for numeric scales
    const numericTokens = tokens.filter(token => {
      const parts = token.name.split('.');
      const lastPart = parts[parts.length - 1];
      return /^\d+$/.test(lastPart);
    });

    if (numericTokens.length > 2) {
      const baseName = this.findCommonBase(numericTokens.map(t => t.name));
      const scaleValues = numericTokens
        .map(token => ({
          token: token.name,
          value: parseInt(token.name.split('.').pop()!),
          tokenValue: token.value,
        }))
        .sort((a, b) => a.value - b.value);

      scales.push({
        name: baseName,
        tokens: scaleValues.map(s => s.token),
        scaleType: this.determineScaleType(scaleValues.map(s => s.value)),
        values: scaleValues.map(s => typeof s.tokenValue === 'string' || typeof s.tokenValue === 'number' ? s.tokenValue : String(s.tokenValue)),
      });
    }

    return scales;
  }

  private analyzeVariants(tokens: DesignToken[], category: TokenCategory): TokenVariant[] {
    const variants: TokenVariant[] = [];
    
    // Group by base and find variant patterns
    const baseGroups = new Map<string, DesignToken[]>();
    
    for (const token of tokens) {
      const parts = token.name.split('.');
      if (parts.length > 1) {
        const base = parts.slice(0, -1).join('.');
        if (!baseGroups.has(base)) {
          baseGroups.set(base, []);
        }
        baseGroups.get(base)!.push(token);
      }
    }

    for (const [base, groupTokens] of baseGroups) {
      if (groupTokens.length > 1) {
        const variantMap: Record<string, string> = {};
        
        for (const token of groupTokens) {
          const variant = token.name.split('.').pop()!;
          variantMap[variant] = token.name;
        }

        variants.push({
          base,
          variants: variantMap,
          category,
        });
      }
    }

    return variants;
  }

  private analyzeCrossCategory(tokens: DesignToken[]): SemanticRelationship[] {
    const relationships: SemanticRelationship[] = [];
    
    // Find tokens that reference other tokens
    for (const token of tokens) {
      if (token.value && typeof token.value === 'object' && '$ref' in token.value) {
        const ref = token.value as TokenReference;
        const referencedToken = tokens.find(t => t.name === ref.$ref);
        
        if (referencedToken) {
          relationships.push({
            type: SemanticRelationshipType.HIERARCHY,
            sourceToken: token.name,
            targetToken: referencedToken.name,
            confidence: 0.9,
            metadata: { relationship: 'reference' },
          });
        }
      }
    }

    return relationships;
  }

  private computeSemanticMappings(
    sourceRules: FrameworkSemanticRules,
    targetRules: FrameworkSemanticRules
  ): TokenSemanticMapping[] {
    const mappings: TokenSemanticMapping[] = [];

    // Map patterns with same semantic roles
    for (const sourcePattern of sourceRules.patterns) {
      for (const targetPattern of targetRules.patterns) {
        if (sourcePattern.semanticRole === targetPattern.semanticRole) {
          mappings.push({
            sourcePattern: sourcePattern.pattern,
            targetPattern: targetPattern.pattern,
            confidence: 0.8,
            semanticRole: sourcePattern.semanticRole,
            transform: this.createSemanticTransform(sourcePattern, targetPattern),
          });
        }
      }
    }

    return mappings;
  }

  private extractSemanticInfo(token: DesignToken, context: TokenSemanticContext): any {
    const rules = this.frameworkRules.get(context.framework);
    if (!rules) return {};

    for (const pattern of rules.patterns) {
      const match = token.name.match(pattern.pattern);
      if (match) {
        return {
          pattern: pattern.name,
          role: pattern.semanticRole,
          ...pattern.extractMetadata(match),
        };
      }
    }

    return { role: 'unknown' };
  }

  private findBestSemanticMapping(
    semanticInfo: any,
    mappings: TokenSemanticMapping[]
  ): TokenSemanticMapping | null {
    return mappings.find(mapping => mapping.semanticRole === semanticInfo.role) || null;
  }

  private async applySemanticMapping(
    token: DesignToken,
    mapping: TokenSemanticMapping,
    context: TokenSemanticContext
  ): Promise<DesignToken> {
    let newName = token.name;
    
    if (mapping.transform) {
      newName = mapping.transform(token.name, token.value);
    }

    return {
      ...token,
      name: newName,
      metadata: {
        ...token.metadata,
        semanticMapping: mapping.semanticRole,
        originalName: token.name,
      },
    };
  }

  private async inferSemanticMapping(
    token: DesignToken,
    sourceContext: TokenSemanticContext,
    targetContext: TokenSemanticContext
  ): Promise<DesignToken> {
    // Basic inference based on category and naming patterns
    const semanticInfo = this.extractSemanticInfo(token, sourceContext);
    const targetRules = this.frameworkRules.get(targetContext.framework);
    
    if (targetRules) {
      const conventions = targetRules.namingConventions[token.category || TokenCategory.CUSTOM];
      if (conventions && conventions.length > 0) {
        const newName = this.inferTargetName(token.name, conventions[0]);
        return {
          ...token,
          name: newName,
          metadata: {
            ...token.metadata,
            inferredMapping: true,
            originalName: token.name,
          },
        };
      }
    }

    return token;
  }

  private detectValueConflicts(
    tokens: DesignToken[],
    context: TokenSemanticContext
  ): SemanticConflict[] {
    const conflicts: SemanticConflict[] = [];
    // Implementation would detect value-based conflicts
    return conflicts;
  }

  private detectHierarchyConflicts(
    tokens: DesignToken[],
    context: TokenSemanticContext
  ): SemanticConflict[] {
    const conflicts: SemanticConflict[] = [];
    // Implementation would detect hierarchy conflicts
    return conflicts;
  }

  private applyConflictResolutions(
    tokens: DesignToken[],
    resolutions: ConflictResolution[]
  ): DesignToken[] {
    // Apply the resolutions to the tokens
    return tokens; // Simplified implementation
  }

  private checkNamingConventions(token: DesignToken, rules: FrameworkSemanticRules): string[] {
    const warnings: string[] = [];
    // Implementation would check naming conventions
    return warnings;
  }

  private checkSemanticHierarchies(tokens: DesignToken[], rules: FrameworkSemanticRules): string[] {
    const warnings: string[] = [];
    // Implementation would check hierarchies
    return warnings;
  }

  private checkValueSemantics(tokens: DesignToken[], rules: FrameworkSemanticRules): string[] {
    const errors: string[] = [];
    // Implementation would check value semantics
    return errors;
  }

  private findSemanticEquivalent(
    sourceToken: string,
    candidates: string[],
    context: TokenMigrationContext
  ): string | null {
    // Implementation would find semantic equivalent
    return candidates.length > 0 ? candidates[0] : null;
  }

  private createSemanticTransform(
    sourcePattern: SemanticPattern,
    targetPattern: SemanticPattern
  ): (name: string, value: TokenValue) => string {
    return (name: string, value: TokenValue) => {
      // Basic implementation - would be more sophisticated in practice
      return name.replace(sourcePattern.pattern, targetPattern.name);
    };
  }

  private findCommonBase(names: string[]): string {
    if (names.length === 0) return '';
    
    const parts = names[0].split('.');
    let commonBase = '';
    
    for (let i = 0; i < parts.length - 1; i++) {
      const prefix = parts.slice(0, i + 1).join('.');
      if (names.every(name => name.startsWith(prefix))) {
        commonBase = prefix;
      } else {
        break;
      }
    }
    
    return commonBase;
  }

  private determineScaleType(values: number[]): 'linear' | 'exponential' | 'categorical' {
    if (values.length < 3) return 'categorical';
    
    // Check for linear progression
    const differences = [];
    for (let i = 1; i < values.length; i++) {
      differences.push(values[i] - values[i - 1]);
    }
    
    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const variance = differences.reduce((acc, diff) => acc + Math.pow(diff - avgDiff, 2), 0) / differences.length;
    
    if (variance < avgDiff * 0.1) {
      return 'linear';
    }
    
    // Check for exponential progression
    const ratios = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        ratios.push(values[i] / values[i - 1]);
      }
    }
    
    if (ratios.length > 0) {
      const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      const ratioVariance = ratios.reduce((acc, ratio) => acc + Math.pow(ratio - avgRatio, 2), 0) / ratios.length;
      
      if (ratioVariance < avgRatio * 0.1 && avgRatio > 1.2) {
        return 'exponential';
      }
    }
    
    return 'categorical';
  }

  private inferTargetName(sourceName: string, targetConvention: string): string {
    const parts = sourceName.split('.');
    return [targetConvention, ...parts.slice(1)].join('.');
  }

  // Utility methods
  private getColorIntensity(value: number): 'light' | 'medium' | 'dark' {
    if (value <= 200) return 'light';
    if (value <= 600) return 'medium';
    return 'dark';
  }

  private isRelativeSize(size: string): boolean {
    return ['xs', 'sm', 'md', 'lg', 'xl'].includes(size);
  }

  private getFontScale(size: string): number {
    const scales: Record<string, number> = {
      xs: 0.75, sm: 0.875, base: 1, lg: 1.125, xl: 1.25,
      '2xl': 1.5, '3xl': 1.875, '4xl': 2.25,
    };
    return scales[size] || 1;
  }

  private extractUnit(value: string): string {
    const match = value.match(/[a-z%]+$/i);
    return match ? match[0] : '';
  }

  private getSemanticSize(size: string): 'small' | 'medium' | 'large' {
    if (['xs', 'sm'].includes(size)) return 'small';
    if (['md', 'lg'].includes(size)) return 'medium';
    return 'large';
  }

  private getSemanticRole(role: string): 'primary' | 'secondary' | 'semantic' {
    if (['primary', 'main'].includes(role)) return 'primary';
    if (['secondary', 'accent'].includes(role)) return 'secondary';
    return 'semantic';
  }

  private getTypographyHierarchy(variant: string): number {
    const hierarchy: Record<string, number> = {
      h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6,
      body1: 7, body2: 8, caption: 9,
    };
    return hierarchy[variant] || 10;
  }
}

/**
 * Semantic token migrator registry
 */
export class SemanticTokenMigratorRegistry {
  private migrators = new Map<string, SemanticTokenMigrator>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.migrators.set('base', new BaseSemanticTokenMigrator());
  }

  register(name: string, migrator: SemanticTokenMigrator): void {
    this.migrators.set(name, migrator);
  }

  getMigrator(name: string): SemanticTokenMigrator | undefined {
    return this.migrators.get(name);
  }

  getAvailableMigrators(): string[] {
    return Array.from(this.migrators.keys());
  }

  async migrate(
    tokens: DesignToken[],
    sourceContext: TokenSemanticContext,
    targetContext: TokenSemanticContext,
    migratorName: string = 'base'
  ): Promise<TokenTransformationResult> {
    const migrator = this.getMigrator(migratorName);
    
    if (!migrator) {
      throw new Error(`No semantic migrator available: ${migratorName}`);
    }

    return migrator.migrate(tokens, sourceContext, targetContext);
  }
}