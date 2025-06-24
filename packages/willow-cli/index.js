#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


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
  .version('0.3.0');

program
  .command('add <component>')
  .description('Add a Willow component to your project (or use "all" to install all components)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-a, --all', 'Install all available components')
  .action(async (component, options) => {
    // Handle --all flag or 'all' as component name
    if (options.all || component === 'all') {
      console.log(chalk.blue('📦 Installing all Willow components...'));
      const spinner = ora('Preparing to install all components...').start();
      
      // Check for valid project
      const fs = await import('fs/promises');
      try {
        await fs.access('package.json');
        await fs.access('components.json');
      } catch {
        spinner.fail(chalk.red('❌ Please run "willow init" first to set up your project.'));
        process.exit(1);
      }
      
      let successCount = 0;
      let failedComponents = [];
      
      // Detect project type
      let isViteProject = false;
      try {
        const packageJson = await fs.readFile('package.json', 'utf8');
        const pkg = JSON.parse(packageJson);
        isViteProject = pkg.devDependencies?.vite || pkg.dependencies?.vite;
      } catch {}
      
      const componentsDir = isViteProject ? 'src/components/ui' : 'components/ui';
      
      // Check for CSS file and create if missing
      let cssPath = isViteProject ? 'src/index.css' : 'app/globals.css';
      let hasCssFile = false;
      
      try {
        await fs.access(cssPath);
        hasCssFile = true;
      } catch {
        // Try alternative paths
        const altPaths = isViteProject 
          ? ['src/App.css', 'src/main.css', 'src/styles/globals.css']
          : ['src/app/globals.css', 'styles/globals.css', 'src/styles/globals.css'];
        
        for (const path of altPaths) {
          try {
            await fs.access(path);
            cssPath = path;
            hasCssFile = true;
            break;
          } catch {}
        }
      }
      
      if (!hasCssFile) {
        spinner.text = 'Creating CSS file...';
        const cssDir = cssPath.split('/').slice(0, -1).join('/');
        if (cssDir) {
          await fs.mkdir(cssDir, { recursive: true });
        }
        
        const willowCSS = `/* Willow Design System - Global Styles */\n@import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    /* Willow Primary Colors - Purple/Blue Theme */\n    --willow-primary-50: #f4f3ff;\n    --willow-primary-100: #e8e6ff;\n    --willow-primary-200: #d1ccff;\n    --willow-primary-300: #bbb3ff;\n    --willow-primary-400: #a499ff;\n    --willow-primary-500: #8d80ff;\n    --willow-primary-600: #7666ff;\n    --willow-primary-700: #5f4dff;\n    --willow-primary-800: #4833ff;\n    --willow-primary-900: #311aff;\n    --willow-primary-950: #230e67;\n    \n    /* Light Mode Variables */\n    --background: 0 0% 100%;\n    --foreground: 222.2 84% 4.9%;\n    --card: 0 0% 100%;\n    --card-foreground: 222.2 84% 4.9%;\n    --popover: 0 0% 100%;\n    --popover-foreground: 222.2 84% 4.9%;\n    --primary: 255 84% 60%;\n    --primary-foreground: 0 0% 100%;\n    --secondary: 210 40% 96.1%;\n    --secondary-foreground: 222.2 47.4% 11.2%;\n    --muted: 210 40% 96.1%;\n    --muted-foreground: 215.4 16.3% 46.9%;\n    --accent: 210 40% 96.1%;\n    --accent-foreground: 222.2 47.4% 11.2%;\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 214.3 31.8% 91.4%;\n    --input: 214.3 31.8% 91.4%;\n    --ring: 255 84% 60%;\n    --radius: 0.5rem;\n  }\n\n  .dark {\n    --background: 222.2 84% 4.9%;\n    --foreground: 210 40% 98%;\n    --card: 222.2 84% 4.9%;\n    --card-foreground: 210 40% 98%;\n    --popover: 222.2 84% 4.9%;\n    --popover-foreground: 210 40% 98%;\n    --primary: 255 72% 58%;\n    --primary-foreground: 222.2 47.4% 11.2%;\n    --secondary: 217.2 32.6% 17.5%;\n    --secondary-foreground: 210 40% 98%;\n    --muted: 217.2 32.6% 17.5%;\n    --muted-foreground: 215 20.2% 65.1%;\n    --accent: 217.2 32.6% 17.5%;\n    --accent-foreground: 210 40% 98%;\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 217.2 32.6% 17.5%;\n    --input: 217.2 32.6% 17.5%;\n    --ring: 255 72% 58%;\n  }\n}\n\n@layer base {\n  * {\n    @apply border-border;\n  }\n  body {\n    @apply bg-background text-foreground;\n    font-family: 'Codec Pro', 'Inter', system-ui, -apple-system, sans-serif;\n  }\n}`;
        
        await fs.writeFile(cssPath, willowCSS);
        spinner.succeed(`✅ Created CSS file: ${cssPath}`);
        spinner.start('Installing components...');
      }
      
      for (const comp of AVAILABLE_COMPONENTS) {
        spinner.text = `Installing ${comp} (${successCount + 1}/${AVAILABLE_COMPONENTS.length})...`;
        
        try {
          const componentUrl = `${WILLOW_REGISTRY_BASE}/${comp}.json`;
          const pathFlag = isViteProject ? '--path src/components/ui' : '--path components/ui';
          const installCommand = `npx --yes shadcn add ${componentUrl} --overwrite ${pathFlag}`;
          
          execSync(installCommand, {
            stdio: 'ignore',
            timeout: 30000,
            env: {
              ...process.env,
              CI: '1',
              FORCE_COLOR: '0'
            }
          });
          
          // Verify installation
          let installed = false;
          try {
            await fs.access(`${componentsDir}/${comp}.tsx`);
            installed = true;
          } catch {
            try {
              await fs.access(`${componentsDir}/${comp}.jsx`);
              installed = true;
            } catch {}
          }
          
          if (installed) {
            successCount++;
          } else {
            throw new Error('Component not found after installation');
          }
        } catch (error) {
          failedComponents.push(comp);
        }
      }
      
      spinner.stop();
      
      if (successCount === AVAILABLE_COMPONENTS.length) {
        console.log(chalk.green(`✅ Successfully installed all ${successCount} components!`));
      } else {
        console.log(chalk.yellow(`⚠️  Installed ${successCount}/${AVAILABLE_COMPONENTS.length} components.`));
        if (failedComponents.length > 0) {
          console.log(chalk.red(`Failed: ${failedComponents.join(', ')}`));
          console.log(chalk.gray('\nTo retry failed components individually:'));
          failedComponents.forEach(comp => {
            console.log(chalk.gray(`  willow add ${comp}`));
          });
        }
      }
      
      console.log(chalk.blue('\n💡 Import components like:'));
      console.log(chalk.gray('import { Button } from "@/components/ui/button"'));
      console.log(chalk.gray('import { Card } from "@/components/ui/card"'));
      
      process.exit(successCount === AVAILABLE_COMPONENTS.length ? 0 : 1);
    }
    if (!AVAILABLE_COMPONENTS.includes(component)) {
      console.error(chalk.red(`❌ Component "${component}" not found.`));
      console.log(chalk.yellow('\n📦 Available components:'));
      console.log(AVAILABLE_COMPONENTS.map(c => `  • ${c}`).join('\n'));
      process.exit(1);
    }

    // Check if we're in a valid project
    const fs = await import('fs/promises');
    let isValidProject = false;
    let isViteProject = false;
    
    try {
      // Check for package.json
      await fs.access('package.json');
      isValidProject = true;
      
      // Check project type
      const packageJson = await fs.readFile('package.json', 'utf8');
      const pkg = JSON.parse(packageJson);
      isViteProject = pkg.devDependencies?.vite || pkg.dependencies?.vite;
    } catch {
      console.error(chalk.red('❌ No package.json found. Please run this command in a Next.js/React/Vite project root.'));
      console.log(chalk.yellow('\n💡 To get started:'));
      console.log('1. Create a new project:');
      console.log('   • Next.js: npx create-next-app@latest my-app');
      console.log('   • Vite: npm create vite@latest my-app -- --template react');
      console.log('2. cd into your project: cd my-app');
      console.log('3. Initialize Willow: willow init');
      console.log('4. Add components: willow add button');
      process.exit(1);
    }

    // Check for components.json and other required files
    let hasComponentsJson = false;
    let hasCssFile = false;
    let cssPath = isViteProject ? 'src/index.css' : 'app/globals.css';
    
    try {
      await fs.access('components.json');
      hasComponentsJson = true;
    } catch {
      console.error(chalk.red('❌ No components.json found. Please run "willow init" first.'));
      process.exit(1);
    }
    
    // Check for CSS file and create if missing
    try {
      await fs.access(cssPath);
      hasCssFile = true;
    } catch {
      // Try alternative paths
      const altPaths = isViteProject 
        ? ['src/App.css', 'src/main.css', 'src/styles/globals.css']
        : ['src/app/globals.css', 'styles/globals.css', 'src/styles/globals.css'];
      
      for (const path of altPaths) {
        try {
          await fs.access(path);
          cssPath = path;
          hasCssFile = true;
          break;
        } catch {}
      }
    }
    
    if (!hasCssFile) {
      console.log(chalk.yellow('⚠️  No CSS file found. Creating one...'));
      const cssDir = cssPath.split('/').slice(0, -1).join('/');
      if (cssDir) {
        await fs.mkdir(cssDir, { recursive: true });
      }
      
      const willowCSS = `/* Willow Design System - Global Styles */
@import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Willow Primary Colors - Purple/Blue Theme */
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
    
    /* Light Mode Variables */
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

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 255 72% 58%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 255 72% 58%;
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
      
      await fs.writeFile(cssPath, willowCSS);
      console.log(chalk.green(`✅ Created CSS file: ${cssPath}`));
      
      // Add import to main file for Vite projects
      if (isViteProject) {
        const mainFiles = ['src/main.tsx', 'src/main.jsx', 'src/main.ts', 'src/main.js'];
        for (const mainFile of mainFiles) {
          try {
            let mainContent = await fs.readFile(mainFile, 'utf8');
            const cssImportPath = cssPath.startsWith('src/') ? `./${cssPath.slice(4)}` : `./${cssPath}`;
            
            if (!mainContent.includes(cssImportPath) && !mainContent.includes('index.css')) {
              mainContent = mainContent.replace(
                /(import React from ['"']react['"'];?)/,
                `$1\nimport '${cssImportPath}';`
              );
              
              if (!mainContent.includes('import React')) {
                mainContent = `import '${cssImportPath}';\n${mainContent}`;
              }
              
              await fs.writeFile(mainFile, mainContent);
              console.log(chalk.green(`✅ Added CSS import to ${mainFile}`));
            }
            break;
          } catch {}
        }
      }
    }

    const spinner = ora(`Installing ${component} component...`).start();
    
    try {
      // Always use full URL for consistency
      const componentUrl = `${WILLOW_REGISTRY_BASE}/${component}.json`;
      const pathFlag = isViteProject ? '--path src/components/ui' : '--path components/ui';
      const installCommand = `npx --yes shadcn add ${componentUrl} --overwrite ${pathFlag}`;
      
      execSync(installCommand, { 
        stdio: 'ignore',
        timeout: 30000,
        env: {
          ...process.env,
          CI: '1',
          FORCE_COLOR: '0'
        }
      });
      
      // Verify installation
      const componentsDir = isViteProject ? 'src/components/ui' : 'components/ui';
      let installed = false;
      try {
        await fs.access(`${componentsDir}/${component}.tsx`);
        installed = true;
      } catch {
        try {
          await fs.access(`${componentsDir}/${component}.jsx`);
          installed = true;
        } catch {}
      }
      
      if (installed) {
        spinner.succeed(chalk.green(`✅ Successfully installed ${component} component!`));
      } else {
        throw new Error('Component file not found after installation');
      }
      
      console.log(chalk.blue('\n💡 Usage:'));
      console.log(`import { ${component.charAt(0).toUpperCase() + component.slice(1)} } from "@/components/ui/${component}"`);
      
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to install ${component} component`));
      console.error(chalk.red('Make sure you have a valid Next.js project with components.json configured.'));
      console.log(chalk.yellow('\n🔧 Try running: willow init'));
      console.log(chalk.gray(`\n🔍 Debug: ${error.message}`));
      process.exit(1);
    }
  });
*/

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
  .option('--fast', 'Fast mode: skip dependencies and components installation')
  .option('-y, --yes', 'Skip all confirmation prompts')
  .option('--overwrite', 'Force overwrite existing shadcn components (automatic in online IDEs)')
  .action(async (options) => {
    const fs = await import('fs/promises');
    
    // Check if we're in a valid project
    try {
      await fs.access('package.json');
    } catch {
      console.error(chalk.red('❌ No package.json found. Please run this command in a React/Next.js/Vite project root.'));
      console.log(chalk.yellow('\n💡 To get started:'));
      console.log('1. Create a new project:');
      console.log('   • Next.js: npx create-next-app@latest my-app');
      console.log('   • Vite: npm create vite@latest my-app -- --template react');
      console.log('2. cd into your project: cd my-app');
      console.log('3. Initialize Willow: willow init');
      process.exit(1);
    }

    // Detect environment early for warnings
    let isStackBlitz = process.env.SHELL && process.env.SHELL.includes('jsh');
    let isBolt = false;
    try {
      await fs.access('.bolt');
      isBolt = true;
    } catch {}
    let isOnlineIDE = isStackBlitz || process.env.CODESANDBOX_SSE || process.env.GITPOD_WORKSPACE_ID || isBolt;
    
    // Check for existing shadcn installation
    let hasExistingShadcn = false;
    try {
      await fs.access('components.json');
      const existingComponentsDir = await fs.readdir('components/ui').catch(() => []);
      hasExistingShadcn = existingComponentsDir.length > 0;
    } catch {}
    
    // Environment-specific warnings
    if (isOnlineIDE && !options.yes) {
      if (isBolt) {
        console.log(chalk.blue('⚡ Bolt environment detected - will update prompt with Willow guidelines...'));
      } else {
        console.log(chalk.blue('🌐 Online environment detected - optimizing for compatibility...'));
      }
    }
    
    // Project type detection (will be determined later in the try block)
    let projectType = 'Unknown';
    try {
      const packageJson = await fs.readFile('package.json', 'utf8');
      const pkg = JSON.parse(packageJson);
      if (pkg.devDependencies?.vite || pkg.dependencies?.vite) {
        projectType = 'Vite';
      } else if (pkg.devDependencies?.next || pkg.dependencies?.next) {
        projectType = 'Next.js';
      } else {
        projectType = 'React';
      }
      
      if (!options.yes) {
        console.log(chalk.blue(`📦 ${projectType} project detected - configuring accordingly...`));
      }
    } catch {}
    
    if (hasExistingShadcn && !options.yes) {
      console.log(chalk.yellow('🔄 Existing shadcn/ui installation detected!'));
      console.log(chalk.gray('   → All existing components will be REPLACED with Willow versions'));
      console.log('');
    }
    
    // Warning about overwriting files (skip if --yes flag)
    if (!options.yes) {
      console.log(chalk.yellow('⚠️  WARNING: This will overwrite existing files with Willow defaults:'));
      console.log(chalk.gray('   • CSS file (globals.css)'));
      console.log(chalk.gray('   • Tailwind configuration'));
      console.log(chalk.gray('   • components.json'));
      console.log(chalk.gray('   • lib/utils.ts'));
      if (hasExistingShadcn) {
        console.log(chalk.gray('   • ALL existing shadcn/ui components → Willow versions'));
      }
      console.log('');
    }
    
    const spinner = ora('🌳 Setting up Willow Design System...').start();
    
    try {

      // Detect project structure and environment
      let cssPath = 'app/globals.css';
      let tailwindConfig = 'tailwind.config.js';
      let isStackBlitz = false;
      let isTypeScriptProject = false;
      let isViteProject = false;
      let isNextProject = false;
      
      // Check project type and configuration
      try {
        const packageJson = await fs.readFile('package.json', 'utf8');
        const pkg = JSON.parse(packageJson);
        isStackBlitz = process.env.SHELL && process.env.SHELL.includes('jsh');
        isTypeScriptProject = pkg.devDependencies?.typescript || pkg.dependencies?.typescript;
        isViteProject = pkg.devDependencies?.vite || pkg.dependencies?.vite;
        isNextProject = pkg.devDependencies?.next || pkg.dependencies?.next;
      } catch {}

      // Set default paths based on project type
      if (isViteProject) {
        const vitePossiblePaths = [
          'src/index.css', 'src/App.css', 'src/main.css', 'src/styles/globals.css', 'src/globals.css'
        ];
        
        // Check for existing CSS files in Vite project
        let foundCssPath = false;
        for (const path of vitePossiblePaths) {
          try {
            await fs.access(path);
            cssPath = path;
            foundCssPath = true;
            break;
          } catch {}
        }
        
        // If no CSS file found, create src/index.css
        if (!foundCssPath) {
          cssPath = 'src/index.css';
          await fs.mkdir('src', { recursive: true });
        }
      } else {
        // Next.js or other projects
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
      }

      // Force .js config for StackBlitz and online environments
      if (isStackBlitz) {
        tailwindConfig = 'tailwind.config.js';
      } else {
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
      }

      // 1. Install required dependencies
      if (!options.skipInstall && !options.fast) {
        spinner.text = '📦 Installing required dependencies...';
        try {
          let installCommand = 'npm install clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-slot';
          
          // Add willow-cli to devDependencies
          let willowCliCommand = 'npm install --save-dev willow-cli@latest';
          
          // Add Tailwind CSS for Vite projects if not already installed
          if (isViteProject) {
            try {
              const packageJson = await fs.readFile('package.json', 'utf8');
              const pkg = JSON.parse(packageJson);
              const hasTailwind = pkg.devDependencies?.tailwindcss || pkg.dependencies?.tailwindcss;
              
              if (!hasTailwind) {
                installCommand += ' tailwindcss@latest postcss@latest autoprefixer@latest';
                spinner.text = '📦 Installing dependencies + Tailwind CSS for Vite...';
              }
            } catch {}
          }
          
          // Install dependencies
          execSync(installCommand, { 
            stdio: 'pipe',
            timeout: 60000 // 60 second timeout
          });
          
          // Install willow-cli
          spinner.text = '📦 Adding willow-cli to devDependencies...';
          execSync(willowCliCommand, { 
            stdio: 'pipe',
            timeout: 30000 // 30 second timeout
          });
          
          spinner.succeed('✅ Dependencies installed successfully!');
          spinner.start('⚙️  Configuring Willow...');
        } catch (error) {
          if (error.signal === 'SIGTERM') {
            spinner.warn(chalk.yellow('⚠️  Dependency installation timed out. Please run manually:'));
          } else {
            spinner.warn(chalk.yellow('⚠️  Could not auto-install dependencies. Please run manually:'));
          }
          const baseCommand = 'npm install clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-slot';
          const viteCommand = isViteProject ? ' tailwindcss@latest postcss@latest autoprefixer@latest' : '';
          const willowCommand = 'npm install --save-dev willow-cli@latest';
          console.log(chalk.gray(`   ${baseCommand}${viteCommand}`));
          console.log(chalk.gray(`   ${willowCommand}`));
          spinner.start('⚙️  Continuing with configuration...');
        }
      }

      // 2. Create or update components.json with Willow-specific configuration
      let componentsConfig = {
        "$schema": "https://ui.shadcn.com/schema.json",
        "style": "new-york",
        "rsc": isViteProject ? false : true, // Vite projects typically don't use RSC
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

      // Always overwrite components.json with Willow defaults
      await fs.writeFile('components.json', JSON.stringify(componentsConfig, null, 2));
      
      // Verify file was created
      try {
        await fs.access('components.json');
        const stats = await fs.stat('components.json');
        spinner.succeed(`⚙️  Created components.json with Willow defaults! (${stats.size} bytes)`);
      } catch {
        throw new Error('Failed to create components.json');
      }
      
      spinner.start('📁 Setting up directories...');
      
      // 3. Create directories
      await fs.mkdir('lib', { recursive: true });
      await fs.mkdir('components/ui', { recursive: true });
      spinner.succeed('📁 Created project directories!');
      spinner.start('🔧 Setting up utilities...');

      // 4. Always overwrite lib/utils.ts with Willow defaults
      const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
      
      await fs.writeFile('lib/utils.ts', utilsContent);
      
      // Verify utils file was created
      try {
        await fs.access('lib/utils.ts');
        spinner.succeed('🔧 Created utilities with Willow defaults!');
      } catch {
        throw new Error('Failed to create lib/utils.ts');
      }
      
      spinner.start('🎨 Setting up CSS...');

      // 5. Update CSS with Willow styles
      const willowCSS = `/* Willow Design System */
/* Font imports with fallbacks */
@import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

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

      // Always overwrite CSS with Willow defaults
      // Ensure the directory exists before writing the file
      const cssDir = cssPath.split('/').slice(0, -1).join('/');
      if (cssDir) {
        await fs.mkdir(cssDir, { recursive: true });
      }
      
      // Check if CSS file exists and needs import in main file
      let cssFileCreated = false;
      try {
        await fs.access(cssPath);
        spinner.text = `🎨 Overwriting existing CSS file: ${cssPath}...`;
      } catch {
        cssFileCreated = true;
        spinner.text = `🎨 Creating new CSS file: ${cssPath}...`;
      }
      
      await fs.writeFile(cssPath, willowCSS);
      spinner.succeed(`🎨 Created CSS with Willow defaults! (${cssPath})`);
      
      // Ensure CSS is imported in the correct file
      if (cssFileCreated) {
        if (isViteProject) {
          // For Vite projects, add to main file
          const mainFiles = ['src/main.tsx', 'src/main.jsx', 'src/main.ts', 'src/main.js'];
          for (const mainFile of mainFiles) {
            try {
              let mainContent = await fs.readFile(mainFile, 'utf8');
              const cssImportPath = cssPath.startsWith('src/') ? `./${cssPath.slice(4)}` : `./${cssPath}`;
              
              if (!mainContent.includes(cssImportPath) && !mainContent.includes('index.css')) {
                // Add import after React import
                mainContent = mainContent.replace(
                  /(import React from ['"]react['"];?)/,
                  `$1\nimport '${cssImportPath}';`
                );
                
                // If no React import, add at the beginning
                if (!mainContent.includes('import React')) {
                  mainContent = `import '${cssImportPath}';\n${mainContent}`;
                }
                
                await fs.writeFile(mainFile, mainContent);
                spinner.succeed(`📝 Added CSS import to ${mainFile}`);
              }
              break;
            } catch {}
          }
        } else if (isNextProject) {
          // For Next.js projects, check layout files
          const layoutFiles = [
            'app/layout.tsx', 'app/layout.jsx', 'app/layout.js',
            'src/app/layout.tsx', 'src/app/layout.jsx', 'src/app/layout.js'
          ];
          
          for (const layoutFile of layoutFiles) {
            try {
              let layoutContent = await fs.readFile(layoutFile, 'utf8');
              const cssImportPath = cssPath.includes('app/') ? './globals.css' : '../globals.css';
              
              if (!layoutContent.includes('globals.css') && !layoutContent.includes(cssImportPath)) {
                // Add import at the top of the file
                layoutContent = `import '${cssImportPath}';\n${layoutContent}`;
                
                await fs.writeFile(layoutFile, layoutContent);
                spinner.succeed(`📝 Added CSS import to ${layoutFile}`);
              }
              break;
            } catch {}
          }
        }
      }
      
      spinner.start('⚙️  Setting up Tailwind...');

      // 6. Update Tailwind config
      // Set content paths based on project type
      let contentPaths;
      if (isViteProject) {
        contentPaths = [
          './index.html',
          './src/**/*.{js,ts,jsx,tsx}',
          './components/**/*.{js,ts,jsx,tsx}',
        ];
      } else {
        contentPaths = [
          './pages/**/*.{ts,tsx}',
          './components/**/*.{ts,tsx}',
          './app/**/*.{ts,tsx}',
          './src/**/*.{ts,tsx}',
        ];
      }

      const tailwindConfigContent = `import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ${JSON.stringify(contentPaths, null, 4)},
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

      // Always overwrite Tailwind config with Willow defaults
      // Use JS config for StackBlitz and online environments
      if (isStackBlitz || tailwindConfig.endsWith('.js') || tailwindConfig.endsWith('.mjs')) {
        const jsConfig = tailwindConfigContent
          .replace('import type { Config } from "tailwindcss"', '/** @type {import("tailwindcss").Config} */')
          .replace(' satisfies Config', '')
          .replace('export default config', 'module.exports = config');
        await fs.writeFile(tailwindConfig, jsConfig);
        spinner.succeed('⚙️  Created Tailwind config (JS) with Willow defaults!');
      } else {
        // TypeScript config for local development
        await fs.writeFile(tailwindConfig, tailwindConfigContent);
        spinner.succeed('⚙️  Created Tailwind config (TS) with Willow defaults!');
      }

      // Create PostCSS config for Vite projects if it doesn't exist
      if (isViteProject) {
        try {
          await fs.access('postcss.config.js');
        } catch {
          const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
          await fs.writeFile('postcss.config.js', postcssConfig);
          spinner.succeed('⚙️  Created PostCSS config for Vite!');
        }
      }

      // 7. Install all components (overwrite existing shadcn components)
      if (!options.skipComponents && !options.fast) {
        spinner.text = '🎯 Installing all Willow components...';
        
        // Check if components/ui directory exists (existing shadcn project)
        let hasExistingComponents = false;
        let existingComponentFiles = [];
        const componentsDir = isViteProject ? 'src/components/ui' : 'components/ui';
        
        try {
          existingComponentFiles = await fs.readdir(componentsDir);
          hasExistingComponents = existingComponentFiles.length > 0;
          if (hasExistingComponents) {
            spinner.text = '🔄 Replacing existing shadcn components with Willow versions...';
          }
        } catch {}
        
        // Determine if we should force overwrite
        const shouldOverwrite = isOnlineIDE || options.overwrite || hasExistingComponents;
        
        if (shouldOverwrite && !options.yes) {
          console.log(chalk.yellow('\n📝 Overwriting mode activated:'));
          if (isOnlineIDE) {
            console.log(chalk.gray('   • Online IDE detected - automatic overwrite enabled'));
          }
          if (hasExistingComponents) {
            console.log(chalk.gray(`   • Found ${existingComponentFiles.length} existing components to replace`));
          }
          console.log('');
        }
        
        let installedCount = 0;
        let failedComponents = [];
        
        // For bulletproof overwriting, delete existing components first if needed
        if (shouldOverwrite && hasExistingComponents) {
          spinner.text = '🗑️  Cleaning existing components for fresh install...';
          for (const component of AVAILABLE_COMPONENTS) {
            try {
              // Remove component file if it exists
              await fs.unlink(`${componentsDir}/${component}.tsx`).catch(() => {});
              await fs.unlink(`${componentsDir}/${component}.jsx`).catch(() => {});
            } catch {}
          }
        }
        
        // Direct installation method to avoid hanging
        spinner.text = '🔄 Installing components from Willow registry...';
        console.log(chalk.gray(`\n   Target directory: ${componentsDir}`));
        console.log(chalk.gray(`   Total components: ${AVAILABLE_COMPONENTS.length}`));
        
        // Create a progress indicator
        let progressCount = 0;
        
        for (const component of AVAILABLE_COMPONENTS) {
          progressCount++;
          const action = shouldOverwrite ? 'Replacing' : 'Installing';
          
          try {
            // Update spinner with current component
            spinner.text = `${action} ${component} (${progressCount}/${AVAILABLE_COMPONENTS.length})...`;
            
            // Fetch component data
            const response = await fetch(`${WILLOW_REGISTRY_BASE}/${component}.json`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validate component data
            if (!data.files || !data.files[0] || !data.files[0].content) {
              throw new Error('Invalid registry data');
            }
            
            // Write component file
            const content = data.files[0].content;
            const fileName = `${component}.tsx`;
            const filePath = `${componentsDir}/${fileName}`;
            
            // Ensure directory exists
            await fs.mkdir(componentsDir, { recursive: true });
            
            // Write the file
            await fs.writeFile(filePath, content, 'utf8');
            
            // Verify file was written
            const stats = await fs.stat(filePath);
            if (stats.size > 0) {
              installedCount++;
              console.log(chalk.gray(`   ✓ ${component} (${stats.size} bytes)`));
            } else {
              throw new Error('Empty file');
            }
            
          } catch (error) {
            failedComponents.push(component);
            console.log(chalk.gray(`   ✗ ${component} - ${error.message}`));
            
            // Don't try shadcn CLI fallback - it causes hanging
          }
          
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        spinner.stop(); // Stop spinner before showing results
        
        // Verify installation by checking if component files exist
        let verifiedCount = 0;
        for (const component of AVAILABLE_COMPONENTS) {
          try {
            // Check if component file exists (try both .tsx and .jsx)
            try {
              await fs.access(`${componentsDir}/${component}.tsx`);
              verifiedCount++;
            } catch {
              await fs.access(`${componentsDir}/${component}.jsx`);
              verifiedCount++;
            }
          } catch {
            // Component file doesn't exist
          }
        }
        
        if (failedComponents.length > 0 || verifiedCount < installedCount) {
          const action = shouldOverwrite ? 'Replaced' : 'Installed';
          spinner.warn(chalk.yellow(`⚠️  ${action} ${installedCount}/${AVAILABLE_COMPONENTS.length} components. Failed: ${failedComponents.join(', ')}`));
          console.log(chalk.gray('   You can install failed components manually with: willow add <component>'));
          if (isOnlineIDE) {
            console.log(chalk.gray('   Note: Some components may fail in online IDEs due to limitations'));
          }
          if (verifiedCount < installedCount) {
            console.log(chalk.gray(`   Verified: ${verifiedCount}/${installedCount} components actually installed`));
          }
        } else {
          const action = shouldOverwrite ? 'replaced' : 'installed';
          console.log(chalk.green(`\n✅ All ${installedCount} components ${action} with Willow versions!`));
        }
      }

      // 8. Create or update Bolt prompt if .bolt directory exists
      try {
        await fs.access('.bolt');
        const boltPrompt = `For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

This project uses the Willow Design System - a premium design system with custom purple/blue color palette and Codec Pro typography.

**Available Components:**
- All shadcn/ui components are pre-installed with Willow styling
- Use the Willow color palette: willow-primary-50 through willow-primary-950
- Components have additional variants: success, warning, info (for badges, buttons, etc.)
- Typography uses Codec Pro font family (automatically loaded)

**Import Examples:**
\`\`\`jsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
\`\`\`

**Color Palette Usage:**
- Primary: bg-willow-primary-600, text-willow-primary-600, border-willow-primary-600
- Hover states: hover:bg-willow-primary-700
- Light backgrounds: bg-willow-primary-50
- Dark text: text-willow-primary-900

**Component Variants:**
- Buttons: default, secondary, outline, ghost, destructive
- Badges: default, secondary, success, warning, destructive, info
- Cards: Use with willow color classes for beautiful designs

**Design Principles:**
1. Use gradients with Willow colors: bg-gradient-to-br from-willow-primary-50 to-white
2. Add subtle shadows and hover effects for depth
3. Maintain consistent spacing with Tailwind's spacing scale
4. Use Codec Pro font weights for hierarchy (font-light to font-bold)
5. Incorporate the purple/blue theme throughout the design

**Best Practices:**
- Always use Willow color tokens instead of default Tailwind colors
- Leverage the pre-built component library - don't recreate components
- Use lucide-react icons which are already installed
- Apply hover states and transitions for polished interactions
- Create responsive layouts with Tailwind's responsive prefixes

By default, this template supports JSX syntax with Tailwind CSS classes, the Willow-enhanced shadcn/ui library, React hooks, and Lucide React for icons. All Willow components are pre-installed and configured. Do not install other packages for UI themes, icons, etc unless absolutely necessary or requested.

Use icons from lucide-react for logos and UI elements.`;
        
        await fs.writeFile('.bolt/prompt', boltPrompt);
        spinner.succeed('📝 Created Bolt prompt with Willow Design System guidelines!');
      } catch {
        // .bolt directory doesn't exist, skip
      }

      // 9. Add Willow scripts to package.json
      try {
        const packageJsonContent = await fs.readFile('package.json', 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        
        // Add willow scripts if they don't exist
        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }
        
        // Add helpful Willow scripts
        const willowScripts = {
          'willow:add': 'willow add',
          'willow:list': 'willow list',
          'willow:update': 'npm update willow-cli && willow init --yes --skip-install'
        };
        
        let scriptsAdded = false;
        for (const [key, value] of Object.entries(willowScripts)) {
          if (!packageJson.scripts[key]) {
            packageJson.scripts[key] = value;
            scriptsAdded = true;
          }
        }
        
        if (scriptsAdded) {
          await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
          spinner.succeed('📝 Added Willow scripts to package.json!');
        }
      } catch (error) {
        // Failed to update package.json scripts, not critical
      }

      spinner.succeed(chalk.green('🎉 Willow Design System setup complete!'));
      
      console.log(chalk.blue('\n✨ What was installed/configured:'));
      console.log(chalk.gray('📦 Dependencies: clsx, tailwind-merge, lucide-react, class-variance-authority'));
      console.log(chalk.gray('📦 DevDependencies: willow-cli@latest'));
      console.log(chalk.gray('🎨 CSS: Complete Willow fonts, colors, and design tokens'));
      console.log(chalk.gray('⚙️  Tailwind: Full Willow configuration and theme'));
      console.log(chalk.gray('🔧 components.json: Willow set as DEFAULT registry'));
      console.log(chalk.gray('🛠️  lib/utils.ts: Willow utility functions'));
      console.log(chalk.gray('📝 package.json: Added Willow scripts (willow:add, willow:list, willow:update)'));
      const componentsMessage = (options.skipComponents || options.fast) 
        ? 'Skipped' 
        : shouldOverwrite
          ? `All ${AVAILABLE_COMPONENTS.length} components REPLACED with Willow versions`
          : `All ${AVAILABLE_COMPONENTS.length} components installed`;
      console.log(chalk.gray(`🧩 Components: ${componentsMessage}`));
      
      console.log(chalk.blue('\n🚀 Next steps:'));
      if (options.fast || options.skipInstall) {
        console.log(chalk.yellow('• Install dependencies: npm install clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-slot'));
      }
      if (options.fast || options.skipComponents) {
        console.log(chalk.yellow('• Install components: npm run willow:add button'));
      }
      console.log(chalk.gray('• Start your development server: npm run dev'));
      console.log(chalk.gray('• Create test page: app/test-willow/page.tsx'));
      console.log(chalk.gray('• Add components: npm run willow:add <component>'));
      console.log(chalk.gray('• List components: npm run willow:list'));
      console.log(chalk.gray('• Update Willow: npm run willow:update'));
      console.log(chalk.gray('• Check the documentation: https://iridescent-brigadeiros-fe4174.netlify.app/docs'));
      const filesList = `${cssPath}, ${tailwindConfig}, components.json, lib/utils.ts`;
      const filesWithBolt = isBolt ? `${filesList}, .bolt/prompt` : filesList;
      console.log(chalk.gray(`📁 Files: ${filesWithBolt}`));
      
      if (isOnlineIDE) {
        console.log(chalk.blue('\n🌐 Online Environment Optimizations Applied:'));
        console.log(chalk.gray('• JavaScript Tailwind config (better compatibility)'));
        console.log(chalk.gray('• Willow set as default registry for easy component installs'));
        console.log(chalk.gray('• Enhanced fallback component installation'));
        console.log(chalk.gray('• Optimized font loading'));
        
        if (isBolt) {
          console.log(chalk.blue('\n⚡ Bolt-Specific Features:'));
          console.log(chalk.gray('• Updated .bolt/prompt with Willow Design System guidelines'));
          console.log(chalk.gray('• AI will now use Willow components and color palette'));
          console.log(chalk.gray('• Beautiful, production-ready designs with purple/blue theme'));
        }
      }
      
      console.log(chalk.blue('\n🎯 Willow Registry Configuration:'));
      console.log(chalk.gray('• Default registry: Willow Design System'));
      console.log(chalk.gray('• Simple installs: npx shadcn add button'));
      console.log(chalk.gray('• Fallback: shadcn/ui registry available'));
      
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
      console.error(chalk.red('Error details:'), error.message);
      
      // Check what was actually created
      console.log(chalk.yellow('\n📋 Checking what was created:'));
      const filesToCheck = [
        { file: cssPath, name: 'CSS file' },
        { file: tailwindConfig, name: 'Tailwind config' },
        { file: 'components.json', name: 'components.json' },
        { file: 'lib/utils.ts', name: 'Utils' },
        { file: 'postcss.config.js', name: 'PostCSS config' }
      ];
      
      for (const { file, name } of filesToCheck) {
        try {
          await fs.access(file);
          console.log(chalk.green(`   ✓ ${name} exists at ${file}`));
        } catch {
          console.log(chalk.red(`   ✗ ${name} NOT created at ${file}`));
        }
      }
      
      console.log(chalk.yellow('\n🔧 Troubleshooting:'));
      console.log(chalk.gray('1. Make sure you have write permissions in this directory'));
      console.log(chalk.gray('2. Try running with: npx willow-cli@latest init --fast'));
      console.log(chalk.gray('3. Check if any antivirus/security software is blocking file creation'));
      
      process.exit(1);
    }
  });

// Register the new modular add command
registerAddCommand(program);

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