/**
 * Docs Command - Generate documentation for components
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { CommandContext } from '../core/command-loader';
import { DocumentationGenerator } from '../docs/doc-generator';
import { StoryGenerator } from '../docs/story-generator';
import { detectFramework } from '../utils/framework-detector';

export function createDocsCommand(context: CommandContext): Command {
  const { logger, config } = context;
  
  return new Command('docs')
    .description('Generate documentation for your components')
    .option('--components <path>', 'Path to components directory', 'src/components')
    .option('--output <path>', 'Output directory for docs', 'docs')
    .option('--format <format>', 'Documentation format (markdown, html, json)', 'markdown')
    .option('--stories', 'Generate Storybook stories')
    .option('--watch', 'Watch for changes and regenerate')
    .option('--serve', 'Start a documentation server')
    .option('--port <port>', 'Server port', '3333')
    .action(async (options) => {
      const spinner = ora();
      
      try {
        // Detect framework
        const framework = await detectFramework();
        
        const componentsPath = options.components.startsWith('/') 
          ? options.components 
          : join(process.cwd(), options.components);
        
        const outputPath = options.output.startsWith('/')
          ? options.output
          : join(process.cwd(), options.output);
        
        // Generate documentation
        const docGenerator = new DocumentationGenerator({
          logger,
          outputDir: outputPath,
          format: options.format,
          includeExamples: true,
          includeTypes: framework.typescript
        });
        
        spinner.start('Scanning components...');
        const components = await docGenerator.scanComponents(componentsPath);
        spinner.succeed(`Found ${components.length} components`);
        
        // Generate docs
        spinner.start('Generating documentation...');
        const docsGenerated = await docGenerator.generate(components);
        spinner.succeed(`Generated documentation for ${docsGenerated.length} components`);
        
        // Generate stories if requested
        if (options.stories) {
          spinner.start('Generating Storybook stories...');
          const storyGenerator = new StoryGenerator({ logger });
          const storiesGenerated = await storyGenerator.generateForComponents(components);
          spinner.succeed(`Generated ${storiesGenerated.length} stories`);
        }
        
        // Show results
        logger.success('\n✨ Documentation generated successfully!');
        logger.info(`Output directory: ${chalk.cyan(outputPath)}`);
        
        // Start server if requested
        if (options.serve) {
          logger.info(`\nStarting documentation server on port ${options.port}...`);
          await startDocServer(outputPath, parseInt(options.port, 10));
        } else {
          logger.info('\n💡 To view your documentation:');
          logger.info(chalk.cyan(`  willow docs --serve`));
        }
        
        // Watch mode
        if (options.watch) {
          logger.info('\n👀 Watching for changes...');
          await docGenerator.watch(componentsPath, async (changed) => {
            logger.info(`Detected change in ${changed}`);
            const components = await docGenerator.scanComponents(componentsPath);
            await docGenerator.generate(components);
            logger.success('Documentation updated');
          });
        }
        
      } catch (error) {
        spinner.fail('Documentation generation failed');
        logger.error(error as Error);
        process.exit(1);
      }
    });
}

async function startDocServer(docsPath: string, port: number): Promise<void> {
  const express = await import('express');
  const app = express.default();
  
  app.use(express.static(docsPath));
  
  app.get('/', (req, res) => {
    res.sendFile(join(docsPath, 'index.html'));
  });
  
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(chalk.green(`\n📚 Documentation server running at http://localhost:${port}`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray('Press Ctrl+C to stop'));
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('\nDocumentation server stopped');
      process.exit(0);
    });
  });
}