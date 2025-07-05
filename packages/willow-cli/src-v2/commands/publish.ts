/**
 * Publish Command - Publish components to Willow registry
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { CommandContext } from '../core/command-loader';
import { ComponentPublisher } from '../registry/publisher';
import { ASTParser } from '../docs/ast-parser';

export function createPublishCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('publish')
    .description('Publish a component to the Willow registry')
    .argument('<path>', 'Path to component directory or file')
    .option('--name <name>', 'Component name (defaults to directory name)')
    .option('--version <version>', 'Component version (defaults to 1.0.0)')
    .option('--category <category>', 'Component category (ui/layout/utility/hook/provider)')
    .option('--private', 'Publish as private component')
    .option('--dry-run', 'Preview what will be published')
    .option('--token <token>', 'Registry authentication token')
    .option('--tag <tags...>', 'Add tags to component')
    .action(async (componentPath: string, options) => {
      const spinner = ora();
      
      try {
        // Validate authentication
        const token = options.token || process.env.WILLOW_REGISTRY_TOKEN;
        if (!token && !options.dryRun) {
          logger.error('Authentication required. Set WILLOW_REGISTRY_TOKEN or use --token');
          process.exit(1);
        }
        
        // Parse component
        spinner.start('Analyzing component...');
        const parser = new ASTParser();
        const componentData = await parser.parseComponent(componentPath);
        spinner.stop();
        
        // Build metadata
        const metadata = {
          name: options.name || componentData.name,
          version: options.version || '1.0.0',
          description: componentData.description,
          category: options.category || 'ui',
          tags: options.tag || [],
          ...componentData.metadata
        };
        
        // Show what will be published
        logger.info('Publishing component:');
        logger.info(`  Name: ${chalk.cyan(metadata.name)}`);
        logger.info(`  Version: ${chalk.cyan(metadata.version)}`);
        logger.info(`  Category: ${chalk.cyan(metadata.category)}`);
        if (metadata.tags.length > 0) {
          logger.info(`  Tags: ${chalk.cyan(metadata.tags.join(', '))}`);
        }
        if (options.private) {
          logger.info(`  Visibility: ${chalk.yellow('Private')}`);
        }
        
        // Show files
        logger.info('\nFiles to publish:');
        Object.keys(componentData.files).forEach(file => {
          logger.info(`  - ${file}`);
        });
        
        if (options.dryRun) {
          logger.info('\n✨ Dry run complete. No files were published.');
          return;
        }
        
        // Publish component
        const publisher = new ComponentPublisher({
          logger,
          registryURL: config.registry?.url
        });
        
        spinner.start('Publishing to registry...');
        const result = await publisher.publish({
          component: {
            metadata: metadata as any,
            files: componentData.files,
            content: componentData.content
          },
          token,
          private: options.private,
          tags: options.tag
        });
        spinner.stop();
        
        // Show success
        logger.success(`Component published successfully!`);
        logger.info(`  URL: ${chalk.cyan(result.url)}`);
        logger.info(`  ID: ${chalk.gray(result.id)}`);
        
        // Show usage
        logger.info('\n💡 Install your component:');
        logger.info(chalk.cyan(`  willow add ${metadata.name}`));
        
      } catch (error) {
        spinner.fail('Publishing failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}