import type { Config } from "tailwindcss";
import { tokens } from "./lib/tokens";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from tokens
        "willow-primary": tokens.colors.willow,
        
        // Neutral colors from tokens
        neutral: tokens.colors.neutral,
        
        // Semantic colors from tokens
        info: tokens.colors.info,
        success: tokens.colors.success,
        warning: tokens.colors.warning,
        danger: tokens.colors.error[500],
        
        // State colors
        state: {
          error: {
            base: tokens.colors.error[500],
            lighter: tokens.colors.error[50],
          },
          success: {
            base: tokens.colors.success[500],
            lighter: tokens.colors.success[50],
          },
          warning: {
            base: tokens.colors.warning[500],
            lighter: tokens.colors.warning[50],
          },
        },
        
        // Oxford Blue (secondary neutral)
        "oxford-blue": tokens.colors.oxfordBlue,
        
        // CSS Variable based colors for light/dark mode
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          ...tokens.colors.willow,
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          ...tokens.colors.error,
        },
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      
      spacing: tokens.spacing,
      
      fontSize: tokens.typography.fontSize,
      
      fontFamily: {
        sans: tokens.typography.fontFamily.sans,
        mono: tokens.typography.fontFamily.mono,
        "codec-pro": tokens.typography.fontFamily.sans,
      },
      
      fontWeight: tokens.typography.fontWeight,
      
      letterSpacing: tokens.typography.letterSpacing,
      
      lineHeight: tokens.typography.lineHeight,
      
      borderRadius: {
        ...tokens.borderRadius,
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      boxShadow: {
        ...tokens.shadows,
        
        // Card shadows
        card: tokens.shadows.card.DEFAULT,
        "card-default": tokens.shadows.card['default-stroke'],
        "card-default-inset": tokens.shadows.card['default-inset'],
        "card-raised": tokens.shadows.card.raised,
        "card-raised-inset": tokens.shadows.card['raised-inset'],
        "card-hover": tokens.shadows.card.hover,
        
        // Button shadows
        "button-primary": tokens.shadows.button.primary.DEFAULT,
        "button-primary-hover": tokens.shadows.button.primary.hover,
        "button-primary-active": tokens.shadows.button.primary.active,
        
        "button-secondary": tokens.shadows.button.secondary.DEFAULT,
        "button-secondary-hover": tokens.shadows.button.secondary.hover,
        "button-secondary-active": tokens.shadows.button.secondary.active,
        
        "button-danger": tokens.shadows.button.danger.DEFAULT,
        "button-danger-hover": tokens.shadows.button.danger.hover,
        "button-danger-active": tokens.shadows.button.danger.active,
        "button-fancy": 'inset 0px -2.4px 11.2px 0px rgba(122, 196, 230, 0.46), inset 0px 2px 13px 0px rgba(192, 122, 230, 0.46)',
        
        // Input shadows
        input: tokens.shadows.input.DEFAULT,
        "input-focus": tokens.shadows.input.focus,
        "input-error": tokens.shadows.input.error,
        
        // Chip shadows
        chip: tokens.shadows.chip.DEFAULT,
        "chip-hover": tokens.shadows.chip.hover,
        "chip-fancy": tokens.shadows.chip.fancy,
        "chip-fancy-hover": tokens.shadows.chip['fancy-hover'],
        // Theme-specific chip shadows
        "chip-primary-selected": tokens.shadows.chip['primary-selected'],
        "chip-primary-fancy-selected": tokens.shadows.chip['primary-fancy-selected'],
        "chip-neutral-selected": tokens.shadows.chip['neutral-selected'],
        "chip-neutral-fancy-selected": tokens.shadows.chip['neutral-fancy-selected'],
        "chip-success-selected": tokens.shadows.chip['success-selected'],
        "chip-success-fancy-selected": tokens.shadows.chip['success-fancy-selected'],
        "chip-warning-selected": tokens.shadows.chip['warning-selected'],
        "chip-warning-fancy-selected": tokens.shadows.chip['warning-fancy-selected'],
        "chip-danger-selected": tokens.shadows.chip['danger-selected'],
        "chip-danger-fancy-selected": tokens.shadows.chip['danger-fancy-selected'],
        "chip-info-selected": tokens.shadows.chip['info-selected'],
        "chip-info-fancy-selected": tokens.shadows.chip['info-fancy-selected'],
      },
      
      zIndex: tokens.zIndex,
      
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "accordion-down": "accordion-down 1ms ease-out",
        "accordion-up": "accordion-up 1ms ease-out",
        fadeIn: "fadeIn 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite",
        ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      
      transitionDuration: tokens.animation.duration,
      
      transitionTimingFunction: tokens.animation.timing,
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: ".5",
          },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "none",
            animationTimingFunction: "cubic-bezier(0,0,0.2,1)",
          },
        },
        ping: {
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0",
          },
        },
      },
      
      // Add utility class support for missing tokens
      backgroundColor: ({ theme }) => ({
        ...theme('colors'),
        primary: theme('colors.primary.DEFAULT'),
        input: theme('colors.input'),
      }),
      
      borderColor: ({ theme }) => ({
        ...theme('colors'),
        primary: theme('colors.primary.DEFAULT'),
        input: theme('colors.input'),
      }),
      
      textColor: ({ theme }) => ({
        ...theme('colors'),
        destructive: theme('colors.destructive.DEFAULT'),
      }),
    },
  },
  plugins: [],
};

export default config;