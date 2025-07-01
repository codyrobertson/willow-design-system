/**
 * Transform Command Implementation
 * Converts components between different UI frameworks
 */

import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  TransformOptions,
  TransformOptionsSchema,
  CommandResult,
  CLIError,
  CLIErrorCode,
  Framework,
  UIKit
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { argumentParser } from '../../core/ArgumentParser.js';
import { configManager } from '../../config/index.js';
import { AdapterFactory } from '../../adapters/AdapterFactory.js';

export class TransformCommand {
  static command = 'transform <source> [destination]';
  static description = 'Transform components between UI frameworks';

  static builder(cmd: Command): void {
    cmd
      .option('-f, --from <framework>', 'source framework (react, vue, angular)')
      .option('-t, --to <framework>', 'target framework')
      .option('--from-kit <kit>', 'source UI kit')
      .option('--to-kit <kit>', 'target UI kit')
      .option('--dry-run', 'preview changes without writing files')
      .option('--preserve-styles', 'preserve original styling approach')
      .option('--typescript', 'generate TypeScript output')
      .option('--overwrite', 'overwrite existing files')
      .option('--interactive', 'interactively confirm each transformation')
      .addHelpText('after', `
Examples:
  # Transform a single component
  willow transform Button.tsx --from react --to vue
  
  # Transform entire directory
  willow transform src/components --from react --to angular --typescript
  
  # Transform with UI kit conversion
  willow transform src/mui-components --from-kit material-ui --to-kit shadcn
  
  # Dry run to preview changes
  willow transform MyComponent.jsx --to vue --dry-run
      `);
  }

  static async action(
    context: CommandContext,
    source: string,
    destination: string | undefined,
    options: TransformOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;

    // Validate options
    const validatedOptions = argumentParser.parse(
      options,
      TransformOptionsSchema,
      'transform options'
    );

    try {
      // Load configuration
      const config = configManager.get();
      
      // Determine source and target frameworks
      const sourceFramework = validatedOptions.from || config.framework;
      const targetFramework = validatedOptions.to;
      
      if (!targetFramework) {
        throw new CLIError(
          CLIErrorCode.INVALID_ARGUMENTS,
          'Target framework is required. Use --to option.'
        );
      }

      if (sourceFramework === targetFramework) {
        throw new CLIError(
          CLIErrorCode.INVALID_ARGUMENTS,
          'Source and target frameworks cannot be the same'
        );
      }

      // Determine source and target UI kits
      const sourceUIKit = validatedOptions.fromKit || config.uiKit;
      const targetUIKit = validatedOptions.toKit || config.uiKit;

      progress.start('Initializing transformers...');

      // Get adapters
      const sourceAdapter = await AdapterFactory.getAdapter(sourceUIKit);
      const targetAdapter = await AdapterFactory.getAdapter(targetUIKit);

      // Check if source exists
      const sourceStat = await fs.stat(source);
      const isDirectory = sourceStat.isDirectory();

      let filesToTransform: string[] = [];

      if (isDirectory) {
        // Get all component files in directory
        filesToTransform = await this.getComponentFiles(source, sourceFramework);
        logger.info(`Found ${filesToTransform.length} components to transform`);
      } else {
        filesToTransform = [source];
      }

      if (filesToTransform.length === 0) {
        logger.warn('No components found to transform');
        return { success: true };
      }

      // Determine destination
      const outputDir = destination || (isDirectory ? `${source}-${targetFramework}` : undefined);
      
      if (validatedOptions.dryRun) {
        logger.info('Running in dry-run mode - no files will be written');
      }

      // Transform each file
      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
      };

      for (const file of filesToTransform) {
        try {
          progress.progress(`Transforming ${path.basename(file)}...`);
          
          // Read source file
          const sourceContent = await fs.readFile(file, 'utf-8');
          
          // Parse component
          const parsedComponent = await sourceAdapter.parse(sourceContent, {
            framework: sourceFramework,
            typescript: file.endsWith('.tsx') || file.endsWith('.ts'),
          });

          // Transform to target framework
          const transformedComponent = await targetAdapter.transform(parsedComponent, {
            framework: targetFramework,
            typescript: validatedOptions.typescript,
            preserveStyles: validatedOptions.preserveStyles,
          });

          // Generate output
          const generatedCode = await targetAdapter.generate(transformedComponent, {
            framework: targetFramework,
            typescript: validatedOptions.typescript,
          });

          // Determine output path
          let outputPath: string;
          if (outputDir) {
            const relativePath = path.relative(source, file);
            outputPath = path.join(outputDir, this.updateFileExtension(relativePath, targetFramework, validatedOptions.typescript));
          } else {
            outputPath = this.updateFileExtension(file, targetFramework, validatedOptions.typescript);
          }

          // Interactive confirmation
          if (validatedOptions.interactive && !validatedOptions.dryRun) {
            const { getPrompts } = await import('../../ui/index.js');
            const prompts = getPrompts();
            
            logger.info(`\nSource: ${file}`);
            logger.info(`Target: ${outputPath}`);
            logger.code(generatedCode.substring(0, 200) + '...');
            
            const confirm = await prompts.confirm('Transform this component?', true);
            if (!confirm) {
              results.skipped++;
              continue;
            }
          }

          // Write output
          if (!validatedOptions.dryRun) {
            // Check if file exists
            if (!validatedOptions.overwrite) {
              try {
                await fs.access(outputPath);
                logger.warn(`Skipping ${outputPath} - file already exists (use --overwrite to replace)`);
                results.skipped++;
                continue;
              } catch {
                // File doesn't exist, safe to write
              }
            }

            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, generatedCode, 'utf-8');
            logger.success(`Transformed: ${path.basename(file)} → ${path.basename(outputPath)}`);
          } else {
            logger.info(`Would transform: ${file} → ${outputPath}`);
          }

          results.success++;
        } catch (error) {
          logger.error(`Failed to transform ${file}:`, error);
          results.failed++;
        }
      }

      progress.succeed('Transformation complete!');

      // Summary
      logger.section('Summary');
      logger.info(`✓ Successfully transformed: ${results.success}`);
      if (results.failed > 0) {
        logger.error(`✗ Failed: ${results.failed}`);
      }
      if (results.skipped > 0) {
        logger.warn(`⚠ Skipped: ${results.skipped}`);
      }

      return {
        success: results.failed === 0,
        data: results,
      };
    } catch (error) {
      progress.fail('Transformation failed');
      
      if (error instanceof CLIError) {
        throw error;
      }
      
      throw new CLIError(
        CLIErrorCode.UNKNOWN_ERROR,
        'Transformation failed',
        error
      );
    }
  }

  /**
   * Get component files from directory
   */
  private static async getComponentFiles(dir: string, framework: Framework): Promise<string[]> {
    const extensions = this.getFrameworkExtensions(framework);
    const files: string[] = [];

    async function walk(currentDir: string): Promise<void> {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    await walk(dir);
    return files;
  }

  /**
   * Get file extensions for framework
   */
  private static getFrameworkExtensions(framework: Framework): string[] {
    const extensionMap: Record<Framework, string[]> = {
      react: ['.jsx', '.tsx', '.js', '.ts'],
      vue: ['.vue', '.js', '.ts'],
      angular: ['.component.ts', '.ts'],
    };

    return extensionMap[framework] || [];
  }

  /**
   * Update file extension for target framework
   */
  private static updateFileExtension(filePath: string, framework: Framework, typescript?: boolean): string {
    const baseName = path.basename(filePath, path.extname(filePath));
    const dirName = path.dirname(filePath);

    const extensionMap: Record<Framework, string> = {
      react: typescript ? '.tsx' : '.jsx',
      vue: '.vue',
      angular: '.component.ts',
    };

    const newExtension = extensionMap[framework] || '.js';
    return path.join(dirName, baseName + newExtension);
  }
}