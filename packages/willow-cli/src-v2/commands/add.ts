/**
 * Add Command - Install Willow components
 * Direct commander.js implementation without abstractions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CommandContext } from '../core/command-loader';
import { ComponentInstaller } from '../core/component-installer';
import { RegistryClient } from '../registry/client';
import { detectFramework } from '../utils/framework-detector';

export function createAddCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('add')
    .description('Add Willow components to your project')
    .argument('[components...]', 'Component names to install (use "all" for all components)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--dry-run', 'Preview changes without installing')
    .option('--force', 'Overwrite existing files')
    .option('--no-deps', 'Skip installing dependencies')
    .option('--path <path>', 'Custom components directory')
    .option('--registry <url>', 'Use custom registry URL')
    .action(async (components: string[], options) => {
      const spinner = ora();
      
      try {
        // Validate project
        const framework = await detectFramework();
        if (framework.type === 'unknown') {
          logger.error('No supported framework detected. Please run this in a React project.');
          process.exit(1);
        }
        
        // Handle "all" command
        if (components.length === 1 && components[0] === 'all') {
          spinner.start('Fetching all available components...');
          const registry = new RegistryClient({
            baseURL: options.registry || config.registry?.url
          });
          const allComponents = await registry.listComponents();
          components = allComponents.map(c => c.name);
          spinner.succeed(`Found ${components.length} components`);
        }
        
        // Validate component names
        if (components.length === 0) {
          logger.error('No components specified. Use "willow add button card" or "willow add all"');
          process.exit(1);
        }
        
        // Show what will be installed
        if (!options.yes && !options.dryRun) {
          logger.info('Installing components:', components.join(', '));
          logger.info(`Target directory: ${options.path || framework.paths.components}`);
        }
        
        // Install components
        const installer = new ComponentInstaller({
          logger,
          config,
          framework,
          dryRun: options.dryRun,
          force: options.force,
          skipDeps: options.noDeps,
          componentPath: options.path
        });
        
        spinner.start('Installing components...');
        const results = await installer.install(components);
        spinner.stop();
        
        // Show results
        if (results.installed.length > 0) {
          logger.success(`Installed ${results.installed.length} components:`);
          results.installed.forEach(name => {
            logger.info(`  ${chalk.green('✓')} ${name}`);
          });
        }
        
        if (results.failed.length > 0) {
          logger.error(`Failed to install ${results.failed.length} components:`);
          results.failed.forEach(({ name, error }) => {
            logger.error(`  ${chalk.red('✗')} ${name}: ${error.message}`);
          });
        }
        
        if (results.skipped.length > 0) {
          logger.warn(`Skipped ${results.skipped.length} components (already installed):`);
          results.skipped.forEach(name => {
            logger.info(`  ${chalk.yellow('-')} ${name}`);
          });
        }
        
        // Show usage instructions
        if (results.installed.length > 0 && !options.dryRun) {
          logger.info('\n💡 Import components:');
          logger.info(chalk.gray('import { Button, Card } from "@/components/ui"'));
          
          if (results.dependencies.length > 0) {
            logger.warn('\n📦 Required packages:');
            logger.info(chalk.cyan(`npm install ${results.dependencies.join(' ')}`));
          }
        }
        
      } catch (error) {
        spinner.fail('Installation failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}