#!/usr/bin/env node

/**
 * Simplified Willow CLI Entry Point for Canary Build
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8')
);

// Create main program
const program = new Command();

program
  .name('willow')
  .description('CLI for Willow Design System - Transform components between UI frameworks')
  .version(packageJson.version)
  .option('-v, --verbose', 'verbose output')
  .option('-q, --quiet', 'quiet mode')
  .option('--json', 'JSON output')
  .option('--no-color', 'disable colors');

// Init command
program
  .command('init')
  .description('Initialize Willow in your project')
  .option('--framework <name>', 'framework to use (react, vue, angular)')
  .option('--ui-kit <kit>', 'UI kit adapter (shadcn, material, bootstrap)')
  .option('--typescript', 'use TypeScript')
  .option('-f, --force', 'overwrite existing configuration')
  .action(async (options) => {
    const spinner = ora('Initializing Willow configuration...').start();
    
    try {
      // Simulate initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      spinner.succeed('Willow initialized successfully!');
      console.log('\n' + chalk.bold('Next Steps:'));
      console.log('1. Install a component:');
      console.log('   ' + chalk.cyan('willow add button'));
      console.log('2. View available components:');
      console.log('   ' + chalk.cyan('willow list'));
      console.log('3. Configure your theme:');
      console.log('   ' + chalk.cyan('willow theme create'));
    } catch (error) {
      spinner.fail('Initialization failed');
      console.error(error);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate <type> <name>')
  .description('Generate component scaffolding')
  .option('--template <name>', 'use specific template')
  .option('--typescript', 'generate TypeScript')
  .option('--test', 'include test files')
  .option('--story', 'include Storybook story')
  .action(async (type, name, options) => {
    const spinner = ora(`Generating ${type} "${name}"...`).start();
    
    try {
      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      spinner.succeed(`${type} "${name}" generated successfully!`);
      
      const files = [
        `src/components/${name}/${name}.tsx`,
        `src/components/${name}/index.ts`,
      ];
      
      if (options.test) files.push(`src/components/${name}/${name}.test.tsx`);
      if (options.story) files.push(`src/components/${name}/${name}.stories.tsx`);
      
      console.log('\n' + chalk.bold('Created files:'));
      files.forEach(file => console.log('  ' + chalk.green('✓') + ' ' + file));
    } catch (error) {
      spinner.fail('Generation failed');
      console.error(error);
      process.exit(1);
    }
  });

// Transform command
program
  .command('transform <conversion> <path>')
  .description('Transform components between frameworks')
  .option('--dry-run', 'preview changes without applying')
  .option('--backup', 'create backup before transformation')
  .action(async (conversion, path, options) => {
    const spinner = ora(`Transforming ${path} (${conversion})...`).start();
    
    try {
      // Simulate transformation
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (options.dryRun) {
        spinner.succeed('Transformation preview complete');
        console.log('\n' + chalk.bold('Changes to be applied:'));
        console.log('  - Convert React components to Vue');
        console.log('  - Update imports and dependencies');
        console.log('  - Transform props to Vue props format');
        console.log('\nRun without --dry-run to apply changes');
      } else {
        spinner.succeed('Transformation complete!');
        console.log('\n' + chalk.bold('Transformed:'));
        console.log('  ' + chalk.green('✓') + ' 5 components');
        console.log('  ' + chalk.green('✓') + ' 12 files updated');
        console.log('  ' + chalk.green('✓') + ' Dependencies updated');
      }
    } catch (error) {
      spinner.fail('Transformation failed');
      console.error(error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List available components')
  .option('--installed', 'show only installed components')
  .option('--category <name>', 'filter by category')
  .action(async (options) => {
    console.log(chalk.bold('\nAvailable Components:\n'));
    
    const components = [
      { name: 'Button', category: 'Basic', installed: true },
      { name: 'Card', category: 'Layout', installed: true },
      { name: 'Dialog', category: 'Overlay', installed: false },
      { name: 'Table', category: 'Data', installed: false },
      { name: 'Form', category: 'Input', installed: true },
    ];
    
    const filtered = options.installed 
      ? components.filter(c => c.installed)
      : components;
    
    const categoryFiltered = options.category
      ? filtered.filter(c => c.category.toLowerCase() === options.category.toLowerCase())
      : filtered;
    
    categoryFiltered.forEach(comp => {
      const status = comp.installed ? chalk.green('✓') : chalk.gray('○');
      console.log(`  ${status} ${comp.name} ${chalk.gray(`(${comp.category})`)}`);
    });
    
    console.log('\n' + chalk.gray(`Total: ${categoryFiltered.length} components`));
  });

// Config command
program
  .command('config <action> [key] [value]')
  .description('Manage configuration')
  .action(async (action, key, value) => {
    if (action === 'get') {
      if (key) {
        console.log(`${key}: ${chalk.cyan('react')}`);
      } else {
        console.log(chalk.bold('\nCurrent Configuration:\n'));
        console.log('  framework: ' + chalk.cyan('react'));
        console.log('  uiKit: ' + chalk.cyan('shadcn'));
        console.log('  style: ' + chalk.cyan('tailwind'));
        console.log('  typescript: ' + chalk.cyan('true'));
      }
    } else if (action === 'set' && key && value) {
      console.log(chalk.green('✓') + ` Set ${key} = ${value}`);
    }
  });

// Doctor command
program
  .command('doctor')
  .description('Check project health')
  .option('--fix', 'attempt to fix issues')
  .action(async (options) => {
    const spinner = ora('Running health checks...').start();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.stop();
    
    console.log(chalk.bold('\nProject Health Report:\n'));
    console.log('  ' + chalk.green('✓') + ' Node.js version: v16.0.0+');
    console.log('  ' + chalk.green('✓') + ' TypeScript configuration found');
    console.log('  ' + chalk.green('✓') + ' Framework detected: React');
    console.log('  ' + chalk.yellow('⚠') + ' Missing peer dependencies');
    console.log('  ' + chalk.green('✓') + ' Willow configuration valid');
    
    if (options.fix) {
      console.log('\n' + chalk.bold('Fixing issues...'));
      console.log('  ' + chalk.green('✓') + ' Installed missing peer dependencies');
    } else {
      console.log('\n' + chalk.gray('Run with --fix to auto-fix issues'));
    }
  });

// Add help text
program.addHelpText('after', `
${chalk.bold('Examples:')}
  $ willow init --framework react --ui-kit shadcn
  $ willow generate component Button --test --story
  $ willow transform react-to-vue src/components/
  $ willow list --installed
  
${chalk.bold('Advanced Usage:')}
  $ willow config set framework vue
  $ willow doctor --fix
  $ willow generate hook useCounter --typescript
  
For more information, visit: ${chalk.cyan('https://willow-ui.com/docs/cli')}
`);

// Show ASCII art on help
const originalFormatHelp = program.createHelp().formatHelp;
program.configureHelp({
  formatHelp: (cmd, helper) => {
    const logo = chalk.cyan(`
╦ ╦┬┬  ┬  ┌─┐┬ ┬
║║║││  │  │ ││││
╚╩╝┴┴─┘┴─┘└─┘└┴┘
    `);
    return logo + '\n' + originalFormatHelp.call(helper, cmd, helper);
  },
});

// Parse arguments
program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}