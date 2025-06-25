/**
 * Component configuration for UI kit adapters
 */
export interface ComponentConfig {
  name: string;
  type: ComponentType;
  props?: Record<string, any>;
  children?: any;
  variants?: ComponentVariant[];
  defaultProps?: Record<string, any>;
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
  props: Record<string, any>;
  description?: string;
}

/**
 * Style configuration
 */
export interface StyleConfig {
  base?: Record<string, any>;
  variants?: Record<string, Record<string, any>>;
  states?: Record<string, Record<string, any>>;
  responsive?: ResponsiveStyles;
  dark?: Record<string, any>;
}

/**
 * Responsive style breakpoints
 */
export interface ResponsiveStyles {
  xs?: Record<string, any>;
  sm?: Record<string, any>;
  md?: Record<string, any>;
  lg?: Record<string, any>;
  xl?: Record<string, any>;
  '2xl'?: Record<string, any>;
}

/**
 * Design token configuration
 */
export interface TokenConfig {
  colors?: ColorTokens;
  typography?: TypographyTokens;
  spacing?: SpacingTokens;
  sizing?: SizingTokens;
  borders?: BorderTokens;
  shadows?: ShadowTokens;
  animations?: AnimationTokens;
  breakpoints?: BreakpointTokens;
  custom?: Record<string, any>;
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
  background?: Record<string, string>;
  foreground?: Record<string, string>;
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
  fontFamily?: Record<string, string>;
  fontSize?: Record<string, string>;
  fontWeight?: Record<string, string | number>;
  lineHeight?: Record<string, string | number>;
  letterSpacing?: Record<string, string>;
}

/**
 * Spacing tokens
 */
export interface SpacingTokens {
  [key: string]: string | number;
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
  width?: Record<string, string>;
  radius?: Record<string, string>;
  style?: Record<string, string>;
}

/**
 * Shadow tokens
 */
export interface ShadowTokens {
  [key: string]: string;
}

/**
 * Animation tokens
 */
export interface AnimationTokens {
  duration?: Record<string, string>;
  easing?: Record<string, string>;
  delay?: Record<string, string>;
}

/**
 * Breakpoint tokens
 */
export interface BreakpointTokens {
  [key: string]: string | number;
}