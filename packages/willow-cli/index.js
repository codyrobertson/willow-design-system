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
  .version('0.1.0');

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

    const spinner = ora(`Installing ${component} component...`).start();
    
    try {
      const componentUrl = `${WILLOW_REGISTRY_BASE}/${component}.json`;
      const args = ['shadcn@latest', 'add', componentUrl];
      
      if (options.yes) {
        args.push('--yes');
      }

      execSync(`npx ${args.join(' ')}`, { stdio: 'inherit' });
      
      spinner.succeed(chalk.green(`✅ Successfully installed ${component} component!`));
      
      console.log(chalk.blue('\n💡 Usage:'));
      console.log(`import { ${component.charAt(0).toUpperCase() + component.slice(1)} } from "@/components/ui/${component}"`);
      
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to install ${component} component`));
      console.error(chalk.red(error.message));
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
  .description('Initialize Willow Design System in your project')
  .action(async () => {
    const spinner = ora('Initializing Willow Design System...').start();
    
    try {
      // Check if components.json exists
      const fs = await import('fs/promises');
      let componentsConfig;
      
      try {
        const existing = await fs.readFile('components.json', 'utf8');
        componentsConfig = JSON.parse(existing);
        spinner.text = 'Found existing components.json, updating...';
      } catch {
        // Create new components.json
        componentsConfig = {
          "$schema": "https://ui.shadcn.com/schema.json",
          "style": "new-york",
          "rsc": true,
          "tsx": true,
          "tailwind": {
            "config": "tailwind.config.js",
            "css": "app/globals.css",
            "baseColor": "neutral",
            "cssVariables": true
          },
          "aliases": {
            "components": "@/components",
            "utils": "@/lib/utils"
          }
        };
      }

      // Write updated components.json
      await fs.writeFile('components.json', JSON.stringify(componentsConfig, null, 2));
      
      // Create utils if it doesn't exist
      try {
        await fs.mkdir('lib', { recursive: true });
        const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
        
        try {
          await fs.access('lib/utils.ts');
        } catch {
          await fs.writeFile('lib/utils.ts', utilsContent);
        }
      } catch (error) {
        // lib/utils already exists or couldn't create
      }

      spinner.succeed(chalk.green('✅ Willow Design System initialized!'));
      
      console.log(chalk.blue('\n🎉 Next steps:'));
      console.log('1. Add Willow fonts to your CSS:');
      console.log(chalk.gray("   @import url('https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/codec-pro.css');"));
      console.log('2. Install components:');
      console.log(chalk.gray('   willow add button'));
      console.log('3. View all components:');
      console.log(chalk.gray('   willow list'));
      
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