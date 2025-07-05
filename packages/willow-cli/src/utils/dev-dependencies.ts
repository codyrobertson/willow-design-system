import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectPackageManager, buildInstallCommand, executePackageManagerCommand, type PackageManagerInfo } from './package-manager.js';
import { type FrameworkDetectionResult } from './framework-detection.js';

export interface DevDependenciesResult {
  success: boolean;
  packagesInstalled: string[];
  eslintConfigured: boolean;
  prettierConfigured: boolean;
  huskyConfigured: boolean;
  lintStagedConfigured: boolean;
  error?: string;
}

export interface DevDependenciesOptions {
  force?: boolean;
  skipEslint?: boolean;
  skipPrettier?: boolean;
  skipHusky?: boolean;
  customEslintRules?: Record<string, any>;
  customPrettierConfig?: Record<string, any>;
}

const BASE_DEV_DEPENDENCIES = [
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  'eslint',
  'eslint-plugin-tailwindcss',
  'prettier',
  'prettier-plugin-tailwindcss',
  'husky',
  'lint-staged'
];

const FRAMEWORK_SPECIFIC_DEPS: Record<string, string[]> = {
  react: [
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-jsx-a11y'
  ],
  next: [
    'eslint-config-next',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-jsx-a11y'
  ],
  vue: [
    'eslint-plugin-vue',
    '@vue/eslint-config-typescript'
  ],
  angular: [
    '@angular-eslint/eslint-plugin',
    '@angular-eslint/eslint-plugin-template',
    '@angular-eslint/schematics',
    '@angular-eslint/template-parser'
  ],
  svelte: [
    'eslint-plugin-svelte',
    '@sveltejs/eslint-config'
  ]
};

/**
 * Installs and configures development dependencies
 */
export async function setupDevDependencies(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: DevDependenciesOptions = {}
): Promise<DevDependenciesResult> {
  const result: DevDependenciesResult = {
    success: false,
    packagesInstalled: [],
    eslintConfigured: false,
    prettierConfigured: false,
    huskyConfigured: false,
    lintStagedConfigured: false
  };

  try {
    const packageManager = detectPackageManager(projectPath);
    
    // Install dev dependencies
    const installResult = await installDevPackages(
      packageManager,
      projectPath,
      frameworkResult,
      options
    );
    
    result.packagesInstalled = installResult.installed;

    // Configure ESLint
    if (!options.skipEslint) {
      const eslintResult = await configureEslint(
        projectPath,
        frameworkResult,
        options
      );
      result.eslintConfigured = eslintResult.configured;
    }

    // Configure Prettier
    if (!options.skipPrettier) {
      const prettierResult = await configurePrettier(
        projectPath,
        options
      );
      result.prettierConfigured = prettierResult.configured;
    }

    // Configure Husky and lint-staged
    if (!options.skipHusky) {
      const huskyResult = await configureHusky(
        packageManager,
        projectPath,
        options
      );
      result.huskyConfigured = huskyResult.huskyConfigured;
      result.lintStagedConfigured = huskyResult.lintStagedConfigured;
    }

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Installs development packages
 */
async function installDevPackages(
  packageManager: PackageManagerInfo,
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: DevDependenciesOptions
): Promise<{ installed: string[] }> {
  const packagesToInstall = [...BASE_DEV_DEPENDENCIES];
  
  // Add framework-specific dependencies
  const frameworkDeps = FRAMEWORK_SPECIFIC_DEPS[frameworkResult.framework] || [];
  packagesToInstall.push(...frameworkDeps);

  // Remove TypeScript ESLint packages if not using TypeScript
  if (!frameworkResult.typescript) {
    const tsPackages = ['@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'];
    const filtered = packagesToInstall.filter(pkg => !tsPackages.includes(pkg));
    packagesToInstall.length = 0;
    packagesToInstall.push(...filtered);
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
        { dev: true }
      );

      const result = executePackageManagerCommand(installCommand, {
        cwd: projectPath,
        silent: false
      });

      if (!result.success) {
        throw new Error(`Failed to install dev dependencies: ${result.error}`);
      }

      return { installed: toInstall };
    }
  }

  return { installed: [] };
}

/**
 * Configures ESLint
 */
async function configureEslint(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: DevDependenciesOptions
): Promise<{ configured: boolean }> {
  const eslintConfigPath = join(projectPath, '.eslintrc.json');
  const eslintConfigJsPath = join(projectPath, '.eslintrc.js');
  const eslintConfigCjsPath = join(projectPath, '.eslintrc.cjs');
  
  // Check if config already exists
  const configExists = existsSync(eslintConfigPath) || 
                     existsSync(eslintConfigJsPath) || 
                     existsSync(eslintConfigCjsPath);

  if (configExists && !options.force) {
    return { configured: false };
  }

  const eslintConfig = generateEslintConfig(frameworkResult, options);
  
  // Prefer JSON format
  writeFileSync(eslintConfigPath, JSON.stringify(eslintConfig, null, 2), 'utf-8');
  
  // Create .eslintignore
  const eslintIgnorePath = join(projectPath, '.eslintignore');
  if (!existsSync(eslintIgnorePath) || options.force) {
    const eslintIgnore = generateEslintIgnore(frameworkResult);
    writeFileSync(eslintIgnorePath, eslintIgnore, 'utf-8');
  }

  return { configured: true };
}

/**
 * Generates ESLint configuration
 */
function generateEslintConfig(
  frameworkResult: FrameworkDetectionResult,
  options: DevDependenciesOptions
): any {
  const { framework, typescript } = frameworkResult;
  
  const baseConfig: any = {
    root: true,
    env: {
      browser: true,
      es2021: true,
      node: true
    },
    extends: [
      'eslint:recommended'
    ],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      ...options.customEslintRules
    }
  };

  // TypeScript configuration
  if (typescript) {
    baseConfig.parser = '@typescript-eslint/parser';
    baseConfig.extends.push(
      'plugin:@typescript-eslint/recommended'
    );
    baseConfig.plugins = ['@typescript-eslint'];
    baseConfig.parserOptions.project = './tsconfig.json';
  }

  // Framework-specific configuration
  switch (framework) {
    case 'react':
      baseConfig.extends.push(
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended'
      );
      baseConfig.settings = {
        react: {
          version: 'detect'
        }
      };
      baseConfig.parserOptions.ecmaFeatures = {
        jsx: true
      };
      baseConfig.rules['react/react-in-jsx-scope'] = 'off'; // Not needed in React 17+
      baseConfig.rules['react/prop-types'] = 'off'; // Using TypeScript
      break;

    case 'next':
      baseConfig.extends = ['next/core-web-vitals'];
      break;

    case 'vue':
      baseConfig.extends.push('plugin:vue/vue3-recommended');
      if (typescript) {
        baseConfig.extends.push('@vue/typescript/recommended');
      }
      baseConfig.parserOptions.parser = typescript ? '@typescript-eslint/parser' : undefined;
      break;

    case 'angular':
      baseConfig.overrides = [
        {
          files: ['*.ts'],
          parserOptions: {
            project: ['tsconfig.json'],
            createDefaultProgram: true
          },
          extends: [
            'plugin:@angular-eslint/recommended',
            'plugin:@angular-eslint/template/process-inline-templates'
          ]
        },
        {
          files: ['*.html'],
          extends: ['plugin:@angular-eslint/template/recommended'],
          rules: {}
        }
      ];
      break;

    case 'svelte':
      baseConfig.extends.push('plugin:svelte/recommended');
      if (typescript) {
        baseConfig.parserOptions.parser = '@typescript-eslint/parser';
        baseConfig.parserOptions.extraFileExtensions = ['.svelte'];
      }
      break;
  }

  // Add Tailwind CSS plugin
  baseConfig.extends.push('plugin:tailwindcss/recommended');
  
  // Add common rules
  baseConfig.rules = {
    ...baseConfig.rules,
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/classnames-order': 'warn'
  };

  return baseConfig;
}

/**
 * Generates .eslintignore content
 */
function generateEslintIgnore(frameworkResult: FrameworkDetectionResult): string {
  const common = [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'out',
    'coverage',
    '*.min.js',
    '*.min.css'
  ];

  if (frameworkResult.framework === 'next') {
    common.push('.vercel');
  }

  if (frameworkResult.framework === 'angular') {
    common.push('.angular');
  }

  return common.join('\n');
}

/**
 * Configures Prettier
 */
async function configurePrettier(
  projectPath: string,
  options: DevDependenciesOptions
): Promise<{ configured: boolean }> {
  const prettierConfigPath = join(projectPath, '.prettierrc');
  const prettierConfigJsonPath = join(projectPath, '.prettierrc.json');
  const prettierConfigJsPath = join(projectPath, '.prettierrc.js');
  
  // Check if config already exists
  const configExists = existsSync(prettierConfigPath) || 
                     existsSync(prettierConfigJsonPath) || 
                     existsSync(prettierConfigJsPath);

  if (configExists && !options.force) {
    return { configured: false };
  }

  const prettierConfig = {
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 100,
    plugins: ['prettier-plugin-tailwindcss'],
    ...options.customPrettierConfig
  };
  
  writeFileSync(prettierConfigJsonPath, JSON.stringify(prettierConfig, null, 2), 'utf-8');
  
  // Create .prettierignore
  const prettierIgnorePath = join(projectPath, '.prettierignore');
  if (!existsSync(prettierIgnorePath) || options.force) {
    const prettierIgnore = generatePrettierIgnore();
    writeFileSync(prettierIgnorePath, prettierIgnore, 'utf-8');
  }

  return { configured: true };
}

/**
 * Generates .prettierignore content
 */
function generatePrettierIgnore(): string {
  return [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'out',
    'coverage',
    '*.min.js',
    '*.min.css',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb'
  ].join('\n');
}

/**
 * Configures Husky and lint-staged
 */
async function configureHusky(
  packageManager: PackageManagerInfo,
  projectPath: string,
  options: DevDependenciesOptions
): Promise<{ huskyConfigured: boolean; lintStagedConfigured: boolean }> {
  const result = {
    huskyConfigured: false,
    lintStagedConfigured: false
  };

  // Initialize Husky
  const huskyInstallCommand = `${packageManager.runCommand} husky install`;
  const huskyResult = executePackageManagerCommand(huskyInstallCommand, {
    cwd: projectPath,
    silent: false
  });

  if (!huskyResult.success) {
    return result;
  }

  // Add pre-commit hook
  const huskyAddCommand = `${packageManager.runCommand} husky add .husky/pre-commit "npx lint-staged"`;
  const addResult = executePackageManagerCommand(huskyAddCommand, {
    cwd: projectPath,
    silent: false
  });

  if (addResult.success) {
    result.huskyConfigured = true;
  }

  // Configure lint-staged
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson['lint-staged'] || options.force) {
      packageJson['lint-staged'] = {
        '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
        '*.{css,scss,md,json}': 'prettier --write'
      };
      
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
      result.lintStagedConfigured = true;
    }

    // Add prepare script for Husky
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    if (!packageJson.scripts.prepare || options.force) {
      packageJson.scripts.prepare = 'husky install';
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }
  }

  return result;
}

/**
 * Validates development dependencies setup
 */
export function validateDevDependenciesSetup(projectPath = process.cwd()): {
  hasEslint: boolean;
  hasPrettier: boolean;
  hasHusky: boolean;
  hasLintStaged: boolean;
  missingPackages: string[];
  issues: string[];
} {
  const result = {
    hasEslint: false,
    hasPrettier: false,
    hasHusky: false,
    hasLintStaged: false,
    missingPackages: [] as string[],
    issues: [] as string[]
  };

  // Check package.json for dependencies
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Check for ESLint
      if ('eslint' in allDeps) {
        result.hasEslint = true;
        
        // Check for ESLint config
        const eslintConfigs = ['.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs'];
        const hasConfig = eslintConfigs.some(config => 
          existsSync(join(projectPath, config))
        );
        
        if (!hasConfig) {
          result.issues.push('ESLint installed but no configuration found');
        }
      } else {
        result.missingPackages.push('eslint');
      }

      // Check for Prettier
      if ('prettier' in allDeps) {
        result.hasPrettier = true;
        
        // Check for Prettier config
        const prettierConfigs = ['.prettierrc', '.prettierrc.json', '.prettierrc.js'];
        const hasConfig = prettierConfigs.some(config => 
          existsSync(join(projectPath, config))
        );
        
        if (!hasConfig) {
          result.issues.push('Prettier installed but no configuration found');
        }
        
        // Check for Tailwind plugin
        if (!('prettier-plugin-tailwindcss' in allDeps)) {
          result.issues.push('Missing prettier-plugin-tailwindcss for Tailwind class sorting');
        }
      } else {
        result.missingPackages.push('prettier');
      }

      // Check for Husky
      if ('husky' in allDeps) {
        result.hasHusky = true;
        
        // Check for .husky directory
        if (!existsSync(join(projectPath, '.husky'))) {
          result.issues.push('Husky installed but not initialized');
        }
      } else {
        result.missingPackages.push('husky');
      }

      // Check for lint-staged
      if ('lint-staged' in allDeps) {
        result.hasLintStaged = true;
        
        // Check for lint-staged configuration
        if (!packageJson['lint-staged']) {
          result.issues.push('lint-staged installed but not configured');
        }
      } else {
        result.missingPackages.push('lint-staged');
      }

    } catch {
      result.issues.push('Failed to read package.json');
    }
  } else {
    result.issues.push('No package.json found');
  }

  return result;
}