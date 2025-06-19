'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FA6Icon } from './FA6Icon';

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl"
export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline"
export type ButtonState = "default" | "hover" | "active" | "disabled" | "loading"

interface ButtonProps {
  /**
   * Button text content
   */
  children: React.ReactNode
  /**
   * Visual style variant
   * 
   * • `primary` – solid purple background (default)
   * • `secondary` – lighter/muted styling  
   * • `ghost` – transparent background
   * • `outline` – border with transparent background
   */
  variant?: ButtonVariant
  /**
   * Button size affecting padding and text size
   */
  size?: ButtonSize
  /**
   * Disabled state
   */
  disabled?: boolean
  /**
   * Loading state with spinner
   */
  loading?: boolean
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Button type for forms
   */
  type?: "button" | "submit" | "reset"
  /**
   * Optional icon on the left
   */
  leftIcon?: React.ReactNode
  /**
   * Optional icon on the right  
   */
  rightIcon?: React.ReactNode
  /**
   * Full width button
   */
  fullWidth?: boolean
  /**
   * Additional class names
   */
  className?: string
}

const sizeMap: Record<ButtonSize, string> = {
  xs: "px-3 py-1.5 text-sm h-8",
  sm: "px-4 py-2 text-sm h-10", 
  md: "px-6 py-2.5 text-base h-12",
  lg: "px-8 py-4 text-xl h-16",
  xl: "px-10 py-5 text-2xl h-20",
}

// Base button styles shared across all variants
const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-full overflow-hidden transition-all duration-200 transform"

// Primary button with all its states
const primaryStyles = {
  base: "bg-[#230E67] text-white shadow-[0px_1px_3px_0px_rgba(37,62,167,0.2)]",
  hover: "hover:bg-[#1A0A4E] hover:shadow-[0px_4px_8px_0px_rgba(37,62,167,0.3)] hover:-translate-y-0.5",
  active: "active:bg-[#0F0633] active:shadow-[0px_1px_2px_0px_rgba(37,62,167,0.2)] active:translate-y-0",
  disabled: "disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
}

const variantMap: Record<ButtonVariant, string> = {
  primary: `${primaryStyles.base} ${primaryStyles.hover} ${primaryStyles.active} ${primaryStyles.disabled}`,
  secondary: "bg-willow-primary-100 text-willow-primary-950 hover:bg-willow-primary-200 active:bg-willow-primary-300 disabled:bg-gray-100 disabled:text-gray-400",
  ghost: "bg-transparent text-willow-primary-950 hover:bg-willow-primary-50 active:bg-willow-primary-100 disabled:text-gray-400",
  outline: "bg-transparent border-2 border-willow-primary-950 text-willow-primary-950 hover:bg-willow-primary-50 active:bg-willow-primary-100 disabled:border-gray-300 disabled:text-gray-400"
}

export function FancyButton({
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
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // Base styles
        baseStyles,
        // Size styles
        sizeMap[size],
        // Variant styles
        variantMap[variant],
        // Width
        fullWidth && "w-full",
        // Custom classes
        className
      )}
    >
      {/* Inner shadow effect for primary button - matches Figma */}
      {variant === "primary" && !isDisabled && (
        <div 
          className="absolute inset-0 rounded-full pointer-events-none" 
          style={{
            boxShadow: "inset 0px -2.4px 7.5px 0px rgba(122, 196, 230, 0.46)"
          }}
        />
      )}
      
      {/* Loading spinner */}
      {loading && (
        <FA6Icon 
          name="spinner" 
          style="solid" 
          className="absolute animate-spin" 
        />
      )}
      
      {/* Content wrapper */}
      <span className={cn(
        "relative z-10 flex items-center gap-2",
        loading && "invisible"
      )}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className="font-codec-pro-medium">{children}</span>
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </span>
    </button>
  );
}