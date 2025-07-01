import {
  DesignToken,
  TokenType,
  TokenCategory,
  TokenReference,
  TokenArray,
  TokenCompositeValue,
  TokenMigrationContext,
  TokenSemanticContext,
} from '../../src/types/theme-tokens.types';

/**
 * Factory functions for creating test tokens
 */
export const makeColorToken = (
  name: string,
  value: string,
  options: Partial<DesignToken> = {}
): DesignToken => ({
  name,
  value,
  type: TokenType.COLOR,
  category: TokenCategory.COLOR,
  ...options,
});

export const makeSpacingToken = (
  name: string,
  value: string,
  options: Partial<DesignToken> = {}
): DesignToken => ({
  name,
  value,
  type: TokenType.DIMENSION,
  category: TokenCategory.SPACING,
  ...options,
});

export const makeFontFamilyToken = (
  name: string,
  value: string[],
  options: Partial<DesignToken> = {}
): DesignToken => ({
  name,
  value: { $array: value } as TokenArray,
  type: TokenType.FONT_FAMILY,
  category: TokenCategory.TYPOGRAPHY,
  ...options,
});

export const makeShadowToken = (
  name: string,
  value: {
    x: string;
    y: string;
    blur: string;
    spread?: string;
    color: string;
  },
  options: Partial<DesignToken> = {}
): DesignToken => ({
  name,
  value: value as TokenCompositeValue,
  type: TokenType.SHADOW,
  category: TokenCategory.SHADOW,
  ...options,
});

export const makeReferenceToken = (
  name: string,
  ref: string,
  category: TokenCategory = TokenCategory.CUSTOM,
  options: Partial<DesignToken> = {}
): DesignToken => ({
  name,
  value: { $ref: ref } as TokenReference,
  type: TokenType.REFERENCE,
  category,
  ...options,
});

export const makeBorderRadiusToken = (
  name: string,
  value: string,
  options: Partial<DesignToken> = {}
): DesignToken => ({
  name,
  value,
  type: TokenType.DIMENSION,
  category: TokenCategory.BORDER,
  metadata: { borderProperty: 'radius' },
  ...options,
});

/**
 * Context factories
 */
export const makeMigrationContext = (
  sourceFramework: string,
  targetFramework: string,
  options: Partial<TokenMigrationContext> = {}
): TokenMigrationContext => ({
  sourceFramework,
  targetFramework,
  preserveSemantics: true,
  strictValidation: false,
  ...options,
});

export const makeSemanticContext = (
  framework: string,
  version: string = '1.0.0',
  options: Partial<TokenSemanticContext> = {}
): TokenSemanticContext => ({
  framework,
  version,
  ...options,
});

/**
 * Token set builders
 */
export class TokenSetBuilder {
  private tokens: DesignToken[] = [];

  addColor(name: string, value: string, options?: Partial<DesignToken>): this {
    this.tokens.push(makeColorToken(name, value, options));
    return this;
  }

  addSpacing(name: string, value: string, options?: Partial<DesignToken>): this {
    this.tokens.push(makeSpacingToken(name, value, options));
    return this;
  }

  addFontFamily(name: string, value: string[], options?: Partial<DesignToken>): this {
    this.tokens.push(makeFontFamilyToken(name, value, options));
    return this;
  }

  addShadow(
    name: string,
    value: { x: string; y: string; blur: string; spread?: string; color: string },
    options?: Partial<DesignToken>
  ): this {
    this.tokens.push(makeShadowToken(name, value, options));
    return this;
  }

  addReference(
    name: string,
    ref: string,
    category?: TokenCategory,
    options?: Partial<DesignToken>
  ): this {
    this.tokens.push(makeReferenceToken(name, ref, category, options));
    return this;
  }

  addBorderRadius(name: string, value: string, options?: Partial<DesignToken>): this {
    this.tokens.push(makeBorderRadiusToken(name, value, options));
    return this;
  }

  build(): DesignToken[] {
    return [...this.tokens];
  }

  clear(): this {
    this.tokens = [];
    return this;
  }
}

/**
 * Common test token sets
 */
export const createBasicColorTokens = (): DesignToken[] => {
  const builder = new TokenSetBuilder();
  return builder
    .addColor('colors.primary.500', '#2196f3')
    .addColor('colors.secondary.500', '#9c27b0')
    .addColor('colors.error.500', '#f44336')
    .addColor('colors.success.500', '#4caf50')
    .build();
};

export const createBasicSpacingTokens = (): DesignToken[] => {
  const builder = new TokenSetBuilder();
  return builder
    .addSpacing('spacing.xs', '4px')
    .addSpacing('spacing.sm', '8px')
    .addSpacing('spacing.md', '16px')
    .addSpacing('spacing.lg', '24px')
    .addSpacing('spacing.xl', '32px')
    .build();
};

export const createTypographyTokens = (): DesignToken[] => {
  const builder = new TokenSetBuilder();
  return builder
    .addFontFamily('font.family.sans', ['Inter', 'system-ui', 'sans-serif'])
    .addFontFamily('font.family.mono', ['Fira Code', 'monospace'])
    .addSpacing('font.size.sm', '14px', {
      type: TokenType.DIMENSION,
      category: TokenCategory.TYPOGRAPHY,
    })
    .addSpacing('font.size.base', '16px', {
      type: TokenType.DIMENSION,
      category: TokenCategory.TYPOGRAPHY,
    })
    .build();
};

export const createSemanticTokens = (): DesignToken[] => {
  const builder = new TokenSetBuilder();
  return builder
    .addReference('semantic.background.primary', 'colors.primary.500', TokenCategory.COLOR)
    .addReference('semantic.text.error', 'colors.error.500', TokenCategory.COLOR)
    .addReference('button.primary.background', 'semantic.background.primary', TokenCategory.COLOR)
    .build();
};

export const createCircularReferenceTokens = (): DesignToken[] => {
  const builder = new TokenSetBuilder();
  return builder
    .addReference('token.a', 'token.b')
    .addReference('token.b', 'token.c')
    .addReference('token.c', 'token.a')
    .build();
};

/**
 * Assertion helpers
 */
export const assertTokenEqual = (
  actual: DesignToken,
  expected: Partial<DesignToken>
): void => {
  if (expected.name !== undefined) {
    expect(actual.name).toBe(expected.name);
  }
  if (expected.value !== undefined) {
    expect(actual.value).toEqual(expected.value);
  }
  if (expected.type !== undefined) {
    expect(actual.type).toBe(expected.type);
  }
  if (expected.category !== undefined) {
    expect(actual.category).toBe(expected.category);
  }
};

export const assertTokensContain = (
  tokens: DesignToken[],
  expectedNames: string[]
): void => {
  const tokenNames = tokens.map(t => t.name);
  expectedNames.forEach(name => {
    expect(tokenNames).toContain(name);
  });
};

export const assertValidationSuccess = (result: {
  valid: boolean;
  errors: any[];
  warnings: any[];
}): void => {
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
};

export const assertValidationError = (
  result: { valid: boolean; errors: any[]; warnings: any[] },
  errorPattern: string | RegExp
): void => {
  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  
  const hasMatchingError = result.errors.some(error =>
    typeof errorPattern === 'string'
      ? error.message.includes(errorPattern)
      : errorPattern.test(error.message)
  );
  expect(hasMatchingError).toBe(true);
};

/**
 * Performance helpers
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  return { result, duration: endTime - startTime };
};

export const assertPerformanceImprovement = (
  firstDuration: number,
  secondDuration: number,
  improvementRatio: number = 0.5
): void => {
  expect(secondDuration).toBeLessThanOrEqual(firstDuration * improvementRatio);
};

/**
 * Fixture helpers
 */
export const loadFixture = async (filename: string): Promise<string> => {
  // In a real implementation, this would use fs.readFileSync
  // For now, we'll return a placeholder
  return `// Content from __fixtures__/${filename}`;
};

export const loadJsonFixture = async <T>(filename: string): Promise<T> => {
  const content = await loadFixture(filename);
  return JSON.parse(content);
};