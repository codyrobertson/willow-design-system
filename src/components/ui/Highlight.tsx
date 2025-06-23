import React from "react"
import { cn } from '../../lib/utils'

export type HighlightSize = "sm" | "md" | "lg"
export type HighlightVariant = "dark" | "light"

interface HighlightProps {
  /** Strength of the backdrop blur in pixels. Default is `34`. */
  blurStrength?: number
  /** Visual theme for card */
  variant?: HighlightVariant
  /** Label text */
  text: string
  /** Card size */
  size?: HighlightSize
  /** Optional icon rendered to the left of the text. Pass a React element */
  iconLeft?: React.ReactNode
  /** Optional icon rendered to the right of the text. Pass a React element */
  iconRight?: React.ReactNode
  /** Additional classes */
  className?: string
}

const sizeStyles: Record<HighlightSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
}

export function Highlight({
  blurStrength = 20,
  variant = "dark",
  text,
  size = "md",
  iconLeft,
  iconRight,
  className,
}: HighlightProps) {
  const background =
    variant === "dark"
      ? "bg-black/20 border border-white/10"
      : "bg-gray-100/80"

  const textColor =
    variant === "dark"
      ? "text-white"
      : "text-gray-800"

  const renderIcon = (icon: React.ReactNode | undefined) => {
    if (!icon) return null;
    return icon;
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl w-full",
        background,
        className
      )}
      style={{ backdropFilter: `blur(${blurStrength}px)` }}
    >
      <div className="flex items-center px-6 py-4 gap-3">
        {renderIcon(iconLeft)}
        <span
          className={cn(
            "font-normal",
            sizeStyles[size],
            textColor
          )}
        >
          {text}
        </span>
        {renderIcon(iconRight)}
      </div>
    </div>
  )
}

export default Highlight