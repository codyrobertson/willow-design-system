/**
 * Init Command Implementation
 */

import { Command } from 'commander';
import path from 'path';
import { promises as fs } from 'fs';
import { 
  InitOptions,
  InitOptionsSchema,
  CommandResult,
  CLIError,
  CLIErrorCode 
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { argumentParser } from '../../core/ArgumentParser.js';
import { 
  configManager, 
  ConfigLoader, 
  CONFIG_PRESETS,
  configValidator 
} from '../../config/index.js';
import { getPrompts } from '../../ui/index.js';

export class InitCommand {
  static command = 'init';
  static description = 'Initialize Willow in your project';

  static builder(cmd: Command): void {
    cmd
      .option('--framework <name>', 'framework to use (react, vue, angular)')
      .option('--ui-kit <kit>', 'UI kit adapter (shadcn, material, bootstrap)')
      .option('--typescript', 'use TypeScript (default: auto-detect)')
      .option('--style <type>', 'styling approach (tailwind, css-modules, styled)')
      .option('--skip-install', 'skip dependency installation')
      .option('-f, --force', 'overwrite existing configuration')
      .option('-i, --interactive', 'interactive mode (default)', true)
      .option('--preset <name>', 'use a preset configuration');
  }

  static async action(
    context: CommandContext,
    options: InitOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;
    const prompts = getPrompts();

    // Validate options
    const validatedOptions = argumentParser.parse(
      options,
      InitOptionsSchema,
      'init options'
    );

    try {
      // Check for existing configuration
      if (!validatedOptions.force && await configManager.exists()) {
        const overwrite = await prompts.confirm(
          'Configuration already exists. Overwrite?',
          false
        );
        
        if (!overwrite) {
          return {
            success: false,
            error: new CLIError(
              CLIErrorCode.CONFIGURATION_ERROR,
              'Configuration already exists'
            ),
          };
        }
      }

      progress.start('Initializing Willow configuration...');

      let config;

      // Use preset if provided
      if (validatedOptions.preset) {
        const preset = CONFIG_PRESETS[validatedOptions.preset];
        if (!preset) {
          throw new CLIError(
            CLIErrorCode.INVALID_ARGUMENTS,
            `Unknown preset: ${validatedOptions.preset}`
          );
        }
        config = { ...configManager.get(), ...preset };
      } 
      // Interactive mode
      else if (validatedOptions.interactive && !validatedOptions.framework) {
        config = await this.runInteractiveSetup(context);
        if (!config) {
          return { success: false };
        }
      } 
      // Use provided options
      else {
        config = await this.createConfigFromOptions(context, validatedOptions);
      }

      // Validate configuration
      const validation = await configValidator.validate(config);
      if (!validation.valid) {
        logger.error('Configuration validation failed:');
        validation.errors.forEach(err => {
          logger.error(`  - ${err.path}: ${err.message}`);
        });
        
        throw new CLIError(
          CLIErrorCode.CONFIGURATION_ERROR,
          'Invalid configuration'
        );
      }

      // Show warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warn => {
          logger.warn(`${warn.path}: ${warn.message}`);
          if (warn.suggestion) {
            logger.info(`  Suggestion: ${warn.suggestion}`);
          }
        });
      }

      // Create directories
      progress.progress('Creating directories...');
      await this.createDirectories(config.paths);

      // Save configuration
      progress.progress('Saving configuration...');
      await configManager.save(config);

      // Install dependencies if needed
      if (!validatedOptions.skipInstall) {
        await this.installDependencies(context, config);
      }

      // Create starter files
      await this.createStarterFiles(context, config);

      progress.succeed('Willow initialized successfully!');

      // Show next steps
      logger.section('Next Steps');
      logger.info('1. Install a component:');
      logger.info('   willow add button');
      logger.info('');
      logger.info('2. View available components:');
      logger.info('   willow list');
      logger.info('');
      logger.info('3. Configure your theme:');
      logger.info('   willow theme create');

      return {
        success: true,
        data: { config, configPath: configManager.getConfigPath() },
      };

    } catch (error) {
      progress.fail('Initialization failed');
      
      if (error instanceof CLIError) {
        throw error;
      }
      
      throw new CLIError(
        CLIErrorCode.UNKNOWN_ERROR,
        'Failed to initialize Willow',
        error
      );
    }
  }

  private static async runInteractiveSetup(context: CommandContext): Promise<any> {
    const prompts = getPrompts();
    const { logger } = context;

    logger.section('Willow Configuration Setup');

    // Ask for preset first
    const preset = await prompts.selectPreset();
    if (preset) {
      const presetConfig = CONFIG_PRESETS[preset];
      const confirmed = await prompts.showSummary([
        { label: 'Preset', value: preset },
        { label: 'Framework', value: presetConfig.framework! },
        { label: 'UI Kit', value: presetConfig.uiKit! },
        { label: 'Style', value: presetConfig.style! },
      ]);
      
      if (confirmed) {
        return { ...configManager.get(), ...presetConfig };
      }
    }

    // Manual configuration
    const framework = await prompts.selectFramework();
    if (!framework) return null;

    const uiKit = await prompts.selectUIKit(framework);
    if (!uiKit) return null;

    const style = await prompts.selectStyle(uiKit);
    if (!style) return null;

    const typescript = await prompts.confirm('Use TypeScript?', true);

    const componentPath = await prompts.inputPath(
      'Where should components be installed?',
      'src/components'
    );
    if (!componentPath) return null;

    // Show summary
    const confirmed = await prompts.showSummary([
      { label: 'Framework', value: framework },
      { label: 'UI Kit', value: uiKit },
      { label: 'Style', value: style },
      { label: 'TypeScript', value: typescript ? 'Yes' : 'No' },
      { label: 'Components', value: componentPath },
    ]);

    if (!confirmed) return null;

    return {
      ...configManager.get(),
      framework,
      uiKit,
      style,
      typescript,
      paths: {
        ...configManager.get().paths,
        components: componentPath,
      },
    };
  }

  private static async createConfigFromOptions(
    context: CommandContext,
    options: InitOptions
  ): Promise<any> {
    const { logger } = context;
    const currentConfig = configManager.get();

    // Auto-detect TypeScript if not specified
    let typescript = options.typescript;
    if (typescript === undefined) {
      try {
        await fs.access(path.join(process.cwd(), 'tsconfig.json'));
        typescript = true;
        logger.debug('TypeScript detected');
      } catch {
        typescript = false;
      }
    }

    return {
      ...currentConfig,
      framework: options.framework || currentConfig.framework,
      uiKit: options.uiKit || currentConfig.uiKit,
      style: options.style || currentConfig.style,
      typescript: typescript ?? currentConfig.typescript,
    };
  }

  private static async createDirectories(paths: Record<string, string>): Promise<void> {
    for (const [key, dirPath] of Object.entries(paths)) {
      const fullPath = path.resolve(dirPath);
      await fs.mkdir(fullPath, { recursive: true });
    }
  }

  private static async installDependencies(
    context: CommandContext,
    config: any
  ): Promise<void> {
    const { progress, logger } = context;
    
    progress.progress('Installing dependencies...');

    // Dependencies based on configuration
    const deps: string[] = [];
    
    if (config.style === 'tailwind') {
      deps.push('tailwindcss', 'postcss', 'autoprefixer');
    }
    
    if (config.uiKit === 'shadcn') {
      deps.push('class-variance-authority', 'clsx', 'tailwind-merge');
    }

    if (deps.length === 0) {
      logger.debug('No additional dependencies needed');
      return;
    }

    // TODO: Actually run npm install
    logger.info(`Dependencies to install: ${deps.join(', ')}`);
  }

  private static async createStarterFiles(
    context: CommandContext,
    config: any
  ): Promise<void> {
    const { progress } = context;
    
    progress.progress('Creating starter files...');

    // Create utils file
    const utilsPath = path.join(config.paths.utils, 'cn.ts');
    const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

    await fs.mkdir(path.dirname(utilsPath), { recursive: true });
    await fs.writeFile(utilsPath, utilsContent, 'utf-8');

    // Create README
    const readmePath = path.join(config.paths.components, 'README.md');
    const readmeContent = `# Willow Components

This directory contains components installed by Willow CLI.

## Usage

\`\`\`bash
# Add a component
willow add button

# Update components
willow update

# View installed components
willow list --installed
\`\`\`
`;

    await fs.writeFile(readmePath, readmeContent, 'utf-8');
  }
}