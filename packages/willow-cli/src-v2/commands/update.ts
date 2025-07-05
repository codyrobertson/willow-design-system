/**
 * Update Command - Update installed Willow components
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CommandContext } from '../core/command-loader';
import { ComponentInstaller } from '../core/component-installer';
import { RegistryClient } from '../registry/client';
import { detectFramework } from '../utils/framework-detector';

export function createUpdateCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('update')
    .description('Update installed Willow components to latest versions')
    .argument('[components...]', 'Specific components to update (leave empty for all)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--dry-run', 'Preview what will be updated')
    .option('--check', 'Only check for updates without installing')
    .action(async (components: string[], options) => {
      const spinner = ora();
      
      try {
        // Detect framework
        const framework = await detectFramework();
        if (framework.type === 'unknown') {
          logger.error('No supported framework detected.');
          process.exit(1);
        }
        
        const installer = new ComponentInstaller({
          logger,
          config,
          framework,
          dryRun: options.dryRun
        });
        
        const registry = new RegistryClient({
          baseURL: config.registry?.url
        });
        
        // Get installed components
        spinner.start('Checking installed components...');
        const installed = await installer.getInstalledComponents();
        spinner.stop();
        
        if (installed.length === 0) {
          logger.info('No Willow components found to update.');
          return;
        }
        
        // Filter components to update
        const toUpdate = components.length > 0
          ? installed.filter(c => components.includes(c.name))
          : installed;
        
        if (toUpdate.length === 0) {
          logger.warn('None of the specified components are installed.');
          return;
        }
        
        // Check for updates
        spinner.start('Checking for updates...');
        const updates = await Promise.all(
          toUpdate.map(async (component) => {
            const latest = await registry.getComponent(component.name);
            return {
              name: component.name,
              current: component.version,
              latest: latest.metadata.version,
              hasUpdate: component.version !== latest.metadata.version
            };
          })
        );
        spinner.stop();
        
        // Filter components that have updates
        const availableUpdates = updates.filter(u => u.hasUpdate);
        
        if (availableUpdates.length === 0) {
          logger.success('All components are up to date!');
          return;
        }
        
        // Show available updates
        logger.info('Available updates:');
        availableUpdates.forEach(update => {
          logger.info(`  ${update.name}: ${chalk.gray(update.current)} → ${chalk.green(update.latest)}`);
        });
        
        if (options.check) {
          return;
        }
        
        // Confirm update
        if (!options.yes && !options.dryRun) {
          logger.info(`\nThis will update ${availableUpdates.length} components.`);
        }
        
        // Perform updates
        spinner.start('Updating components...');
        const results = await installer.update(availableUpdates.map(u => u.name));
        spinner.stop();
        
        // Show results
        if (results.updated.length > 0) {
          logger.success(`Updated ${results.updated.length} components:`);
          results.updated.forEach(name => {
            const update = availableUpdates.find(u => u.name === name);
            logger.info(`  ${chalk.green('✓')} ${name} ${chalk.gray(update?.current)} → ${chalk.green(update?.latest)}`);
          });
        }
        
        if (results.failed.length > 0) {
          logger.error(`Failed to update ${results.failed.length} components:`);
          results.failed.forEach(({ name, error }) => {
            logger.error(`  ${chalk.red('✗')} ${name}: ${error.message}`);
          });
        }
        
        // Show dependency updates
        if (results.dependencies.length > 0 && !options.dryRun) {
          logger.warn('\n📦 Updated dependencies required:');
          logger.info(chalk.cyan(`npm install ${results.dependencies.join(' ')}`));
        }
        
      } catch (error) {
        spinner.fail('Update check failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}