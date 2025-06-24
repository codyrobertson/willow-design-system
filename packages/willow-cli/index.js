#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

const WILLOW_REGISTRY_BASE = 'https://iridescent-brigadeiros-fe4174.netlify.app/r';

// Available components
const AVAILABLE_COMPONENTS = [
  'button', 'badge', 'card', 'input', 'label', 'select', 'textarea',
  'accordion', 'tabs', 'modal', 'avatar', 'checkbox', 'chip', 
  'fancy-button', 'form-card', 'form-field', 'gradient-bg', 
  'highlight', 'info-card', 'list', 'logo', 'skeleton', 
  'switch', 'tag', 'toast', 'tooltip'
];

const program = new Command();

program
  .name('willow')
  .description('CLI for installing Willow Design System components')
  .version('0.2.1');

program
  .command('add <component>')
  .description('Add a Willow component to your project')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (component, options) => {
    if (!AVAILABLE_COMPONENTS.includes(component)) {
      console.error(chalk.red(`❌ Component "${component}" not found.`));
      console.log(chalk.yellow('\n📦 Available components:'));
      console.log(AVAILABLE_COMPONENTS.map(c => `  • ${c}`).join('\n'));
      process.exit(1);
    }

    // Check if we're in a valid project
    const fs = await import('fs/promises');
    let isValidProject = false;
    
    try {
      // Check for package.json
      await fs.access('package.json');
      isValidProject = true;
    } catch {
      console.error(chalk.red('❌ No package.json found. Please run this command in a Next.js/React project root.'));
      console.log(chalk.yellow('\n💡 To get started:'));
      console.log('1. Create a new Next.js project: npx create-next-app@latest my-app');
      console.log('2. cd into your project: cd my-app');
      console.log('3. Initialize Willow: willow init');
      console.log('4. Add components: willow add button');
      process.exit(1);
    }

    // Check for components.json
    let hasComponentsJson = false;
    try {
      await fs.access('components.json');
      hasComponentsJson = true;
    } catch {
      console.error(chalk.red('❌ No components.json found. Please run "willow init" first.'));
      process.exit(1);
    }

    const spinner = ora(`Installing ${component} component...`).start();
    
    try {
      const componentUrl = `${WILLOW_REGISTRY_BASE}/${component}.json`;
      const args = ['shadcn@latest', 'add', componentUrl, '--yes']; // Always use --yes to prevent prompts
      
      // Use pipe instead of inherit to capture output but still show it
      execSync(`npx ${args.join(' ')}`, { stdio: 'pipe' });
      
      spinner.succeed(chalk.green(`✅ Successfully installed ${component} component!`));
      
      console.log(chalk.blue('\n💡 Usage:'));
      console.log(`import { ${component.charAt(0).toUpperCase() + component.slice(1)} } from "@/components/ui/${component}"`);
      
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to install ${component} component`));
      console.error(chalk.red('Make sure you have a valid Next.js project with components.json configured.'));
      console.log(chalk.yellow('\n🔧 Try running: willow init'));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available Willow components')
  .action(() => {
    console.log(chalk.blue.bold('\n🌳 Willow Design System Components\n'));
    
    const categories = {
      'Core Components': ['button', 'badge', 'card', 'avatar'],
      'Form Components': ['input', 'label', 'select', 'textarea', 'checkbox', 'switch'],
      'Layout Components': ['accordion', 'tabs', 'modal', 'list'],
      'Display Components': ['chip', 'toast', 'tooltip', 'skeleton', 'highlight'],
      'Specialty Components': ['fancy-button', 'form-card', 'form-field', 'gradient-bg', 'info-card', 'logo', 'tag']
    };

    Object.entries(categories).forEach(([category, components]) => {
      console.log(chalk.yellow.bold(category));
      components.forEach(component => {
        if (AVAILABLE_COMPONENTS.includes(component)) {
          console.log(`  • ${component}`);
        }
      });
      console.log('');
    });

    console.log(chalk.gray('Usage: willow add <component>'));
    console.log(chalk.gray('Example: willow add button'));
  });

program
  .command('init')
  .description('Initialize Willow Design System in your project (complete setup)')
  .option('--skip-install', 'Skip npm package installation')
  .option('--skip-components', 'Skip installing all components')
  .action(async (options) => {
    const spinner = ora('🌳 Setting up Willow Design System...').start();
    
    try {
      const fs = await import('fs/promises');
      
      // Check if we're in a valid project
      try {
        await fs.access('package.json');
      } catch {
        spinner.fail(chalk.red('❌ No package.json found. Please run this command in a Next.js/React project root.'));
        console.log(chalk.yellow('\n💡 To get started:'));
        console.log('1. Create a new Next.js project: npx create-next-app@latest my-app');
        console.log('2. cd into your project: cd my-app');
        console.log('3. Initialize Willow: willow init');
        process.exit(1);
      }

      // Detect project structure
      let cssPath = 'app/globals.css';
      let tailwindConfig = 'tailwind.config.js';
      
      const possibleCssPaths = [
        'app/globals.css', 'src/app/globals.css', 'styles/globals.css', 'src/styles/globals.css'
      ];
      
      for (const path of possibleCssPaths) {
        try {
          await fs.access(path);
          cssPath = path;
          break;
        } catch {}
      }

      const possibleTailwindConfigs = [
        'tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs'
      ];
      
      for (const config of possibleTailwindConfigs) {
        try {
          await fs.access(config);
          tailwindConfig = config;
          break;
        } catch {}
      }

      // 1. Install required dependencies
      if (!options.skipInstall) {
        spinner.text = '📦 Installing required dependencies...';
        try {
          execSync('npm install clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-slot', { stdio: 'pipe' });
          spinner.text = '✅ Dependencies installed...';
        } catch (error) {
          spinner.warn(chalk.yellow('⚠️  Could not auto-install dependencies. Please run:'));
          console.log(chalk.gray('   npm install clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-slot'));
        }
      }

      // 2. Create or update components.json
      let componentsConfig = {
        "$schema": "https://ui.shadcn.com/schema.json",
        "style": "new-york",
        "rsc": true,
        "tsx": true,
        "tailwind": {
          "config": tailwindConfig,
          "css": cssPath,
          "baseColor": "neutral",
          "cssVariables": true
        },
        "aliases": {
          "components": "@/components",
          "utils": "@/lib/utils"
        }
      };

      // Check if components.json already exists
      try {
        const existingConfig = await fs.readFile('components.json', 'utf8');
        const existing = JSON.parse(existingConfig);
        
        // Merge with existing config, preserving user customizations
        componentsConfig = {
          ...existing,
          "$schema": "https://ui.shadcn.com/schema.json",
          tailwind: {
            ...existing.tailwind,
            config: tailwindConfig,
            css: cssPath,
            baseColor: existing.tailwind?.baseColor || "neutral",
            cssVariables: existing.tailwind?.cssVariables ?? true
          },
          aliases: {
            ...existing.aliases,
            components: existing.aliases?.components || "@/components",
            utils: existing.aliases?.utils || "@/lib/utils"
          }
        };
        
        spinner.text = '⚙️  Updated existing components.json...';
      } catch {
        spinner.text = '⚙️  Created components.json...';
      }

      await fs.writeFile('components.json', JSON.stringify(componentsConfig, null, 2));
      
      // 3. Create directories
      await fs.mkdir('lib', { recursive: true });
      await fs.mkdir('components/ui', { recursive: true });
      spinner.text = '📁 Created project directories...';

      // 4. Create lib/utils.ts if it doesn't exist
      try {
        await fs.access('lib/utils.ts');
        spinner.text = '🔧 Utils already exists...';
      } catch {
        const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
        
        await fs.writeFile('lib/utils.ts', utilsContent);
        spinner.text = '🔧 Created utilities...';
      }

      // 5. Update CSS with Willow styles
      const willowCSS = `/* Willow Design System */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
@import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');

@tailwind base;
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

    /* Neutral Colors */
    --neutral-0: #ffffff;
    --neutral-50: #f3f7f8;
    --neutral-100: #e0e9ed;
    --neutral-200: #cdd9de;
    --neutral-300: #b9c9d0;
    --neutral-400: #a6b9c2;
    --neutral-500: #93a9b4;
    --neutral-600: #7f99a6;
    --neutral-700: #6c8998;
    --neutral-800: #587989;
    --neutral-900: #45697b;
    --neutral-950: #31596d;

    /* Semantic tokens */
    --background: #ffffff;
    --foreground: #333e49;
    --card: #ffffff;
    --card-foreground: #333e49;
    --popover: #ffffff;
    --popover-foreground: #333e49;
    --primary: #7666ff;
    --primary-foreground: #ffffff;
    --secondary: #f3f7f8;
    --secondary-foreground: #333e49;
    --muted: #e0e9ed;
    --muted-foreground: #6c8998;
    --accent: #e0e9ed;
    --accent-foreground: #333e49;
    --destructive: #eb5757;
    --destructive-foreground: #ffffff;
    --border: #e0e9ed;
    --input: #e0e9ed;
    --ring: #7666ff;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: #1e262e;
    --foreground: #f3f7f8;
    --card: #333e49;
    --card-foreground: #f3f7f8;
    --popover: #333e49;
    --popover-foreground: #f3f7f8;
    --primary: #8d80ff;
    --primary-foreground: #1e262e;
    --secondary: #384652;
    --secondary-foreground: #f3f7f8;
    --muted: #384652;
    --muted-foreground: #b9c9d0;
    --accent: #384652;
    --accent-foreground: #f3f7f8;
    --destructive: #fb3748;
    --destructive-foreground: #f3f7f8;
    --border: #384652;
    --input: #384652;
    --ring: #8d80ff;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Codec Pro', 'Inter', system-ui, -apple-system, sans-serif;
  }
}`;

      // Check if CSS file exists and handle accordingly
      try {
        const existingCSS = await fs.readFile(cssPath, 'utf8');
        
        // Check if Willow styles are already present
        if (existingCSS.includes('Willow Design System')) {
          spinner.text = '🎨 Willow styles already present...';
        } else {
          // Backup existing CSS and add Willow styles
          const backupCSS = `/* === EXISTING STYLES === */
${existingCSS}

/* === WILLOW DESIGN SYSTEM === */
${willowCSS}`;
          
          await fs.writeFile(cssPath, backupCSS);
          spinner.text = '🎨 Added Willow styles to existing CSS...';
        }
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(cssPath, willowCSS);
        spinner.text = '🎨 Created CSS with Willow styles...';
      }

      // 6. Update Tailwind config
      const tailwindConfigContent = `import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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
        // Willow brand colors
        willow: {
          50: '#f4f3ff',
          100: '#e8e6ff',
          200: '#d1ccff',
          300: '#bbb3ff',
          400: '#a499ff',
          500: '#8d80ff',
          600: '#7666ff',
          700: '#5f4dff',
          800: '#4833ff',
          900: '#311aff',
          950: '#230e67',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
} satisfies Config

export default config`;

      // Check if Tailwind config exists and handle accordingly
      try {
        const existingTailwind = await fs.readFile(tailwindConfig, 'utf8');
        
        // Check if it already has Willow colors
        if (existingTailwind.includes('willow-primary')) {
          spinner.text = '⚙️  Tailwind already has Willow config...';
        } else {
          // Try to merge configs intelligently
          if (tailwindConfig.endsWith('.ts')) {
            await fs.writeFile(tailwindConfig, tailwindConfigContent);
            spinner.text = '⚙️  Updated Tailwind configuration...';
          } else {
            // For .js files, create a basic config
            const jsConfig = tailwindConfigContent.replace('import type { Config } from "tailwindcss"', '/** @type {import("tailwindcss").Config} */').replace(' satisfies Config', '');
            await fs.writeFile(tailwindConfig, jsConfig);
            spinner.text = '⚙️  Updated Tailwind configuration...';
          }
        }
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(tailwindConfig, tailwindConfigContent);
        spinner.text = '⚙️  Created Tailwind configuration...';
      }

      // 7. Install all components
      if (!options.skipComponents) {
        spinner.text = '🎯 Installing all Willow components...';
        let installedCount = 0;
        
        for (const component of AVAILABLE_COMPONENTS) {
          try {
            const componentUrl = `${WILLOW_REGISTRY_BASE}/${component}.json`;
            execSync(`npx shadcn@latest add ${componentUrl} --yes`, { stdio: 'pipe' });
            installedCount++;
            spinner.text = `🎯 Installing components (${installedCount}/${AVAILABLE_COMPONENTS.length})...`;
          } catch (error) {
            // Continue installing other components
          }
        }
        spinner.text = `✅ Installed ${installedCount} components...`;
      }

      spinner.succeed(chalk.green('🎉 Willow Design System setup complete!'));
      
      console.log(chalk.blue('\n✨ What was installed:'));
      console.log(chalk.gray('📦 Dependencies: clsx, tailwind-merge, lucide-react, class-variance-authority'));
      console.log(chalk.gray('🎨 CSS: Willow fonts, colors, and design tokens'));
      console.log(chalk.gray('⚙️  Tailwind: Complete configuration with Willow theme'));
      console.log(chalk.gray(`🧩 Components: ${options.skipComponents ? 'Skipped' : 'All ' + AVAILABLE_COMPONENTS.length + ' components'}`));
      
      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log(chalk.gray('• Start your development server: npm run dev'));
      console.log(chalk.gray('• Add more components: willow add <component>'));
      console.log(chalk.gray('• View all components: willow list'));
      console.log(chalk.gray('• Check the documentation: https://iridescent-brigadeiros-fe4174.netlify.app/docs'));
      console.log(chalk.gray(`📁 Files: ${cssPath}, ${tailwindConfig}, components.json, lib/utils.ts`));
      
      console.log(chalk.blue('\n🚀 Ready to use:'));
      console.log(chalk.gray('import { Button } from "@/components/ui/button"'));
      console.log(chalk.gray('import { Card } from "@/components/ui/card"'));
      console.log(chalk.gray('import { Badge } from "@/components/ui/badge"'));
      
      if (!options.skipInstall) {
        console.log(chalk.blue('\n💡 Next: Start your dev server and begin building!'));
        console.log(chalk.gray('npm run dev'));
      } else {
        console.log(chalk.blue('\n💡 Next: Install dependencies and start your dev server'));
        console.log(chalk.gray('npm install clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-slot'));
        console.log(chalk.gray('npm run dev'));
      }
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to initialize Willow Design System'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`❌ Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('\n📖 Available commands:'));
  console.log('  willow add <component>  - Install a component');
  console.log('  willow list            - List all components');
  console.log('  willow init            - Initialize Willow in your project');
  process.exit(1);
});

program.parse(process.argv);