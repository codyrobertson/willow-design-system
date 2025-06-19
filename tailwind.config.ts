import type { Config } from "tailwindcss";

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
        // Willow Core Brand Colors
        "willow-primary": {
          50: "#F4F3FF",
          100: "#E8E6FF",
          200: "#D1CCFF",
          300: "#BBB3FF",
          400: "#A499FF",
          500: "#8D80FF",
          600: "#7666FF",
          700: "#5F4DFF",
          800: "#4833FF",
          900: "#311AFF",
          950: "#230E67",
        },
        // Neutrals
        neutral: {
          0: "#FFFFFF",
          50: "#F3F7F8",
          100: "#E0E9ED",
          200: "#CDD9DE",
          300: "#B9C9D0",
          400: "#A6B9C2",
          500: "#93A9B4",
          600: "#7F99A6",
          700: "#6C8998",
          800: "#587989",
          900: "#45697B",
          950: "#31596D",
        },
        // Oxford Blue (secondary neutral)
        "oxford-blue": {
          50: "#F3F7F8",
          100: "#E0E9ED",
          400: "#6C90A4",
          500: "#50748A",
          600: "#456075",
          800: "#384652",
          900: "#333E49",
          950: "#1E262E",
        },
        // System colors
        danger: "#EB5757",
        success: "#1FC16B",
        warning: "#FF8447",
        // State colors
        state: {
          error: {
            base: "#FB3748",
            lighter: "#FFEBEC",
          },
          success: {
            base: "#1FC16B",
            lighter: "#E0FAEC",
          },
          warning: {
            base: "#FF8447",
            lighter: "#FFF1EB",
          },
        },
        // Background
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Card
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Popover
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Primary (using willow brand color)
        primary: {
          DEFAULT: "#230E67",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Secondary
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Muted
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // Accent
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Destructive
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // Border
        border: "hsl(var(--border))",
        // Input
        input: "hsl(var(--input))",
        // Ring
        ring: "hsl(var(--ring))",
        // Chart
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      boxShadow: {
        card: "0px 4px 20px 0px rgba(0,0,0,0.12), 0px 1px 2px 0px rgba(10,13,20,0.03)",
      },
      fontFamily: {
        sans: ["Codec Pro", "Inter", "system-ui", "sans-serif"],
        "codec-pro": ["Codec Pro", "Inter", "system-ui", "sans-serif"],
        "font-awesome": ["Font Awesome 6 Pro", "Font Awesome 6 Free"],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        heavy: '900',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
}
export default config