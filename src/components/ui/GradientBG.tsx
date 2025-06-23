import React from 'react';
import { cn } from '../../lib/utils';

interface GradientBGProps {
  /**
   * The URL of the background image (optional).
   */
  imageUrl?: string;
  /**
   * An array of color strings for the gradient overlay.
   * If not provided, only the image will be shown.
   */
  gradientColors?: string[];
  /**
   * Direction of the gradient
   * @default 'to bottom'
   */
  gradientDirection?: 'to top' | 'to bottom' | 'to left' | 'to right' | 'to top left' | 'to top right' | 'to bottom left' | 'to bottom right' | string;
  /**
   * Blur amount applied to the background
   * @default 0
   */
  blur?: number;
  /**
   * Opacity of the gradient overlay
   * @default 1
   */
  gradientOpacity?: number;
  /**
   * Background size for the image
   * @default 'cover'
   */
  backgroundSize?: 'cover' | 'contain' | 'auto' | string;
  /**
   * Background position for the image
   * @default 'center'
   */
  backgroundPosition?: string;
  /**
   * Whether to add a dark overlay for better text readability
   * @default false
   */
  darkOverlay?: boolean;
  /**
   * Height of the component
   * @default 'min-h-screen'
   */
  height?: string;
  /**
   * Additional class names to apply to the container.
   */
  className?: string;
  /**
   * The content to be rendered inside the component.
   */
  children?: React.ReactNode;
}

export default function GradientBG({
  imageUrl,
  gradientColors,
  gradientDirection = 'to bottom',
  blur = 0,
  gradientOpacity = 1,
  backgroundSize = 'cover',
  backgroundPosition = 'center',
  darkOverlay = false,
  height = 'min-h-screen',
  className,
  children,
}: GradientBGProps) {
  const hasImage = !!imageUrl;
  const hasGradient = gradientColors && gradientColors.length > 0;

  // Create gradient style object
  const gradientStyle: React.CSSProperties = {};
  if (hasGradient) {
    if (gradientColors.length === 1) {
      gradientStyle.backgroundColor = gradientColors[0];
    } else {
      gradientStyle.backgroundImage = `linear-gradient(${gradientDirection}, ${gradientColors.join(', ')})`;
    }
    gradientStyle.opacity = gradientOpacity;
  }

  // Create image style object
  const imageStyle: React.CSSProperties = hasImage ? {
    backgroundImage: `url('${imageUrl}')`,
    backgroundSize,
    backgroundPosition,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
  } : {};

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        height,
        className
      )}
    >
      {/* Background Image Layer */}
      {hasImage && (
        <div
          className="absolute inset-0 bg-no-repeat"
          style={imageStyle}
        />
      )}
      
      {/* Gradient Overlay Layer */}
      {hasGradient && (
        <div
          className="absolute inset-0"
          style={gradientStyle}
        />
      )}
      
      {/* Dark Overlay Layer */}
      {darkOverlay && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      
      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
}