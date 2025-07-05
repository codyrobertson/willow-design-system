import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectPackageManager, buildInstallCommand, executePackageManagerCommand, type PackageManagerInfo } from './package-manager.js';
import { detectFramework, getFrameworkRecommendations, type FrameworkDetectionResult } from './framework-detection.js';

export interface TailwindInstallResult {
  success: boolean;
  installed: string[];
  skipped: string[];
  configCreated: boolean;
  cssFileCreated: boolean;
  error?: string;
}

export interface TailwindInstallOptions {
  force?: boolean;
  skipCss?: boolean;
  skipConfig?: boolean;
  customConfigPath?: string;
  customCssPath?: string;
}

const TAILWIND_PACKAGES = [
  'tailwindcss',
  'postcss',
  'autoprefixer'
];

/**
 * Installs and configures Tailwind CSS for the detected framework
 */
export async function installTailwindCSS(
  projectPath = process.cwd(),
  options: TailwindInstallOptions = {}
): Promise<TailwindInstallResult> {
  const result: TailwindInstallResult = {
    success: false,
    installed: [],
    skipped: [],
    configCreated: false,
    cssFileCreated: false
  };

  try {
    // Detect package manager and framework
    const packageManager = detectPackageManager(projectPath);
    const frameworkResult = detectFramework(projectPath);
    const recommendations = getFrameworkRecommendations(frameworkResult);

    // Check existing installations
    const existingPackages = await checkExistingTailwindInstallation(projectPath, packageManager);
    
    // Install packages
    const installResult = await installTailwindPackages(
      packageManager,
      existingPackages,
      options.force || false,
      projectPath
    );
    
    result.installed = installResult.installed;
    result.skipped = installResult.skipped;

    // Generate Tailwind config
    if (!options.skipConfig) {
      const configResult = await generateTailwindConfig(
        projectPath,
        frameworkResult,
        recommendations,
        options
      );
      result.configCreated = configResult.created;
    }

    // Generate CSS file
    if (!options.skipCss) {
      const cssResult = await generateTailwindCSS(
        projectPath,
        frameworkResult,
        recommendations,
        options
      );
      result.cssFileCreated = cssResult.created;
    }

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Checks if Tailwind CSS is already installed
 */
async function checkExistingTailwindInstallation(
  projectPath: string,
  packageManager: PackageManagerInfo
): Promise<{ existing: string[]; missing: string[] }> {
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return { existing: [], missing: TAILWIND_PACKAGES };
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const existing = TAILWIND_PACKAGES.filter(pkg => pkg in allDeps);
    const missing = TAILWIND_PACKAGES.filter(pkg => !(pkg in allDeps));

    return { existing, missing };
  } catch {
    return { existing: [], missing: TAILWIND_PACKAGES };
  }
}

/**
 * Installs Tailwind CSS packages
 */
async function installTailwindPackages(
  packageManager: PackageManagerInfo,
  existingPackages: { existing: string[]; missing: string[] },
  force: boolean,
  projectPath: string
): Promise<{ installed: string[]; skipped: string[] }> {
  const { existing, missing } = existingPackages;

  if (missing.length === 0 && !force) {
    return { installed: [], skipped: existing };
  }

  const packagesToInstall = force ? TAILWIND_PACKAGES : missing;
  
  if (packagesToInstall.length === 0) {
    return { installed: [], skipped: existing };
  }

  const installCommand = buildInstallCommand(
    packageManager,
    packagesToInstall,
    { dev: true }
  );

  const result = executePackageManagerCommand(installCommand, {
    cwd: projectPath,
    silent: false
  });

  if (!result.success) {
    throw new Error(`Failed to install packages: ${result.error}`);
  }

  return {
    installed: packagesToInstall,
    skipped: force ? [] : existing
  };
}

/**
 * Generates Tailwind configuration file
 */
async function generateTailwindConfig(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  recommendations: ReturnType<typeof getFrameworkRecommendations>,
  options: TailwindInstallOptions
): Promise<{ created: boolean; path: string }> {
  const configPath = options.customConfigPath || join(projectPath, recommendations.tailwindConfig);
  
  // Check if config already exists
  if (existsSync(configPath) && !options.force) {
    return { created: false, path: configPath };
  }

  const config = generateTailwindConfigContent(frameworkResult, recommendations);
  
  try {
    writeFileSync(configPath, config, 'utf-8');
    return { created: true, path: configPath };
  } catch (error) {
    throw new Error(`Failed to create Tailwind config: ${error}`);
  }
}

/**
 * Generates Tailwind CSS file
 */
async function generateTailwindCSS(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  recommendations: ReturnType<typeof getFrameworkRecommendations>,
  options: TailwindInstallOptions
): Promise<{ created: boolean; path: string }> {
  const cssPath = options.customCssPath || join(
    projectPath,
    frameworkResult.framework === 'next' ? 'styles/globals.css' : 'src/index.css'
  );
  
  // Check if CSS file already exists and contains Tailwind directives
  if (existsSync(cssPath) && !options.force) {
    const existingContent = readFileSync(cssPath, 'utf-8');
    if (existingContent.includes('@tailwind base')) {
      return { created: false, path: cssPath };
    }
  }

  const cssContent = generateTailwindCSSContent(frameworkResult);
  
  try {
    // If file exists, prepend Tailwind directives
    let finalContent = cssContent;
    if (existsSync(cssPath) && !options.force) {
      const existingContent = readFileSync(cssPath, 'utf-8');
      finalContent = cssContent + '\n\n' + existingContent;
    }
    
    writeFileSync(cssPath, finalContent, 'utf-8');
    return { created: true, path: cssPath };
  } catch (error) {
    throw new Error(`Failed to create CSS file: ${error}`);
  }
}

/**
 * Generates Tailwind configuration content based on framework
 */
function generateTailwindConfigContent(
  frameworkResult: FrameworkDetectionResult,
  recommendations: ReturnType<typeof getFrameworkRecommendations>
): string {
  const { framework } = frameworkResult;
  
  // Base content paths for different frameworks
  const contentPaths = getContentPaths(framework, recommendations);
  
  const config = {
    content: contentPaths,
    theme: {
      extend: {}
    },
    plugins: []
  };

  // Framework-specific configurations
  if (framework === 'next') {
    return `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(config, null, 2)}`;
  }

  return `/** @type {import('tailwindcss').Config} */
export default ${JSON.stringify(config, null, 2)}`;
}

/**
 * Gets content paths for Tailwind based on framework
 */
function getContentPaths(
  framework: string,
  recommendations: ReturnType<typeof getFrameworkRecommendations>
): string[] {
  switch (framework) {
    case 'next':
      return [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}'
      ];
    
    case 'vue':
      return [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}'
      ];
    
    case 'svelte':
      return [
        './src/**/*.{html,js,svelte,ts}'
      ];
    
    case 'angular':
      return [
        './src/**/*.{html,ts}'
      ];
    
    case 'react':
    default:
      return [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}'
      ];
  }
}

/**
 * Generates Tailwind CSS content
 */
function generateTailwindCSSContent(frameworkResult: FrameworkDetectionResult): string {
  const baseDirectives = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

  // Add framework-specific base styles if needed
  if (frameworkResult.framework === 'next') {
    return `${baseDirectives}

html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}`;
  }

  return baseDirectives;
}

/**
 * Checks if Tailwind CSS is properly configured
 */
export function validateTailwindInstallation(projectPath = process.cwd()): {
  isInstalled: boolean;
  hasConfig: boolean;
  hasCss: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check if packages are installed
  const packageJsonPath = join(projectPath, 'package.json');
  let isInstalled = false;
  
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      const missingPackages = TAILWIND_PACKAGES.filter(pkg => !(pkg in allDeps));
      if (missingPackages.length === 0) {
        isInstalled = true;
      } else {
        issues.push(`Missing packages: ${missingPackages.join(', ')}`);
      }
    } catch {
      issues.push('Could not read package.json');
    }
  } else {
    issues.push('No package.json found');
  }
  
  // Check for config file
  const configFiles = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'];
  const hasConfig = configFiles.some(file => existsSync(join(projectPath, file)));
  
  if (!hasConfig) {
    issues.push('No Tailwind config file found');
  }
  
  // Check for CSS file with Tailwind directives
  const cssFiles = [
    'src/index.css',
    'src/App.css',
    'styles/globals.css',
    'src/styles/global.css'
  ];
  
  let hasCss = false;
  for (const cssFile of cssFiles) {
    const fullPath = join(projectPath, cssFile);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes('@tailwind base')) {
          hasCss = true;
          break;
        }
      } catch {
        // Continue checking other files
      }
    }
  }
  
  if (!hasCss) {
    issues.push('No CSS file with Tailwind directives found');
  }
  
  return {
    isInstalled,
    hasConfig,
    hasCss,
    issues
  };
}