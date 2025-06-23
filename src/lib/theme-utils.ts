import { tokens } from './tokens';

/**
 * Theme utility functions for consistent token usage
 */

// Color utilities
export const getColorToken = (color: keyof typeof tokens.colors, shade: string) => {
  return (tokens.colors[color] as any)[shade] || '';
};

// Shadow utilities
export const getShadowToken = (category: keyof typeof tokens.shadows, variant?: string) => {
  const shadowCategory = tokens.shadows[category];
  if (typeof shadowCategory === 'string') {
    return shadowCategory;
  }
  return variant && shadowCategory ? (shadowCategory as any)[variant] : '';
};

// Spacing utilities
export const getSpacingToken = (size: keyof typeof tokens.spacing) => {
  return tokens.spacing[size];
};

// Typography utilities
export const getFontSizeToken = (size: keyof typeof tokens.typography.fontSize) => {
  return tokens.typography.fontSize[size];
};

export const getFontWeightToken = (weight: keyof typeof tokens.typography.fontWeight) => {
  return tokens.typography.fontWeight[weight];
};

// Border radius utilities
export const getBorderRadiusToken = (size: keyof typeof tokens.borderRadius) => {
  return tokens.borderRadius[size];
};

// Animation utilities
export const getAnimationDuration = (speed: keyof typeof tokens.animation.duration) => {
  return tokens.animation.duration[speed];
};

export const getAnimationTiming = (timing: keyof typeof tokens.animation.timing) => {
  return tokens.animation.timing[timing];
};

// Component token utilities
export const getComponentToken = (
  component: keyof typeof tokens.components,
  property: string,
  size?: string
) => {
  const componentTokens = tokens.components[component] as any;
  const propertyTokens = componentTokens[property];
  return size && propertyTokens ? propertyTokens[size] : propertyTokens;
};

// Semantic color utilities
export const getSemanticColor = (
  category: keyof typeof tokens.semantic,
  subcategory: string,
  state?: string
) => {
  const semanticCategory = tokens.semantic[category] as any;
  const subcategoryValue = semanticCategory[subcategory];
  
  if (state && typeof subcategoryValue === 'object') {
    return subcategoryValue[state];
  }
  
  return subcategoryValue;
};

// Theme class builders
export const buildThemeClasses = (config: {
  background?: string;
  text?: string;
  border?: string;
  shadow?: string;
  padding?: string;
  rounded?: string;
}) => {
  const classes: string[] = [];
  
  if (config.background) classes.push(`bg-${config.background}`);
  if (config.text) classes.push(`text-${config.text}`);
  if (config.border) classes.push(`border-${config.border}`);
  if (config.shadow) classes.push(`shadow-${config.shadow}`);
  if (config.padding) classes.push(`p-${config.padding}`);
  if (config.rounded) classes.push(`rounded-${config.rounded}`);
  
  return classes.join(' ');
};

// State variant builder
export const getStateVariant = (
  baseClass: string,
  state: 'hover' | 'focus' | 'active' | 'disabled',
  variant: string
) => {
  return `${state}:${baseClass}-${variant}`;
};

// Responsive variant builder
export const getResponsiveVariant = (
  baseClass: string,
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl',
  value: string
) => {
  return `${breakpoint}:${baseClass}-${value}`;
};

// Dark mode variant builder
export const getDarkModeVariant = (lightClass: string, darkClass: string) => {
  return `${lightClass} dark:${darkClass}`;
};

// Validation utilities
export const isValidColorToken = (color: string): boolean => {
  const [colorName, shade] = color.split('-');
  if (!colorName || !shade) return false;
  
  const colorTokens = tokens.colors[colorName as keyof typeof tokens.colors];
  if (!colorTokens) return false;
  
  return shade in colorTokens;
};

export const isValidSpacingToken = (spacing: string): boolean => {
  return spacing in tokens.spacing;
};

export const isValidShadowToken = (shadow: string): boolean => {
  // Check if it's a direct shadow token
  if (shadow in tokens.shadows) return true;
  
  // Check if it's a nested shadow token (e.g., card-hover)
  const [category, variant] = shadow.split('-');
  const shadowCategory = tokens.shadows[category as keyof typeof tokens.shadows];
  
  if (typeof shadowCategory === 'object' && variant) {
    return variant in shadowCategory;
  }
  
  return false;
};

// Migration helpers
export const migrateColorClass = (oldClass: string): string => {
  const colorMigrationMap: Record<string, string> = {
    // Hardcoded colors to token colors
    'bg-[#230E67]': 'bg-willow-primary-950',
    'bg-[#1A0A4E]': 'bg-willow-primary-900',
    'text-[#534F5E]': 'text-neutral-900',
    'text-[#635E73]': 'text-neutral-800',
    'border-[#E1DEE9]': 'border-neutral-200',
    'bg-[#E1DEE9]': 'bg-neutral-200',
    // Add more mappings as needed
  };
  
  return colorMigrationMap[oldClass] || oldClass;
};

export const migrateShadowClass = (oldShadow: string): string => {
  // Map complex shadow strings to token classes
  if (oldShadow.includes('0px 4px 20px')) return 'shadow-card';
  if (oldShadow.includes('0px 8px 30px')) return 'shadow-card-raised';
  if (oldShadow.includes('0px 1px 3px') && oldShadow.includes('inset')) return 'shadow-button-primary';
  
  return oldShadow;
};