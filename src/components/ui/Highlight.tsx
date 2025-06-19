import React from "react"
import { cn } from "@/lib/utils"
import { FA6Icon } from "./FA6Icon"

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
  /** Optional icon rendered to the left of the text. Pass an icon name (string) or a React element */
  iconLeft?: string | React.ReactNode
  /** Optional icon rendered to the right of the text. Pass an icon name (string) or a React element */
  iconRight?: string | React.ReactNode
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
      ? "bg-white/10"
      : "bg-gray-100/80"

  const textColor =
    variant === "dark"
      ? "text-white"
      : "text-gray-800"

  const renderIcon = (icon: string | React.ReactNode | undefined) => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return <FA6Icon name={icon} style="solid" size="sm" className={textColor} />;
    }
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
            "font-medium",
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