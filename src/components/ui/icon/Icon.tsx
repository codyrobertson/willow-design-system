import * as React from 'react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Icon size mappings
const iconSizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

export type IconSize = keyof typeof iconSizeMap;

// Convert kebab-case to PascalCase
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string;
  size?: IconSize | number;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 'md', className, ...props }, ref) => {
    // Convert kebab-case to PascalCase for Lucide icon lookup
    const iconName = toPascalCase(name);
    const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" (looking for "${iconName}") not found in lucide-react`);
      return null;
    }

    const iconSize = typeof size === 'number' ? size : iconSizeMap[size];

    return (
      <IconComponent
        ref={ref}
        size={iconSize}
        className={cn('shrink-0', className)}
        aria-hidden={props['aria-hidden'] ?? !props['aria-label']}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

export { Icon };