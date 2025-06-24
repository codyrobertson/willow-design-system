import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import didyoumean from 'didyoumean';
import {
  installComponents,
  updateBarrelExport,
} from '../utils/componentInstaller.js';
import {
  detectProjectType,
  getComponentDir,
  getLibDir,
  fileExists
} from '../utils/fileSystem.js';
import { WILLOW_REGISTRY, AVAILABLE_COMPONENTS } from '../types/index.js';
import type { ComponentName } from '../types/index.js';

export function registerAddCommand(program: Command): void {
  program
    .command('add [components...]')
    .description('Add Willow components to your project (use "all" to install all components)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--dry-run', 'Preview what will be installed without making changes')
    .option('--overwrite', 'Overwrite existing files')
    .option('--no-deps', 'Skip installing component dependencies')
    .option('--path <path>', 'Custom components directory path')
    .action(async (components: string[], options) => {
      // Validate project
      if (!(await fileExists('package.json'))) {
        console.error(chalk.red('❌ No package.json found. Please run this command in a project root.'));
        console.log(chalk.yellow('\n💡 To get started:'));
        console.log('1. Create a new project:');
        console.log('   • Next.js: npx create-next-app@latest my-app');
        console.log('   • Vite: npm create vite@latest my-app -- --template react');
        console.log('2. cd into your project: cd my-app');
        console.log('3. Initialize Willow: willow init');
        process.exit(1);
      }
      
      // Check for components.json
      if (!(await fileExists('components.json'))) {
        console.error(chalk.red('❌ No components.json found. Please run "willow init" first.'));
        process.exit(1);
      }
      
      // Handle "all" command
      if (components.length === 1 && components[0] === 'all') {
        components = [...AVAILABLE_COMPONENTS];
        console.log(chalk.blue(`📦 Installing all ${components.length} Willow components...`));
      }
      
      // Validate component names
      const invalidComponents = components.filter(c => !AVAILABLE_COMPONENTS.includes(c as ComponentName));
      if (invalidComponents.length > 0) {
        console.error(chalk.red(`❌ Unknown components: ${invalidComponents.join(', ')}`));
        console.log(chalk.yellow('\n📦 Available components:'));
        console.log(AVAILABLE_COMPONENTS.map(c => `  • ${c}`).join('\n'));
        
        // Suggest similar components
        invalidComponents.forEach(invalid => {
          const suggestion = didyoumean(invalid, AVAILABLE_COMPONENTS as unknown as string[]);
          if (suggestion) {
            console.log(chalk.gray(`\nDid you mean "${suggestion}"?`));
          }
        });
        
        process.exit(1);
      }
      
      // Detect project type
      const projectType = await detectProjectType();
      const componentDir = options.path || await getComponentDir(projectType);
      
      // For online IDEs, force overwrite and skip prompts
      if (projectType.isOnlineIDE) {
        options.yes = true;
        options.overwrite = true;
        console.log(chalk.cyan('🚀 Online IDE detected - auto-configuring for best experience...'));
      }
      
      if (options.dryRun) {
        console.log(chalk.blue('🔍 DRY RUN MODE - No files will be created\n'));
      }
      
      // Show what will be installed
      if (!options.yes && !options.dryRun) {
        console.log(chalk.yellow('⚠️  This will install the following components:'));
        components.forEach(c => console.log(`  • ${c}`));
        console.log(chalk.gray(`\nTarget directory: ${componentDir}`));
        console.log(chalk.gray('Files will be created/overwritten.\n'));
      }
      
      const spinner = ora('Preparing installation...').start();
      
      try {
        // Install components with dependencies
        const installOptions = {
          dryRun: options.dryRun,
          overwrite: true, // Always overwrite for Willow components
          baseDir: process.cwd(),
          isVite: projectType.isVite,
          skipDeps: options.deps === false,
          componentDir: componentDir,
          libDir: await getLibDir(projectType)
        };
        
        spinner.text = 'Installing components...';
        
        const result = await installComponents(components, WILLOW_REGISTRY, installOptions);
        
        spinner.stop();
        
        // Update barrel exports
        if (!options.dryRun && result.installed.length > 0) {
          await updateBarrelExport(componentDir, { dryRun: options.dryRun });
        }
        
        // Show results
        if (result.installed.length > 0) {
          console.log(chalk.green(`\n✅ Successfully installed ${result.installed.length} components:`));
          result.installed.forEach(c => console.log(chalk.gray(`   • ${c}`)));
        }
        
        if (result.failed.length > 0) {
          console.log(chalk.red(`\n❌ Failed to install ${result.failed.length} components:`));
          result.failed.forEach(({ component, error }) => {
            console.log(chalk.red(`   • ${component}`));
            console.log(chalk.gray(`     - ${error}`));
          });
        }
        
        // Show usage examples
        if (result.installed.length > 0 && !options.dryRun) {
          console.log(chalk.blue('\n💡 Import components:'));
          console.log(chalk.gray('import { Button, Card } from "@/components/ui"'));
          console.log(chalk.gray('// or'));
          result.installed.slice(0, 3).forEach(comp => {
            const name = comp.charAt(0).toUpperCase() + comp.slice(1).replace(/-./g, x => x[1].toUpperCase());
            console.log(chalk.gray(`import { ${name} } from "@/components/ui/${comp}"`));
          });
          
          // Show npm dependencies if any
          if (result.npmDependencies && result.npmDependencies.length > 0) {
            console.log(chalk.yellow('\n📦 Required npm packages:'));
            console.log(chalk.gray('Please ensure these are installed:'));
            console.log(chalk.cyan(`npm install ${result.npmDependencies.join(' ')}`));
          }
          
          // Check if CSS exists
          await checkCSSSetup(projectType);
        }
        
      } catch (error) {
        spinner.fail(chalk.red('Installation failed'));
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });
}

// Check if CSS is properly set up
async function checkCSSSetup(projectType: any): Promise<void> {
  const cssPath = projectType.isVite ? 'src/index.css' : 'app/globals.css';
  
  if (!(await fileExists(cssPath))) {
    console.log(chalk.yellow('\n⚠️  No CSS file found!'));
    console.log(chalk.gray(`   Expected: ${cssPath}`));
    console.log(chalk.gray('   Run "willow init" to set up your CSS with Willow styles.'));
  }
}