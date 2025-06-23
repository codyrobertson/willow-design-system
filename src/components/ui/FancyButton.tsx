'use client';

/**
 * @deprecated Use Button component instead with theme="primary" and variant="default"
 * 
 * This component is maintained for backward compatibility only.
 * All new code should use the Button component from './Button'
 * 
 * Migration guide:
 * - <FancyButton variant="primary"> → <Button theme="primary" variant="default">
 * - <FancyButton variant="secondary"> → <Button theme="primary" variant="secondary">
 * - <FancyButton variant="ghost"> → <Button theme="primary" variant="ghost">
 * - <FancyButton variant="outline"> → <Button theme="primary" variant="outline">
 * - <FancyButton variant="danger"> → <Button theme="danger" variant="default">
 */

import React from 'react';
import { Button, type ButtonProps as BaseButtonProps } from './Button';

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl"
export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "fancy"
export type ButtonState = "default" | "hover" | "active" | "disabled" | "loading"

interface FancyButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  className?: string
}

// Map old size props to new ones
const sizeMap: Record<ButtonSize, BaseButtonProps['size']> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg', // xl doesn't exist in new system, use lg
}

// Map old variant props to new theme/variant combinations
const variantMap = (variant: ButtonVariant): Pick<BaseButtonProps, 'theme' | 'variant'> => {
  switch (variant) {
    case 'primary':
      return { theme: 'primary', variant: 'default' };
    case 'secondary':
      return { theme: 'primary', variant: 'secondary' };
    case 'ghost':
      return { theme: 'primary', variant: 'ghost' };
    case 'outline':
      return { theme: 'primary', variant: 'outline' };
    case 'danger':
      return { theme: 'danger', variant: 'default' };
    case 'fancy':
      return { theme: 'primary', variant: 'fancy' };
    default:
      return { theme: 'primary', variant: 'default' };
  }
}

export const FancyButton = React.forwardRef<HTMLButtonElement, FancyButtonProps>(
  ({
    children,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    onClick,
    type = "button",
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    ...props
  }, ref) => {
    console.warn(
      'FancyButton is deprecated. Please use Button component instead. ' +
      'See migration guide in FancyButton.tsx'
    );

    const { theme, variant: newVariant } = variantMap(variant);

    return (
      <Button
        ref={ref}
        theme={theme}
        variant={newVariant}
        size={sizeMap[size]}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        type={type}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        fullWidth={fullWidth}
        className={className}
        radius="full" // FancyButton was always rounded-full
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FancyButton.displayName = 'FancyButton';