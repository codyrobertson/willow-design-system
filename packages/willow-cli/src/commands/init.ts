import { Command } from 'commander';
import { execSync } from 'child_process';
import { writeFile } from 'fs/promises';
import {
  fileExists,
  createDirectory,
  writeFileContent,
  getComponentDir,
  getLibDir,
} from '../utils/fileSystem.js';
import {
  createComponentsJson,
  createGlobalCSS,
  createTailwindConfig,
  createPostCSSConfig,
  createViteConfig,
  createTSConfig,
  createBoltPrompt,
} from '../utils/configTemplates.js';
import { detectProjectType, validateProjectRequirements, logProjectEnvironment } from '../utils/projectDetection.js';
import { createDesignSystemFiles, createCoreLibFiles, createVersionFile } from '../utils/createDesignSystemFiles.js';
import { handleError, safeExecute, ProgressTracker } from '../utils/errorHandling.js';
import { Logger } from '../utils/logger.js';
import { fixWillowImports } from '../utils/importFixer.js';
import type { ProjectType } from '../types/index.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Willow Design System in your project')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--no-install', 'Skip dependency installation')
    .option('--force', 'Overwrite existing configuration')
    .option('--with-components', 'Install all Willow components after initialization')
    .option('--include-unstable', 'Include unstable components (avatar, tooltip)')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      if (options.debug) {
        Logger.setDebugMode(true);
      }
      
      Logger.title('Initializing Willow Design System');
      
      const progressTracker = new ProgressTracker();
      progressTracker.addStep('Validate project');
      progressTracker.addStep('Detect project type');
      progressTracker.addStep('Create directories');
      progressTracker.addStep('Create configuration files');
      progressTracker.addStep('Create design system files');
      progressTracker.addStep('Setup CSS');
      progressTracker.addStep('Install dependencies');
      progressTracker.addStep('Install components');
      progressTracker.addStep('Fix imports');
      progressTracker.addStep('Install docs');
      
      try {
        // Step 1: Validate project
        await progressTracker.executeStep('Validate project', async () => {
          if (!(await fileExists('package.json'))) {
            throw new Error('No package.json found. Please run this command in a project root.');
          }
          
          const validation = await validateProjectRequirements();
          if (!validation.valid) {
            Logger.error('Project validation failed:');
            validation.issues.forEach(issue => Logger.error(issue, { prefix: '  •' }));
            throw new Error('Project requirements not met');
          }
          
          if (validation.warnings.length > 0) {
            Logger.warning('Project warnings:');
            validation.warnings.forEach(warning => Logger.warning(warning, { prefix: '  •' }));
          }
        });
        
        // Step 2: Detect project type
        const projectType = await progressTracker.executeStep('Detect project type', async () => {
          const detected = await detectProjectType();
          logProjectEnvironment(detected);
          
          // For online IDEs, force specific options
          if (detected.isOnlineIDE) {
            options.force = true;
            options.install = true;
            options.yes = true;
            Logger.info('Online IDE detected - auto-configuring for best experience', { prefix: '🚀' });
          }
          
          return detected;
        });
        
        // Check for existing configuration
        if (await fileExists('components.json') && !options.force) {
          throw new Error('Components.json already exists! Use --force to overwrite existing configuration.');
        }
        
        // Step 3: Create directories
        await progressTracker.executeStep('Create directories', async () => {
          const componentDir = await getComponentDir(projectType);
          const libDir = await getLibDir(projectType);
          
          await createDirectory(componentDir);
          await createDirectory(libDir);
          
          Logger.debug(`Component directory: ${componentDir}`);
          Logger.debug(`Library directory: ${libDir}`);
        });
        
        // Step 4: Create configuration files
        await progressTracker.executeStep('Create configuration files', async () => {
          const componentDir = await getComponentDir(projectType);
          const libDir = await getLibDir(projectType);
          
          // Create components.json
          const componentsConfig = createComponentsJson(projectType);
          await writeFileContent('components.json', JSON.stringify(componentsConfig, null, 2));
          Logger.substep('Created components.json');
          
          // Create core lib files
          await createCoreLibFiles(libDir, projectType);
          Logger.substep('Created core library files');
          
          // Create version tracking
          await safeExecute(
            () => createVersionFile(),
            'Version file creation',
            { logWarning: false }
          );
        });
        
        // Step 5: Create design system files
        await progressTracker.executeStep('Create design system files', async () => {
          const libDir = await getLibDir(projectType);
          await createDesignSystemFiles(libDir, projectType);
        });
        
        // Step 6: Setup CSS and Tailwind
        await progressTracker.executeStep('Setup CSS', async () => {
          // Create global CSS
          const cssPath = await createGlobalCSS(projectType, options.force);
          Logger.substep(`Created ${cssPath} with Willow styles`);
          
          // Create Tailwind config
          const tailwindPath = await createTailwindConfig(projectType, projectType.isOnlineIDE);
          Logger.substep(`Created ${tailwindPath}`);
          
          // Create PostCSS config if needed
          if (!(await fileExists('postcss.config.js'))) {
            await createPostCSSConfig();
            Logger.substep('Created postcss.config.js');
          }
          
          // Create Vite config for Vite projects (especially online IDEs)
          if (projectType.isVite || projectType.isOnlineIDE) {
            await createViteConfig(projectType);
            Logger.substep('Created Vite config with path aliases');
            
            // Create TypeScript config for proper path resolution
            await createTSConfig(projectType);
            Logger.substep('Created TypeScript config with path mappings');
          }
          
          // Create .bolt/prompt for online IDEs
          if (projectType.isOnlineIDE || await fileExists('.bolt')) {
            await createDirectory('.bolt');
            const aiPrompt = await createBoltPrompt();
            await writeFileContent('.bolt/prompt', aiPrompt);
            Logger.substep('Created .bolt/prompt with Willow AI assistant');
          }
        });
        
        // Step 7: Install dependencies
        if (options.install !== false) {
          await progressTracker.executeStep('Install dependencies', async () => {
            const dependencies = getDependencies(projectType);
            
            try {
              const packageManager = projectType.packageManager || await detectPackageManager();
              const installCmd = getInstallCommand(packageManager, dependencies);
              
              Logger.substep(`Installing with ${packageManager}...`);
              execSync(installCmd, { stdio: 'inherit' });
              
            } catch (error) {
              // For online IDEs, suppress installation errors as they often have permission issues
              if (projectType.isOnlineIDE) {
                Logger.warning('Dependencies may need manual installation in online IDE');
                Logger.info('Add these to your package.json:', { prefix: '📦' });
                Logger.list(dependencies, { indent: 2 });
              } else {
                Logger.error('Failed to install dependencies');
                Logger.error('Please install the following dependencies manually:');
                Logger.list(dependencies, { indent: 2 });
                throw error;
              }
            }
          });
        }
        
        // Step 8: Install components (if requested)
        if (options.withComponents || projectType.isOnlineIDE) {
          await progressTracker.executeStep('Install components', async () => {
            Logger.section('Installing all Willow components');
            
            const componentDir = await getComponentDir(projectType);
            const libDir = await getLibDir(projectType);
            
            const { installAllWillowComponents } = await import('../utils/componentInstaller.js');
            const installResult = await installAllWillowComponents({
              overwrite: true,
              baseDir: process.cwd(),
              includeUnstable: options.includeUnstable,
              componentDir,
              libDir,
              isVite: projectType.isVite,
              projectType
            });
            
            if (installResult.installed.length > 0) {
              Logger.success(`Installed ${installResult.installed.length} components`);
              
              // Update barrel exports
              const { updateBarrelExport } = await import('../utils/componentInstaller.js');
              await updateBarrelExport(componentDir, { dryRun: false });
            }
            
            if (installResult.failed.length > 0) {
              Logger.error(`Failed to install ${installResult.failed.length} components`);
            }
            
            // Handle npm dependencies for components
            if (installResult.npmDependencies && installResult.npmDependencies.length > 0) {
              if (projectType.isOnlineIDE) {
                // Auto-install npm packages in online IDEs
                try {
                  const packageManager = projectType.packageManager || 'npm';
                  const packageCmd = getInstallCommand(packageManager, installResult.npmDependencies);
                  execSync(packageCmd, { stdio: 'inherit' });
                  Logger.success('Installed component dependencies');
                } catch (error) {
                  Logger.warning('Some packages may need manual installation');
                  Logger.info('Add these packages if needed:', { prefix: '📦' });
                  Logger.list(installResult.npmDependencies, { indent: 2 });
                }
              } else {
                Logger.info('Additional npm packages needed:', { prefix: '📦' });
                const packageManager = projectType.packageManager || 'npm';
                const installCmd = getInstallCommand(packageManager, installResult.npmDependencies);
                Logger.info(installCmd);
              }
            }
          });
        }
        
        // Step 9: Install component guide
        await progressTracker.executeStep('Install docs', async () => {
          try {
            const { loadTemplate } = await import('../utils/templateLoader.js');
            const guideContent = await loadTemplate('docs/component-guide.md');
            await writeFile('COMPONENT-GUIDE.md', guideContent, 'utf-8');
            Logger.substep('Created COMPONENT-GUIDE.md with usage examples');
          } catch (error) {
            Logger.substep('Component guide not available');
          }
        });
        
        // Step 10: Fix any incorrect imports
        await progressTracker.executeStep('Fix imports', async () => {
          await fixWillowImports(process.cwd());
        });
        
        // Success summary
        Logger.spacer();
        Logger.success('Willow Design System initialized successfully!');
        
        if (!options.withComponents && !projectType.isOnlineIDE) {
          Logger.section('Next steps');
          Logger.list([
            'Add components: willow add button',
            'Import and use: import { Button } from "@/components/ui"',
            'View all components: willow list'
          ], { indent: 2 });
        } else {
          Logger.section('Start using Willow components');
          Logger.info('import { Button, Card, Badge } from "@/components/ui"', { indent: 2 });
        }
        
        // Show warning for online IDEs
        if (projectType.isOnlineIDE) {
          Logger.warning('Online IDE detected:');
          Logger.list([
            'Automatically installed all components',
            'Using .js config files for compatibility'
          ], { indent: 2 });
        }
        
        progressTracker.summarize();
        
      } catch (error) {
        handleError(error, 'Initialization failed');
        progressTracker.summarize();
        process.exit(1);
      }
    });
}

function getDependencies(projectType: ProjectType): string[] {
  const baseDeps = [
    'tailwindcss',
    'tailwindcss-animate',
    'autoprefixer',
    'postcss',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'lucide-react',
    '@radix-ui/react-slot'
  ];
  
  // Add TypeScript types if not in online IDE and project uses TypeScript
  if (!projectType.isOnlineIDE && projectType.hasTypeScript) {
    baseDeps.push('@types/node', '@types/react', '@types/react-dom');
  }
  
  return baseDeps;
}

async function detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
  if (await fileExists('bun.lockb')) return 'bun';
  if (await fileExists('pnpm-lock.yaml')) return 'pnpm';
  if (await fileExists('yarn.lock')) return 'yarn';
  return 'npm';
}

function getInstallCommand(packageManager: string, dependencies: string[]): string {
  const depString = dependencies.join(' ');
  
  switch (packageManager) {
    case 'yarn':
      return `yarn add ${depString}`;
    case 'pnpm':
      return `pnpm add ${depString}`;
    case 'bun':
      return `bun add ${depString}`;
    default:
      return `npm install ${depString}`;
  }
}
