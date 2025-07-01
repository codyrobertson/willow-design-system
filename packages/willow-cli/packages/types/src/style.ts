/**
 * Style-related types
 */

export interface StyleSystem {
  /**
   * Style system type
   */
  type: 'utility' | 'css-modules' | 'css-in-js' | 'inline';
  
  /**
   * Style system name
   */
  name: string;
  
  /**
   * Transform styles
   */
  transform(styles: StyleInput): StyleOutput;
  
  /**
   * Get required dependencies
   */
  getDependencies(): string[];
}

export type StyleInput = 
  | UtilityClasses
  | CSSModuleStyles
  | CSSInJSStyles
  | InlineStyles;

export type StyleOutput = {
  className?: string;
  style?: React.CSSProperties;
  css?: string;
};

export interface UtilityClasses {
  type: 'utility';
  classes: string[];
  conditionals?: ConditionalClasses;
}

export interface CSSModuleStyles {
  type: 'css-modules';
  module: string;
  classes: string[];
}

export interface CSSInJSStyles {
  type: 'css-in-js';
  styles: Record<string, any>;
  theme?: any;
}

export interface InlineStyles {
  type: 'inline';
  styles: React.CSSProperties;
}

export interface ConditionalClasses {
  [condition: string]: string | string[];
}

/**
 * Design token types
 */
export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  borders: BorderTokens;
  animations: AnimationTokens;
  breakpoints: BreakpointTokens;
  custom?: Record<string, any>;
}

export interface ColorTokens {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  [key: string]: ColorScale;
}

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
  DEFAULT?: string;
}

export interface SpacingTokens {
  0?: string;
  0.5?: string;
  1?: string;
  2?: string;
  3?: string;
  4?: string;
  5?: string;
  6?: string;
  8?: string;
  10?: string;
  12?: string;
  16?: string;
  20?: string;
  24?: string;
  32?: string;
  40?: string;
  48?: string;
  56?: string;
  64?: string;
  [key: string]: string | undefined;
}

export interface TypographyTokens {
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string }]>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
}

export interface ShadowTokens {
  sm?: string;
  DEFAULT?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  inner?: string;
  none?: string;
  [key: string]: string | undefined;
}

export interface BorderTokens {
  radius: Record<string, string>;
  width: Record<string, string>;
}

export interface AnimationTokens {
  duration: Record<string, string>;
  timing: Record<string, string>;
  delay: Record<string, string>;
}

export interface BreakpointTokens {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  [key: string]: string | undefined;
}