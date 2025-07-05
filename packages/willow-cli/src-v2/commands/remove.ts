/**
 * Remove Command - Uninstall Willow components
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CommandContext } from '../core/command-loader';
import { ComponentInstaller } from '../core/component-installer';
import { detectFramework } from '../utils/framework-detector';

export function createRemoveCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('remove')
    .description('Remove Willow components from your project')
    .argument('<components...>', 'Component names to remove')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--dry-run', 'Preview what will be removed')
    .option('--keep-deps', 'Keep npm dependencies')
    .action(async (components: string[], options) => {
      const spinner = ora();
      
      try {
        // Detect framework
        const framework = await detectFramework();
        if (framework.type === 'unknown') {
          logger.error('No supported framework detected.');
          process.exit(1);
        }
        
        // Confirm removal
        if (!options.yes && !options.dryRun) {
          logger.warn('This will remove the following components:');
          components.forEach(c => logger.info(`  - ${c}`));
          logger.warn('Files will be permanently deleted.');
        }
        
        // Remove components
        const installer = new ComponentInstaller({
          logger,
          config,
          framework,
          dryRun: options.dryRun
        });
        
        spinner.start('Removing components...');
        const results = await installer.remove(components);
        spinner.stop();
        
        // Show results
        if (results.removed.length > 0) {
          logger.success(`Removed ${results.removed.length} components:`);
          results.removed.forEach(name => {
            logger.info(`  ${chalk.green('✓')} ${name}`);
          });
        }
        
        if (results.failed.length > 0) {
          logger.error(`Failed to remove ${results.failed.length} components:`);
          results.failed.forEach(({ name, error }) => {
            logger.error(`  ${chalk.red('✗')} ${name}: ${error.message}`);
          });
        }
        
        if (results.notFound.length > 0) {
          logger.warn(`Not found ${results.notFound.length} components:`);
          results.notFound.forEach(name => {
            logger.info(`  ${chalk.yellow('-')} ${name}`);
          });
        }
        
        // Show dependency cleanup hint
        if (results.removed.length > 0 && !options.keepDeps && !options.dryRun) {
          logger.info('\n💡 You may want to remove unused dependencies:');
          logger.info(chalk.gray('npm uninstall <package-name>'));
        }
        
      } catch (error) {
        spinner.fail('Removal failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}