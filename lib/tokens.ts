/**
 * Willow Design System Tokens
 * 
 * This file contains all design tokens for the Willow Design System.
 * These tokens should be the single source of truth for all design values.
 */

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  // Brand Colors
  willow: {
    50: '#F4F3FF',
    100: '#EAE8FF',
    200: '#D7D5FF',
    300: '#BBB3FF',
    400: '#9988FD',
    500: '#7B5CFA',
    600: '#6635F2',
    700: '#5824DD',
    800: '#491DBA',
    900: '#3D1A98',
    950: '#230E67',
  },
  
  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#F6F5F8',
    100: '#EEEDF2',
    200: '#E1DEE9',
    300: '#CDC9DA',
    400: '#B8B2C9',
    500: '#A39CB6',
    600: '#8D85A2',
    700: '#7F7892',
    800: '#635E73',
    900: '#534F5E',
    950: '#312F37',
  },
  
  // Info Blue
  info: {
    50: '#F1F8FE',
    100: '#E1EFFD',
    200: '#BDDFFA',
    300: '#62B6F4',
    400: '#41A8EF',
    500: '#188DDF',
    600: '#0B6FBE',
    700: '#0A589A',
    800: '#0D4B7F',
    900: '#10406A',
    950: '#0B2846',
  },
  
  // Success Green
  success: {
    50: '#E0FAEC',
    100: '#C8F5DD',
    200: '#91EBBA',
    300: '#5AE198',
    400: '#23D775',
    500: '#1FC16B',
    600: '#199B55',
    700: '#147540',
    800: '#0E4F2A',
    900: '#082A15',
  },
  
  // Warning Orange
  warning: {
    50: '#FFF1EB',
    100: '#FFE3D6',
    200: '#FFC7AD',
    300: '#FFAB85',
    400: '#FF8F5C',
    500: '#FF8447',
    600: '#E66A2E',
    700: '#B35124',
    800: '#803919',
    900: '#4D210F',
  },
  
  // Error/Danger Red
  error: {
    50: '#FFEBEC',
    100: '#FFD6D9',
    200: '#FFADB3',
    300: '#FF858C',
    400: '#FF5C66',
    500: '#FB3748',
    600: '#E01E2F',
    700: '#AB1723',
    800: '#751018',
    900: '#400A0C',
  },
  
  // Oxford Blue (Secondary)
  oxfordBlue: {
    50: '#F3F7F8',
    100: '#E0E9ED',
    200: '#CDD9DE',
    300: '#9FB6C2',
    400: '#6C90A4',
    500: '#50748A',
    600: '#456075',
    700: '#3A4D60',
    800: '#384652',
    900: '#333E49',
    950: '#1E262E',
  },
} as const;

// ============================================
// SPACING TOKENS
// ============================================

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
} as const;

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Codec Pro', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
  },
  
  // Font Sizes
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1.125rem' }],    // 12px / 18px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],    // 14px / 20px
    base: ['1rem', { lineHeight: '1.5rem' }],       // 16px / 24px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],    // 18px / 28px
    xl: ['1.25rem', { lineHeight: '1.875rem' }],    // 20px / 30px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px / 32px
    '3xl': ['1.875rem', { lineHeight: '2.375rem' }],// 30px / 38px
    '4xl': ['2.25rem', { lineHeight: '2.75rem' }],  // 36px / 44px
    '5xl': ['3rem', { lineHeight: '3.75rem' }],     // 48px / 60px
    '6xl': ['3.75rem', { lineHeight: '4.5rem' }],   // 60px / 72px
    '7xl': ['4.5rem', { lineHeight: '5.625rem' }],  // 72px / 90px
  },
  
  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    heavy: '900',
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============================================
// BORDER RADIUS TOKENS
// ============================================

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  // Elevation shadows
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
  
  // Component-specific shadows
  card: {
    DEFAULT: '0px 4px 20px 0px rgba(0,0,0,0.12), 0px 1px 2px 0px rgba(10,13,20,0.03)',
    'default-stroke': '0px 1px 3px 0px rgba(37,62,167,0.2), 0px 0px 0px 1px rgba(55,93,251,0.1), 0px 1px 2px 0px rgba(0,0,0,0.05)',
    'default-inset': 'inset 0px -2.4px 9.3px 0px rgba(137,114,250,0.15)',
    raised: '0px 8px 30px 0px rgba(0,0,0,0.15), 0px 2px 5px 0px rgba(37,62,167,0.25), 0px 0px 0px 1px rgba(55,93,251,0.15), 0px 2px 4px 0px rgba(0,0,0,0.08)',
    'raised-inset': 'inset 0px -3px 12px 0px rgba(137,114,250,0.2)',
    hover: '0px 4px 20px 0px rgba(0,0,0,0.12), 0px 1px 2px 0px rgba(10,13,20,0.03)',
  },
  
  button: {
    primary: {
      DEFAULT: '0px 1px 3px 0px rgba(37,62,167,0.2), inset 0px -2.4px 7.5px 0px rgba(122,196,230,0.46)',
      hover: '0px 2px 5px 0px rgba(37,62,167,0.3), inset 0px -2.4px 7.5px 0px rgba(122,196,230,0.5)',
      active: 'inset 0px 2px 4px 0px rgba(37,62,167,0.3)',
    },
    secondary: {
      DEFAULT: '0px 1px 2px 0px rgba(10,13,20,0.03)',
      hover: '0px 1px 3px 0px rgba(10,13,20,0.05)',
      active: 'inset 0px 1px 2px 0px rgba(10,13,20,0.05)',
    },
    danger: {
      DEFAULT: '0px 1px 3px 0px rgba(183,55,55,0.4), inset 0px -2.4px 7.5px 0px rgba(255,150,150,0.5)',
      hover: '0px 2px 5px 0px rgba(183,55,55,0.5), inset 0px -2.4px 7.5px 0px rgba(255,150,150,0.6)',
      active: 'inset 0px 2px 4px 0px rgba(183,55,55,0.5)',
    },
  },
  
  input: {
    DEFAULT: '0px 1px 2px 0px rgba(10,13,20,0.03)',
    focus: '0px 0px 0px 3px rgba(35,14,103,0.1)',
    error: '0px 0px 0px 3px rgba(251,55,72,0.1)',
  },
  
  chip: {
    // Normal variant shadows
    DEFAULT: '0px 0px 0px 1px #E0E9ED, 0px 1px 3px 0px rgba(143,143,143,0.2)',
    hover: '0px 0px 0px 1px #CDD9DE, 0px 1px 3px 0px rgba(143,143,143,0.3)',
    // Fancy variant shadows (with inset)
    fancy: '0px 1px 3px 0px rgba(143,143,143,0.2), 0px 0px 0px 1px #E0E9ED, inset 0px -2.4px 0px 0px rgba(61,61,61,0.04)',
    'fancy-hover': '0px 1px 3px 0px rgba(143,143,143,0.3), 0px 0px 0px 1px #CDD9DE, inset 0px -2.4px 0px 0px rgba(61,61,61,0.06)',
    // Selected state shadows for themes
    'primary-selected': '0px 0px 0px 1px #230E67, 0px 1px 3px 0px rgba(35,14,103,0.3)',
    'primary-fancy-selected': '0px 1px 3px 0px rgba(35,14,103,0.2), 0px 0px 0px 1px #230E67, inset 0px -2.4px 0px 0px rgba(49,26,255,0.25)',
    'neutral-selected': '0px 0px 0px 1px #6C8998, 0px 1px 3px 0px rgba(108,137,152,0.3)',
    'neutral-fancy-selected': '0px 1px 3px 0px rgba(108,137,152,0.2), 0px 0px 0px 1px #587989, inset 0px -2.4px 0px 0px rgba(127,153,166,0.3)',
    'success-selected': '0px 0px 0px 1px #15803d, 0px 1px 3px 0px rgba(31,193,107,0.3)',
    'success-fancy-selected': '0px 1px 3px 0px rgba(31,193,107,0.2), 0px 0px 0px 1px #15803d, inset 0px -2.4px 0px 0px rgba(34,197,94,0.3)',
    'warning-selected': '0px 0px 0px 1px #ea580c, 0px 1px 3px 0px rgba(255,132,71,0.3)',
    'warning-fancy-selected': '0px 1px 3px 0px rgba(255,132,71,0.2), 0px 0px 0px 1px #ea580c, inset 0px -2.4px 0px 0px rgba(251,146,60,0.3)',
    'danger-selected': '0px 0px 0px 1px #dc2626, 0px 1px 3px 0px rgba(251,55,72,0.3)',
    'danger-fancy-selected': '0px 1px 3px 0px rgba(235,87,87,0.2), 0px 0px 0px 1px #dc2626, inset 0px -2.4px 0px 0px rgba(248,113,113,0.3)',
    'info-selected': '0px 0px 0px 1px #5F4DFF, 0px 1px 3px 0px rgba(118,102,255,0.3)',
    'info-fancy-selected': '0px 1px 3px 0px rgba(118,102,255,0.2), 0px 0px 0px 1px #5F4DFF, inset 0px -2.4px 0px 0px rgba(141,128,255,0.3)',
  },
} as const;

// ============================================
// Z-INDEX TOKENS
// ============================================

export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
} as const;

// ============================================
// ANIMATION TOKENS
// ============================================

export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    DEFAULT: '200ms',
    medium: '300ms',
    slow: '500ms',
  },
  
  timing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================
// SEMANTIC TOKENS
// ============================================

export const semantic = {
  // Background colors
  background: {
    primary: colors.neutral[0],
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
    inverse: colors.neutral[900],
  },
  
  // Text colors
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[700],
    tertiary: colors.neutral[600],
    disabled: colors.neutral[400],
    inverse: colors.neutral[0],
  },
  
  // Border colors
  border: {
    DEFAULT: colors.neutral[200],
    light: colors.neutral[100],
    dark: colors.neutral[300],
    focus: colors.willow[500],
  },
  
  // Interactive states
  interactive: {
    primary: {
      DEFAULT: colors.willow[950],
      hover: colors.willow[900],
      active: colors.willow[800],
      disabled: colors.willow[200],
    },
    secondary: {
      DEFAULT: colors.neutral[100],
      hover: colors.neutral[200],
      active: colors.neutral[300],
      disabled: colors.neutral[50],
    },
    danger: {
      DEFAULT: colors.error[500],
      hover: colors.error[600],
      active: colors.error[700],
      disabled: colors.error[200],
    },
    success: {
      DEFAULT: colors.success[500],
      hover: colors.success[600],
      active: colors.success[700],
      disabled: colors.success[200],
    },
    warning: {
      DEFAULT: colors.warning[500],
      hover: colors.warning[600],
      active: colors.warning[700],
      disabled: colors.warning[200],
    },
  },
} as const;

// ============================================
// COMPONENT TOKENS
// ============================================

export const components = {
  button: {
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      md: `${spacing[2.5]} ${spacing[4]}`,
      lg: `${spacing[3]} ${spacing[5]}`,
    },
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
  },
  
  input: {
    padding: {
      sm: `${spacing[1.5]} ${spacing[2.5]}`,
      md: `${spacing[2]} ${spacing[3]}`,
      lg: `${spacing[2.5]} ${spacing[3.5]}`,
    },
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
  },
  
  card: {
    padding: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    },
    borderRadius: borderRadius.lg,
  },
} as const;

// Export all tokens as a single object for convenience
export const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  zIndex,
  animation,
  semantic,
  components,
} as const;

export default tokens;