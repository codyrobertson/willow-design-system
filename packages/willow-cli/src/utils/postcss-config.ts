import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { type FrameworkDetectionResult } from './framework-detection.js';

export interface PostCSSConfigResult {
  success: boolean;
  configCreated: boolean;
  configPath?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export interface PostCSSConfigOptions {
  force?: boolean;
  customPath?: string;
  includePlugins?: string[];
  excludePlugins?: string[];
}

/**
 * Sets up PostCSS configuration for the detected framework
 */
export function setupPostCSSConfig(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: PostCSSConfigOptions = {}
): PostCSSConfigResult {
  try {
    // Check if PostCSS config is needed for this framework
    if (!needsPostCSSConfig(frameworkResult)) {
      return {
        success: true,
        configCreated: false,
        skipped: true,
        reason: `${frameworkResult.framework} has built-in PostCSS support`
      };
    }

    const configPath = options.customPath || join(projectPath, 'postcss.config.js');
    
    // Check if config already exists
    if (existsSync(configPath) && !options.force) {
      return {
        success: true,
        configCreated: false,
        skipped: true,
        reason: 'PostCSS config already exists',
        configPath
      };
    }

    // Generate config content
    const configContent = generatePostCSSConfig(frameworkResult, options);
    
    // Write config file
    writeFileSync(configPath, configContent, 'utf-8');

    return {
      success: true,
      configCreated: true,
      configPath
    };

  } catch (error: any) {
    return {
      success: false,
      configCreated: false,
      error: error.message
    };
  }
}

/**
 * Determines if a framework needs a PostCSS config file
 */
function needsPostCSSConfig(frameworkResult: FrameworkDetectionResult): boolean {
  const { framework, buildTool } = frameworkResult;
  
  // Next.js has built-in PostCSS support and doesn't typically need a config
  if (framework === 'next') {
    return false;
  }
  
  // Vite projects typically need PostCSS config for Tailwind
  if (buildTool === 'vite') {
    return true;
  }
  
  // React projects typically need PostCSS config
  if (framework === 'react') {
    return true;
  }
  
  // Vue projects need PostCSS config
  if (framework === 'vue') {
    return true;
  }
  
  // Svelte projects need PostCSS config
  if (framework === 'svelte') {
    return true;
  }
  
  // Angular projects typically handle PostCSS through Angular CLI
  if (framework === 'angular') {
    return false;
  }
  
  // Default to needing config for unknown frameworks
  return true;
}

/**
 * Generates PostCSS configuration content
 */
function generatePostCSSConfig(
  frameworkResult: FrameworkDetectionResult,
  options: PostCSSConfigOptions = {}
): string {
  const { framework, buildTool } = frameworkResult;
  
  // Base plugins that are commonly needed
  const basePlugins = [
    'tailwindcss',
    'autoprefixer'
  ];
  
  // Add additional plugins based on options
  const additionalPlugins = options.includePlugins || [];
  const excludedPlugins = options.excludePlugins || [];
  
  let plugins = [...basePlugins, ...additionalPlugins]
    .filter(plugin => !excludedPlugins.includes(plugin));
  
  // Framework-specific plugin adjustments
  plugins = adjustPluginsForFramework(plugins, frameworkResult);
  
  // Generate the configuration object
  const configObject = generateConfigObject(plugins, frameworkResult);
  
  // Return formatted configuration
  return formatConfigContent(configObject, frameworkResult);
}

/**
 * Adjusts plugins based on framework requirements
 */
function adjustPluginsForFramework(
  plugins: string[],
  frameworkResult: FrameworkDetectionResult
): string[] {
  const { framework, buildTool, supportedFeatures } = frameworkResult;
  
  // Vue-specific adjustments
  if (framework === 'vue') {
    // Vue might need additional PostCSS plugins
    if (!plugins.includes('postcss-import')) {
      plugins.unshift('postcss-import');
    }
  }
  
  // Svelte-specific adjustments
  if (framework === 'svelte') {
    // Svelte might need specific plugin ordering
    if (!plugins.includes('postcss-load-config')) {
      // Keep existing order but ensure compatibility
    }
  }
  
  // Build tool specific adjustments
  if (buildTool === 'vite') {
    // Vite has some built-in PostCSS features
    // Ensure proper plugin ordering for Vite
  }
  
  return plugins;
}

/**
 * Generates the configuration object
 */
function generateConfigObject(
  plugins: string[],
  frameworkResult: FrameworkDetectionResult
): any {
  const config: any = {
    plugins: {}
  };
  
  // Add plugins as key-value pairs
  plugins.forEach(plugin => {
    config.plugins[plugin] = getPluginConfig(plugin, frameworkResult);
  });
  
  return config;
}

/**
 * Gets configuration for a specific plugin
 */
function getPluginConfig(plugin: string, frameworkResult: FrameworkDetectionResult): any {
  switch (plugin) {
    case 'tailwindcss':
      return {};
    
    case 'autoprefixer':
      return {};
    
    case 'postcss-import':
      return {};
    
    case 'postcss-nested':
      return {};
    
    case 'postcss-custom-properties':
      return {
        preserve: false
      };
    
    case 'cssnano':
      return {
        preset: 'default'
      };
    
    default:
      return {};
  }
}

/**
 * Formats the configuration content as a JavaScript module
 */
function formatConfigContent(
  configObject: any,
  frameworkResult: FrameworkDetectionResult
): string {
  const { framework } = frameworkResult;
  
  // Use ES modules for modern frameworks, CommonJS for others
  const useESModules = ['vue', 'svelte'].includes(framework);
  
  const configString = JSON.stringify(configObject, null, 2);
  
  if (useESModules) {
    return `export default ${configString}`;
  } else {
    return `module.exports = ${configString}`;
  }
}

/**
 * Validates PostCSS configuration
 */
export function validatePostCSSConfig(projectPath = process.cwd()): {
  hasConfig: boolean;
  configPath?: string;
  isValid: boolean;
  hasTailwind: boolean;
  hasAutoprefixer: boolean;
  issues: string[];
} {
  const result = {
    hasConfig: false,
    isValid: false,
    hasTailwind: false,
    hasAutoprefixer: false,
    issues: [] as string[]
  };
  
  // Check for PostCSS config files
  const configFiles = [
    'postcss.config.js',
    'postcss.config.mjs',
    'postcss.config.cjs',
    'postcss.config.ts',
    '.postcssrc.js',
    '.postcssrc.json'
  ];
  
  let configPath: string | undefined;
  for (const file of configFiles) {
    const fullPath = join(projectPath, file);
    if (existsSync(fullPath)) {
      configPath = fullPath;
      result.hasConfig = true;
      result.configPath = configPath;
      break;
    }
  }
  
  if (!result.hasConfig) {
    result.issues.push('No PostCSS config file found');
    return result;
  }
  
  // Try to read and validate the config
  try {
    const configContent = readFileSync(configPath!, 'utf-8');
    
    // Basic validation - check for required plugins
    result.hasTailwind = configContent.includes('tailwindcss');
    result.hasAutoprefixer = configContent.includes('autoprefixer');
    
    if (!result.hasTailwind) {
      result.issues.push('Tailwind CSS plugin not found in PostCSS config');
    }
    
    if (!result.hasAutoprefixer) {
      result.issues.push('Autoprefixer plugin not found in PostCSS config');
    }
    
    // Check if it's a valid JavaScript/JSON structure
    const hasValidStructure = 
      configContent.includes('module.exports') || 
      configContent.includes('export default') ||
      configContent.includes('plugins');
    
    if (!hasValidStructure) {
      result.issues.push('PostCSS config appears to have invalid structure');
    } else {
      result.isValid = true;
    }
    
  } catch (error) {
    result.issues.push(`Failed to read PostCSS config: ${error}`);
  }
  
  return result;
}

/**
 * Updates existing PostCSS config to include Tailwind CSS
 */
export function updatePostCSSConfigForTailwind(
  projectPath = process.cwd(),
  force = false
): PostCSSConfigResult {
  try {
    const validation = validatePostCSSConfig(projectPath);
    
    if (!validation.hasConfig) {
      return {
        success: false,
        configCreated: false,
        error: 'No PostCSS config found to update'
      };
    }
    
    if (validation.hasTailwind && !force) {
      return {
        success: true,
        configCreated: false,
        skipped: true,
        reason: 'Tailwind CSS already configured in PostCSS',
        configPath: validation.configPath
      };
    }
    
    const configPath = validation.configPath!;
    const configContent = readFileSync(configPath, 'utf-8');
    
    // Simple approach: add tailwindcss to the plugins if not present
    let updatedContent = configContent;
    
    if (!validation.hasTailwind) {
      // Try to add tailwindcss to the plugins object
      if (configContent.includes('plugins:')) {
        // Add tailwindcss as first plugin
        updatedContent = configContent.replace(
          /plugins:\s*{/,
          'plugins: {\n    tailwindcss: {},'
        );
      } else if (configContent.includes('plugins')) {
        // Handle different plugin syntax patterns
        updatedContent = configContent.replace(
          /plugins\s*:\s*{/,
          'plugins: {\n    tailwindcss: {},'
        );
      } else {
        // Create a basic structure - fallback if no plugins found
        updatedContent = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
      }
    }
    
    writeFileSync(configPath, updatedContent, 'utf-8');
    
    return {
      success: true,
      configCreated: false, // Updated existing
      configPath
    };
    
  } catch (error: any) {
    return {
      success: false,
      configCreated: false,
      error: error.message
    };
  }
}

/**
 * Gets PostCSS config template for a specific framework
 */
export function getPostCSSTemplate(framework: string): string {
  const templates = {
    react: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    
    vue: `export default {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    
    svelte: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    
    angular: `module.exports = {
  plugins: {
    autoprefixer: {},
  },
}`,
    
    default: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  };
  
  return templates[framework as keyof typeof templates] || templates.default;
}