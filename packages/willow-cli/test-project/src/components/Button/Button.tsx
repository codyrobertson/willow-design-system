import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Button({ className, children, ...props }: ButtonProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}
