import React from 'react';
import { cn } from '@/lib/utils';

export type GradientDirection = "to-t" | "to-tr" | "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl"
export type BlurType = "solid" | "progressive"
export type BlurVariant = "light" | "dark"
export type CoverMode = "contain" | "cover" | "stretch"

interface GradientBackgroundProps {
  direction?: GradientDirection
  colors: string[]
  coverMode?: CoverMode
  blurSize?: number
  blurType?: BlurType
  blurVariant?: BlurVariant
  position?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  size?: {
    width?: number
    height?: number
  }
  blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light"
  shape?: "rectangle" | "circle" | "ellipse"
  className?: string
  children?: React.ReactNode
}

// Pure function to build gradient classes
const buildGradientClasses = (direction: GradientDirection, colors: string[]): string => {
  return [
    `bg-gradient-${direction}`,
    ...colors.map((color, i) => 
      i === 0 ? `from-${color}` : 
      i === colors.length - 1 ? `to-${color}` : 
      `via-${color}`
    )
  ].join(' ');
};

// Pure function to build position styles
const buildPositionStyles = (position?: GradientBackgroundProps['position']) => ({
  top: position?.top !== undefined ? `${position.top}rem` : undefined,
  right: position?.right !== undefined ? `${position.right}rem` : undefined,
  bottom: position?.bottom !== undefined ? `${position.bottom}rem` : undefined,
  left: position?.left !== undefined ? `${position.left}rem` : undefined,
});

// Pure function to build size styles
const buildSizeStyles = (size?: GradientBackgroundProps['size']) => ({
  width: size?.width !== undefined ? `${size.width}rem` : '40rem',
  height: size?.height !== undefined ? `${size.height}rem` : '40rem',
});

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  direction = "to-b",
  colors = ["white/30", "transparent"],
  coverMode = "cover",
  blurSize = 16,
  blurType = "progressive",
  blurVariant = "light",
  position,
  size,
  blendMode = "overlay",
  shape = "circle",
  className,
  children
}) => {
  const gradientClasses = buildGradientClasses(direction, colors);
  const positionStyles = buildPositionStyles(position);
  const sizeStyles = buildSizeStyles(size);

  const shapeClasses = shape === "circle" ? "rounded-full" : 
                      shape === "ellipse" ? "rounded-[50%]" : 
                      "rounded-none";

  const coverClasses = coverMode === "contain" ? "object-contain" : 
                      coverMode === "cover" ? "object-cover" : 
                      "object-fill";

  return (
    <>
      {/* Gradient overlay */}
      <div 
        className={cn(
          "absolute flex items-center justify-center",
          `mix-blend-${blendMode}`,
          coverClasses,
          className
        )}
        style={{
          ...positionStyles,
          ...sizeStyles
        }}
      >
        <div className={cn(
          "relative w-full h-full",
          shapeClasses
        )}>
          <div className={cn(
            gradientClasses,
            "w-full h-full",
            blurType === "solid" ? `blur-[${blurSize}px]` : ""
          )} />
        </div>
      </div>

      {/* Content wrapper with progressive blur */}
      {blurType === "progressive" && (
        <div className={cn(
          "backdrop-blur-sm flex-1 w-full flex flex-col relative",
          blurVariant === "light" ? "bg-white/30" : "bg-black/30"
        )}>
          {children}
        </div>
      )}
    </>
  );
};

export default GradientBackground;