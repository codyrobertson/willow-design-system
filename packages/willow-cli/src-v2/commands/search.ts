/**
 * Search Command - Search for components in the Willow registry
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CommandContext } from '../core/command-loader';
import { SearchEngine } from '../registry/search-engine';

export function createSearchCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('search')
    .description('Search for components in the Willow registry')
    .argument('[query]', 'Search query')
    .option('--category <category>', 'Filter by category (ui, layout, utility, hook, provider)')
    .option('--framework <framework>', 'Filter by framework (react, vue, svelte)')
    .option('--tags <tags...>', 'Filter by tags')
    .option('--sort <sort>', 'Sort results (relevance, downloads, rating, date)', 'relevance')
    .option('--limit <limit>', 'Number of results to show', '10')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options) => {
      const spinner = ora();
      
      try {
        const searchEngine = new SearchEngine({
          registryURL: config.registry?.url
        });
        
        // Build search options
        const searchOptions = {
          query: query || '',
          category: options.category,
          framework: options.framework,
          tags: options.tags,
          sortBy: options.sort,
          limit: parseInt(options.limit, 10)
        };
        
        // Perform search
        spinner.start('Searching components...');
        const results = await searchEngine.search(searchOptions);
        spinner.stop();
        
        // Output JSON if requested
        if (options.json) {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(results, null, 2));
          return;
        }
        
        // Display results
        if (results.components.length === 0) {
          logger.warn('No components found matching your search.');
          return;
        }
        
        logger.info(`Found ${results.total} components (showing ${results.components.length}):\n`);
        
        results.components.forEach((component, index) => {
          logger.info(chalk.cyan(`${index + 1}. ${component.name}`) + 
            chalk.gray(` v${component.version}`));
          
          if (component.description) {
            logger.info(`   ${component.description}`);
          }
          
          logger.info(`   ${chalk.gray('Category:')} ${component.category}` +
            (component.framework ? ` | ${chalk.gray('Framework:')} ${component.framework}` : ''));
          
          if (component.tags && component.tags.length > 0) {
            logger.info(`   ${chalk.gray('Tags:')} ${component.tags.join(', ')}`);
          }
          
          if (component.downloads) {
            logger.info(`   ${chalk.gray('Downloads:')} ${component.downloads.toLocaleString()}` +
              (component.rating ? ` | ${chalk.gray('Rating:')} ⭐ ${component.rating}/5` : ''));
          }
          
          logger.info(`   ${chalk.gray('Install:')} ${chalk.cyan(`willow add ${component.name}`)}`);
          logger.info('');
        });
        
        // Show facets if available
        if (results.facets) {
          logger.info(chalk.bold('Filter by:'));
          
          if (results.facets.categories) {
            const categories = Object.entries(results.facets.categories)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);
            logger.info(`  ${chalk.gray('Categories:')} ${categories.map(([cat, count]) => 
              `${cat} (${count})`).join(', ')}`);
          }
          
          if (results.facets.tags) {
            const tags = Object.entries(results.facets.tags)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8);
            logger.info(`  ${chalk.gray('Popular tags:')} ${tags.map(([tag, count]) => 
              `${tag} (${count})`).join(', ')}`);
          }
        }
        
        // Show pagination hint
        if (results.total > results.components.length) {
          logger.info(`\n${chalk.gray('Showing')} ${results.components.length} ${chalk.gray('of')} ${results.total} ${chalk.gray('results.')}`);
          logger.info(chalk.gray('Use --limit to see more results.'));
        }
        
      } catch (error) {
        spinner.fail('Search failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}