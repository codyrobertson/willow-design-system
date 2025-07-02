import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { type FrameworkDetectionResult, getFrameworkRecommendations } from './framework-detection.js';

export interface DirectoryStructureResult {
  success: boolean;
  directoriesCreated: string[];
  filesCreated: string[];
  skipped: string[];
  error?: string;
}

export interface DirectoryStructureOptions {
  force?: boolean;
  skipFiles?: boolean;
  customPaths?: {
    components?: string;
    utils?: string;
    lib?: string;
    styles?: string;
    hooks?: string;
  };
}

interface DirectoryConfig {
  path: string;
  description: string;
  createIndex: boolean;
  indexContent?: string;
}

/**
 * Creates standardized directory structure for the project
 */
export function createDirectoryStructure(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: DirectoryStructureOptions = {}
): DirectoryStructureResult {
  const result: DirectoryStructureResult = {
    success: false,
    directoriesCreated: [],
    filesCreated: [],
    skipped: []
  };

  try {
    const recommendations = getFrameworkRecommendations(frameworkResult);
    const directories = getDirectoryConfig(frameworkResult, recommendations, options);

    // Create each directory
    for (const dir of directories) {
      const fullPath = join(projectPath, dir.path);
      
      if (existsSync(fullPath)) {
        result.skipped.push(dir.path);
      } else {
        mkdirSync(fullPath, { recursive: true });
        result.directoriesCreated.push(dir.path);
      }

      // Create index files if requested
      if (!options.skipFiles && dir.createIndex) {
        const indexPath = getIndexFilePath(fullPath, frameworkResult.typescript);
        
        if (!existsSync(indexPath) || options.force) {
          const content = dir.indexContent || generateIndexContent(dir.path, frameworkResult);
          writeFileSync(indexPath, content, 'utf-8');
          result.filesCreated.push(indexPath);
        }
      }
    }

    // Create additional framework-specific files
    if (!options.skipFiles) {
      const additionalFiles = createFrameworkSpecificFiles(
        projectPath,
        frameworkResult,
        recommendations,
        options
      );
      
      result.filesCreated.push(...additionalFiles);
    }

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Gets directory configuration based on framework
 */
function getDirectoryConfig(
  frameworkResult: FrameworkDetectionResult,
  recommendations: ReturnType<typeof getFrameworkRecommendations>,
  options: DirectoryStructureOptions
): DirectoryConfig[] {
  const { framework } = frameworkResult;
  
  const base: DirectoryConfig[] = [
    {
      path: options.customPaths?.components || recommendations.componentPath,
      description: 'UI components',
      createIndex: true
    },
    {
      path: join(options.customPaths?.components || recommendations.componentPath, 'ui'),
      description: 'shadcn/ui components',
      createIndex: true
    },
    {
      path: options.customPaths?.lib || recommendations.utilsPath,
      description: 'Utility functions and libraries',
      createIndex: true
    },
    {
      path: options.customPaths?.hooks || join(recommendations.utilsPath, 'hooks'),
      description: 'Custom React hooks',
      createIndex: framework === 'react' || framework === 'next'
    }
  ];

  // Add framework-specific directories
  switch (framework) {
    case 'next':
      base.push(
        {
          path: options.customPaths?.styles || 'styles',
          description: 'Global styles',
          createIndex: false
        },
        {
          path: 'public',
          description: 'Static assets',
          createIndex: false
        }
      );
      break;

    case 'react':
    case 'vue':
    case 'svelte':
      base.push(
        {
          path: options.customPaths?.styles || 'src/styles',
          description: 'Global and component styles',
          createIndex: false
        },
        {
          path: 'src/assets',
          description: 'Static assets',
          createIndex: false
        }
      );
      break;

    case 'angular':
      base.push(
        {
          path: 'src/styles',
          description: 'Global styles',
          createIndex: false
        },
        {
          path: 'src/assets',
          description: 'Static assets',
          createIndex: false
        }
      );
      break;
  }

  // Add utils directory if not already included
  if (!base.some(d => d.path === (options.customPaths?.utils || 'src/utils'))) {
    base.push({
      path: options.customPaths?.utils || 'src/utils',
      description: 'Utility functions',
      createIndex: true
    });
  }

  return base;
}

/**
 * Gets the appropriate index file path
 */
function getIndexFilePath(dirPath: string, typescript: boolean): string {
  const extension = typescript ? 'ts' : 'js';
  return join(dirPath, `index.${extension}`);
}

/**
 * Generates index file content
 */
function generateIndexContent(dirPath: string, frameworkResult: FrameworkDetectionResult): string {
  const { framework, typescript } = frameworkResult;
  
  if (dirPath.includes('components/ui')) {
    return generateUIComponentsIndex(typescript);
  }

  if (dirPath.includes('hooks')) {
    return generateHooksIndex(typescript);
  }

  if (dirPath.includes('utils') || dirPath.includes('lib')) {
    return generateUtilsIndex(typescript);
  }

  if (dirPath.includes('components')) {
    return generateComponentsIndex(typescript);
  }

  // Default empty index
  return `// ${dirPath} exports\n`;
}

/**
 * Generates index for UI components
 */
function generateUIComponentsIndex(typescript: boolean): string {
  return `// shadcn/ui components
// Export all UI components from this directory

// Example:
// export { Button } from './button'${typescript ? ';' : ''}
// export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'${typescript ? ';' : ''}
// export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog'${typescript ? ';' : ''}
`;
}

/**
 * Generates index for hooks
 */
function generateHooksIndex(typescript: boolean): string {
  return `// Custom hooks
// Export all custom hooks from this directory

// Example:
// export { useDebounce } from './use-debounce'${typescript ? ';' : ''}
// export { useLocalStorage } from './use-local-storage'${typescript ? ';' : ''}
// export { useMediaQuery } from './use-media-query'${typescript ? ';' : ''}
`;
}

/**
 * Generates index for utils
 */
function generateUtilsIndex(typescript: boolean): string {
  return `// Utility functions
// Export all utilities from this directory

// Example:
// export { cn } from './utils'${typescript ? ';' : ''}
// export { formatDate, formatCurrency } from './format'${typescript ? ';' : ''}
// export { validateEmail, validatePhone } from './validation'${typescript ? ';' : ''}
`;
}

/**
 * Generates index for components
 */
function generateComponentsIndex(typescript: boolean): string {
  return `// Application components
// Export all components from this directory

// UI components
export * from './ui'${typescript ? ';' : ''}

// Feature components
// export { Header } from './header'${typescript ? ';' : ''}
// export { Footer } from './footer'${typescript ? ';' : ''}
// export { Navigation } from './navigation'${typescript ? ';' : ''}
`;
}

/**
 * Creates framework-specific files
 */
function createFrameworkSpecificFiles(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  recommendations: ReturnType<typeof getFrameworkRecommendations>,
  options: DirectoryStructureOptions
): string[] {
  const files: string[] = [];
  const { framework, typescript } = frameworkResult;

  // Create globals.d.ts for TypeScript projects
  if (typescript) {
    const globalsDPath = join(projectPath, 'src', 'globals.d.ts');
    if (!existsSync(globalsDPath) || options.force) {
      writeFileSync(globalsDPath, generateGlobalsDts(), 'utf-8');
      files.push(globalsDPath);
    }
  }

  // Create env.d.ts for Vite projects
  if (frameworkResult.buildTool === 'vite' && typescript) {
    const envDPath = join(projectPath, 'src', 'env.d.ts');
    if (!existsSync(envDPath) || options.force) {
      writeFileSync(envDPath, '/// <reference types="vite/client" />\n', 'utf-8');
      files.push(envDPath);
    }
  }

  // Create app.css or index.css if it doesn't exist
  const cssFileName = framework === 'next' ? 'globals.css' : 'index.css';
  const cssPath = join(
    projectPath,
    framework === 'next' ? 'styles' : 'src',
    cssFileName
  );
  
  if (!existsSync(cssPath) || options.force) {
    const cssContent = generateBaseCss(framework);
    
    // Ensure directory exists
    const cssDir = dirname(cssPath);
    if (!existsSync(cssDir)) {
      mkdirSync(cssDir, { recursive: true });
    }
    
    writeFileSync(cssPath, cssContent, 'utf-8');
    files.push(cssPath);
  }

  return files;
}

/**
 * Generates globals.d.ts content
 */
function generateGlobalsDts(): string {
  return `// Global type definitions

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

// Add global namespace augmentations here
declare global {
  // Example: adding a custom property to Window
  // interface Window {
  //   myCustomProperty: string;
  // }
}

export {};
`;
}

/**
 * Generates base CSS content
 */
function generateBaseCss(framework: string): string {
  const base = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;

  if (framework === 'next') {
    return base + `\n\nhtml,
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

  return base;
}

/**
 * Validates directory structure
 */
export function validateDirectoryStructure(
  projectPath = process.cwd(),
  frameworkResult?: FrameworkDetectionResult
): {
  hasComponentsDir: boolean;
  hasUtilsDir: boolean;
  hasUIDir: boolean;
  missingDirs: string[];
  existingDirs: string[];
  issues: string[];
} {
  const result = {
    hasComponentsDir: false,
    hasUtilsDir: false,
    hasUIDir: false,
    missingDirs: [] as string[],
    existingDirs: [] as string[],
    issues: [] as string[]
  };

  // Common directory paths to check
  const componentsPath = [
    'src/components',
    'components',
    'app/components'
  ];

  const utilsPaths = [
    'src/lib',
    'src/utils',
    'lib',
    'utils'
  ];

  const uiPaths = [
    'src/components/ui',
    'components/ui',
    'app/components/ui'
  ];

  // Check components directory
  for (const path of componentsPath) {
    if (existsSync(join(projectPath, path))) {
      result.hasComponentsDir = true;
      // Extract the base directory name for consistency
      const baseName = path.split('/').pop() || path;
      result.existingDirs.push(baseName);
      break;
    }
  }

  // Check utils directory
  for (const path of utilsPaths) {
    if (existsSync(join(projectPath, path))) {
      result.hasUtilsDir = true;
      // Extract the base directory name for consistency
      const baseName = path.split('/').pop() || path;
      result.existingDirs.push(baseName);
      break;
    }
  }

  // Check UI directory
  for (const path of uiPaths) {
    if (existsSync(join(projectPath, path))) {
      result.hasUIDir = true;
      result.existingDirs.push(path);
      break;
    }
  }

  // Determine missing directories
  if (!result.hasComponentsDir) {
    result.missingDirs.push('components');
    result.issues.push('No components directory found');
  }

  if (!result.hasUtilsDir) {
    result.missingDirs.push('utils or lib');
    result.issues.push('No utils/lib directory found');
  }

  if (!result.hasUIDir) {
    result.missingDirs.push('components/ui');
    result.issues.push('No UI components directory found');
  }

  return result;
}