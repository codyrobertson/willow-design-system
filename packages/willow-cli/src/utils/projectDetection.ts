import { fileExists, readFileContent } from './fileSystem.js';
import type { ProjectType } from '../types/index.js';
import chalk from 'chalk';

/**
 * Enhanced project type detection with better environment awareness
 */
export async function detectProjectType(): Promise<ProjectType> {
  console.log(chalk.blue('🔍 Detecting project environment...'));
  
  try {
    const packageJsonContent = await readFileContent('package.json');
    const pkg = JSON.parse(packageJsonContent);
    
    // Check for framework dependencies
    const isVite = !!(pkg.devDependencies?.vite || pkg.dependencies?.vite);
    const isNext = !!(pkg.devDependencies?.next || pkg.dependencies?.next);
    const isNuxt = !!(pkg.devDependencies?.nuxt || pkg.dependencies?.nuxt);
    const isRemix = !!(pkg.devDependencies?.['@remix-run/dev'] || pkg.dependencies?.['@remix-run/dev']);
    
    // Detect online IDE environments with more robust checks
    const isStackBlitz = process.env.SHELL?.includes('jsh') || !!process.env.STACKBLITZ;
    const isCodeSandbox = !!process.env.CODESANDBOX_SSE || !!process.env.CODESANDBOX;
    const isGitpod = !!process.env.GITPOD_WORKSPACE_ID;
    const isReplit = !!process.env.REPLIT_DB_URL || !!process.env.REPL_ID;
    const isBolt = await fileExists('.bolt');
    const isGlitch = !!process.env.PROJECT_REMIX_CHAIN;
    
    const isOnlineIDE = isStackBlitz || isCodeSandbox || isGitpod || isBolt || isReplit || isGlitch;
    
    // Determine project type with priority
    let type: 'vite' | 'nextjs' | 'nuxt' | 'remix' | 'react' = 'react';
    if (isNext) type = 'nextjs';
    else if (isVite) type = 'vite';
    else if (isNuxt) type = 'nuxt';
    else if (isRemix) type = 'remix';
    
    const result: ProjectType = {
      isVite,
      isNext,
      isOnlineIDE,
      type,
      // Additional metadata
      hasTypeScript: !!(pkg.devDependencies?.typescript || pkg.dependencies?.typescript),
      packageManager: await detectPackageManager(),
      framework: type,
    };
    
    console.log(chalk.green(`✅ Project detected: ${type}${isOnlineIDE ? ' (Online IDE)' : ''}`));
    console.log(chalk.gray(`   TypeScript: ${result.hasTypeScript ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`   Package Manager: ${result.packageManager}`));
    
    return result;
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Failed to read package.json, using defaults'));
    
    return {
      isVite: false,
      isNext: true,
      isOnlineIDE: false,
      type: 'nextjs',
      hasTypeScript: true,
      packageManager: 'npm',
      framework: 'nextjs',
    };
  }
}

/**
 * Detect the package manager being used
 */
export async function detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
  if (await fileExists('bun.lockb')) return 'bun';
  if (await fileExists('pnpm-lock.yaml')) return 'pnpm';
  if (await fileExists('yarn.lock')) return 'yarn';
  return 'npm';
}

/**
 * Check if the project has specific configurations
 */
export async function hasConfiguration(configType: 'tailwind' | 'postcss' | 'typescript' | 'eslint'): Promise<boolean> {
  const configFiles = {
    tailwind: ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'],
    postcss: ['postcss.config.js', 'postcss.config.ts', 'postcss.config.mjs'],
    typescript: ['tsconfig.json'],
    eslint: ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yaml', '.eslintrc.yml', 'eslint.config.js'],
  };
  
  const files = configFiles[configType] || [];
  
  for (const file of files) {
    if (await fileExists(file)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get project-specific directory preferences
 */
export async function getProjectStructure(projectType: ProjectType): Promise<{
  componentsDir: string;
  libDir: string;
  cssPath: string;
  publicDir: string;
}> {
  const structure = {
    vite: {
      componentsDir: 'src/components/ui',
      libDir: 'src/lib',
      cssPath: 'src/index.css',
      publicDir: 'public',
    },
    nextjs: {
      componentsDir: 'components/ui',
      libDir: 'lib',
      cssPath: 'app/globals.css',
      publicDir: 'public',
    },
    nuxt: {
      componentsDir: 'components/ui',
      libDir: 'lib',
      cssPath: 'assets/css/main.css',
      publicDir: 'public',
    },
    remix: {
      componentsDir: 'app/components/ui',
      libDir: 'app/lib',
      cssPath: 'app/styles/global.css',
      publicDir: 'public',
    },
    react: {
      componentsDir: 'src/components/ui',
      libDir: 'src/lib',
      cssPath: 'src/index.css',
      publicDir: 'public',
    },
  };
  
  return structure[projectType.type] || structure.react;
}

/**
 * Validate project requirements for Willow installation
 */
export async function validateProjectRequirements(): Promise<{
  valid: boolean;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check for package.json
  if (!(await fileExists('package.json'))) {
    issues.push('No package.json found - not a valid Node.js project');
  }
  
  // Check for React
  try {
    const pkg = JSON.parse(await readFileContent('package.json'));
    const hasReact = !!(pkg.dependencies?.react || pkg.devDependencies?.react);
    
    if (!hasReact) {
      issues.push('React not found in dependencies - Willow requires React');
    }
    
    // Check React version
    const reactVersion = pkg.dependencies?.react || pkg.devDependencies?.react;
    if (reactVersion && !reactVersion.includes('18') && !reactVersion.includes('19')) {
      warnings.push('React version may be incompatible - Willow is tested with React 18+');
    }
  } catch {
    warnings.push('Could not validate React dependencies');
  }
  
  // Check for conflicting design systems
  try {
    const pkg = JSON.parse(await readFileContent('package.json'));
    const conflictingLibs = [
      'chakra-ui',
      'antd',
      'mantine',
      '@mui/material',
      'react-bootstrap',
    ];
    
    const foundConflicts = conflictingLibs.filter(lib => 
      pkg.dependencies?.[lib] || pkg.devDependencies?.[lib]
    );
    
    if (foundConflicts.length > 0) {
      warnings.push(`Conflicting UI libraries found: ${foundConflicts.join(', ')}`);
    }
  } catch {
    // Ignore validation errors
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Log project environment details for debugging
 */
export function logProjectEnvironment(projectType: ProjectType): void {
  console.log(chalk.blue('\n📋 Project Environment Summary:'));
  console.log(chalk.gray(`   Type: ${projectType.type}`));
  console.log(chalk.gray(`   Framework: ${projectType.framework || 'Unknown'}`));
  console.log(chalk.gray(`   TypeScript: ${projectType.hasTypeScript ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`   Package Manager: ${projectType.packageManager || 'npm'}`));
  console.log(chalk.gray(`   Online IDE: ${projectType.isOnlineIDE ? 'Yes' : 'No'}`));
  
  if (projectType.isOnlineIDE) {
    console.log(chalk.yellow('   ⚠️  Online IDE optimizations will be applied'));
  }
}