/**
 * Init Command Implementation using the new command infrastructure
 */

import { Command } from 'commander';
import path from 'path';
import { promises as fs } from 'fs';
import { z } from 'zod';
import { 
  InteractiveCommand,
  InteractiveOptions,
  CommandContext,
  CommandResult,
  CLIError,
  CLIErrorCode
} from '../../core/commands/index.js';
import { 
  InitOptionsSchema,
  InitOptions as InitOptionsType
} from '../../types/cli.js';
import { 
  configManager, 
  ConfigLoader, 
  CONFIG_PRESETS,
  configValidator 
} from '../../config/index.js';

/**
 * Extended init options with interactive support
 */
interface InitOptions extends InitOptionsType, InteractiveOptions {}

/**
 * Init command using new infrastructure
 */
export class InitCommandV2 extends InteractiveCommand<InitOptions> {
  constructor() {
    super({
      name: 'init',
      description: 'Initialize Willow in your project',
      category: 'setup',
      examples: [
        {
          description: 'Initialize with React and Tailwind',
          command: 'willow init --framework react --style tailwind'
        },
        {
          description: 'Initialize with a preset',
          command: 'willow init --preset shadcn'
        },
        {
          description: 'Initialize in non-interactive mode',
          command: 'willow init --framework react --ui-kit shadcn --no-interactive'
        }
      ]
    });

    // Set options schema for validation
    this.setOptionsSchema(InitOptionsSchema.merge(z.object({
      interactive: z.boolean().optional(),
      yes: z.boolean().optional(),
      defaults: z.boolean().optional()
    })));

    // Set lifecycle hooks
    this.setLifecycleHooks({
      beforeExecute: async (context, options) => {
        context.logger.debug('Initializing Willow configuration...');
      },
      afterExecute: async (context, options, result) => {
        if (result.success) {
          context.logger.success('Willow initialized successfully!');
        }
        return result;
      },
      onError: async (error, context, options) => {
        context.logger.error('Initialization failed:', error.message);
      }
    });
  }

  /**
   * Configure additional options
   */
  protected configureAdditionalOptions(cmd: Command): void {
    cmd
      .option('--framework <name>', 'framework to use (react, vue, angular)')
      .option('--ui-kit <kit>', 'UI kit adapter (shadcn, material, bootstrap)')
      .option('--typescript', 'use TypeScript (default: auto-detect)')
      .option('--style <type>', 'styling approach (tailwind, css-modules, styled)')
      .option('--skip-install', 'skip dependency installation')
      .option('-f, --force', 'overwrite existing configuration')
      .option('--preset <name>', 'use a preset configuration');
  }

  /**
   * Run in interactive mode
   */
  async runInteractive(context: CommandContext): Promise<InitOptions> {
    const { logger } = context;

    logger.section('Willow Configuration Setup');

    // Ask for preset first
    const preset = await this.selectOption(
      'Choose a preset configuration',
      Object.keys(CONFIG_PRESETS).map(key => ({
        title: key,
        value: key,
        description: `Use ${key} preset configuration`
      })).concat([{
        title: 'Custom',
        value: null as any,
        description: 'Configure manually'
      }]),
      { interactive: true } as InitOptions
    );

    if (preset && preset !== 'Custom') {
      const presetConfig = CONFIG_PRESETS[preset];
      const items = [
        { label: 'Preset', value: preset },
        { label: 'Framework', value: presetConfig.framework! },
        { label: 'UI Kit', value: presetConfig.uiKit! },
        { label: 'Style', value: presetConfig.style! },
      ];

      const confirmed = await this.showSummaryAndConfirm(
        'Configuration Summary',
        items,
        { interactive: true } as InitOptions
      );

      if (confirmed) {
        return {
          preset,
          interactive: true
        } as InitOptions;
      }
    }

    // Manual configuration
    const framework = await this.selectOption(
      'Select framework',
      [
        { title: 'React', value: 'react', description: 'React framework' },
        { title: 'Vue', value: 'vue', description: 'Vue.js framework' },
        { title: 'Angular', value: 'angular', description: 'Angular framework' },
        { title: 'Svelte', value: 'svelte', description: 'Svelte framework' },
        { title: 'Solid', value: 'solid', description: 'SolidJS framework' }
      ],
      { interactive: true } as InitOptions,
      'react'
    );

    const uiKit = await this.selectOption(
      'Select UI kit',
      [
        { title: 'shadcn/ui', value: 'shadcn', description: 'Beautifully designed components' },
        { title: 'Material UI', value: 'material', description: 'React components for faster development' },
        { title: 'Bootstrap', value: 'bootstrap', description: 'The most popular CSS framework' },
        { title: 'Ant Design', value: 'antd', description: 'Enterprise-class UI design language' },
        { title: 'Chakra UI', value: 'chakra', description: 'Simple, modular and accessible' },
        { title: 'Mantine', value: 'mantine', description: 'Full featured React components library' }
      ],
      { interactive: true } as InitOptions,
      'shadcn'
    );

    const style = await this.selectOption(
      'Select styling approach',
      [
        { title: 'Tailwind CSS', value: 'tailwind', description: 'Utility-first CSS framework' },
        { title: 'CSS Modules', value: 'css-modules', description: 'Locally scoped CSS' },
        { title: 'Styled Components', value: 'styled-components', description: 'CSS-in-JS styling' },
        { title: 'Emotion', value: 'emotion', description: 'CSS-in-JS library' },
        { title: 'SCSS', value: 'scss', description: 'Sass preprocessor' }
      ],
      { interactive: true } as InitOptions,
      'tailwind'
    );

    const typescript = await this.confirmAction(
      'Use TypeScript?',
      { interactive: true } as InitOptions,
      true
    );

    const componentPath = await this.getInput(
      'Where should components be installed?',
      { interactive: true } as InitOptions,
      'src/components'
    );

    return {
      framework: framework as any,
      uiKit: uiKit as any,
      style: style as any,
      typescript,
      interactive: true
    } as InitOptions;
  }

  /**
   * Validate options for non-interactive mode
   */
  protected async validateNonInteractiveOptions(
    options: InitOptions,
    context: CommandContext
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!options.preset && !options.framework) {
      errors.push('Either --preset or --framework is required in non-interactive mode');
    }

    if (!options.preset && options.framework && !options.uiKit) {
      errors.push('--ui-kit is required when --framework is specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute the command
   */
  protected async executeCommand(
    context: CommandContext,
    options: InitOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;

    try {
      // Check environment requirements
      await this.validateEnvironment(context, {
        files: ['package.json']
      });

      // Check for existing configuration
      if (!options.force && await configManager.exists()) {
        const overwrite = await this.confirmAction(
          'Configuration already exists. Overwrite?',
          options,
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
      if (options.preset) {
        const preset = CONFIG_PRESETS[options.preset];
        if (!preset) {
          throw new CLIError(
            CLIErrorCode.INVALID_ARGUMENTS,
            `Unknown preset: ${options.preset}`
          );
        }
        config = { ...configManager.get(), ...preset };
      } else {
        config = await this.createConfigFromOptions(context, options);
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
      if (!options.skipInstall) {
        await this.installDependencies(context, config);
      }

      // Create starter files
      await this.createStarterFiles(context, config);

      progress.succeed('Willow initialized successfully!');

      // Show next steps
      this.showNextSteps(logger);

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

  private async createConfigFromOptions(
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

  private async createDirectories(paths: Record<string, string>): Promise<void> {
    for (const [key, dirPath] of Object.entries(paths)) {
      const fullPath = path.resolve(dirPath);
      await fs.mkdir(fullPath, { recursive: true });
    }
  }

  private async installDependencies(
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

  private async createStarterFiles(
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

  private showNextSteps(logger: any): void {
    logger.section('Next Steps');
    logger.info('1. Install a component:');
    logger.info('   willow add button');
    logger.info('');
    logger.info('2. View available components:');
    logger.info('   willow list');
    logger.info('');
    logger.info('3. Configure your theme:');
    logger.info('   willow theme create');
  }
}