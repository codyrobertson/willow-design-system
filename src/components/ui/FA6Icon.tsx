'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type IconStyle = 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands';
export type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';

interface FA6IconProps {
  name: string;
  style?: IconStyle;
  size?: IconSize;
  className?: string;
  spin?: boolean;
  pulse?: boolean;
  beat?: boolean;
  bounce?: boolean;
  flip?: 'horizontal' | 'vertical' | 'both';
  rotate?: 90 | 180 | 270;
  fixedWidth?: boolean;
}

const styleMap: Record<IconStyle, string> = {
  solid: 'fas',
  regular: 'far',
  light: 'fal',
  thin: 'fat',
  duotone: 'fad',
  brands: 'fab',
};

const sizeMap: Record<IconSize, string> = {
  xs: 'fa-xs',
  sm: 'fa-sm',
  base: '',
  lg: 'fa-lg',
  xl: 'fa-xl',
  '2xl': 'fa-2xl',
  '3xl': 'fa-3xl',
  '4xl': 'fa-4xl',
  '5xl': 'fa-5xl',
  '6xl': 'fa-6xl',
  '7xl': 'fa-7xl',
  '8xl': 'fa-8xl',
  '9xl': 'fa-9xl',
};

export function FA6Icon({
  name,
  style = 'solid',
  size = 'base',
  className,
  spin = false,
  pulse = false,
  beat = false,
  bounce = false,
  flip,
  rotate,
  fixedWidth = false,
}: FA6IconProps) {
  const iconClasses = cn(
    styleMap[style],
    `fa-${name}`,
    sizeMap[size],
    {
      'fa-spin': spin,
      'fa-pulse': pulse,
      'fa-beat': beat,
      'fa-bounce': bounce,
      'fa-flip-horizontal': flip === 'horizontal',
      'fa-flip-vertical': flip === 'vertical',
      'fa-flip-both': flip === 'both',
      'fa-rotate-90': rotate === 90,
      'fa-rotate-180': rotate === 180,
      'fa-rotate-270': rotate === 270,
      'fa-fw': fixedWidth,
    },
    className
  );

  return <i className={iconClasses} aria-hidden="true" />;
}

// SVG-based icon component for more control
interface FA6SVGIconProps extends Omit<FA6IconProps, 'spin' | 'pulse' | 'beat' | 'bounce' | 'flip' | 'rotate'> {
  color?: string;
  secondaryColor?: string; // For duotone icons
  secondaryOpacity?: number; // For duotone icons
}

export function FA6SVGIcon({
  name,
  style = 'solid',
  size = 'base',
  className,
  color,
  secondaryColor,
  secondaryOpacity = 0.4,
}: FA6SVGIconProps) {
  const [svgContent, setSvgContent] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const loadSVG = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch(`/fontawesome/svgs/${style}/${name}.svg`);
        if (!response.ok) throw new Error('SVG not found');
        const text = await response.text();
        setSvgContent(text);
      } catch (err) {
        setError(true);
        console.error(`Failed to load icon: ${style}/${name}`, err);
      } finally {
        setLoading(false);
      }
    };

    loadSVG();
  }, [name, style]);

  const sizeClasses: Record<IconSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    base: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
    '3xl': 'w-12 h-12',
    '4xl': 'w-16 h-16',
    '5xl': 'w-20 h-20',
    '6xl': 'w-24 h-24',
    '7xl': 'w-28 h-28',
    '8xl': 'w-32 h-32',
    '9xl': 'w-36 h-36',
  };

  if (loading) {
    return <div className={cn(sizeClasses[size], 'animate-pulse bg-gray-200 rounded', className)} />;
  }

  if (error || !svgContent) {
    return <div className={cn(sizeClasses[size], 'bg-gray-100 rounded', className)} />;
  }

  // Parse and modify SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) return null;

  // Set size classes
  svg.setAttribute('class', cn(sizeClasses[size], className || ''));
  
  // Set colors
  if (color) {
    svg.setAttribute('fill', color);
  }

  // Handle duotone icons
  if (style === 'duotone' && secondaryColor) {
    const secondary = svg.querySelector('.fa-secondary');
    if (secondary) {
      secondary.setAttribute('fill', secondaryColor);
      secondary.setAttribute('opacity', secondaryOpacity.toString());
    }
  }

  return <div dangerouslySetInnerHTML={{ __html: svg.outerHTML }} />;
}

// Export convenience components for common icon styles
export const SolidIcon = (props: Omit<FA6IconProps, 'style'>) => <FA6Icon {...props} style="solid" />;
export const RegularIcon = (props: Omit<FA6IconProps, 'style'>) => <FA6Icon {...props} style="regular" />;
export const LightIcon = (props: Omit<FA6IconProps, 'style'>) => <FA6Icon {...props} style="light" />;
export const ThinIcon = (props: Omit<FA6IconProps, 'style'>) => <FA6Icon {...props} style="thin" />;
export const DuotoneIcon = (props: Omit<FA6IconProps, 'style'>) => <FA6Icon {...props} style="duotone" />;
export const BrandsIcon = (props: Omit<FA6IconProps, 'style'>) => <FA6Icon {...props} style="brands" />;