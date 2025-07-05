import {
  TokenMigrationStrategy,
  TokenMigrationMapping,
  TokenFormat,
  TokenType,
  TokenCategory,
  TokenValidationRule,
  TokenTransform,
} from '../../types/theme-tokens.types';

/**
 * Predefined token mapping strategies for common framework migrations
 */

/**
 * Tailwind to Chakra UI migration strategy
 */
export const tailwindToChakraMappingStrategy: TokenMigrationStrategy = {
  name: 'Tailwind CSS to Chakra UI',
  sourceFormat: TokenFormat.TAILWIND_CONFIG,
  targetFormat: TokenFormat.CHAKRA_THEME,
  mappings: [
    // Color mappings
    {
      source: /^colors\.gray\.(\d+)$/,
      target: (match) => `colors.gray.${match.replace('colors.gray.', '')}`,
      notes: 'Map Tailwind gray scale to Chakra gray scale',
    },
    {
      source: /^colors\.blue\.(\d+)$/,
      target: (match) => `colors.blue.${match.replace('colors.blue.', '')}`,
      notes: 'Map Tailwind blue scale to Chakra blue scale',
    },
    {
      source: /^colors\.red\.(\d+)$/,
      target: (match) => `colors.red.${match.replace('colors.red.', '')}`,
      notes: 'Map Tailwind red scale to Chakra red scale',
    },
    {
      source: /^colors\.green\.(\d+)$/,
      target: (match) => `colors.green.${match.replace('colors.green.', '')}`,
      notes: 'Map Tailwind green scale to Chakra green scale',
    },
    {
      source: /^colors\.yellow\.(\d+)$/,
      target: (match) => `colors.yellow.${match.replace('colors.yellow.', '')}`,
      notes: 'Map Tailwind yellow scale to Chakra yellow scale',
    },
    {
      source: /^colors\.purple\.(\d+)$/,
      target: (match) => `colors.purple.${match.replace('colors.purple.', '')}`,
      notes: 'Map Tailwind purple scale to Chakra purple scale',
    },
    {
      source: /^colors\.pink\.(\d+)$/,
      target: (match) => `colors.pink.${match.replace('colors.pink.', '')}`,
      notes: 'Map Tailwind pink scale to Chakra pink scale',
    },
    {
      source: /^colors\.indigo\.(\d+)$/,
      target: (match) => `colors.blue.${match.replace('colors.indigo.', '')}`,
      notes: 'Map Tailwind indigo to Chakra blue (closest match)',
    },

    // Spacing mappings
    {
      source: /^spacing\.(\d+)$/,
      target: (match) => `space.${match.replace('spacing.', '')}`,
      notes: 'Map Tailwind spacing to Chakra space',
    },
    {
      source: 'spacing.px',
      target: 'space.px',
      notes: 'Map Tailwind px spacing to Chakra px',
    },

    // Font size mappings
    {
      source: 'fontSize.xs',
      target: 'fontSizes.xs',
      notes: 'Map Tailwind font size to Chakra font sizes',
    },
    {
      source: 'fontSize.sm',
      target: 'fontSizes.sm',
      notes: 'Map Tailwind font size to Chakra font sizes',
    },
    {
      source: 'fontSize.base',
      target: 'fontSizes.md',
      notes: 'Map Tailwind base to Chakra md',
    },
    {
      source: 'fontSize.lg',
      target: 'fontSizes.lg',
      notes: 'Map Tailwind font size to Chakra font sizes',
    },
    {
      source: 'fontSize.xl',
      target: 'fontSizes.xl',
      notes: 'Map Tailwind font size to Chakra font sizes',
    },
    {
      source: /^fontSize\.(\d+)xl$/,
      target: (match) => `fontSizes.${match.replace('fontSize.', '')}`,
      notes: 'Map Tailwind xl sizes to Chakra',
    },

    // Font weight mappings
    {
      source: 'fontWeight.thin',
      target: 'fontWeights.thin',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.extralight',
      target: 'fontWeights.extralight',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.light',
      target: 'fontWeights.light',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.normal',
      target: 'fontWeights.normal',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.medium',
      target: 'fontWeights.medium',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.semibold',
      target: 'fontWeights.semibold',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.bold',
      target: 'fontWeights.bold',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.extrabold',
      target: 'fontWeights.extrabold',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },
    {
      source: 'fontWeight.black',
      target: 'fontWeights.black',
      notes: 'Map Tailwind font weight to Chakra font weights',
    },

    // Border radius mappings
    {
      source: 'borderRadius.none',
      target: 'radii.none',
      notes: 'Map Tailwind border radius to Chakra radii',
    },
    {
      source: 'borderRadius.sm',
      target: 'radii.sm',
      notes: 'Map Tailwind border radius to Chakra radii',
    },
    {
      source: 'borderRadius.DEFAULT',
      target: 'radii.base',
      notes: 'Map Tailwind default radius to Chakra base',
    },
    {
      source: 'borderRadius.md',
      target: 'radii.md',
      notes: 'Map Tailwind border radius to Chakra radii',
    },
    {
      source: 'borderRadius.lg',
      target: 'radii.lg',
      notes: 'Map Tailwind border radius to Chakra radii',
    },
    {
      source: 'borderRadius.xl',
      target: 'radii.xl',
      notes: 'Map Tailwind border radius to Chakra radii',
    },
    {
      source: 'borderRadius.2xl',
      target: 'radii.2xl',
      notes: 'Map Tailwind border radius to Chakra radii',
    },
    {
      source: 'borderRadius.3xl',
      target: 'radii.3xl',
      notes: 'Map Tailwind border radius to Chakra radii',
    },
    {
      source: 'borderRadius.full',
      target: 'radii.full',
      notes: 'Map Tailwind border radius to Chakra radii',
    },

    // Shadow mappings
    {
      source: 'boxShadow.sm',
      target: 'shadows.sm',
      notes: 'Map Tailwind shadow to Chakra shadows',
    },
    {
      source: 'boxShadow.DEFAULT',
      target: 'shadows.base',
      notes: 'Map Tailwind default shadow to Chakra base',
    },
    {
      source: 'boxShadow.md',
      target: 'shadows.md',
      notes: 'Map Tailwind shadow to Chakra shadows',
    },
    {
      source: 'boxShadow.lg',
      target: 'shadows.lg',
      notes: 'Map Tailwind shadow to Chakra shadows',
    },
    {
      source: 'boxShadow.xl',
      target: 'shadows.xl',
      notes: 'Map Tailwind shadow to Chakra shadows',
    },
    {
      source: 'boxShadow.2xl',
      target: 'shadows.2xl',
      notes: 'Map Tailwind shadow to Chakra shadows',
    },
    {
      source: 'boxShadow.inner',
      target: 'shadows.inner',
      notes: 'Map Tailwind shadow to Chakra shadows',
    },
    {
      source: 'boxShadow.none',
      target: 'shadows.none',
      notes: 'Map Tailwind shadow to Chakra shadows',
    },
  ],
  validation: [
    {
      name: 'Color format validation',
      types: [TokenType.COLOR],
      validate: (token) => ({
        valid: typeof token.value === 'string' && /^#[0-9a-fA-F]{6}$/.test(token.value),
        message: 'Color must be a valid hex code',
      }),
      severity: 'warning',
    },
    {
      name: 'Dimension format validation',
      types: [TokenType.DIMENSION],
      validate: (token) => ({
        valid: typeof token.value === 'string' && /^-?\d+(\.\d+)?(px|rem|em|%)$/.test(token.value),
        message: 'Dimension must have valid unit',
      }),
      severity: 'warning',
    },
  ],
};

/**
 * Material-UI to Ant Design migration strategy
 */
export const muiToAntdMappingStrategy: TokenMigrationStrategy = {
  name: 'Material-UI to Ant Design',
  sourceFormat: TokenFormat.MUI_THEME,
  targetFormat: TokenFormat.ANTD_THEME,
  mappings: [
    // Palette mappings
    {
      source: 'palette.primary.main',
      target: 'colorPrimary',
      notes: 'Map MUI primary color to Ant Design primary color',
    },
    {
      source: 'palette.primary.light',
      target: 'colorPrimaryHover',
      notes: 'Map MUI primary light to Ant Design primary hover',
    },
    {
      source: 'palette.primary.dark',
      target: 'colorPrimaryActive',
      notes: 'Map MUI primary dark to Ant Design primary active',
    },
    {
      source: 'palette.secondary.main',
      target: 'colorSecondary',
      notes: 'Map MUI secondary color to Ant Design secondary',
    },
    {
      source: 'palette.error.main',
      target: 'colorError',
      notes: 'Map MUI error color to Ant Design error',
    },
    {
      source: 'palette.warning.main',
      target: 'colorWarning',
      notes: 'Map MUI warning color to Ant Design warning',
    },
    {
      source: 'palette.info.main',
      target: 'colorInfo',
      notes: 'Map MUI info color to Ant Design info',
    },
    {
      source: 'palette.success.main',
      target: 'colorSuccess',
      notes: 'Map MUI success color to Ant Design success',
    },
    {
      source: 'palette.text.primary',
      target: 'colorText',
      notes: 'Map MUI text primary to Ant Design text color',
    },
    {
      source: 'palette.text.secondary',
      target: 'colorTextSecondary',
      notes: 'Map MUI text secondary to Ant Design secondary text',
    },
    {
      source: 'palette.background.default',
      target: 'colorBgContainer',
      notes: 'Map MUI background to Ant Design container background',
    },
    {
      source: 'palette.background.paper',
      target: 'colorBgElevated',
      notes: 'Map MUI paper background to Ant Design elevated background',
    },

    // Typography mappings
    {
      source: 'typography.h1.fontSize',
      target: 'fontSizeHeading1',
      notes: 'Map MUI h1 font size to Ant Design heading 1',
    },
    {
      source: 'typography.h2.fontSize',
      target: 'fontSizeHeading2',
      notes: 'Map MUI h2 font size to Ant Design heading 2',
    },
    {
      source: 'typography.h3.fontSize',
      target: 'fontSizeHeading3',
      notes: 'Map MUI h3 font size to Ant Design heading 3',
    },
    {
      source: 'typography.h4.fontSize',
      target: 'fontSizeHeading4',
      notes: 'Map MUI h4 font size to Ant Design heading 4',
    },
    {
      source: 'typography.h5.fontSize',
      target: 'fontSizeHeading5',
      notes: 'Map MUI h5 font size to Ant Design heading 5',
    },
    {
      source: 'typography.h6.fontSize',
      target: 'fontSizeHeading6',
      notes: 'Map MUI h6 font size to Ant Design heading 6',
    },
    {
      source: 'typography.body1.fontSize',
      target: 'fontSize',
      notes: 'Map MUI body1 to Ant Design base font size',
    },
    {
      source: 'typography.body2.fontSize',
      target: 'fontSizeSM',
      notes: 'Map MUI body2 to Ant Design small font size',
    },
    {
      source: 'typography.caption.fontSize',
      target: 'fontSizeXS',
      notes: 'Map MUI caption to Ant Design extra small font size',
    },
    {
      source: 'typography.fontFamily',
      target: 'fontFamily',
      notes: 'Map MUI font family to Ant Design font family',
    },

    // Spacing mappings
    {
      source: /^spacing\((\d+)\)$/,
      target: (match) => {
        const multiplier = parseInt(match.replace(/spacing\((\d+)\)/, '$1'));
        return `sizeStep${multiplier}`;
      },
      transform: {
        type: 'multiply',
        amount: 8, // MUI spacing unit is 8px by default
      },
      notes: 'Map MUI spacing function to Ant Design size steps',
    },

    // Border radius mappings
    {
      source: 'shape.borderRadius',
      target: 'borderRadius',
      notes: 'Map MUI border radius to Ant Design border radius',
    },

    // Shadow mappings
    {
      source: /^shadows\.(\d+)$/,
      target: (match) => {
        const level = parseInt(match.replace('shadows.', ''));
        if (level <= 2) return 'boxShadowSecondary';
        if (level <= 8) return 'boxShadow';
        return 'boxShadowTertiary';
      },
      notes: 'Map MUI shadow levels to Ant Design shadow categories',
    },

    // Z-index mappings
    {
      source: 'zIndex.drawer',
      target: 'zIndexDrawer',
      notes: 'Map MUI drawer z-index to Ant Design drawer',
    },
    {
      source: 'zIndex.modal',
      target: 'zIndexModal',
      notes: 'Map MUI modal z-index to Ant Design modal',
    },
    {
      source: 'zIndex.tooltip',
      target: 'zIndexTooltip',
      notes: 'Map MUI tooltip z-index to Ant Design tooltip',
    },
    {
      source: 'zIndex.appBar',
      target: 'zIndexAffix',
      notes: 'Map MUI app bar to Ant Design affix z-index',
    },
  ],
  validation: [
    {
      name: 'Color token validation',
      types: [TokenType.COLOR],
      validate: (token) => ({
        valid: token.value !== null && token.value !== undefined,
        message: 'Color token must have a value',
      }),
      severity: 'error',
    },
    {
      name: 'Font size validation',
      types: [TokenType.DIMENSION],
      validate: (token) => {
        if (typeof token.value === 'string') {
          return {
            valid: /^-?\d+(\.\d+)?(px|rem|em)$/.test(token.value),
            message: 'Font size must be in px, rem, or em',
          };
        }
        return { valid: true };
      },
      severity: 'warning',
    },
  ],
};

/**
 * Bootstrap to Tailwind migration strategy
 */
export const bootstrapToTailwindMappingStrategy: TokenMigrationStrategy = {
  name: 'Bootstrap to Tailwind CSS',
  sourceFormat: TokenFormat.CSS_VARIABLE,
  targetFormat: TokenFormat.TAILWIND_CONFIG,
  mappings: [
    // Color mappings
    {
      source: '--bs-primary',
      target: 'colors.blue.600',
      notes: 'Map Bootstrap primary to Tailwind blue-600',
    },
    {
      source: '--bs-secondary',
      target: 'colors.gray.600',
      notes: 'Map Bootstrap secondary to Tailwind gray-600',
    },
    {
      source: '--bs-success',
      target: 'colors.green.600',
      notes: 'Map Bootstrap success to Tailwind green-600',
    },
    {
      source: '--bs-danger',
      target: 'colors.red.600',
      notes: 'Map Bootstrap danger to Tailwind red-600',
    },
    {
      source: '--bs-warning',
      target: 'colors.yellow.500',
      notes: 'Map Bootstrap warning to Tailwind yellow-500',
    },
    {
      source: '--bs-info',
      target: 'colors.blue.500',
      notes: 'Map Bootstrap info to Tailwind blue-500',
    },
    {
      source: '--bs-light',
      target: 'colors.gray.100',
      notes: 'Map Bootstrap light to Tailwind gray-100',
    },
    {
      source: '--bs-dark',
      target: 'colors.gray.800',
      notes: 'Map Bootstrap dark to Tailwind gray-800',
    },

    // Spacing mappings
    {
      source: /^--bs-gutter-x$/,
      target: 'spacing.6',
      notes: 'Map Bootstrap gutter to Tailwind spacing',
    },
    {
      source: /^--bs-gutter-y$/,
      target: 'spacing.6',
      notes: 'Map Bootstrap gutter to Tailwind spacing',
    },

    // Font size mappings
    {
      source: '--bs-font-size-base',
      target: 'fontSize.base',
      notes: 'Map Bootstrap base font size to Tailwind base',
    },
    {
      source: '--bs-font-size-sm',
      target: 'fontSize.sm',
      notes: 'Map Bootstrap small font size to Tailwind sm',
    },
    {
      source: '--bs-font-size-lg',
      target: 'fontSize.lg',
      notes: 'Map Bootstrap large font size to Tailwind lg',
    },

    // Border radius mappings
    {
      source: '--bs-border-radius',
      target: 'borderRadius.DEFAULT',
      notes: 'Map Bootstrap border radius to Tailwind default',
    },
    {
      source: '--bs-border-radius-sm',
      target: 'borderRadius.sm',
      notes: 'Map Bootstrap small border radius to Tailwind sm',
    },
    {
      source: '--bs-border-radius-lg',
      target: 'borderRadius.lg',
      notes: 'Map Bootstrap large border radius to Tailwind lg',
    },
    {
      source: '--bs-border-radius-pill',
      target: 'borderRadius.full',
      notes: 'Map Bootstrap pill radius to Tailwind full',
    },

    // Border width mappings
    {
      source: '--bs-border-width',
      target: 'borderWidth.DEFAULT',
      notes: 'Map Bootstrap border width to Tailwind default',
    },

    // Font weight mappings
    {
      source: '--bs-font-weight-lighter',
      target: 'fontWeight.light',
      notes: 'Map Bootstrap lighter font weight to Tailwind light',
    },
    {
      source: '--bs-font-weight-light',
      target: 'fontWeight.light',
      notes: 'Map Bootstrap light font weight to Tailwind light',
    },
    {
      source: '--bs-font-weight-normal',
      target: 'fontWeight.normal',
      notes: 'Map Bootstrap normal font weight to Tailwind normal',
    },
    {
      source: '--bs-font-weight-bold',
      target: 'fontWeight.bold',
      notes: 'Map Bootstrap bold font weight to Tailwind bold',
    },
    {
      source: '--bs-font-weight-bolder',
      target: 'fontWeight.extrabold',
      notes: 'Map Bootstrap bolder font weight to Tailwind extrabold',
    },

    // Line height mappings
    {
      source: '--bs-line-height-base',
      target: 'lineHeight.normal',
      notes: 'Map Bootstrap base line height to Tailwind normal',
    },
    {
      source: '--bs-line-height-sm',
      target: 'lineHeight.tight',
      notes: 'Map Bootstrap small line height to Tailwind tight',
    },
    {
      source: '--bs-line-height-lg',
      target: 'lineHeight.relaxed',
      notes: 'Map Bootstrap large line height to Tailwind relaxed',
    },
  ],
  validation: [
    {
      name: 'CSS variable format',
      types: [TokenType.COLOR, TokenType.DIMENSION, TokenType.FONT_WEIGHT],
      validate: (token) => ({
        valid: token.name.startsWith('--'),
        message: 'Bootstrap tokens should start with --',
      }),
      severity: 'info',
    },
  ],
};

/**
 * Design Tokens to CSS Variables migration strategy
 */
export const designTokensToCSSMappingStrategy: TokenMigrationStrategy = {
  name: 'Design Tokens to CSS Variables',
  sourceFormat: TokenFormat.DESIGN_TOKENS,
  targetFormat: TokenFormat.CSS_VARIABLE,
  mappings: [
    // Convert dot notation to kebab case with -- prefix
    {
      source: /^(.+)$/,
      target: (match) => `--${match.replace(/\./g, '-')}`,
      notes: 'Convert all tokens to CSS custom properties',
    },
  ],
  preTransforms: [
    {
      type: 'custom',
      transform: (value) => {
        // Convert Design Tokens $value format
        if (value && typeof value === 'object' && '$value' in value) {
          return (value as any).$value;
        }
        return value;
      },
    },
  ],
  validation: [
    {
      name: 'CSS variable naming',
      types: [TokenType.COLOR, TokenType.DIMENSION, TokenType.FONT_FAMILY, TokenType.FONT_WEIGHT],
      validate: (token) => ({
        valid: token.name.startsWith('--') && /^--[a-z][a-z0-9-]*$/.test(token.name),
        message: 'CSS variables must start with -- and use kebab-case',
      }),
      severity: 'warning',
    },
  ],
};

/**
 * CSS Variables to Tailwind Config migration strategy
 */
export const cssToTailwindMappingStrategy: TokenMigrationStrategy = {
  name: 'CSS Variables to Tailwind Config',
  sourceFormat: TokenFormat.CSS_VARIABLE,
  targetFormat: TokenFormat.TAILWIND_CONFIG,
  mappings: [
    // Color mappings
    {
      source: /^--color-(.+)$/,
      target: (match) => `colors.${match.replace('--color-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS color variables to Tailwind colors',
    },
    {
      source: /^--bg-(.+)$/,
      target: (match) => `colors.${match.replace('--bg-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS background variables to Tailwind colors',
    },
    {
      source: /^--text-(.+)$/,
      target: (match) => `colors.${match.replace('--text-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS text variables to Tailwind colors',
    },

    // Spacing mappings
    {
      source: /^--spacing-(.+)$/,
      target: (match) => `spacing.${match.replace('--spacing-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS spacing variables to Tailwind spacing',
    },
    {
      source: /^--space-(.+)$/,
      target: (match) => `spacing.${match.replace('--space-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS space variables to Tailwind spacing',
    },
    {
      source: /^--gap-(.+)$/,
      target: (match) => `spacing.${match.replace('--gap-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS gap variables to Tailwind spacing',
    },

    // Font size mappings
    {
      source: /^--font-size-(.+)$/,
      target: (match) => `fontSize.${match.replace('--font-size-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS font size variables to Tailwind fontSize',
    },
    {
      source: /^--text-(.+)$/,
      target: (match) => {
        const value = match.replace('--text-', '');
        if (['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'].includes(value)) {
          return `fontSize.${value}`;
        }
        return `colors.${value.replace(/-/g, '.')}`;
      },
      notes: 'Map CSS text variables to appropriate Tailwind category',
    },

    // Font family mappings
    {
      source: /^--font-family-(.+)$/,
      target: (match) => `fontFamily.${match.replace('--font-family-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS font family variables to Tailwind fontFamily',
    },
    {
      source: /^--font-(.+)$/,
      target: (match) => {
        const value = match.replace('--font-', '');
        if (['sans', 'serif', 'mono'].includes(value)) {
          return `fontFamily.${value}`;
        }
        return `fontWeight.${value}`;
      },
      notes: 'Map CSS font variables to appropriate Tailwind category',
    },

    // Border radius mappings
    {
      source: /^--border-radius-(.+)$/,
      target: (match) => `borderRadius.${match.replace('--border-radius-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS border radius variables to Tailwind borderRadius',
    },
    {
      source: /^--radius-(.+)$/,
      target: (match) => `borderRadius.${match.replace('--radius-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS radius variables to Tailwind borderRadius',
    },

    // Shadow mappings
    {
      source: /^--shadow-(.+)$/,
      target: (match) => `boxShadow.${match.replace('--shadow-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS shadow variables to Tailwind boxShadow',
    },
    {
      source: /^--box-shadow-(.+)$/,
      target: (match) => `boxShadow.${match.replace('--box-shadow-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS box shadow variables to Tailwind boxShadow',
    },

    // Z-index mappings
    {
      source: /^--z-index-(.+)$/,
      target: (match) => `zIndex.${match.replace('--z-index-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS z-index variables to Tailwind zIndex',
    },
    {
      source: /^--z-(.+)$/,
      target: (match) => `zIndex.${match.replace('--z-', '').replace(/-/g, '.')}`,
      notes: 'Map CSS z variables to Tailwind zIndex',
    },
  ],
  validation: [
    {
      name: 'Valid CSS variable names',
      types: [TokenType.COLOR, TokenType.DIMENSION, TokenType.FONT_FAMILY, TokenType.FONT_WEIGHT],
      validate: (token) => ({
        valid: token.name.startsWith('--'),
        message: 'Source tokens should be CSS variables starting with --',
      }),
      severity: 'warning',
    },
  ],
};

/**
 * Strategy registry for managing migration strategies
 */
export class TokenMappingStrategyRegistry {
  private strategies = new Map<string, TokenMigrationStrategy>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.strategies.set('tailwind-to-chakra', tailwindToChakraMappingStrategy);
    this.strategies.set('mui-to-antd', muiToAntdMappingStrategy);
    this.strategies.set('bootstrap-to-tailwind', bootstrapToTailwindMappingStrategy);
    this.strategies.set('design-tokens-to-css', designTokensToCSSMappingStrategy);
    this.strategies.set('css-to-tailwind', cssToTailwindMappingStrategy);
  }

  register(name: string, strategy: TokenMigrationStrategy): void {
    this.strategies.set(name, strategy);
  }

  getStrategy(name: string): TokenMigrationStrategy | undefined {
    return this.strategies.get(name);
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  getAllStrategies(): Map<string, TokenMigrationStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Get strategies by source and target formats
   */
  getStrategiesByFormats(
    sourceFormat: TokenFormat,
    targetFormat?: TokenFormat
  ): TokenMigrationStrategy[] {
    const results: TokenMigrationStrategy[] = [];

    const strategyValues = Array.from(this.strategies.values());
    for (const strategy of strategyValues) {
      if (strategy.sourceFormat === sourceFormat) {
        if (!targetFormat || strategy.targetFormat === targetFormat) {
          results.push(strategy);
        }
      }
    }

    return results;
  }

  /**
   * Create a custom strategy by combining existing mappings
   */
  createCustomStrategy(
    name: string,
    baseStrategyName: string,
    customMappings: TokenMigrationMapping[],
    customValidation?: TokenValidationRule[]
  ): TokenMigrationStrategy {
    const baseStrategy = this.getStrategy(baseStrategyName);
    
    if (!baseStrategy) {
      throw new Error(`Base strategy not found: ${baseStrategyName}`);
    }

    const customStrategy: TokenMigrationStrategy = {
      ...baseStrategy,
      name,
      mappings: [...baseStrategy.mappings, ...customMappings],
      validation: customValidation ? 
        [...(baseStrategy.validation || []), ...customValidation] : 
        baseStrategy.validation,
    };

    this.register(name, customStrategy);
    return customStrategy;
  }

  /**
   * Merge multiple strategies into one
   */
  mergeStrategies(
    name: string,
    sourceFormat: TokenFormat,
    targetFormat: TokenFormat,
    strategyNames: string[]
  ): TokenMigrationStrategy {
    const strategies = strategyNames.map(name => {
      const strategy = this.getStrategy(name);
      if (!strategy) {
        throw new Error(`Strategy not found: ${name}`);
      }
      return strategy;
    });

    const allMappings: TokenMigrationMapping[] = [];
    const allValidation: TokenValidationRule[] = [];

    for (const strategy of strategies) {
      allMappings.push(...strategy.mappings);
      if (strategy.validation) {
        allValidation.push(...strategy.validation);
      }
    }

    const mergedStrategy: TokenMigrationStrategy = {
      name,
      sourceFormat,
      targetFormat,
      mappings: allMappings,
      validation: allValidation.length > 0 ? allValidation : undefined,
    };

    this.register(name, mergedStrategy);
    return mergedStrategy;
  }
}