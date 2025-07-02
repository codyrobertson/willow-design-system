import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export type Framework = 'next' | 'react' | 'vue' | 'svelte' | 'angular' | 'nuxt' | 'vite' | 'unknown';
export type BuildTool = 'vite' | 'webpack' | 'rollup' | 'esbuild' | 'turbo' | 'unknown';

export interface FrameworkDetectionResult {
  framework: Framework;
  version?: string;
  buildTool: BuildTool;
  typescript: boolean;
  configFiles: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  supportedFeatures: string[];
}

export interface FrameworkConfig {
  name: Framework;
  dependencies: string[];
  configFiles: string[];
  devDependencies?: string[];
  buildTools?: BuildTool[];
  features?: string[];
}

// Framework configurations
const FRAMEWORK_CONFIGS: FrameworkConfig[] = [
  {
    name: 'next',
    dependencies: ['next'],
    configFiles: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
    buildTools: ['webpack'],
    features: ['ssr', 'routing', 'api-routes', 'image-optimization']
  },
  {
    name: 'nuxt',
    dependencies: ['nuxt', '@nuxt/kit'],
    configFiles: ['nuxt.config.js', 'nuxt.config.ts'],
    buildTools: ['vite', 'webpack'],
    features: ['ssr', 'routing', 'auto-imports']
  },
  {
    name: 'vue',
    dependencies: ['vue'],
    configFiles: ['vue.config.js', 'vite.config.js', 'vite.config.ts'],
    buildTools: ['vite', 'webpack'],
    features: ['composition-api', 'options-api']
  },
  {
    name: 'svelte',
    dependencies: ['svelte'],
    configFiles: ['svelte.config.js', 'vite.config.js', 'vite.config.ts'],
    buildTools: ['vite', 'rollup'],
    features: ['stores', 'transitions']
  },
  {
    name: 'angular',
    dependencies: ['@angular/core'],
    configFiles: ['angular.json', 'ng-package.json'],
    devDependencies: ['@angular/cli'],
    buildTools: ['webpack'],
    features: ['dependency-injection', 'routing', 'forms']
  },
  {
    name: 'react',
    dependencies: ['react'],
    configFiles: ['vite.config.js', 'vite.config.ts', 'webpack.config.js'],
    buildTools: ['vite', 'webpack'],
    features: ['hooks', 'jsx']
  }
];

// Build tool detection patterns
const BUILD_TOOL_PATTERNS: Record<BuildTool, { dependencies: string[]; configFiles: string[] }> = {
  vite: {
    dependencies: ['vite'],
    configFiles: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs']
  },
  webpack: {
    dependencies: ['webpack'],
    configFiles: ['webpack.config.js', 'webpack.config.ts']
  },
  rollup: {
    dependencies: ['rollup'],
    configFiles: ['rollup.config.js', 'rollup.config.ts']
  },
  esbuild: {
    dependencies: ['esbuild'],
    configFiles: ['esbuild.config.js']
  },
  turbo: {
    dependencies: ['turbo'],
    configFiles: ['turbo.json']
  },
  unknown: {
    dependencies: [],
    configFiles: []
  }
};

/**
 * Detects the framework and build configuration of a project
 */
export function detectFramework(projectPath = process.cwd()): FrameworkDetectionResult {
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return createUnknownResult();
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const allDeps = { ...dependencies, ...devDependencies };

    // Detect framework
    const framework = detectFrameworkFromDependencies(allDeps);
    const version = getFrameworkVersion(framework, allDeps);
    
    // Detect build tool
    const buildTool = detectBuildTool(allDeps, projectPath);
    
    // Check for TypeScript
    const typescript = hasTypeScript(allDeps, projectPath);
    
    // Find config files
    const configFiles = findConfigFiles(projectPath, framework, buildTool);
    
    // Get supported features
    const supportedFeatures = getSupportedFeatures(framework, allDeps);

    return {
      framework,
      version,
      buildTool,
      typescript,
      configFiles,
      dependencies,
      devDependencies,
      supportedFeatures
    };
  } catch (error) {
    return createUnknownResult();
  }
}

/**
 * Detects framework from package.json dependencies
 */
function detectFrameworkFromDependencies(dependencies: Record<string, string>): Framework {
  // Check in priority order (more specific frameworks first)
  for (const config of FRAMEWORK_CONFIGS) {
    const hasFrameworkDep = config.dependencies.some(dep => dep in dependencies);
    if (hasFrameworkDep) {
      return config.name;
    }
  }
  
  return 'unknown';
}

/**
 * Gets the version of the detected framework
 */
function getFrameworkVersion(framework: Framework, dependencies: Record<string, string>): string | undefined {
  if (framework === 'unknown') return undefined;
  
  const config = FRAMEWORK_CONFIGS.find(c => c.name === framework);
  if (!config) return undefined;
  
  // Find the main framework dependency
  const mainDep = config.dependencies[0];
  return dependencies[mainDep];
}

/**
 * Detects the build tool being used
 */
function detectBuildTool(dependencies: Record<string, string>, projectPath: string): BuildTool {
  // Check dependencies first
  for (const [tool, { dependencies: deps }] of Object.entries(BUILD_TOOL_PATTERNS)) {
    if (deps.some(dep => dep in dependencies)) {
      return tool as BuildTool;
    }
  }
  
  // Check for config files
  for (const [tool, { configFiles }] of Object.entries(BUILD_TOOL_PATTERNS)) {
    if (configFiles.some(file => existsSync(join(projectPath, file)))) {
      return tool as BuildTool;
    }
  }
  
  return 'unknown';
}

/**
 * Checks if the project uses TypeScript
 */
function hasTypeScript(dependencies: Record<string, string>, projectPath: string): boolean {
  // Check for TypeScript dependency
  if ('typescript' in dependencies) {
    return true;
  }
  
  // Check for tsconfig.json
  if (existsSync(join(projectPath, 'tsconfig.json'))) {
    return true;
  }
  
  // Check for .ts/.tsx files in common locations
  const commonTsFiles = [
    'src/index.ts',
    'src/main.ts',
    'src/app.ts',
    'index.ts',
    'main.ts'
  ];
  
  return commonTsFiles.some(file => existsSync(join(projectPath, file)));
}

/**
 * Finds relevant configuration files
 */
function findConfigFiles(projectPath: string, framework: Framework, buildTool: BuildTool): string[] {
  const configFiles: string[] = [];
  
  // Framework-specific config files
  const frameworkConfig = FRAMEWORK_CONFIGS.find(c => c.name === framework);
  if (frameworkConfig) {
    configFiles.push(
      ...frameworkConfig.configFiles.filter(file => 
        existsSync(join(projectPath, file))
      )
    );
  }
  
  // Build tool config files
  const buildToolConfig = BUILD_TOOL_PATTERNS[buildTool];
  if (buildToolConfig) {
    configFiles.push(
      ...buildToolConfig.configFiles.filter(file => 
        existsSync(join(projectPath, file))
      )
    );
  }
  
  // Common config files
  const commonConfigs = [
    'tsconfig.json',
    'tailwind.config.js',
    'tailwind.config.ts',
    'postcss.config.js',
    'eslint.config.js',
    '.eslintrc.js',
    'prettier.config.js'
  ];
  
  configFiles.push(
    ...commonConfigs.filter(file => 
      existsSync(join(projectPath, file))
    )
  );
  
  return [...new Set(configFiles)]; // Remove duplicates
}

/**
 * Gets supported features for the framework
 */
function getSupportedFeatures(framework: Framework, dependencies: Record<string, string>): string[] {
  const frameworkConfig = FRAMEWORK_CONFIGS.find(c => c.name === framework);
  const baseFeatures = frameworkConfig?.features || [];
  
  const additionalFeatures: string[] = [];
  
  // Check for additional features based on dependencies
  if ('react-router' in dependencies || 'react-router-dom' in dependencies) {
    additionalFeatures.push('client-routing');
  }
  
  if ('@apollo/client' in dependencies || 'graphql' in dependencies) {
    additionalFeatures.push('graphql');
  }
  
  if ('redux' in dependencies || '@reduxjs/toolkit' in dependencies) {
    additionalFeatures.push('state-management');
  }
  
  if ('framer-motion' in dependencies) {
    additionalFeatures.push('animations');
  }
  
  if ('tailwindcss' in dependencies) {
    additionalFeatures.push('tailwind');
  }
  
  if ('styled-components' in dependencies || '@emotion/styled' in dependencies) {
    additionalFeatures.push('css-in-js');
  }
  
  return [...baseFeatures, ...additionalFeatures];
}

/**
 * Creates a default result for unknown projects
 */
function createUnknownResult(): FrameworkDetectionResult {
  return {
    framework: 'unknown',
    buildTool: 'unknown',
    typescript: false,
    configFiles: [],
    dependencies: {},
    devDependencies: {},
    supportedFeatures: []
  };
}

/**
 * Checks if a framework is supported for Willow CLI operations
 */
export function isFrameworkSupported(framework: Framework): boolean {
  return ['next', 'react', 'vue', 'svelte'].includes(framework);
}

/**
 * Gets recommended configuration for a framework
 */
export function getFrameworkRecommendations(result: FrameworkDetectionResult): {
  tailwindConfig: string;
  postCssConfig: boolean;
  tsConfigPath: string;
  componentPath: string;
  utilsPath: string;
} {
  const { framework } = result;
  
  const configs = {
    next: {
      tailwindConfig: 'tailwind.config.js',
      postCssConfig: false, // Next.js has built-in PostCSS
      tsConfigPath: 'tsconfig.json',
      componentPath: 'components',
      utilsPath: 'lib'
    },
    react: {
      tailwindConfig: 'tailwind.config.js',
      postCssConfig: true,
      tsConfigPath: 'tsconfig.json',
      componentPath: 'src/components',
      utilsPath: 'src/lib'
    },
    vue: {
      tailwindConfig: 'tailwind.config.js',
      postCssConfig: true,
      tsConfigPath: 'tsconfig.json',
      componentPath: 'src/components',
      utilsPath: 'src/utils'
    },
    svelte: {
      tailwindConfig: 'tailwind.config.js',
      postCssConfig: true,
      tsConfigPath: 'tsconfig.json',
      componentPath: 'src/lib',
      utilsPath: 'src/lib'
    }
  };
  
  return configs[framework] || configs.react;
}

/**
 * Detects if project is in a monorepo
 */
export function detectMonorepo(projectPath = process.cwd()): {
  isMonorepo: boolean;
  tool?: 'lerna' | 'nx' | 'rush' | 'yarn-workspaces' | 'npm-workspaces' | 'pnpm-workspaces';
  workspaceRoot?: string;
  packages?: string[];
} {
  // Check for workspace tools
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // Check for npm/yarn/pnpm workspaces
    if (packageJson.workspaces) {
      const isYarn = existsSync(join(projectPath, 'yarn.lock'));
      const isPnpm = existsSync(join(projectPath, 'pnpm-lock.yaml'));
      
      return {
        isMonorepo: true,
        tool: isPnpm ? 'pnpm-workspaces' : isYarn ? 'yarn-workspaces' : 'npm-workspaces',
        workspaceRoot: projectPath,
        packages: Array.isArray(packageJson.workspaces) ? packageJson.workspaces : packageJson.workspaces.packages
      };
    }
  }
  
  // Check for Lerna
  if (existsSync(join(projectPath, 'lerna.json'))) {
    return {
      isMonorepo: true,
      tool: 'lerna',
      workspaceRoot: projectPath
    };
  }
  
  // Check for Nx
  if (existsSync(join(projectPath, 'nx.json'))) {
    return {
      isMonorepo: true,
      tool: 'nx',
      workspaceRoot: projectPath
    };
  }
  
  // Check for Rush
  if (existsSync(join(projectPath, 'rush.json'))) {
    return {
      isMonorepo: true,
      tool: 'rush',
      workspaceRoot: projectPath
    };
  }
  
  return { isMonorepo: false };
}