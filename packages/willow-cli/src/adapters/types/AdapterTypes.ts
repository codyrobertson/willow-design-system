/**
 * Core adapter type definitions for UI Kit integration
 */

// =============================================================================
// Base Types
// =============================================================================

/**
 * Unique identifier for adapter instances
 */
export type AdapterId = string;

/**
 * Semantic version string (e.g., "1.2.3")
 */
export type SemVer = string;

/**
 * Component name identifier
 */
export type ComponentName = string;

/**
 * Lifecycle phase identifiers
 */
export type LifecyclePhase = 
  | 'initialization'
  | 'configuration'
  | 'validation'
  | 'registration'
  | 'activation'
  | 'operation'
  | 'cleanup'
  | 'destruction';

/**
 * Adapter capability identifiers
 */
export type AdapterCapability = 
  | 'component-mapping'
  | 'style-translation'
  | 'token-conversion'
  | 'theme-switching'
  | 'accessibility-enhancement'
  | 'performance-optimization'
  | 'hot-reloading'
  | 'code-generation'
  | 'documentation-generation'
  | 'testing-integration';

/**
 * Severity levels for validation and errors
 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Log levels for debugging and monitoring
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Core adapter configuration
 */
export interface AdapterConfig {
  /** Unique adapter identifier */
  name: string;
  
  /** Semantic version */
  version: SemVer;
  
  /** Human-readable display name */
  displayName?: string;
  
  /** Adapter description */
  description?: string;
  
  /** Author information */
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  
  /** License information */
  license?: string;
  
  /** Homepage URL */
  homepage?: string;
  
  /** Repository information */
  repository?: {
    type: string;
    url: string;
  };
  
  /** Keywords for searchability */
  keywords?: string[];
  
  /** Adapter capabilities */
  capabilities: AdapterCapability[];
  
  /** Target UI framework */
  framework: {
    name: string;
    version: SemVer;
    minVersion?: SemVer;
    maxVersion?: SemVer;
  };
  
  /** Dependencies */
  dependencies?: Record<string, SemVer>;
  
  /** Peer dependencies */
  peerDependencies?: Record<string, SemVer>;
  
  /** Optional dependencies */
  optionalDependencies?: Record<string, SemVer>;
  
  /** Runtime options */
  options: AdapterOptions;
  
  /** Metadata for extensions */
  metadata?: Record<string, unknown>;
}

/**
 * Runtime adapter options
 */
export interface AdapterOptions {
  /** Theme configuration */
  theme?: {
    mode: 'light' | 'dark' | 'auto';
    customThemes?: Record<string, ThemeConfig>;
  };
  
  /** Localization settings */
  locale?: {
    language: string;
    region?: string;
    rtl?: boolean;
  };
  
  /** Accessibility configuration */
  accessibility?: {
    enabled: boolean;
    level: 'A' | 'AA' | 'AAA';
    announcements?: boolean;
    highContrast?: boolean;
    reducedMotion?: boolean;
  };
  
  /** Performance settings */
  performance?: {
    mode: 'development' | 'production';
    caching?: boolean;
    cacheSize?: number;
    lazyLoading?: boolean;
    debounceTime?: number;
    throttleTime?: number;
  };
  
  /** Development options */
  development?: {
    hotReload?: boolean;
    debugging?: boolean;
    strictMode?: boolean;
    deprecationWarnings?: boolean;
    logLevel?: LogLevel;
  };
  
  /** Testing configuration */
  testing?: {
    enabled: boolean;
    coverage?: boolean;
    snapshots?: boolean;
    accessibility?: boolean;
  };
  
  /** Custom options */
  custom?: Record<string, unknown>;
}

/**
 * Theme configuration structure
 */
export interface ThemeConfig {
  /** Theme identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Theme description */
  description?: string;
  
  /** Base theme to extend */
  extends?: string;
  
  /** Color tokens */
  colors?: ColorTokens;
  
  /** Typography tokens */
  typography?: TypographyTokens;
  
  /** Spacing tokens */
  spacing?: SpacingTokens;
  
  /** Border tokens */
  borders?: BorderTokens;
  
  /** Shadow tokens */
  shadows?: ShadowTokens;
  
  /** Animation tokens */
  animations?: AnimationTokens;
  
  /** Custom tokens */
  custom?: Record<string, unknown>;
}

// =============================================================================
// Component Types
// =============================================================================

/**
 * Component configuration for UI kit adapters
 */
export interface ComponentConfig {
  name: string;
  type: ComponentType;
  props?: Record<string, unknown>;
  children?: unknown;
  variants?: ComponentVariant[];
  defaultProps?: Record<string, unknown>;
  metadata?: ComponentMetadata;
}

/**
 * Component types
 */
export enum ComponentType {
  Button = 'button',
  Input = 'input',
  Select = 'select',
  Checkbox = 'checkbox',
  Radio = 'radio',
  Switch = 'switch',
  Slider = 'slider',
  Modal = 'modal',
  Tooltip = 'tooltip',
  Popover = 'popover',
  Dropdown = 'dropdown',
  Menu = 'menu',
  Tabs = 'tabs',
  Accordion = 'accordion',
  Card = 'card',
  Badge = 'badge',
  Avatar = 'avatar',
  Progress = 'progress',
  Spinner = 'spinner',
  Alert = 'alert',
  Toast = 'toast',
  Table = 'table',
  Form = 'form',
  Layout = 'layout',
  Grid = 'grid',
  Custom = 'custom',
}

/**
 * Component variant definition
 */
export interface ComponentVariant {
  name: string;
  props: Record<string, unknown>;
  styles?: StyleConfig;
  isDefault?: boolean;
  description?: string;
}

/**
 * Component mapping result
 */
export interface ComponentMapping {
  /** Target component name or constructor */
  component: string | ComponentConstructor;
  
  /** Mapped props */
  props: Record<string, unknown>;
  
  /** Additional styles */
  styles?: StyleConfig;
  
  /** Component variants */
  variants?: ComponentVariant[];
  
  /** Children handling */
  children?: {
    allowed: boolean;
    transform?: (children: unknown) => unknown;
  };
  
  /** Display name for debugging */
  displayName?: string;
  
  /** Component metadata */
  metadata?: ComponentMetadata;
}

/**
 * Component constructor type
 */
export type ComponentConstructor = (...args: any[]) => unknown;

/**
 * Component metadata
 */
export interface ComponentMetadata {
  /** Component category */
  category?: string;
  
  /** Component tags */
  tags?: string[];
  
  /** Accessibility information */
  accessibility?: {
    role?: string;
    description?: string;
    keyboardSupport?: boolean;
    screenReaderSupport?: boolean;
  };
  
  /** Documentation */
  documentation?: {
    description?: string;
    examples?: string[];
    props?: Record<string, PropDocumentation>;
  };
  
  /** Testing information */
  testing?: {
    selectors?: Record<string, string>;
    helpers?: string[];
  };
}

/**
 * Prop documentation
 */
export interface PropDocumentation {
  /** Prop type */
  type: string;
  
  /** Prop description */
  description: string;
  
  /** Default value */
  default?: unknown;
  
  /** Required prop */
  required?: boolean;
  
  /** Deprecated */
  deprecated?: boolean;
  
  /** Examples */
  examples?: unknown[];
}

// =============================================================================
// Style Types
// =============================================================================

/**
 * Style configuration
 */
export interface StyleConfig {
  /** Base styles */
  base?: Record<string, unknown>;
  
  /** Variant-specific styles */
  variants?: Record<string, Record<string, unknown>>;
  
  /** State-specific styles */
  states?: Record<string, Record<string, unknown>>;
  
  /** Responsive styles */
  responsive?: ResponsiveStyles;
  
  /** Dark mode styles */
  dark?: Record<string, unknown>;
  
  /** Layout styles */
  layout?: LayoutStyles;
  
  /** Typography styles */
  typography?: TypographyStyles;
  
  /** Color styles */
  colors?: ColorStyles;
  
  /** Spacing styles */
  spacing?: SpacingStyles;
  
  /** Border styles */
  borders?: BorderStyles;
  
  /** Visual effects */
  effects?: EffectStyles;
  
  /** Animation styles */
  animations?: AnimationStyles;
  
  /** Custom CSS properties */
  custom?: Record<string, string | number>;
}

/**
 * Responsive style breakpoints
 */
export interface ResponsiveStyles {
  xs?: Record<string, unknown>;
  sm?: Record<string, unknown>;
  md?: Record<string, unknown>;
  lg?: Record<string, unknown>;
  xl?: Record<string, unknown>;
  '2xl'?: Record<string, unknown>;
}

/**
 * Layout style properties
 */
export interface LayoutStyles {
  display?: string;
  position?: string;
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  zIndex?: number;
  flexDirection?: string;
  flexWrap?: string;
  alignItems?: string;
  justifyContent?: string;
  alignContent?: string;
  alignSelf?: string;
  flex?: string | number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string | number;
  gridTemplate?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridTemplateAreas?: string;
  gridArea?: string;
  gridColumn?: string;
  gridRow?: string;
  gap?: string | number;
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  overflow?: string;
  overflowX?: string;
  overflowY?: string;
}

/**
 * Typography style properties
 */
export interface TypographyStyles {
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  fontStyle?: string;
  lineHeight?: string | number;
  letterSpacing?: string | number;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  whiteSpace?: string;
  wordBreak?: string;
  wordWrap?: string;
}

/**
 * Color style properties
 */
export interface ColorStyles {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  outlineColor?: string;
  fill?: string;
  stroke?: string;
  opacity?: number;
}

/**
 * Spacing style properties
 */
export interface SpacingStyles {
  margin?: string | number;
  marginTop?: string | number;
  marginRight?: string | number;
  marginBottom?: string | number;
  marginLeft?: string | number;
  padding?: string | number;
  paddingTop?: string | number;
  paddingRight?: string | number;
  paddingBottom?: string | number;
  paddingLeft?: string | number;
}

/**
 * Border style properties
 */
export interface BorderStyles {
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderWidth?: string | number;
  borderStyle?: string;
  borderRadius?: string | number;
  borderTopLeftRadius?: string | number;
  borderTopRightRadius?: string | number;
  borderBottomRightRadius?: string | number;
  borderBottomLeftRadius?: string | number;
}

/**
 * Visual effect style properties
 */
export interface EffectStyles {
  boxShadow?: string;
  textShadow?: string;
  filter?: string;
  backdropFilter?: string;
  transform?: string;
  transformOrigin?: string;
  perspective?: string | number;
  clipPath?: string;
  mask?: string;
}

/**
 * Animation style properties
 */
export interface AnimationStyles {
  animation?: string;
  animationName?: string;
  animationDuration?: string;
  animationTimingFunction?: string;
  animationDelay?: string;
  animationIterationCount?: string | number;
  animationDirection?: string;
  animationFillMode?: string;
  animationPlayState?: string;
  transition?: string;
  transitionProperty?: string;
  transitionDuration?: string;
  transitionTimingFunction?: string;
  transitionDelay?: string;
}

// =============================================================================
// Token Types
// =============================================================================

/**
 * Design token configuration
 */
export interface TokenConfig {
  /** Token category */
  category: string;
  
  /** Token path */
  path: string;
  
  /** Token value */
  value: unknown;
  
  /** Token metadata */
  metadata?: Record<string, unknown>;
  
  /** All token definitions */
  tokens?: {
    colors?: ColorTokens;
    typography?: TypographyTokens;
    spacing?: SpacingTokens;
    sizing?: SizingTokens;
    borders?: BorderTokens;
    shadows?: ShadowTokens;
    animations?: AnimationTokens;
    breakpoints?: BreakpointTokens;
    custom?: Record<string, unknown>;
  };
}

/**
 * Color tokens
 */
export interface ColorTokens {
  primary?: ColorScale;
  secondary?: ColorScale;
  neutral?: ColorScale;
  success?: ColorScale;
  warning?: ColorScale;
  error?: ColorScale;
  info?: ColorScale;
  accent?: ColorScale;
  background?: Record<string, string>;
  foreground?: Record<string, string>;
  text?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    inverse?: string;
  };
  border?: {
    primary?: string;
    secondary?: string;
    focus?: string;
    error?: string;
  };
  semantic?: {
    success?: ColorScale;
    warning?: ColorScale;
    error?: ColorScale;
    info?: ColorScale;
  };
  custom?: Record<string, string | ColorScale>;
}

/**
 * Color scale definition
 */
export interface ColorScale {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
  950?: string;
}

/**
 * Typography tokens
 */
export interface TypographyTokens {
  fontFamily?: {
    sans?: string[];
    serif?: string[];
    mono?: string[];
    display?: string[];
    custom?: Record<string, string[]>;
  };
  fontSize?: {
    xs?: string;
    sm?: string;
    base?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    '3xl'?: string;
    '4xl'?: string;
    '5xl'?: string;
    '6xl'?: string;
    custom?: Record<string, string>;
  };
  fontWeight?: {
    thin?: number;
    light?: number;
    normal?: number;
    medium?: number;
    semibold?: number;
    bold?: number;
    extrabold?: number;
    black?: number;
    custom?: Record<string, number>;
  };
  lineHeight?: {
    none?: number;
    tight?: number;
    snug?: number;
    normal?: number;
    relaxed?: number;
    loose?: number;
    custom?: Record<string, number>;
  };
  letterSpacing?: {
    tighter?: string;
    tight?: string;
    normal?: string;
    wide?: string;
    wider?: string;
    widest?: string;
    custom?: Record<string, string>;
  };
}

/**
 * Spacing tokens
 */
export interface SpacingTokens {
  0?: string;
  px?: string;
  0.5?: string;
  1?: string;
  1.5?: string;
  2?: string;
  2.5?: string;
  3?: string;
  3.5?: string;
  4?: string;
  5?: string;
  6?: string;
  7?: string;
  8?: string;
  9?: string;
  10?: string;
  11?: string;
  12?: string;
  14?: string;
  16?: string;
  20?: string;
  24?: string;
  28?: string;
  32?: string;
  36?: string;
  40?: string;
  44?: string;
  48?: string;
  52?: string;
  56?: string;
  60?: string;
  64?: string;
  72?: string;
  80?: string;
  96?: string;
  custom?: Record<string, string>;
}

/**
 * Sizing tokens
 */
export interface SizingTokens {
  [key: string]: string | number;
}

/**
 * Border tokens
 */
export interface BorderTokens {
  width?: {
    0?: string;
    1?: string;
    2?: string;
    4?: string;
    8?: string;
    custom?: Record<string, string>;
  };
  style?: {
    solid?: string;
    dashed?: string;
    dotted?: string;
    double?: string;
    none?: string;
    custom?: Record<string, string>;
  };
  radius?: {
    none?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    '3xl'?: string;
    full?: string;
    custom?: Record<string, string>;
  };
}

/**
 * Shadow tokens
 */
export interface ShadowTokens {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  inner?: string;
  none?: string;
  custom?: Record<string, string>;
}

/**
 * Animation tokens
 */
export interface AnimationTokens {
  duration?: {
    75?: string;
    100?: string;
    150?: string;
    200?: string;
    300?: string;
    500?: string;
    700?: string;
    1000?: string;
    custom?: Record<string, string>;
  };
  ease?: {
    linear?: string;
    in?: string;
    out?: string;
    'in-out'?: string;
    custom?: Record<string, string>;
  };
  keyframes?: Record<string, Record<string, Record<string, string>>>;
}

/**
 * Breakpoint tokens
 */
export interface BreakpointTokens {
  xs?: string | number;
  sm?: string | number;
  md?: string | number;
  lg?: string | number;
  xl?: string | number;
  '2xl'?: string | number;
  custom?: Record<string, string | number>;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Validation success */
  valid: boolean;
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Property path */
  path: string;
  
  /** Expected value or type */
  expected?: unknown;
  
  /** Actual value */
  actual?: unknown;
  
  /** Error severity */
  severity: SeverityLevel;
  
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Property path */
  path: string;
  
  /** Warning category */
  category: string;
  
  /** Suggested action */
  suggestion?: string;
}

// =============================================================================
// Registry Types
// =============================================================================

/**
 * Adapter registry entry
 */
export interface AdapterRegistryEntry {
  /** Adapter configuration */
  config: AdapterConfig;
  
  /** Adapter instance */
  instance?: AdapterInstance;
  
  /** Registration timestamp */
  registeredAt: Date;
  
  /** Last access timestamp */
  lastAccessedAt?: Date;
  
  /** Usage statistics */
  stats: AdapterStats;
  
  /** Registry metadata */
  metadata: RegistryMetadata;
}

/**
 * Adapter instance interface
 */
export interface AdapterInstance {
  /** Adapter ID */
  id: AdapterId;
  
  /** Adapter configuration */
  config: AdapterConfig;
  
  /** Initialization status */
  initialized: boolean;
  
  /** Initialization method */
  initialize(): Promise<void>;
  
  /** Component mapping method */
  mapComponent(name: ComponentName, props: Record<string, unknown>): ComponentMapping;
  
  /** Style translation method */
  translateStyles(styles: StyleConfig): Record<string, unknown>;
  
  /** Token conversion method */
  convertTokens(tokens: TokenConfig): Record<string, unknown>;
  
  /** Configuration validation method */
  validateConfig(): ValidationResult;
  
  /** Cleanup method */
  cleanup(): Promise<void>;
}

/**
 * Adapter usage statistics
 */
export interface AdapterStats {
  /** Total usage count */
  usageCount: number;
  
  /** Component mapping calls */
  componentMappings: number;
  
  /** Style translation calls */
  styleTranslations: number;
  
  /** Token conversion calls */
  tokenConversions: number;
  
  /** Error count */
  errorCount: number;
  
  /** Average operation duration */
  averageDuration: number;
  
  /** Performance metrics */
  performance: PerformanceMetrics;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Memory usage */
  memoryUsage: {
    current: number;
    peak: number;
    average: number;
  };
  
  /** Operation timings */
  timings: {
    initialization: number;
    componentMapping: number;
    styleTranslation: number;
    tokenConversion: number;
  };
  
  /** Cache statistics */
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
}

/**
 * Registry metadata
 */
export interface RegistryMetadata {
  /** Entry priority */
  priority: number;
  
  /** Entry tags */
  tags: string[];
  
  /** Entry source */
  source: 'builtin' | 'installed' | 'development';
  
  /** Entry status */
  status: 'active' | 'inactive' | 'deprecated' | 'error';
  
  /** Deprecation information */
  deprecation?: {
    reason: string;
    replacement?: string;
    removeAfter?: string;
  };
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Adapter event types
 */
export type AdapterEventType = 
  | 'adapter.registered'
  | 'adapter.unregistered'
  | 'adapter.initialized'
  | 'adapter.activated'
  | 'adapter.deactivated'
  | 'adapter.error'
  | 'component.mapped'
  | 'style.translated'
  | 'token.converted'
  | 'validation.completed'
  | 'performance.measured';

/**
 * Base adapter event
 */
export interface AdapterEvent {
  /** Event type */
  type: AdapterEventType;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Adapter ID */
  adapterId: AdapterId;
  
  /** Event payload */
  payload: Record<string, unknown>;
  
  /** Event metadata */
  metadata?: EventMetadata;
}

/**
 * Event metadata
 */
export interface EventMetadata {
  /** Event source */
  source: string;
  
  /** User context */
  user?: {
    id: string;
    session: string;
  };
  
  /** Request context */
  request?: {
    id: string;
    url: string;
    method: string;
  };
  
  /** Performance context */
  performance?: {
    duration: number;
    memory: number;
  };
}

// =============================================================================
// Plugin Types
// =============================================================================

/**
 * Adapter plugin interface
 */
export interface AdapterPlugin {
  /** Plugin name */
  name: string;
  
  /** Plugin version */
  version: SemVer;
  
  /** Plugin description */
  description?: string;
  
  /** Plugin initialization */
  initialize?(adapter: AdapterInstance): Promise<void>;
  
  /** Component mapping hook */
  beforeComponentMapping?(name: ComponentName, props: Record<string, unknown>): Record<string, unknown>;
  
  /** Component mapping result hook */
  afterComponentMapping?(mapping: ComponentMapping): ComponentMapping;
  
  /** Style translation hook */
  beforeStyleTranslation?(styles: StyleConfig): StyleConfig;
  
  /** Style translation result hook */
  afterStyleTranslation?(styles: Record<string, unknown>): Record<string, unknown>;
  
  /** Token conversion hook */
  beforeTokenConversion?(tokens: TokenConfig): TokenConfig;
  
  /** Token conversion result hook */
  afterTokenConversion?(tokens: Record<string, unknown>): Record<string, unknown>;
  
  /** Validation hook */
  beforeValidation?(config: AdapterConfig): AdapterConfig;
  
  /** Validation result hook */
  afterValidation?(result: ValidationResult): ValidationResult;
  
  /** Error handling hook */
  onError?(error: Error, context: Record<string, unknown>): void;
  
  /** Plugin cleanup */
  cleanup?(): Promise<void>;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Deep partial type for optional configuration
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Branded type for type safety
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * JSON serializable type
 */
export type JSONSerializable = 
  | string
  | number
  | boolean
  | null
  | JSONSerializable[]
  | { [key: string]: JSONSerializable };

/**
 * Function with specific signature
 */
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;

/**
 * Callback function type
 */
export type Callback<T = void> = (error?: Error, result?: T) => void;

/**
 * Event listener function
 */
export type EventListener<T = AdapterEvent> = (event: T) => void | Promise<void>;

/**
 * Constructor type
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin type
 */
export type Mixin<T extends Constructor> = (Base: T) => T;

/**
 * Interface with string index
 */
export interface StringIndexable {
  [key: string]: unknown;
}

/**
 * Readonly array type
 */
export type ReadonlyArray<T> = readonly T[];

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Tuple type with specific length
 */
export type Tuple<T, N extends number> = readonly T[] & { length: N };

/**
 * Union to intersection type
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for adapter configuration
 */
export function isAdapterConfig(value: unknown): value is AdapterConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).version === 'string' &&
    Array.isArray((value as any).capabilities) &&
    typeof (value as any).framework === 'object' &&
    typeof (value as any).options === 'object'
  );
}

/**
 * Type guard for component mapping
 */
export function isComponentMapping(value: unknown): value is ComponentMapping {
  return (
    typeof value === 'object' &&
    value !== null &&
    (typeof (value as any).component === 'string' || typeof (value as any).component === 'function') &&
    typeof (value as any).props === 'object'
  );
}

/**
 * Type guard for validation result
 */
export function isValidationResult(value: unknown): value is ValidationResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).valid === 'boolean' &&
    Array.isArray((value as any).errors) &&
    Array.isArray((value as any).warnings)
  );
}

/**
 * Type guard for adapter instance
 */
export function isAdapterInstance(value: unknown): value is AdapterInstance {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).config === 'object' &&
    typeof (value as any).initialized === 'boolean' &&
    typeof (value as any).initialize === 'function' &&
    typeof (value as any).mapComponent === 'function' &&
    typeof (value as any).translateStyles === 'function' &&
    typeof (value as any).convertTokens === 'function' &&
    typeof (value as any).validateConfig === 'function'
  );
}