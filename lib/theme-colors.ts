// Standardized color mappings for Willow Design System components

export const themeColors = {
  primary: {
    solid: {
      bg: 'bg-willow-primary-950',
      text: 'text-white',
      hover: 'hover:bg-willow-primary-900',
      border: 'border-willow-primary-950',
    },
    soft: {
      bg: 'bg-willow-primary-50',
      text: 'text-willow-primary-800',
      hover: 'hover:bg-willow-primary-100',
      border: 'border-willow-primary-200',
    },
    outline: {
      bg: 'bg-white',
      text: 'text-willow-primary-700',
      hover: 'hover:bg-willow-primary-50',
      border: 'border-willow-primary-300',
    },
  },
  neutral: {
    solid: {
      bg: 'bg-neutral-700',
      text: 'text-white',
      hover: 'hover:bg-neutral-800',
      border: 'border-neutral-700',
    },
    soft: {
      bg: 'bg-neutral-100',
      text: 'text-neutral-700',
      hover: 'hover:bg-neutral-200',
      border: 'border-neutral-300',
    },
    outline: {
      bg: 'bg-white',
      text: 'text-neutral-600',
      hover: 'hover:bg-neutral-50',
      border: 'border-neutral-300',
    },
  },
  success: {
    solid: {
      bg: 'bg-success',
      text: 'text-white',
      hover: 'hover:bg-green-700',
      border: 'border-success',
    },
    soft: {
      bg: 'bg-state-success-lighter',
      text: 'text-green-800',
      hover: 'hover:bg-green-100',
      border: 'border-green-200',
    },
    outline: {
      bg: 'bg-white',
      text: 'text-green-700',
      hover: 'hover:bg-green-50',
      border: 'border-green-300',
    },
  },
  warning: {
    solid: {
      bg: 'bg-warning',
      text: 'text-white',
      hover: 'hover:bg-orange-600',
      border: 'border-warning',
    },
    soft: {
      bg: 'bg-state-warning-lighter',
      text: 'text-orange-800',
      hover: 'hover:bg-orange-100',
      border: 'border-orange-200',
    },
    outline: {
      bg: 'bg-white',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-50',
      border: 'border-orange-300',
    },
  },
  danger: {
    solid: {
      bg: 'bg-danger',
      text: 'text-white',
      hover: 'hover:bg-red-700',
      border: 'border-danger',
    },
    soft: {
      bg: 'bg-state-error-lighter',
      text: 'text-red-800',
      hover: 'hover:bg-red-100',
      border: 'border-red-200',
    },
    outline: {
      bg: 'bg-white',
      text: 'text-red-700',
      hover: 'hover:bg-red-50',
      border: 'border-red-300',
    },
  },
  info: {
    solid: {
      bg: 'bg-willow-primary-600',
      text: 'text-white',
      hover: 'hover:bg-willow-primary-700',
      border: 'border-willow-primary-600',
    },
    soft: {
      bg: 'bg-willow-primary-100',
      text: 'text-willow-primary-700',
      hover: 'hover:bg-willow-primary-200',
      border: 'border-willow-primary-300',
    },
    outline: {
      bg: 'bg-white',
      text: 'text-willow-primary-600',
      hover: 'hover:bg-willow-primary-50',
      border: 'border-willow-primary-300',
    },
  },
} as const;

// Shadow configurations for different component states
export const shadowStyles = {
  chip: {
    normal: {
      base: 'shadow-[0px_0px_0px_1px_#E0E9ED,0px_1px_3px_0px_rgba(143,143,143,0.2)]',
      hover: 'hover:shadow-[0px_0px_0px_1px_#CDD9DE,0px_1px_3px_0px_rgba(143,143,143,0.3)]',
    },
    fancy: {
      base: 'shadow-[0px_1px_3px_0px_rgba(143,143,143,0.2),0px_0px_0px_1px_#E0E9ED,inset_0px_-2.4px_0px_0px_rgba(61,61,61,0.04)]',
      hover: 'hover:shadow-[0px_1px_3px_0px_rgba(143,143,143,0.3),0px_0px_0px_1px_#CDD9DE,inset_0px_-2.4px_0px_0px_rgba(61,61,61,0.06)]',
    },
  },
} as const;