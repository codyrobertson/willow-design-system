import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectPackageManager, buildInstallCommand, executePackageManagerCommand, type PackageManagerInfo } from './package-manager.js';
import { type FrameworkDetectionResult } from './framework-detection.js';

export interface TestingFrameworkResult {
  success: boolean;
  framework: 'vitest' | 'jest' | 'none';
  packagesInstalled: string[];
  configCreated: boolean;
  setupFilesCreated: boolean;
  error?: string;
}

export interface TestingFrameworkOptions {
  force?: boolean;
  preferVitest?: boolean;
  customConfig?: Record<string, any>;
  skipSetupFiles?: boolean;
}

const TESTING_PACKAGES = {
  vitest: {
    base: ['vitest', '@vitest/ui', 'jsdom'],
    react: ['@testing-library/react', '@testing-library/jest-dom', '@testing-library/user-event'],
    vue: ['@testing-library/vue', '@vue/test-utils'],
    angular: ['@testing-library/angular'],
    svelte: ['@testing-library/svelte', 'svelte-jester']
  },
  jest: {
    base: ['jest', '@types/jest', 'jest-environment-jsdom'],
    react: ['@testing-library/react', '@testing-library/jest-dom', '@testing-library/user-event'],
    vue: ['@vue/test-utils', 'vue-jest'],
    angular: ['@testing-library/angular', 'jest-preset-angular'],
    svelte: ['@testing-library/svelte', 'svelte-jester']
  }
};

/**
 * Configures testing framework for the project
 */
export async function setupTestingFramework(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: TestingFrameworkOptions = {}
): Promise<TestingFrameworkResult> {
  const result: TestingFrameworkResult = {
    success: false,
    framework: 'none',
    packagesInstalled: [],
    configCreated: false,
    setupFilesCreated: false
  };

  try {
    const packageManager = detectPackageManager(projectPath);
    
    // Determine which testing framework to use
    const testingFramework = determineTestingFramework(
      frameworkResult,
      projectPath,
      options
    );
    
    result.framework = testingFramework;
    
    if (testingFramework === 'none') {
      result.success = true;
      return result;
    }

    // Install testing packages
    const installResult = await installTestingPackages(
      packageManager,
      projectPath,
      frameworkResult,
      testingFramework,
      options
    );
    
    result.packagesInstalled = installResult.installed;

    // Create configuration file
    const configResult = await createTestingConfig(
      projectPath,
      frameworkResult,
      testingFramework,
      options
    );
    
    result.configCreated = configResult.created;

    // Create setup files
    if (!options.skipSetupFiles) {
      const setupResult = await createSetupFiles(
        projectPath,
        frameworkResult,
        testingFramework,
        options
      );
      
      result.setupFilesCreated = setupResult.created;
    }

    // Update package.json scripts
    await updatePackageJsonScripts(projectPath, testingFramework);

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Determines which testing framework to use
 */
function determineTestingFramework(
  frameworkResult: FrameworkDetectionResult,
  projectPath: string,
  options: TestingFrameworkOptions
): 'vitest' | 'jest' | 'none' {
  // Check if a testing framework is already installed
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if ('vitest' in allDeps) return 'vitest';
    if ('jest' in allDeps) return 'jest';
  }

  // Prefer Vitest for Vite projects
  if (frameworkResult.buildTool === 'vite' || options.preferVitest) {
    return 'vitest';
  }

  // Use Jest for CRA and Angular projects
  if (frameworkResult.buildTool === 'cra' || frameworkResult.framework === 'angular') {
    return 'jest';
  }

  // Default to Vitest for modern projects
  return 'vitest';
}

/**
 * Installs testing packages
 */
async function installTestingPackages(
  packageManager: PackageManagerInfo,
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  testingFramework: 'vitest' | 'jest',
  options: TestingFrameworkOptions
): Promise<{ installed: string[] }> {
  const packages = TESTING_PACKAGES[testingFramework];
  const packagesToInstall = [...packages.base];
  
  // Add framework-specific packages
  const frameworkPackages = packages[frameworkResult.framework as keyof typeof packages];
  if (frameworkPackages) {
    packagesToInstall.push(...frameworkPackages);
  }

  // Add TypeScript support for Jest
  if (testingFramework === 'jest' && frameworkResult.typescript) {
    packagesToInstall.push('ts-jest', '@types/jest');
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
        throw new Error(`Failed to install testing packages: ${result.error}`);
      }

      return { installed: toInstall };
    }
  }

  return { installed: [] };
}

/**
 * Creates testing configuration file
 */
async function createTestingConfig(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  testingFramework: 'vitest' | 'jest',
  options: TestingFrameworkOptions
): Promise<{ created: boolean }> {
  if (testingFramework === 'vitest') {
    return createVitestConfig(projectPath, frameworkResult, options);
  } else {
    return createJestConfig(projectPath, frameworkResult, options);
  }
}

/**
 * Creates Vitest configuration
 */
async function createVitestConfig(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: TestingFrameworkOptions
): Promise<{ created: boolean }> {
  const vitestConfigPath = join(projectPath, 'vitest.config.ts');
  const vitestConfigJsPath = join(projectPath, 'vitest.config.js');
  
  const configPath = frameworkResult.typescript ? vitestConfigPath : vitestConfigJsPath;
  
  if (existsSync(configPath) && !options.force) {
    return { created: false };
  }

  const config = generateVitestConfig(frameworkResult, options);
  writeFileSync(configPath, config, 'utf-8');
  
  return { created: true };
}

/**
 * Generates Vitest configuration
 */
function generateVitestConfig(
  frameworkResult: FrameworkDetectionResult,
  options: TestingFrameworkOptions
): string {
  const { framework, typescript } = frameworkResult;
  const importStatement = typescript ? 'import' : 'const';
  const requireOrImport = typescript ? 'from' : '= require(';
  const closingRequire = typescript ? '' : ')';

  let frameworkPlugin = '';
  let frameworkImport = '';
  
  if (framework === 'react') {
    frameworkImport = `${importStatement} react ${requireOrImport}'@vitejs/plugin-react'${closingRequire}\n`;
    frameworkPlugin = 'react()';
  } else if (framework === 'vue') {
    frameworkImport = `${importStatement} vue ${requireOrImport}'@vitejs/plugin-vue'${closingRequire}\n`;
    frameworkPlugin = 'vue()';
  }

  const customConfig = options.customConfig 
    ? Object.entries(options.customConfig)
        .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
        .join(',\n')
    : '';

  return `/// <reference types="vitest" />
${importStatement} { defineConfig } ${requireOrImport}'vite'${closingRequire}
${importStatement} { fileURLToPath } ${requireOrImport}'node:url'${closingRequire}
${frameworkImport}
export default defineConfig({
  plugins: [${frameworkPlugin}],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.${typescript ? 'ts' : 'js'}',
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__mocks__/**',
        '**/__tests__/**'
      ]
    }${customConfig ? ',\n' + customConfig : ''}
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
`;
}

/**
 * Creates Jest configuration
 */
async function createJestConfig(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: TestingFrameworkOptions
): Promise<{ created: boolean }> {
  const jestConfigPath = join(projectPath, 'jest.config.js');
  
  if (existsSync(jestConfigPath) && !options.force) {
    return { created: false };
  }

  const config = generateJestConfig(frameworkResult, options);
  writeFileSync(jestConfigPath, config, 'utf-8');
  
  return { created: true };
}

/**
 * Generates Jest configuration
 */
function generateJestConfig(
  frameworkResult: FrameworkDetectionResult,
  options: TestingFrameworkOptions
): string {
  const { framework, typescript } = frameworkResult;
  const customConfig = options.customConfig 
    ? Object.entries(options.customConfig)
        .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
        .join(',\n')
    : '';

  let preset = '';
  let transform = '';
  let moduleFileExtensions = `['js', 'jsx', 'json', 'node']`;
  let testMatch = `['**/__tests__/**/*.(js|jsx)', '**/?(*.)+(spec|test).(js|jsx)']`;

  if (typescript) {
    preset = `preset: 'ts-jest',\n  `;
    moduleFileExtensions = `['ts', 'tsx', 'js', 'jsx', 'json', 'node']`;
    testMatch = `['**/__tests__/**/*.(ts|tsx|js|jsx)', '**/?(*.)+(spec|test).(ts|tsx|js|jsx)']`;
  }

  if (framework === 'angular') {
    preset = `preset: 'jest-preset-angular',\n  `;
  } else if (framework === 'vue') {
    transform = `\n  transform: {\n    '^.+\\.vue$': 'vue-jest',\n    '^.+\\.(js|jsx|ts|tsx)$': '${typescript ? 'ts-jest' : 'babel-jest'}'\n  },`;
  }

  return `module.exports = {
  ${preset}testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ${testMatch},
  moduleFileExtensions: ${moduleFileExtensions},${transform}
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.${typescript ? 'ts' : 'js'}'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx${typescript ? ',ts,tsx' : ''}}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }${customConfig ? ',\n' + customConfig : ''}
}
`;
}

/**
 * Creates setup files for testing
 */
async function createSetupFiles(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  testingFramework: 'vitest' | 'jest',
  options: TestingFrameworkOptions
): Promise<{ created: boolean }> {
  const testDir = join(projectPath, 'src', 'test');
  const setupFileName = `setup.${frameworkResult.typescript ? 'ts' : 'js'}`;
  const setupPath = join(testDir, setupFileName);

  if (existsSync(setupPath) && !options.force) {
    return { created: false };
  }

  // Create test directory if it doesn't exist
  if (!existsSync(testDir)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(testDir, { recursive: true });
  }

  const setupContent = generateSetupFile(frameworkResult, testingFramework);
  writeFileSync(setupPath, setupContent, 'utf-8');

  // Create test utilities file
  const utilsPath = join(testDir, `test-utils.${frameworkResult.typescript ? 'tsx' : 'jsx'}`);
  if (!existsSync(utilsPath) || options.force) {
    const utilsContent = generateTestUtils(frameworkResult);
    writeFileSync(utilsPath, utilsContent, 'utf-8');
  }

  return { created: true };
}

/**
 * Generates setup file content
 */
function generateSetupFile(
  frameworkResult: FrameworkDetectionResult,
  testingFramework: 'vitest' | 'jest'
): string {
  const { framework } = frameworkResult;
  
  let imports = '';
  let setup = '';

  if (framework === 'react' || framework === 'next') {
    imports = `import '@testing-library/jest-dom'`;
    if (testingFramework === 'vitest') {
      imports += `\nimport { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'`;
      setup = `\n\n// Cleanup after each test\nafterEach(() => {\n  cleanup()\n})`;
    }
  } else if (framework === 'vue') {
    imports = `import '@testing-library/jest-dom'`;
  }

  return `// Test setup file
${imports}

// Add custom matchers
${testingFramework === 'vitest' ? "import { expect } from 'vitest'" : ''}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
})${setup}

// Add any global test utilities here
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
`;
}

/**
 * Generates test utilities file
 */
function generateTestUtils(frameworkResult: FrameworkDetectionResult): string {
  const { framework, typescript } = frameworkResult;
  
  if (framework === 'react' || framework === 'next') {
    return `import React${typescript ? ', { ReactElement }' : ''} from 'react'
import { render${typescript ? ', RenderOptions' : ''} } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Add any providers or wrappers here
const AllTheProviders = ({ children }${typescript ? ': { children: React.ReactNode }' : ''}) => {
  return <>{children}</>
}

const customRender = (
  ui${typescript ? ': ReactElement' : ''},
  options${typescript ? '?: Omit<RenderOptions, "wrapper">' : ''}
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options })
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
`;
  } else if (framework === 'vue') {
    return `import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'

const customRender = (component${typescript ? ': any' : ''}, options${typescript ? '?: any' : ''}) => {
  return {
    user: userEvent.setup(),
    ...render(component, options)
  }
}

// Re-export everything
export * from '@testing-library/vue'
export { customRender as render }
`;
  }

  return '// Add custom test utilities here\n';
}

/**
 * Updates package.json scripts
 */
async function updatePackageJsonScripts(
  projectPath: string,
  testingFramework: 'vitest' | 'jest'
): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  // Add testing scripts
  if (testingFramework === 'vitest') {
    packageJson.scripts.test = packageJson.scripts.test || 'vitest';
    packageJson.scripts['test:ui'] = 'vitest --ui';
    packageJson.scripts['test:coverage'] = 'vitest --coverage';
  } else {
    packageJson.scripts.test = packageJson.scripts.test || 'jest';
    packageJson.scripts['test:watch'] = 'jest --watch';
    packageJson.scripts['test:coverage'] = 'jest --coverage';
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
}

/**
 * Validates testing framework setup
 */
export function validateTestingSetup(projectPath = process.cwd()): {
  hasTestingFramework: boolean;
  framework: 'vitest' | 'jest' | 'none';
  hasConfig: boolean;
  hasSetupFiles: boolean;
  hasTestUtils: boolean;
  missingPackages: string[];
  issues: string[];
} {
  const result = {
    hasTestingFramework: false,
    framework: 'none' as const,
    hasConfig: false,
    hasSetupFiles: false,
    hasTestUtils: false,
    missingPackages: [] as string[],
    issues: [] as string[]
  };

  // Check package.json for testing framework
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      if ('vitest' in allDeps) {
        result.hasTestingFramework = true;
        result.framework = 'vitest';
        
        // Check for Vitest config
        const vitestConfigs = ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js'];
        result.hasConfig = vitestConfigs.some(config => existsSync(join(projectPath, config)));
        
        if (!result.hasConfig) {
          result.issues.push('Vitest installed but no configuration found');
        }
      } else if ('jest' in allDeps) {
        result.hasTestingFramework = true;
        result.framework = 'jest';
        
        // Check for Jest config
        const jestConfigs = ['jest.config.js', 'jest.config.ts', 'package.json'];
        result.hasConfig = jestConfigs.some(config => {
          if (config === 'package.json') {
            return packageJson.jest !== undefined;
          }
          return existsSync(join(projectPath, config));
        });
        
        if (!result.hasConfig) {
          result.issues.push('Jest installed but no configuration found');
        }
      } else {
        result.missingPackages.push('vitest or jest');
      }

      // Check for testing library
      if (!('@testing-library/react' in allDeps || '@testing-library/vue' in allDeps || '@testing-library/angular' in allDeps)) {
        result.issues.push('No testing library found for component testing');
      }

      // Check for setup files
      const setupPaths = [
        'src/test/setup.ts',
        'src/test/setup.js',
        'src/setupTests.ts',
        'src/setupTests.js'
      ];
      result.hasSetupFiles = setupPaths.some(path => existsSync(join(projectPath, path)));

      // Check for test utils
      const utilsPaths = [
        'src/test/test-utils.tsx',
        'src/test/test-utils.jsx',
        'src/test-utils.tsx',
        'src/test-utils.jsx'
      ];
      result.hasTestUtils = utilsPaths.some(path => existsSync(join(projectPath, path)));

    } catch {
      result.issues.push('Failed to read package.json');
    }
  } else {
    result.issues.push('No package.json found');
  }

  if (!result.hasTestingFramework) {
    result.issues.push('No testing framework installed');
  }

  return result;
}