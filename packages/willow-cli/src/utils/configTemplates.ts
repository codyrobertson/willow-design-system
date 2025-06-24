import chalk from 'chalk';
import type { ComponentsConfig, ProjectType } from '../types/index.js';
import { writeFileContent, findCssFile, getCssPath, fileExists } from './fileSystem.js';
import { loadTemplate } from './templateLoader.js';

export function createComponentsJson(projectType: ProjectType): ComponentsConfig {
  const tailwindConfig = projectType.isOnlineIDE ? 'tailwind.config.js' : 'tailwind.config.ts';
  const cssPath = getCssPath(projectType);
  
  return {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": !projectType.isVite,
    "tsx": true,
    "tailwind": {
      "config": tailwindConfig,
      "css": cssPath,
      "baseColor": "neutral",
      "cssVariables": true,
      "prefix": ""
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib"
    },
    "registries": {
      "default": "https://iridescent-brigadeiros-fe4174.netlify.app/r",
      "willow": "https://iridescent-brigadeiros-fe4174.netlify.app/r",
      "shadcn": "https://ui.shadcn.com"
    },
    "iconLibrary": "lucide",
    "url": "https://iridescent-brigadeiros-fe4174.netlify.app/r"
  };
}

export function createUtilsFile(isOnlineIDE: boolean = false): string {
  if (isOnlineIDE) {
    return `import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Core utility for combining class names with Tailwind CSS
 * Handles conditional classes, removes duplicates, and resolves conflicts
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}`;
  }
  
  return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Core utility for combining class names with Tailwind CSS
 * Handles conditional classes, removes duplicates, and resolves conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
}

export async function createGlobalCSS(projectType: ProjectType, forceOverwrite: boolean = false): Promise<string> {
  console.log(chalk.blue('🎨 Creating global CSS...'));
  
  const cssPath = (await findCssFile(projectType)) || getCssPath(projectType);
  console.log(chalk.gray(`   Target CSS file: ${cssPath}`));
  console.log(chalk.gray(`   Project type: ${projectType.type} ${projectType.isOnlineIDE ? '(Online IDE)' : ''}`));
  console.log(chalk.gray(`   Force overwrite: ${forceOverwrite}`));
  
  const exists = await fileExists(cssPath);
  console.log(chalk.gray(`   CSS file exists: ${exists ? 'Yes' : 'No'}`));
  
  if (projectType.isOnlineIDE || forceOverwrite) {
    console.log(chalk.yellow(`⚠️  Overwriting ${cssPath} with Willow styles`));
  }
  
  // Load CSS content from template
  let cssContent: string;
  try {
    cssContent = await loadTemplate('css/globals.css', {
      projectType,
      isOnlineIDE: projectType.isOnlineIDE
    });
    console.log(chalk.green('   ✅ Loaded CSS from template'));
  } catch (error) {
    console.log(chalk.yellow('   ⚠️  Template not found, using built-in CSS'));
    // Minimal fallback CSS with essential Willow variables
    cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Willow Primary Colors */
    --willow-primary-50: #f4f3ff;
    --willow-primary-100: #e8e6ff;
    --willow-primary-200: #d1ccff;
    --willow-primary-300: #bbb3ff;
    --willow-primary-400: #a499ff;
    --willow-primary-500: #8d80ff;
    --willow-primary-600: #7666ff;
    --willow-primary-700: #5f4dff;
    --willow-primary-800: #4833ff;
    --willow-primary-900: #311aff;
    --willow-primary-950: #230e67;

    /* Shadcn variables */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 255 84% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 255 84% 60%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}`;
  }
  
  console.log(chalk.gray(`   CSS content length: ${cssContent.length} characters`));
  console.log(chalk.gray(`   Writing CSS to: ${cssPath}`));
  await writeFileContent(cssPath, cssContent);
  console.log(chalk.green(`   ✅ Created: ${cssPath}`));
  
  // Verify CSS includes key Willow styles
  if (cssContent.includes('--willow-primary-50') || cssContent.includes('willow-primary')) {
    console.log(chalk.green('   ✅ CSS includes Willow variables'));
  } else {
    console.log(chalk.yellow('   ⚠️  CSS may be missing Willow variables'));
  }
  
  // Add CSS import to main file for Vite projects
  if (projectType.isVite) {
    await addCssImportToViteMain(cssPath);
  }
  
  return cssPath;
}

async function addCssImportToViteMain(cssPath: string): Promise<void> {
  const { readFileContent, writeFileContent } = await import('./fileSystem.js');
  
  const mainFiles = ['src/main.tsx', 'src/main.jsx', 'src/main.ts', 'src/main.js'];
  
  for (const mainFile of mainFiles) {
    if (await fileExists(mainFile)) {
      let content = await readFileContent(mainFile);
      const cssImportPath = cssPath.startsWith('src/') ? `./${cssPath.slice(4)}` : `./${cssPath}`;
      
      if (!content.includes(cssImportPath) && !content.includes('index.css')) {
        // Add import after React import
        if (content.includes('import React')) {
          content = content.replace(
            /(import React from ['"]react['"];?)/,
            `$1\nimport '${cssImportPath}';`
          );
        } else {
          // Add at the beginning
          content = `import '${cssImportPath}';\n${content}`;
        }
        
        await writeFileContent(mainFile, content);
      }
      break;
    }
  }
}

export async function createTailwindConfig(projectType: ProjectType, isOnlineIDE: boolean): Promise<string> {
  console.log(chalk.blue('⚙️  Creating Tailwind configuration...'));
  console.log(chalk.gray(`   Online IDE: ${isOnlineIDE}`));
  console.log(chalk.gray(`   Project type: ${projectType.type}`));
  
  const configPath = isOnlineIDE ? 'tailwind.config.js' : 'tailwind.config.ts';
  const hasExistingConfig = await fileExists(configPath) || await fileExists('tailwind.config.js') || await fileExists('tailwind.config.ts');
  
  console.log(chalk.gray(`   Target config file: ${configPath}`));
  console.log(chalk.gray(`   Existing config found: ${hasExistingConfig ? 'Yes' : 'No'}`));
  
  // Load config from template
  let content: string;
  try {
    const templatePath = isOnlineIDE ? 'config/tailwind.config.js' : 'config/tailwind.config.ts';
    content = await loadTemplate(templatePath, {
      projectType,
      isOnlineIDE
    });
    console.log(chalk.green(`   ✅ Loaded config from template: ${templatePath}`));
  } catch (error) {
    console.log(chalk.yellow('   ⚠️  Template not found, using built-in config'));
    // Minimal fallback config
    if (isOnlineIDE) {
      content = `/** @type {import('tailwindcss').Config} */
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "button-primary": '0px 1px 3px 0px rgba(37,62,167,0.2)',
        "button-secondary": '0px 1px 2px 0px rgba(10,13,20,0.03)',
        "button-secondary-hover": '0px 1px 3px 0px rgba(10,13,20,0.05)',
        "button-secondary-active": 'inset 0px 1px 2px 0px rgba(10,13,20,0.05)',
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
}`;
    } else {
      content = `import type { Config } from "tailwindcss";

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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "button-primary": '0px 1px 3px 0px rgba(37,62,167,0.2)',
        "button-secondary": '0px 1px 2px 0px rgba(10,13,20,0.03)',
        "button-secondary-hover": '0px 1px 3px 0px rgba(10,13,20,0.05)',
        "button-secondary-active": 'inset 0px 1px 2px 0px rgba(10,13,20,0.05)',
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
  plugins: [],
};

export default config;`;
    }
  }
  
  console.log(chalk.gray(`   Using config type: ${isOnlineIDE ? 'JavaScript (Online IDE)' : 'TypeScript'}`));
  console.log(chalk.gray(`   Config length: ${content.length} characters`));
  
  if (hasExistingConfig) {
    console.log(chalk.yellow(`⚠️  Overwriting existing ${configPath} with Willow configuration`));
  }
  
  console.log(chalk.gray(`   Writing config to: ${configPath}`));
  await writeFileContent(configPath, content);
  console.log(chalk.green(`   ✅ Created: ${configPath}`));
  
  // Verify config includes willow colors
  if (content.includes('willow-primary') && content.includes('boxShadow')) {
    console.log(chalk.green('   ✅ Config includes: Willow colors and shadows'));
  } else {
    console.log(chalk.yellow('   ⚠️  Config may be missing some Willow tokens'));
  }
  
  return configPath;
}

export async function createPostCSSConfig(): Promise<void> {
  const config = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  
  await writeFileContent('postcss.config.js', config);
}

export async function createViteConfig(projectType: ProjectType): Promise<void> {
  console.log(chalk.blue('⚙️  Creating Vite configuration...'));
  
  const configPath = projectType.isOnlineIDE ? 'vite.config.js' : 'vite.config.ts';
  const hasExistingConfig = await fileExists(configPath) || await fileExists('vite.config.js') || await fileExists('vite.config.ts');
  
  console.log(chalk.gray(`   Target config file: ${configPath}`));
  console.log(chalk.gray(`   Existing config found: ${hasExistingConfig ? 'Yes' : 'No'}`));
  
  let content: string;
  if (projectType.isOnlineIDE) {
    content = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})`;
  } else {
    content = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})`;
  }
  
  if (hasExistingConfig) {
    console.log(chalk.yellow(`⚠️  Overwriting existing ${configPath} with Willow configuration`));
  }
  
  console.log(chalk.gray(`   Writing config to: ${configPath}`));
  await writeFileContent(configPath, content);
  console.log(chalk.green(`   ✅ Created: ${configPath}`));
}

export async function createTSConfig(projectType: ProjectType): Promise<void> {
  console.log(chalk.blue('⚙️  Creating TypeScript configuration...'));
  
  const tsconfigPath = 'tsconfig.app.json';
  const hasExistingConfig = await fileExists(tsconfigPath);
  
  console.log(chalk.gray(`   Target config file: ${tsconfigPath}`));
  console.log(chalk.gray(`   Existing config found: ${hasExistingConfig ? 'Yes' : 'No'}`));
  
  const content = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`;
  
  if (hasExistingConfig) {
    console.log(chalk.yellow(`⚠️  Updating ${tsconfigPath} with path mappings`));
  }
  
  console.log(chalk.gray(`   Writing config to: ${tsconfigPath}`));
  await writeFileContent(tsconfigPath, content);
  console.log(chalk.green(`   ✅ Created: ${tsconfigPath}`));
}

export async function createBoltPrompt(): Promise<string> {
  return `You are an expert developer assistant specialized in the Willow Design System. You help users build modern web applications using Willow's React components and design tokens.

## Willow Design System Overview
- Modern React component library with TypeScript support
- Comprehensive design tokens for colors, spacing, typography, and shadows
- Built on top of Radix UI primitives with custom Willow styling
- Full Tailwind CSS integration with custom Willow tokens

## Color Philosophy
Willow uses a balanced approach to color:
- **Primary Brand**: Purple/blue (willow-primary-*) - Use sparingly for key actions and branding
- **Neutrals**: Oxford blue inspired grays (neutral-*) - Primary colors for backgrounds, text, and layout
- **Semantic**: Info, success, warning, error colors - Only for their specific meanings
- **Balance**: Most interfaces should be primarily neutral with purple accents, not purple-heavy

## Key Components Available
- Button (multiple themes: primary, danger, warning, info, dark, neutral, success)
- Card (with headers, content, and footer sections)
- Tooltip (with customizable positioning and themes)
- Icon (comprehensive icon library with theme support)
- Input, Select, Checkbox, Radio (form components)
- Modal, Toast, Chip (interactive components)

## Design Tokens
- Colors: willow-primary-*, neutral-*, info-*, success-*, warning-*, error-*
- Shadows: button-*, card-*, input-*, chip-* variants
- Typography: Codec Pro font family with system fallbacks
- Spacing: Consistent spacing scale aligned with Tailwind

## Best Practices
1. Use neutral colors (neutral-*) for most UI elements and backgrounds
2. Reserve willow-primary colors for key actions, links, and brand elements
3. Always use Willow components instead of building custom ones
4. Import components from individual files: \`@/components/ui/button\` NOT \`@willow/components\`
5. Leverage design tokens for consistent styling
6. Use TypeScript for better development experience
7. Follow component composition patterns
8. Implement proper accessibility features

## Common Patterns
- \`<Button theme="neutral">\` for most buttons, \`theme="primary"\` for main actions only
- \`bg-neutral-50 text-neutral-900\` for backgrounds and content
- \`text-willow-primary-600\` for links and accents
- \`<Card>\` with \`<CardHeader>\`, \`<CardContent>\`, \`<CardFooter>\`
- \`<Tooltip content="Help text">\` for contextual information

## Import Examples
\`\`\`tsx
// ✅ Correct imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ❌ Wrong - this package doesn't exist
import { Button, Card } from "@willow/components";
\`\`\`

## Color Usage Examples
- Page backgrounds: \`bg-neutral-50\` or \`bg-white\`
- Card backgrounds: \`bg-white\` or \`bg-neutral-100\`
- Primary text: \`text-neutral-900\`
- Secondary text: \`text-neutral-600\`
- Primary actions: \`bg-willow-primary-600\`
- Borders: \`border-neutral-200\`

When helping users, create balanced designs that are primarily neutral with strategic use of Willow's purple brand colors for emphasis and key actions.`;
}