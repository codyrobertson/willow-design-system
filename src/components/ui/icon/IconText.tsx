import * as React from 'react';
import { cn } from '../../../lib/utils';
import { Icon, type IconSize, type LucideIconName } from './Icon';

export interface IconTextProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIconName;
  children: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: IconSize;
  gap?: 'xs' | 'sm' | 'md' | 'lg';
}

const gapClasses = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
} as const;

const IconText = React.forwardRef<HTMLDivElement, IconTextProps>(
  ({ icon, children, iconPosition = 'left', size = 'md', gap = 'sm', className, ...props }, ref) => (
    <div 
      ref={ref}
      className={cn(
        'inline-flex items-center',
        gapClasses[gap],
        iconPosition === 'right' && 'flex-row-reverse',
        className
      )}
      {...props}
    >
      <Icon name={icon} size={size} className="shrink-0" />
      <span>{children}</span>
    </div>
  )
);

IconText.displayName = 'IconText';

export { IconText };