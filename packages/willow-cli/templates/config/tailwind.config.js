/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // Brand colors - Willow Primary
        "willow-primary": {
          50: '#F4F3FF',
          100: '#E8E6FF',
          200: '#D1CCFF',
          300: '#BBB3FF',
          400: '#A499FF',
          500: '#8D80FF',
          600: '#7666FF',
          700: '#5F4DFF',
          800: '#4833FF',
          900: '#311AFF',
          950: '#230E67',
        },
        
        // Neutral colors
        neutral: {
          0: '#FFFFFF',
          50: '#F3F7F8',
          100: '#E0E9ED',
          200: '#CDD9DE',
          300: '#B9C9D0',
          400: '#A6B9C2',
          500: '#93A9B4',
          600: '#7F99A6',
          700: '#6C8998',
          800: '#587989',
          900: '#45697B',
          950: '#31596D',
        },
        
        // Info Blue
        info: {
          50: '#F1F8FE',
          100: '#E1EFFD',
          200: '#BDDFFA',
          300: '#62B6F4',
          400: '#41A8EF',
          500: '#188DDF',
          600: '#0B6FBE',
          700: '#0A589A',
          800: '#0D4B7F',
          900: '#10406A',
          950: '#0B2846',
        },
        
        // Success Green
        success: {
          50: '#E0FAEC',
          100: '#C8F5DD',
          200: '#91EBBA',
          300: '#5AE198',
          400: '#23D775',
          500: '#1FC16B',
          600: '#199B55',
          700: '#147540',
          800: '#0E4F2A',
          900: '#082A15',
        },
        
        // Warning Orange
        warning: {
          50: '#FFF1EB',
          100: '#FFE3D6',
          200: '#FFC7AD',
          300: '#FFAB85',
          400: '#FF8F5C',
          500: '#FF8447',
          600: '#E66A2E',
          700: '#B35124',
          800: '#803919',
          900: '#4D210F',
        },
        
        // Error/Danger Red
        error: {
          50: '#FFEBEC',
          100: '#FFD6D9',
          200: '#FFADB3',
          300: '#FF858C',
          400: '#FF5C66',
          500: '#FB3748',
          600: '#E01E2F',
          700: '#AB1723',
          800: '#751018',
          900: '#400A0C',
        },
        
        // State colors
        state: {
          error: {
            base: '#fb3748',
            lighter: '#ffebec',
          },
          success: {
            base: '#1fc16b',
            lighter: '#e0faec',
          },
          warning: {
            base: '#ff8447',
            lighter: '#fff1eb',
          },
        },
        
        // Oxford Blue (secondary neutral)
        "oxford-blue": {
          50: '#F3F7F8',
          100: '#E0E9ED',
          400: '#6C90A4',
          500: '#50748A',
          600: '#456075',
          800: '#384652',
          900: '#333E49',
          950: '#1E262E',
        },
        
        // CSS Variable based colors for light/dark mode
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      boxShadow: {
        // Base shadows
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: 'none',
        
        // Card shadows
        card: '0px 4px 20px 0px rgba(0,0,0,0.12), 0px 1px 2px 0px rgba(10,13,20,0.03)',
        "card-hover": '0px 4px 20px 0px rgba(0,0,0,0.12), 0px 1px 2px 0px rgba(10,13,20,0.03)',
        
        // Button shadows
        "button-primary": '0px 1px 3px 0px rgba(37,62,167,0.2), inset 0px -2.4px 7.5px 0px rgba(122,196,230,0.46)',
        "button-primary-hover": '0px 2px 5px 0px rgba(37,62,167,0.3), inset 0px -2.4px 7.5px 0px rgba(122,196,230,0.5)',
        "button-primary-active": 'inset 0px 1px 3px 0px rgba(37,62,167,0.4)',
        "button-secondary": '0px 1px 2px 0px rgba(10,13,20,0.03)',
        "button-secondary-hover": '0px 1px 3px 0px rgba(10,13,20,0.05)',
        "button-secondary-active": 'inset 0px 1px 2px 0px rgba(10,13,20,0.05)',
        
        // Input shadows
        input: '0px 1px 2px 0px rgba(10,13,20,0.03)',
        "input-focus": '0px 0px 0px 3px rgba(35,14,103,0.1)',
        "input-error": '0px 0px 0px 3px rgba(251,55,72,0.1)',
        
        // Chip shadows
        chip: '0px 0px 0px 1px #E0E9ED, 0px 1px 3px 0px rgba(143,143,143,0.2)',
        "chip-hover": '0px 0px 0px 1px #CDD9DE, 0px 1px 3px 0px rgba(143,143,143,0.3)',
        "chip-fancy": '0px 1px 3px 0px rgba(143,143,143,0.2), 0px 0px 0px 1px #E0E9ED, inset 0px -2.4px 0px 0px rgba(61,61,61,0.04)',
        "chip-fancy-hover": '0px 1px 3px 0px rgba(143,143,143,0.3), 0px 0px 0px 1px #CDD9DE, inset 0px -2.4px 0px 0px rgba(61,61,61,0.06)',
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}