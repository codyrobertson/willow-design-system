import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { detectPackageManager, buildInstallCommand, executePackageManagerCommand, type PackageManagerInfo } from './package-manager.js';
import { type FrameworkDetectionResult, getFrameworkRecommendations } from './framework-detection.js';

export interface ShadcnUtilsResult {
  success: boolean;
  packagesInstalled: string[];
  utilsCreated: boolean;
  configCreated: boolean;
  utilsPath?: string;
  configPath?: string;
  error?: string;
}

export interface ShadcnUtilsOptions {
  force?: boolean;
  customUtilsPath?: string;
  customConfigPath?: string;
  skipConfig?: boolean;
  includeAnimations?: boolean;
}

const SHADCN_PACKAGES = [
  'clsx',
  'tailwind-merge',
  'class-variance-authority'
];

const ANIMATION_PACKAGES = [
  'framer-motion',
  '@radix-ui/react-slot'
];

/**
 * Sets up shadcn/ui utilities and dependencies
 */
export async function setupShadcnUtils(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: ShadcnUtilsOptions = {}
): Promise<ShadcnUtilsResult> {
  const result: ShadcnUtilsResult = {
    success: false,
    packagesInstalled: [],
    utilsCreated: false,
    configCreated: false
  };

  try {
    // Detect package manager
    const packageManager = detectPackageManager(projectPath);
    const recommendations = getFrameworkRecommendations(frameworkResult);

    // Install required packages
    const installResult = await installShadcnPackages(
      packageManager,
      projectPath,
      frameworkResult,
      options
    );
    
    result.packagesInstalled = installResult.installed;

    // Create cn utility function
    const utilsResult = await createCnUtility(
      projectPath,
      recommendations,
      options
    );
    
    result.utilsCreated = utilsResult.created;
    result.utilsPath = utilsResult.path;

    // Create components.json configuration
    if (!options.skipConfig) {
      const configResult = await createComponentsConfig(
        projectPath,
        frameworkResult,
        recommendations,
        options
      );
      
      result.configCreated = configResult.created;
      result.configPath = configResult.path;
    }

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Installs required shadcn/ui packages
 */
async function installShadcnPackages(
  packageManager: PackageManagerInfo,
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: ShadcnUtilsOptions
): Promise<{ installed: string[] }> {
  const packagesToInstall = [...SHADCN_PACKAGES];
  
  // Add animation packages if requested
  if (options.includeAnimations && frameworkResult.framework === 'react') {
    packagesToInstall.push(...ANIMATION_PACKAGES);
  }

  // Check which packages are already installed
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const missingPackages = packagesToInstall.filter(pkg => !(pkg in allDeps));
    
    if (missingPackages.length === 0 && !options.force) {
      return { installed: [] };
    }

    const toInstall = options.force ? packagesToInstall : missingPackages;
    
    if (toInstall.length > 0) {
      const installCommand = buildInstallCommand(
        packageManager,
        toInstall,
        { dev: false }
      );

      const result = executePackageManagerCommand(installCommand, {
        cwd: projectPath,
        silent: false
      });

      if (!result.success) {
        throw new Error(`Failed to install packages: ${result.error}`);
      }

      return { installed: toInstall };
    }
  }

  return { installed: [] };
}

/**
 * Creates the cn utility function
 */
async function createCnUtility(
  projectPath: string,
  recommendations: ReturnType<typeof getFrameworkRecommendations>,
  options: ShadcnUtilsOptions
): Promise<{ created: boolean; path: string }> {
  const utilsDir = join(projectPath, recommendations.utilsPath);
  const utilsPath = options.customUtilsPath || join(utilsDir, 'utils.ts');
  
  // Check if utils file already exists and has cn function
  if (existsSync(utilsPath) && !options.force) {
    const existingContent = readFileSync(utilsPath, 'utf-8');
    if (existingContent.includes('cn(')) {
      return { created: false, path: utilsPath };
    }
  }

  // Ensure directory exists
  if (!existsSync(utilsDir)) {
    mkdirSync(utilsDir, { recursive: true });
  }

  // Generate cn utility content
  const cnContent = generateCnUtility();
  
  if (existsSync(utilsPath) && !options.force) {
    // Append to existing file
    const existingContent = readFileSync(utilsPath, 'utf-8');
    const newContent = existingContent + '\n\n' + cnContent;
    writeFileSync(utilsPath, newContent, 'utf-8');
  } else {
    // Create new file
    writeFileSync(utilsPath, cnContent, 'utf-8');
  }

  return { created: true, path: utilsPath };
}

/**
 * Generates the cn utility function content
 */
function generateCnUtility(): string {
  return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
}

/**
 * Creates components.json configuration file
 */
async function createComponentsConfig(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  recommendations: ReturnType<typeof getFrameworkRecommendations>,
  options: ShadcnUtilsOptions
): Promise<{ created: boolean; path: string }> {
  const configPath = options.customConfigPath || join(projectPath, 'components.json');
  
  // Check if config already exists
  if (existsSync(configPath) && !options.force) {
    return { created: false, path: configPath };
  }

  const config = generateComponentsConfig(frameworkResult, recommendations);
  
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  
  return { created: true, path: configPath };
}

/**
 * Generates components.json configuration
 */
function generateComponentsConfig(
  frameworkResult: FrameworkDetectionResult,
  recommendations: ReturnType<typeof getFrameworkRecommendations>
): ComponentsConfig {
  const { framework, typescript } = frameworkResult;
  
  const config: ComponentsConfig = {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "default",
    "rsc": framework === 'next',
    "tsx": typescript,
    "tailwind": {
      "config": recommendations.tailwindConfig,
      "css": framework === 'next' ? "styles/globals.css" : "src/index.css",
      "baseColor": "slate",
      "cssVariables": true,
      "prefix": ""
    },
    "aliases": {
      "components": `@/${recommendations.componentPath.replace(/^\.\//, '')}`,
      "utils": `@/${recommendations.utilsPath.replace(/^\.\//, '')}`,
      "ui": `@/${recommendations.componentPath.replace(/^\.\//, '')}/ui`,
      "lib": `@/${recommendations.utilsPath.replace(/^\.\//, '')}`,
      "hooks": `@/${recommendations.utilsPath.replace(/^\.\//, '')}/hooks`
    }
  };

  return config;
}

interface ComponentsConfig {
  "$schema": string;
  style: string;
  rsc: boolean;
  tsx: boolean;
  tailwind: {
    config: string;
    css: string;
    baseColor: string;
    cssVariables: boolean;
    prefix: string;
  };
  aliases: {
    components: string;
    utils: string;
    ui: string;
    lib: string;
    hooks: string;
  };
}

/**
 * Validates shadcn/ui utilities setup
 */
export function validateShadcnSetup(projectPath = process.cwd()): {
  hasPackages: boolean;
  hasCnUtility: boolean;
  hasComponentsConfig: boolean;
  missingPackages: string[];
  issues: string[];
} {
  const result = {
    hasPackages: false,
    hasCnUtility: false,
    hasComponentsConfig: false,
    missingPackages: [] as string[],
    issues: [] as string[]
  };

  // Check packages
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      result.missingPackages = SHADCN_PACKAGES.filter(pkg => !(pkg in allDeps));
      result.hasPackages = result.missingPackages.length === 0;
      
      if (!result.hasPackages) {
        result.issues.push(`Missing packages: ${result.missingPackages.join(', ')}`);
      }
    } catch {
      result.issues.push('Failed to read package.json');
    }
  } else {
    result.issues.push('No package.json found');
  }

  // Check for cn utility
  const possibleUtilsPaths = [
    'src/lib/utils.ts',
    'src/utils/utils.ts',
    'lib/utils.ts',
    'utils/utils.ts',
    'src/lib/utils.js',
    'src/utils/utils.js'
  ];

  for (const utilsPath of possibleUtilsPaths) {
    const fullPath = join(projectPath, utilsPath);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes('cn(') && content.includes('clsx') && content.includes('twMerge')) {
          result.hasCnUtility = true;
          break;
        }
      } catch {
        // Continue checking other paths
      }
    }
  }

  if (!result.hasCnUtility) {
    result.issues.push('cn utility function not found');
  }

  // Check for components.json
  const componentsConfigPath = join(projectPath, 'components.json');
  if (existsSync(componentsConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(componentsConfigPath, 'utf-8'));
      // Basic validation of config structure
      if (config.tailwind && config.aliases) {
        result.hasComponentsConfig = true;
      } else {
        result.issues.push('components.json has invalid structure');
      }
    } catch {
      result.issues.push('Failed to parse components.json');
    }
  } else {
    result.issues.push('components.json not found');
  }

  return result;
}

/**
 * Gets the path to the cn utility
 */
export function getCnUtilityPath(projectPath = process.cwd()): string | null {
  const possiblePaths = [
    'src/lib/utils.ts',
    'src/utils/utils.ts',
    'lib/utils.ts',
    'utils/utils.ts',
    'src/lib/utils.js',
    'src/utils/utils.js'
  ];

  for (const path of possiblePaths) {
    const fullPath = join(projectPath, path);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes('cn(')) {
          return fullPath;
        }
      } catch {
        // Continue checking other paths
      }
    }
  }

  return null;
}

/**
 * Updates existing utils file to add cn function
 */
export function updateUtilsWithCn(
  utilsPath: string,
  force = false
): { success: boolean; error?: string } {
  try {
    if (!existsSync(utilsPath)) {
      return { success: false, error: 'Utils file does not exist' };
    }

    const content = readFileSync(utilsPath, 'utf-8');
    
    // Check if cn already exists
    if (content.includes('cn(') && !force) {
      return { success: true };
    }

    // Add cn utility to existing file
    const cnContent = generateCnUtility();
    const newContent = content + '\n\n' + cnContent;
    
    writeFileSync(utilsPath, newContent, 'utf-8');
    
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}