import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { type FrameworkDetectionResult } from './framework-detection.js';

export interface TypeScriptConfigResult {
  success: boolean;
  configCreated: boolean;
  configUpdated: boolean;
  configPath?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export interface TypeScriptConfigOptions {
  force?: boolean;
  customPath?: string;
  pathMapping?: boolean;
  strict?: boolean;
  experimentalDecorators?: boolean;
  jsx?: string;
}

export interface TSConfig {
  compilerOptions: {
    target?: string;
    lib?: string[];
    module?: string;
    moduleResolution?: string;
    allowJs?: boolean;
    checkJs?: boolean;
    jsx?: string;
    jsxFactory?: string;
    jsxFragmentFactory?: string;
    declaration?: boolean;
    declarationMap?: boolean;
    sourceMap?: boolean;
    outDir?: string;
    rootDir?: string;
    composite?: boolean;
    tsBuildInfoFile?: string;
    removeComments?: boolean;
    noEmit?: boolean;
    importHelpers?: boolean;
    isolatedModules?: boolean;
    downlevelIteration?: boolean;
    strict?: boolean;
    noUnusedLocals?: boolean;
    noUnusedParameters?: boolean;
    noImplicitReturns?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    moduleDetection?: string;
    allowUmdGlobalAccess?: boolean;
    resolveJsonModule?: boolean;
    allowSyntheticDefaultImports?: boolean;
    esModuleInterop?: boolean;
    experimentalDecorators?: boolean;
    emitDecoratorMetadata?: boolean;
    forceConsistentCasingInFileNames?: boolean;
    useDefineForClassFields?: boolean;
    skipLibCheck?: boolean;
    baseUrl?: string;
    paths?: Record<string, string[]>;
    types?: string[];
    typeRoots?: string[];
  };
  include?: string[];
  exclude?: string[];
  extends?: string;
  references?: Array<{ path: string }>;
}

/**
 * Sets up TypeScript configuration for the detected framework
 */
export function setupTypeScriptConfig(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: TypeScriptConfigOptions = {}
): TypeScriptConfigResult {
  try {
    // Check if TypeScript is needed/wanted
    if (!frameworkResult.typescript && !options.force) {
      return {
        success: true,
        configCreated: false,
        configUpdated: false,
        skipped: true,
        reason: 'TypeScript not detected and not forced'
      };
    }

    const configPath = options.customPath || join(projectPath, 'tsconfig.json');
    const exists = existsSync(configPath);
    
    // Generate or update config
    if (exists && !options.force) {
      // Update existing config
      const result = updateExistingTSConfig(configPath, frameworkResult, options);
      return {
        success: result.success,
        configCreated: false,
        configUpdated: result.updated,
        configPath,
        error: result.error
      };
    } else {
      // Create new config
      const config = generateTSConfig(frameworkResult, options);
      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      
      return {
        success: true,
        configCreated: !exists,
        configUpdated: exists,
        configPath
      };
    }

  } catch (error: any) {
    return {
      success: false,
      configCreated: false,
      configUpdated: false,
      error: error.message
    };
  }
}

/**
 * Generates TypeScript configuration based on framework
 */
function generateTSConfig(
  frameworkResult: FrameworkDetectionResult,
  options: TypeScriptConfigOptions = {}
): TSConfig {
  const { framework, buildTool } = frameworkResult;
  
  // Base configuration
  const baseConfig: TSConfig = {
    compilerOptions: {
      target: 'ES2020',
      lib: ['DOM', 'DOM.Iterable', 'ES6'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowJs: true,
      checkJs: false,
      jsx: getJSXConfig(framework),
      declaration: false,
      declarationMap: false,
      sourceMap: true,
      removeComments: false,
      noEmit: getBuildToolNoEmit(buildTool),
      isolatedModules: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      useDefineForClassFields: true,
      strict: options.strict !== false,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      skipLibCheck: true,
      resolveJsonModule: true
    },
    include: getIncludePatterns(framework),
    exclude: getExcludePatterns(framework)
  };

  // Framework-specific adjustments
  adjustConfigForFramework(baseConfig, frameworkResult, options);
  
  // Add path mapping if requested
  if (options.pathMapping !== false) {
    addPathMapping(baseConfig, frameworkResult);
  }

  // Add experimental decorators if needed
  if (options.experimentalDecorators || framework === 'angular') {
    baseConfig.compilerOptions.experimentalDecorators = true;
    baseConfig.compilerOptions.emitDecoratorMetadata = true;
  }

  return baseConfig;
}

/**
 * Gets JSX configuration for framework
 */
function getJSXConfig(framework: string): string {
  switch (framework) {
    case 'react':
    case 'next':
      return 'react-jsx';
    case 'vue':
      return 'preserve';
    case 'svelte':
      return 'preserve';
    default:
      return 'react-jsx';
  }
}

/**
 * Determines if noEmit should be true based on build tool
 */
function getBuildToolNoEmit(buildTool: string): boolean {
  // Vite and other bundlers handle compilation
  return ['vite', 'webpack', 'rollup', 'esbuild'].includes(buildTool);
}

/**
 * Gets include patterns for framework
 */
function getIncludePatterns(framework: string): string[] {
  switch (framework) {
    case 'next':
      return [
        'next-env.d.ts',
        '**/*.ts',
        '**/*.tsx',
        '.next/types/**/*.ts'
      ];
    case 'vue':
      return [
        'env.d.ts',
        'src/**/*',
        'src/**/*.vue'
      ];
    case 'svelte':
      return [
        'src/**/*.d.ts',
        'src/**/*.ts',
        'src/**/*.js',
        'src/**/*.svelte'
      ];
    case 'angular':
      return [
        'src/**/*.ts'
      ];
    case 'react':
    default:
      return [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.js',
        'src/**/*.jsx'
      ];
  }
}

/**
 * Gets exclude patterns for framework
 */
function getExcludePatterns(framework: string): string[] {
  const common = ['node_modules', 'dist', 'build'];
  
  switch (framework) {
    case 'next':
      return [...common, '.next'];
    case 'angular':
      return [...common, 'e2e'];
    default:
      return common;
  }
}

/**
 * Adjusts config for specific frameworks
 */
function adjustConfigForFramework(
  config: TSConfig,
  frameworkResult: FrameworkDetectionResult,
  options: TypeScriptConfigOptions
): void {
  const { framework, buildTool } = frameworkResult;

  switch (framework) {
    case 'next':
      // Next.js specific configuration
      config.compilerOptions.lib = ['DOM', 'DOM.Iterable', 'ES6'];
      config.compilerOptions.incremental = true;
      config.compilerOptions.plugins = [{ name: 'next' }];
      break;

    case 'vue':
      // Vue specific configuration
      config.compilerOptions.types = ['vite/client'];
      config.compilerOptions.verbatimModuleSyntax = true;
      break;

    case 'svelte':
      // Svelte specific configuration
      config.compilerOptions.types = ['svelte', 'vite/client'];
      break;

    case 'angular':
      // Angular specific configuration
      config.compilerOptions.experimentalDecorators = true;
      config.compilerOptions.emitDecoratorMetadata = true;
      config.compilerOptions.importHelpers = true;
      config.compilerOptions.target = 'ES2022';
      config.compilerOptions.module = 'ES2022';
      config.compilerOptions.lib = ['ES2022', 'DOM'];
      break;
  }

  // Build tool specific adjustments
  if (buildTool === 'vite') {
    config.compilerOptions.types = config.compilerOptions.types || [];
    if (!config.compilerOptions.types.includes('vite/client')) {
      config.compilerOptions.types.push('vite/client');
    }
  }
}

/**
 * Adds path mapping configuration
 */
function addPathMapping(config: TSConfig, frameworkResult: FrameworkDetectionResult): void {
  const { framework } = frameworkResult;
  
  config.compilerOptions.baseUrl = '.';
  config.compilerOptions.paths = {
    '@/*': getPathMappingBase(framework)
  };
}

/**
 * Gets path mapping base for framework
 */
function getPathMappingBase(framework: string): string[] {
  switch (framework) {
    case 'next':
      return ['./*'];
    case 'angular':
      return ['src/*'];
    case 'vue':
    case 'svelte':
    case 'react':
    default:
      return ['src/*'];
  }
}

/**
 * Updates existing TypeScript configuration
 */
function updateExistingTSConfig(
  configPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: TypeScriptConfigOptions
): { success: boolean; updated: boolean; error?: string } {
  try {
    const existingContent = readFileSync(configPath, 'utf-8');
    const existingConfig: TSConfig = JSON.parse(existingContent);
    
    let updated = false;
    
    // Add path mapping if not present and requested
    if (options.pathMapping !== false && !existingConfig.compilerOptions?.paths) {
      addPathMapping(existingConfig, frameworkResult);
      updated = true;
    }
    
    // Ensure proper JSX configuration
    const expectedJSX = getJSXConfig(frameworkResult.framework);
    if (existingConfig.compilerOptions?.jsx !== expectedJSX) {
      existingConfig.compilerOptions = existingConfig.compilerOptions || {};
      existingConfig.compilerOptions.jsx = expectedJSX;
      updated = true;
    }
    
    // Add essential compiler options if missing
    const essentialOptions = {
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      skipLibCheck: true,
      isolatedModules: true
    };
    
    for (const [key, value] of Object.entries(essentialOptions)) {
      if (existingConfig.compilerOptions?.[key] === undefined) {
        existingConfig.compilerOptions = existingConfig.compilerOptions || {};
        existingConfig.compilerOptions[key] = value;
        updated = true;
      }
    }
    
    if (updated) {
      writeFileSync(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8');
    }
    
    return { success: true, updated };
    
  } catch (error: any) {
    return { success: false, updated: false, error: error.message };
  }
}

/**
 * Validates TypeScript configuration
 */
export function validateTypeScriptConfig(projectPath = process.cwd()): {
  hasConfig: boolean;
  isValid: boolean;
  hasPathMapping: boolean;
  hasProperJSX: boolean;
  framework?: string;
  issues: string[];
} {
  const result = {
    hasConfig: false,
    isValid: false,
    hasPathMapping: false,
    hasProperJSX: false,
    issues: [] as string[]
  };
  
  const configPath = join(projectPath, 'tsconfig.json');
  
  if (!existsSync(configPath)) {
    result.issues.push('No tsconfig.json found');
    return result;
  }
  
  result.hasConfig = true;
  
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config: TSConfig = JSON.parse(configContent);
    
    result.isValid = true;
    
    // Check for path mapping
    if (config.compilerOptions?.baseUrl && config.compilerOptions?.paths?.['@/*']) {
      result.hasPathMapping = true;
    } else {
      result.issues.push('No @/* path mapping configured');
    }
    
    // Check JSX configuration
    const jsx = config.compilerOptions?.jsx;
    if (jsx && ['react-jsx', 'react', 'preserve'].includes(jsx)) {
      result.hasProperJSX = true;
    } else {
      result.issues.push('JSX configuration missing or invalid');
    }
    
    // Check essential options
    const essentialOptions = [
      'resolveJsonModule',
      'allowSyntheticDefaultImports',
      'esModuleInterop',
      'skipLibCheck'
    ];
    
    for (const option of essentialOptions) {
      if (!config.compilerOptions?.[option]) {
        result.issues.push(`Missing essential compiler option: ${option}`);
      }
    }
    
  } catch (error) {
    result.isValid = false;
    result.issues.push(`Failed to parse tsconfig.json: ${error}`);
  }
  
  return result;
}

/**
 * Gets TypeScript template for a specific framework
 */
export function getTypeScriptTemplate(framework: string): TSConfig {
  const frameworkResult: FrameworkDetectionResult = {
    framework: framework as any,
    buildTool: 'vite',
    typescript: true,
    configFiles: [],
    dependencies: {},
    devDependencies: {},
    supportedFeatures: []
  };
  
  return generateTSConfig(frameworkResult, { pathMapping: true });
}

/**
 * Checks if TypeScript is properly installed
 */
export function checkTypeScriptInstallation(projectPath = process.cwd()): {
  isInstalled: boolean;
  version?: string;
  hasTypes: boolean;
  missingTypes: string[];
} {
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return {
      isInstalled: false,
      hasTypes: false,
      missingTypes: []
    };
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const isInstalled = 'typescript' in allDeps;
    const version = allDeps.typescript;
    
    // Check for common type packages
    const typePackages = [
      '@types/node',
      '@types/react',
      '@types/react-dom'
    ];
    
    const installedTypes = typePackages.filter(pkg => pkg in allDeps);
    const missingTypes = typePackages.filter(pkg => !(pkg in allDeps));
    
    return {
      isInstalled,
      version,
      hasTypes: installedTypes.length > 0,
      missingTypes
    };
    
  } catch {
    return {
      isInstalled: false,
      hasTypes: false,
      missingTypes: []
    };
  }
}