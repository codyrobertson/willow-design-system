import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { type FrameworkDetectionResult } from './framework-detection.js';

export interface BuildToolConfigResult {
  success: boolean;
  toolConfigured: 'vite' | 'next' | 'webpack' | 'none';
  configPath?: string;
  aliasesAdded: boolean;
  cssConfigured: boolean;
  error?: string;
}

export interface BuildToolConfigOptions {
  force?: boolean;
  skipAliases?: boolean;
  skipCss?: boolean;
  customAliases?: Record<string, string>;
}

/**
 * Configures build tools for optimal Willow usage
 */
export async function configureBuildTool(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: BuildToolConfigOptions = {}
): Promise<BuildToolConfigResult> {
  const result: BuildToolConfigResult = {
    success: false,
    toolConfigured: 'none',
    aliasesAdded: false,
    cssConfigured: false
  };

  try {
    const { buildTool, framework } = frameworkResult;

    switch (buildTool) {
      case 'vite':
        return await configureVite(projectPath, frameworkResult, options);
      
      case 'webpack':
        return await configureWebpack(projectPath, frameworkResult, options);
      
      case 'next':
        return await configureNext(projectPath, frameworkResult, options);
      
      default:
        // Check if it's a Next.js project even if buildTool is unknown
        if (framework === 'next') {
          return await configureNext(projectPath, frameworkResult, options);
        }
        
        result.success = true;
        result.toolConfigured = 'none';
        return result;
    }
  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Configures Vite for Willow
 */
async function configureVite(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: BuildToolConfigOptions
): Promise<BuildToolConfigResult> {
  const result: BuildToolConfigResult = {
    success: false,
    toolConfigured: 'vite',
    aliasesAdded: false,
    cssConfigured: false
  };

  const viteConfigPath = join(projectPath, 'vite.config.js');
  const viteConfigTsPath = join(projectPath, 'vite.config.ts');
  
  const configPath = existsSync(viteConfigTsPath) ? viteConfigTsPath : viteConfigPath;
  const isTypeScript = configPath.endsWith('.ts');

  if (!existsSync(configPath) && !options.force) {
    // Create a new Vite config if it doesn't exist
    const newConfig = generateViteConfig(frameworkResult, options);
    const newConfigPath = isTypeScript || frameworkResult.typescript ? viteConfigTsPath : viteConfigPath;
    
    writeFileSync(newConfigPath, newConfig, 'utf-8');
    result.configPath = newConfigPath;
    result.aliasesAdded = true;
    result.cssConfigured = true;
    result.success = true;
    
    return result;
  }

  if (existsSync(configPath)) {
    const updatedConfig = updateViteConfig(
      readFileSync(configPath, 'utf-8'),
      frameworkResult,
      options
    );
    
    if (updatedConfig.modified) {
      writeFileSync(configPath, updatedConfig.content, 'utf-8');
      result.configPath = configPath;
      result.aliasesAdded = updatedConfig.aliasesAdded;
      result.cssConfigured = updatedConfig.cssConfigured;
    }
    
    result.success = true;
  }

  return result;
}

/**
 * Generates a new Vite configuration
 */
function generateViteConfig(
  frameworkResult: FrameworkDetectionResult,
  options: BuildToolConfigOptions
): string {
  const { framework, typescript } = frameworkResult;
  const importStatement = typescript ? 'import' : 'const';
  const requireOrImport = typescript ? 'from' : '= require(';
  const closingRequire = typescript ? '' : ')';
  
  const aliases = options.customAliases || {
    '@': '/src'
  };
  
  const aliasEntries = Object.entries(aliases)
    .map(([key, value]) => `      '${key}': fileURLToPath(new URL('.${value}', import.meta.url))`)
    .join(',\n');

  let plugins = '';
  if (framework === 'react') {
    plugins = `\n      react()`;
  } else if (framework === 'vue') {
    plugins = `\n      vue()`;
  } else if (framework === 'svelte') {
    plugins = `\n      svelte()`;
  }

  const pluginImports = framework === 'react' ? `${importStatement} react ${requireOrImport}'@vitejs/plugin-react'${closingRequire}\n` :
                       framework === 'vue' ? `${importStatement} vue ${requireOrImport}'@vitejs/plugin-vue'${closingRequire}\n` :
                       framework === 'svelte' ? `${importStatement} { svelte } ${requireOrImport}'@sveltejs/vite-plugin-svelte'${closingRequire}\n` : '';

  return `${importStatement} { defineConfig } ${requireOrImport}'vite'${closingRequire}
${importStatement} { fileURLToPath, URL } ${requireOrImport}'node:url'${closingRequire}
${pluginImports}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [${plugins}
  ],
  resolve: {
    alias: {
${aliasEntries}
    }
  },
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    include: ['clsx', 'tailwind-merge']
  }
})
`;
}

/**
 * Updates existing Vite configuration
 */
function updateViteConfig(
  content: string,
  frameworkResult: FrameworkDetectionResult,
  options: BuildToolConfigOptions
): { content: string; modified: boolean; aliasesAdded: boolean; cssConfigured: boolean } {
  let modified = false;
  let aliasesAdded = false;
  let cssConfigured = false;
  let updatedContent = content;

  // Add imports if missing
  if (!content.includes('fileURLToPath') && !content.includes('path')) {
    const importLine = frameworkResult.typescript
      ? "import { fileURLToPath, URL } from 'node:url'\n"
      : "const { fileURLToPath, URL } = require('node:url')\n";
    
    // Add after the first import/require
    const firstImportMatch = content.match(/(import|const).*?(from|require)/);
    if (firstImportMatch) {
      const insertPos = content.indexOf('\n', firstImportMatch.index) + 1;
      updatedContent = content.slice(0, insertPos) + importLine + content.slice(insertPos);
      modified = true;
    }
  }

  // Add or update aliases
  if (!options.skipAliases) {
    const aliasMatch = updatedContent.match(/alias\s*:\s*{([^}]*)}/s);
    
    if (!aliasMatch || !aliasMatch[1].includes('@')) {
      const aliases = options.customAliases || { '@': '/src' };
      const aliasEntries = Object.entries(aliases)
        .map(([key, value]) => `      '${key}': fileURLToPath(new URL('.${value}', import.meta.url))`)
        .join(',\n');

      if (aliasMatch) {
        // Add to existing alias object
        const existingAliases = aliasMatch[1].trim();
        const newAliases = existingAliases
          ? `${existingAliases},\n${aliasEntries}`
          : aliasEntries;
        
        updatedContent = updatedContent.replace(
          aliasMatch[0],
          `alias: {\n${newAliases}\n    }`
        );
      } else {
        // Add resolve.alias section
        const resolveMatch = updatedContent.match(/resolve\s*:\s*{([^}]*)}/s);
        
        if (resolveMatch) {
          // Add alias to existing resolve
          const newResolve = `resolve: {\n    alias: {\n${aliasEntries}\n    },${resolveMatch[1]}`;
          updatedContent = updatedContent.replace(resolveMatch[0], newResolve);
        } else {
          // Add entire resolve section
          const pluginsMatch = updatedContent.match(/plugins\s*:\s*\[([^\]]*)\]/s);
          if (pluginsMatch) {
            const insertPos = updatedContent.indexOf(']', pluginsMatch.index) + 1;
            const resolveSection = `,\n  resolve: {\n    alias: {\n${aliasEntries}\n    }\n  }`;
            updatedContent = updatedContent.slice(0, insertPos) + resolveSection + updatedContent.slice(insertPos);
          }
        }
      }
      
      modified = true;
      aliasesAdded = true;
    }
  }

  // Add CSS configuration
  if (!options.skipCss && !updatedContent.includes('css:')) {
    const cssSection = `,\n  css: {\n    postcss: './postcss.config.js'\n  }`;
    
    // Find a good place to insert - after resolve or plugins
    const resolveMatch = updatedContent.match(/resolve\s*:\s*{[^}]*}/s);
    const pluginsMatch = updatedContent.match(/plugins\s*:\s*\[[^\]]*\]/s);
    
    const insertAfter = resolveMatch || pluginsMatch;
    if (insertAfter) {
      const insertPos = insertAfter.index! + insertAfter[0].length;
      updatedContent = updatedContent.slice(0, insertPos) + cssSection + updatedContent.slice(insertPos);
      modified = true;
      cssConfigured = true;
    }
  }

  // Add optimizeDeps for Tailwind packages
  if (!updatedContent.includes('optimizeDeps')) {
    const optimizeSection = `,\n  optimizeDeps: {\n    include: ['clsx', 'tailwind-merge']\n  }`;
    
    // Insert before the closing parenthesis
    const lastBrace = updatedContent.lastIndexOf('}');
    if (lastBrace > -1) {
      // Find the last property
      const beforeLastBrace = updatedContent.slice(0, lastBrace);
      const lastPropertyEnd = Math.max(
        beforeLastBrace.lastIndexOf('}'),
        beforeLastBrace.lastIndexOf(']'),
        beforeLastBrace.lastIndexOf('"'),
        beforeLastBrace.lastIndexOf("'")
      );
      
      if (lastPropertyEnd > -1) {
        updatedContent = updatedContent.slice(0, lastPropertyEnd + 1) + 
                        optimizeSection + 
                        updatedContent.slice(lastPropertyEnd + 1);
        modified = true;
      }
    }
  }

  return { content: updatedContent, modified, aliasesAdded, cssConfigured };
}

/**
 * Configures Next.js for Willow
 */
async function configureNext(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: BuildToolConfigOptions
): Promise<BuildToolConfigResult> {
  const result: BuildToolConfigResult = {
    success: false,
    toolConfigured: 'next',
    aliasesAdded: false,
    cssConfigured: false
  };

  const nextConfigPath = join(projectPath, 'next.config.js');
  const nextConfigMjsPath = join(projectPath, 'next.config.mjs');
  
  const configPath = existsSync(nextConfigMjsPath) ? nextConfigMjsPath : nextConfigPath;
  const isESM = configPath.endsWith('.mjs');

  if (!existsSync(configPath) && !options.force) {
    // Create a new Next.js config
    const newConfig = generateNextConfig(options, isESM);
    const newConfigPath = isESM ? nextConfigMjsPath : nextConfigPath;
    
    writeFileSync(newConfigPath, newConfig, 'utf-8');
    result.configPath = newConfigPath;
    result.aliasesAdded = true;
    result.cssConfigured = true;
    result.success = true;
    
    return result;
  }

  if (existsSync(configPath)) {
    const updatedConfig = updateNextConfig(
      readFileSync(configPath, 'utf-8'),
      options,
      isESM
    );
    
    if (updatedConfig.modified) {
      writeFileSync(configPath, updatedConfig.content, 'utf-8');
      result.configPath = configPath;
      result.aliasesAdded = updatedConfig.aliasesAdded;
      result.cssConfigured = true; // Next.js handles CSS automatically
    }
    
    result.success = true;
  }

  return result;
}

/**
 * Generates a new Next.js configuration
 */
function generateNextConfig(options: BuildToolConfigOptions, isESM: boolean): string {
  const aliases = options.customAliases || {
    '@': './src'
  };
  
  const aliasEntries = Object.entries(aliases)
    .map(([key, value]) => `        '${key}': '${value}'`)
    .join(',\n');

  if (isESM) {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
${aliasEntries}
    }
    return config
  }
}

export default nextConfig
`;
  } else {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
${aliasEntries}
    }
    return config
  }
}

module.exports = nextConfig
`;
  }
}

/**
 * Updates existing Next.js configuration
 */
function updateNextConfig(
  content: string,
  options: BuildToolConfigOptions,
  isESM: boolean
): { content: string; modified: boolean; aliasesAdded: boolean } {
  let modified = false;
  let aliasesAdded = false;
  let updatedContent = content;

  // Check if webpack config exists
  const webpackMatch = content.match(/webpack\s*:\s*\([^)]*\)\s*=>\s*{/);
  
  if (!webpackMatch && !options.skipAliases) {
    // Add webpack configuration
    const aliases = options.customAliases || { '@': './src' };
    const aliasEntries = Object.entries(aliases)
      .map(([key, value]) => `        '${key}': '${value}'`)
      .join(',\n');

    const webpackConfig = `\n  webpack: (config) => {\n    config.resolve.alias = {\n      ...config.resolve.alias,\n${aliasEntries}\n    }\n    return config\n  }`;

    // Find where to insert
    const configMatch = content.match(/const\s+nextConfig\s*=\s*{([^}]*)}/s);
    if (configMatch) {
      const existingProps = configMatch[1].trim();
      const newProps = existingProps
        ? `${existingProps},${webpackConfig}`
        : webpackConfig;
      
      updatedContent = content.replace(
        configMatch[0],
        `const nextConfig = {\n${newProps}\n}`
      );
      
      modified = true;
      aliasesAdded = true;
    }
  } else if (webpackMatch && !options.skipAliases) {
    // Check if aliases are already configured
    const hasAliases = content.includes('config.resolve.alias') && content.includes('@');
    
    if (!hasAliases) {
      // Add aliases to existing webpack config
      const aliases = options.customAliases || { '@': './src' };
      const aliasEntries = Object.entries(aliases)
        .map(([key, value]) => `        '${key}': '${value}'`)
        .join(',\n');

      const aliasConfig = `    config.resolve.alias = {\n      ...config.resolve.alias,\n${aliasEntries}\n    }\n`;
      
      // Insert after the webpack function opening
      const insertPos = webpackMatch.index! + webpackMatch[0].length;
      updatedContent = content.slice(0, insertPos) + '\n' + aliasConfig + content.slice(insertPos);
      
      modified = true;
      aliasesAdded = true;
    }
  }

  return { content: updatedContent, modified, aliasesAdded };
}

/**
 * Configures Webpack for Willow
 */
async function configureWebpack(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: BuildToolConfigOptions
): Promise<BuildToolConfigResult> {
  const result: BuildToolConfigResult = {
    success: false,
    toolConfigured: 'webpack',
    aliasesAdded: false,
    cssConfigured: false
  };

  const webpackConfigPath = join(projectPath, 'webpack.config.js');
  
  if (!existsSync(webpackConfigPath)) {
    // For CRA projects, we need to eject or use craco/react-app-rewired
    result.success = true;
    result.error = 'Webpack configuration requires ejecting from Create React App or using CRACO';
    return result;
  }

  const content = readFileSync(webpackConfigPath, 'utf-8');
  const updatedConfig = updateWebpackConfig(content, frameworkResult, options);
  
  if (updatedConfig.modified) {
    writeFileSync(webpackConfigPath, updatedConfig.content, 'utf-8');
    result.configPath = webpackConfigPath;
    result.aliasesAdded = updatedConfig.aliasesAdded;
    result.cssConfigured = updatedConfig.cssConfigured;
  }
  
  result.success = true;
  return result;
}

/**
 * Updates existing Webpack configuration
 */
function updateWebpackConfig(
  content: string,
  frameworkResult: FrameworkDetectionResult,
  options: BuildToolConfigOptions
): { content: string; modified: boolean; aliasesAdded: boolean; cssConfigured: boolean } {
  // This is a simplified implementation
  // Real-world webpack configs can be very complex
  
  let modified = false;
  let aliasesAdded = false;
  let cssConfigured = false;
  let updatedContent = content;

  // Add path import if missing
  if (!content.includes('path') && !content.includes("require('path')")) {
    updatedContent = `const path = require('path');\n${updatedContent}`;
    modified = true;
  }

  // Add aliases
  if (!options.skipAliases) {
    const aliasMatch = content.match(/alias\s*:\s*{([^}]*)}/s);
    
    if (!aliasMatch || !aliasMatch[1].includes('@')) {
      const aliases = options.customAliases || { '@': './src' };
      const aliasEntries = Object.entries(aliases)
        .map(([key, value]) => `      '${key}': path.resolve(__dirname, '${value}')`)
        .join(',\n');

      if (aliasMatch) {
        // Add to existing alias object
        const existingAliases = aliasMatch[1].trim();
        const newAliases = existingAliases
          ? `${existingAliases},\n${aliasEntries}`
          : aliasEntries;
        
        updatedContent = updatedContent.replace(
          aliasMatch[0],
          `alias: {\n${newAliases}\n    }`
        );
      } else {
        // Need to add resolve.alias - this is complex for webpack
        // This is a simplified approach
        modified = false; // Skip for now
      }
      
      if (modified) {
        aliasesAdded = true;
      }
    }
  }

  return { content: updatedContent, modified, aliasesAdded, cssConfigured };
}

/**
 * Validates build tool configuration
 */
export function validateBuildToolConfig(projectPath = process.cwd()): {
  hasConfig: boolean;
  buildTool: 'vite' | 'next' | 'webpack' | 'none';
  hasAliases: boolean;
  hasCssConfig: boolean;
  issues: string[];
} {
  const result = {
    hasConfig: false,
    buildTool: 'none' as const,
    hasAliases: false,
    hasCssConfig: false,
    issues: [] as string[]
  };

  // Check for Vite
  const viteConfigs = ['vite.config.js', 'vite.config.ts'];
  for (const config of viteConfigs) {
    if (existsSync(join(projectPath, config))) {
      result.hasConfig = true;
      result.buildTool = 'vite';
      
      const content = readFileSync(join(projectPath, config), 'utf-8');
      result.hasAliases = content.includes('alias') && content.includes('@');
      result.hasCssConfig = content.includes('css:') || content.includes('postcss');
      
      if (!result.hasAliases) {
        result.issues.push('Missing @ alias configuration');
      }
      break;
    }
  }

  // Check for Next.js
  if (!result.hasConfig) {
    const nextConfigs = ['next.config.js', 'next.config.mjs'];
    for (const config of nextConfigs) {
      if (existsSync(join(projectPath, config))) {
        result.hasConfig = true;
        result.buildTool = 'next';
        result.hasCssConfig = true; // Next.js handles CSS automatically
        
        const content = readFileSync(join(projectPath, config), 'utf-8');
        result.hasAliases = content.includes('alias') && content.includes('@');
        
        if (!result.hasAliases) {
          result.issues.push('Missing @ alias configuration');
        }
        break;
      }
    }
  }

  // Check for Webpack
  if (!result.hasConfig && existsSync(join(projectPath, 'webpack.config.js'))) {
    result.hasConfig = true;
    result.buildTool = 'webpack';
    
    const content = readFileSync(join(projectPath, 'webpack.config.js'), 'utf-8');
    result.hasAliases = content.includes('alias') && content.includes('@');
    result.hasCssConfig = content.includes('css-loader') || content.includes('postcss-loader');
    
    if (!result.hasAliases) {
      result.issues.push('Missing @ alias configuration');
    }
    if (!result.hasCssConfig) {
      result.issues.push('Missing CSS/PostCSS configuration');
    }
  }

  if (!result.hasConfig) {
    result.issues.push('No build tool configuration found');
  }

  return result;
}