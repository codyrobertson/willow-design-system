import * as React from 'react';
import { cn } from '../../../lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Icon Component
 * 
 * A wrapper around Lucide React icons that provides consistent sizing and styling.
 * Automatically converts kebab-case icon names to the appropriate Lucide component.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Icon name="user" size="md" />
 * 
 * // With custom size
 * <Icon name="settings" size={24} />
 * 
 * // With custom styling
 * <Icon name="check" className="text-success" />
 * 
 * // Accessible icon with label
 * <Icon name="trash" aria-label="Delete item" />
 * ```
 */

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
  /** Name of the Lucide icon (kebab-case) */
  name: string;
  /** Size preset or custom pixel value */
  size?: IconSize | number;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Whether to hide from screen readers */
  'aria-hidden'?: boolean;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 'md', className, ...props }, ref) => {
    // Handle undefined, null, or empty icon names
    if (!name) {
      if (name !== '') {
        console.warn(`Icon name is ${name === undefined ? 'undefined' : 'null'}`);
      } else {
        console.warn(`Icon "" (looking for "") not found in lucide-react`);
      }
      return null;
    }
    
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