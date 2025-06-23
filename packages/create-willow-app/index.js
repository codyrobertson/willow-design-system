#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WILLOW_REGISTRY_URL = 'https://willow-prod.vercel.app/r';
const FALLBACK_REGISTRY_URL = 'https://willow-prod.vercel.app/api/registry/ui';

async function init() {
  console.log(chalk.blue.bold('\n🌳 Welcome to Willow Design System\n'));

  // Get project details
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: 'my-willow-app',
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Which framework are you using?',
      choices: ['Next.js', 'Vite', 'Remix'],
      default: 'Next.js',
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Would you like to use TypeScript?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'installExamples',
      message: 'Would you like to install example components?',
      default: true,
    }
  ]);

  const spinner = ora('Setting up your project...').start();

  try {
    // Create project directory
    await fs.mkdir(answers.projectName, { recursive: true });
    process.chdir(answers.projectName);

    // Initialize project based on framework
    spinner.text = 'Creating project structure...';
    
    if (answers.framework === 'Next.js') {
      // Create package.json first
      const packageJson = {
        name: answers.projectName,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        }
      };
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
      
      // Create Next.js project structure
      await fs.mkdir('app', { recursive: true });
      await fs.mkdir('public', { recursive: true });
      await fs.mkdir('components', { recursive: true });
      
      // Create app layout
      const layoutContent = `import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;
      await fs.writeFile('app/layout.tsx', layoutContent);
      
      // Create app page
      const pageContent = `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Willow Design System</h1>
    </main>
  )
}`;
      await fs.writeFile('app/page.tsx', pageContent);
      
      // Create next.config.js
      const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`;
      await fs.writeFile('next.config.js', nextConfig);
      
      // Create tsconfig.json
      const tsConfig = {
        "compilerOptions": {
          "lib": ["dom", "dom.iterable", "esnext"],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": true,
          "noEmit": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "bundler",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "incremental": true,
          "plugins": [
            {
              "name": "next"
            }
          ],
          "paths": {
            "@/*": ["./*"]
          }
        },
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        "exclude": ["node_modules"]
      };
      await fs.writeFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));
      
      // Create globals.css
      await fs.writeFile('app/globals.css', '/* Temporary file - will be replaced */');
      
      // Create postcss.config.js
      const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
      await fs.writeFile('postcss.config.js', postcssConfig);
      
      // Create .eslintrc.json
      const eslintConfig = {
        extends: "next/core-web-vitals"
      };
      await fs.writeFile('.eslintrc.json', JSON.stringify(eslintConfig, null, 2));
      
      // Create .gitignore
      const gitignore = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`;
      await fs.writeFile('.gitignore', gitignore);
      
    } else if (answers.framework === 'Vite') {
      execSync(`npm create vite@latest . -- --template ${answers.typescript ? 'react-ts' : 'react'}`, { 
        stdio: 'pipe' 
      });
    }

    // Install dependencies based on framework
    if (answers.framework === 'Next.js') {
      spinner.text = 'Installing Next.js dependencies...';
      // Install core Next.js dependencies
      execSync('npm install next@latest react@latest react-dom@latest', { stdio: 'pipe' });
      execSync('npm install -D typescript @types/react @types/react-dom @types/node eslint eslint-config-next tailwindcss postcss autoprefixer', { stdio: 'pipe' });
    } else if (answers.framework !== 'Next.js') {
      spinner.text = 'Installing Tailwind CSS...';
      execSync('npm install -D tailwindcss postcss autoprefixer', { stdio: 'pipe' });
      execSync('npx tailwindcss init -p', { stdio: 'pipe' });
    }

    // Configure Willow Design System
    spinner.text = 'Configuring Willow Design System...';
    
    // Create components.json
    const componentsConfig = {
      "$schema": "https://ui.shadcn.com/schema.json",
      "style": "new-york",
      "rsc": answers.framework === 'Next.js',
      "tsx": answers.typescript,
      "tailwind": {
        "config": "tailwind.config.js",
        "css": answers.framework === 'Next.js' ? "app/globals.css" : "src/index.css",
        "baseColor": "neutral",
        "cssVariables": true,
        "prefix": ""
      },
      "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils",
        "ui": "@/components/ui",
        "lib": "@/lib",
        "hooks": "@/hooks"
      },
      "registries": {
        "willow": {
          "url": WILLOW_REGISTRY_URL
        }
      }
    };

    await fs.writeFile('components.json', JSON.stringify(componentsConfig, null, 2));

    // Update tailwind.config.js with Willow theme
    spinner.text = 'Configuring Tailwind with Willow theme...';
    const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Willow Primary Colors
        'willow-primary': {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbfe',
          300: '#b4c6fc',
          400: '#8da2fb',
          500: '#6b7ff8',
          600: '#4c5ff6',
          700: '#254df2',
          800: '#2040d8',
          900: '#1939bc',
          950: '#0f2481',
        },
        // Success Colors
        'success': {
          DEFAULT: '#1fc16b',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#1fc16b',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning Colors
        'warning': {
          DEFAULT: '#ff8447',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff8447',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Destructive Colors
        'destructive': {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Info Colors
        'info': {
          DEFAULT: '#7666ff',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7666ff',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // State Colors
        'state-success-lighter': '#e8fbef',
        'state-warning-lighter': '#fffaeb',
      },
      boxShadow: {
        'button-primary': '0px 4px 4px 0px rgba(35, 40, 102, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        'button-primary-hover': '0px 6px 8px 0px rgba(35, 40, 102, 0.1), 0px 2px 4px 0px rgba(0, 0, 0, 0.12)',
        'button-primary-active': '0px 2px 3px 0px rgba(35, 40, 102, 0.05), 0px 1px 2px 0px rgba(0, 0, 0, 0.08)',
        'button-secondary': '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'button-secondary-hover': '0px 10px 15px -3px rgba(0, 0, 0, 0.15), 0px 4px 6px -2px rgba(0, 0, 0, 0.08)',
        'button-secondary-active': '0px 2px 4px -1px rgba(0, 0, 0, 0.08), 0px 1px 2px -1px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;`;

    await fs.writeFile('tailwind.config.js', tailwindConfig);

    // Install required Willow dependencies
    spinner.text = 'Installing Willow dependencies...';
    const willowDeps = [
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'lucide-react',
      '@radix-ui/react-slot',
      'tailwindcss-animate'
    ];
    
    try {
      execSync(`npm install ${willowDeps.join(' ')} --save-exact`, { 
        stdio: 'pipe' 
      });
    } catch (error) {
      // If that fails, install one by one
      for (const dep of willowDeps) {
        try {
          execSync(`npm install ${dep} --save-exact`, { stdio: 'pipe' });
        } catch (e) {
          console.warn(chalk.yellow(`Warning: Could not install ${dep}, you may need to install it manually`));
        }
      }
    }

    // Install shadcn CLI
    execSync('npm install -D shadcn@latest', { stdio: 'pipe' });

    // Create utils
    spinner.text = 'Setting up utilities...';
    await fs.mkdir('lib', { recursive: true });
    
    const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

    await fs.writeFile('lib/utils.ts', utilsContent);
    
    // For TypeScript projects, create utils.js as well for compatibility
    if (answers.typescript) {
      const utilsJs = `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}`;
      await fs.writeFile('lib/utils.js', utilsJs);
    }

    // Install example components if requested
    if (answers.installExamples) {
      spinner.text = 'Installing Willow components...';
      
      // First, let's download the components directly from the registry
      const components = ['button', 'card', 'badge', 'input', 'select'];
      await fs.mkdir('components/ui', { recursive: true });
      
      for (const component of components) {
        try {
          // Try primary registry first
          let response = await fetch(`${WILLOW_REGISTRY_URL}/${component}.json`);
          let componentData;
          
          if (!response.ok) {
            // Try fallback API
            response = await fetch(`${FALLBACK_REGISTRY_URL}/${component}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${component} from both registry URLs`);
            }
          }
          
          componentData = await response.json();
          
          // Write component files
          if (componentData.files) {
            for (const file of componentData.files) {
              let filePath = file.path || file.name;
              const content = file.content;
              
              // Transform registry path to project path
              if (filePath.startsWith('registry/components/')) {
                filePath = filePath.replace('registry/components/', '');
                // Also fix the casing (Button.tsx -> button.tsx)
                const fileName = path.basename(filePath);
                const dir = path.dirname(filePath);
                filePath = path.join(dir, fileName.toLowerCase());
              }
              
              // Ensure directory exists
              const dir = path.dirname(filePath);
              await fs.mkdir(dir, { recursive: true });
              
              // Write the component file
              await fs.writeFile(filePath, content);
              spinner.text = `Installed ${component} component`;
            }
          }
          
          // Also check for dependencies and add them to a list
          if (componentData.dependencies) {
            // We'll install these after all components are downloaded
          }
        } catch (error) {
          console.warn(chalk.yellow(`\nWarning: Could not install ${component}: ${error.message}`));
        }
      }
    }

    // Add Willow fonts to CSS
    spinner.text = 'Adding Willow fonts...';
    const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Willow Fonts */
@font-face {
  font-family: 'Codec Pro';
  src: url('https://willow-prod.vercel.app/cdn/fonts/Codec-Pro-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://willow-prod.vercel.app/cdn/fonts/Codec-Pro-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: 'Codec Pro';
  src: url('https://willow-prod.vercel.app/cdn/fonts/Codec-Pro-Light.otf') format('opentype');
  font-weight: 300;
  font-style: normal;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 225 73% 57%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 225 73% 57%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 225 73% 57%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 225 73% 57%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Codec Pro', system-ui, -apple-system, sans-serif;
  }
}`;

    const cssPath = answers.framework === 'Next.js' ? 'app/globals.css' : 'src/index.css';
    await fs.writeFile(cssPath, cssContent);

    spinner.succeed(chalk.green('✅ Willow Design System initialized successfully!'));

    console.log(`
${chalk.blue.bold('🎉 Your Willow project is ready!')}

${chalk.yellow('Next steps:')}
  ${chalk.gray('cd')} ${answers.projectName}
  ${chalk.gray('npm run dev')}

${chalk.yellow('Install more components:')}
  ${chalk.gray('npx shadcn@latest add willow/accordion')}
  ${chalk.gray('npx shadcn@latest add willow/tabs')}
  ${chalk.gray('npx shadcn@latest add willow/modal')}

${chalk.yellow('Documentation:')}
  ${chalk.gray('https://willow-prod.vercel.app/docs')}
`);

  } catch (error) {
    spinner.fail('Error setting up project');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

init().catch(console.error);