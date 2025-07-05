/**
 * Import Command - Bulk import components from shadcn/ui or other sources
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CommandContext } from '../core/command-loader';
import { ComponentInstaller } from '../core/component-installer';
import { RegistryClient } from '../registry/client';
import { detectFramework } from '../utils/framework-detector';

interface ImportSource {
  name: string;
  url: string;
  transform?: (component: any) => any;
}

const IMPORT_SOURCES: Record<string, ImportSource> = {
  'shadcn': {
    name: 'shadcn/ui',
    url: 'https://ui.shadcn.com/api/components',
    transform: (component) => ({
      name: component.name,
      files: component.files,
      dependencies: component.dependencies,
      devDependencies: component.devDependencies
    })
  },
  'radix': {
    name: 'Radix UI',
    url: 'https://radix-ui.com/api/components',
    transform: (component) => component
  }
};

export function createImportCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('import')
    .description('Import components from external sources')
    .option('--from <source>', 'Import source (shadcn, radix)', 'shadcn')
    .option('--all', 'Import all available components')
    .option('--components <names...>', 'Specific components to import')
    .option('--dry-run', 'Preview what will be imported')
    .option('--transform', 'Transform to Willow style')
    .option('--registry', 'Publish to Willow registry after import')
    .action(async (options) => {
      const spinner = ora();
      
      try {
        // Get import source
        const source = IMPORT_SOURCES[options.from];
        if (!source) {
          logger.error(`Unknown import source: ${options.from}`);
          logger.info('Available sources:', Object.keys(IMPORT_SOURCES).join(', '));
          process.exit(1);
        }
        
        // Detect framework
        const framework = await detectFramework();
        if (framework.type === 'unknown') {
          logger.error('No supported framework detected.');
          process.exit(1);
        }
        
        spinner.start(`Fetching components from ${source.name}...`);
        
        // Fetch available components
        const registry = new RegistryClient({ baseURL: source.url });
        const availableComponents = await registry.listComponents();
        spinner.succeed(`Found ${availableComponents.length} components`);
        
        // Determine which components to import
        let componentsToImport = availableComponents;
        if (!options.all) {
          if (options.components && options.components.length > 0) {
            componentsToImport = availableComponents.filter(c => 
              options.components.includes(c.name)
            );
          } else {
            logger.error('Specify --all or --components <names...>');
            process.exit(1);
          }
        }
        
        if (componentsToImport.length === 0) {
          logger.warn('No components found to import.');
          return;
        }
        
        // Show what will be imported
        logger.info(`Importing ${componentsToImport.length} components:`);
        componentsToImport.forEach(c => logger.info(`  - ${c.name}`));
        
        if (options.dryRun) {
          logger.info('\n✨ Dry run complete. No files were imported.');
          return;
        }
        
        // Import components
        const installer = new ComponentInstaller({
          logger,
          config,
          framework
        });
        
        spinner.start('Importing components...');
        const results = {
          imported: [] as string[],
          failed: [] as { name: string; error: Error }[],
          transformed: [] as string[]
        };
        
        for (const component of componentsToImport) {
          try {
            // Fetch component data
            const componentData = await registry.getComponent(component.name);
            
            // Transform if needed
            let finalData = componentData;
            if (options.transform && source.transform) {
              finalData = source.transform(componentData);
              results.transformed.push(component.name);
            }
            
            // Install component
            await installer.installComponent(finalData);
            results.imported.push(component.name);
            
            // Publish to registry if requested
            if (options.registry) {
              // TODO: Implement registry publishing
              logger.debug(`Would publish ${component.name} to registry`);
            }
          } catch (error) {
            results.failed.push({ 
              name: component.name, 
              error: error as Error 
            });
          }
        }
        
        spinner.stop();
        
        // Show results
        if (results.imported.length > 0) {
          logger.success(`Imported ${results.imported.length} components:`);
          results.imported.forEach(name => {
            logger.info(`  ${chalk.green('✓')} ${name}`);
          });
        }
        
        if (results.failed.length > 0) {
          logger.error(`Failed to import ${results.failed.length} components:`);
          results.failed.forEach(({ name, error }) => {
            logger.error(`  ${chalk.red('✗')} ${name}: ${error.message}`);
          });
        }
        
        if (results.transformed.length > 0) {
          logger.info(`\n🎨 Transformed ${results.transformed.length} components to Willow style`);
        }
        
        // Show next steps
        if (results.imported.length > 0) {
          logger.info('\n💡 Components imported successfully!');
          logger.info('You can now use them in your project.');
          
          if (options.registry) {
            logger.info('\n📦 To share these components:');
            logger.info(chalk.cyan('  willow publish <component-path>'));
          }
        }
        
      } catch (error) {
        spinner.fail('Import failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}