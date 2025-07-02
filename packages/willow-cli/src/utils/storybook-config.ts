import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { detectPackageManager, executePackageManagerCommand, type PackageManagerInfo } from './package-manager.js';
import { type FrameworkDetectionResult } from './framework-detection.js';
import { execSync } from 'child_process';

export interface StorybookConfigResult {
  success: boolean;
  initialized: boolean;
  addonsInstalled: string[];
  configUpdated: boolean;
  exampleCreated: boolean;
  error?: string;
}

export interface StorybookConfigOptions {
  force?: boolean;
  skipAddons?: boolean;
  skipExamples?: boolean;
  customAddons?: string[];
}

const STORYBOOK_ADDONS = [
  '@storybook/addon-essentials',
  '@storybook/addon-a11y',
  '@storybook/addon-interactions',
  'storybook-addon-themes'
];

/**
 * Sets up Storybook configuration
 */
export async function setupStorybook(
  projectPath = process.cwd(),
  frameworkResult: FrameworkDetectionResult,
  options: StorybookConfigOptions = {}
): Promise<StorybookConfigResult> {
  const result: StorybookConfigResult = {
    success: false,
    initialized: false,
    addonsInstalled: [],
    configUpdated: false,
    exampleCreated: false
  };

  try {
    const packageManager = detectPackageManager(projectPath);
    
    // Check if Storybook is already installed
    const isStorybookInstalled = checkStorybookInstallation(projectPath);
    
    // Initialize Storybook if not installed
    if (!isStorybookInstalled || options.force) {
      const initResult = await initializeStorybook(
        packageManager,
        projectPath,
        frameworkResult
      );
      
      if (!initResult.success) {
        throw new Error(`Failed to initialize Storybook: ${initResult.error}`);
      }
      
      result.initialized = true;
    }

    // Update Storybook configuration for Tailwind CSS
    const configResult = await updateStorybookConfig(
      projectPath,
      frameworkResult,
      options
    );
    
    result.configUpdated = configResult.updated;

    // Install additional addons
    if (!options.skipAddons) {
      const addonsResult = await installStorybookAddons(
        packageManager,
        projectPath,
        options
      );
      
      result.addonsInstalled = addonsResult.installed;
    }

    // Create example stories
    if (!options.skipExamples) {
      const exampleResult = await createExampleStories(
        projectPath,
        frameworkResult,
        options
      );
      
      result.exampleCreated = exampleResult.created;
    }

    result.success = true;
    return result;

  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Checks if Storybook is already installed
 */
function checkStorybookInstallation(projectPath: string): boolean {
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    
    // Check for Storybook scripts
    return 'storybook' in scripts || 'build-storybook' in scripts;
  } catch {
    return false;
  }
}

/**
 * Initializes Storybook
 */
async function initializeStorybook(
  packageManager: PackageManagerInfo,
  projectPath: string,
  frameworkResult: FrameworkDetectionResult
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use npx to run Storybook init
    const initCommand = `npx storybook@latest init --package-manager ${packageManager.name} --skip-install`;
    
    execSync(initCommand, {
      cwd: projectPath,
      stdio: 'inherit',
      shell: true
    });

    // Install dependencies after init
    const installCommand = `${packageManager.installCommand}`;
    const installResult = executePackageManagerCommand(installCommand, {
      cwd: projectPath,
      silent: false
    });

    if (!installResult.success) {
      return { success: false, error: installResult.error };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates Storybook configuration for Tailwind CSS
 */
async function updateStorybookConfig(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: StorybookConfigOptions
): Promise<{ updated: boolean }> {
  const storybookDir = join(projectPath, '.storybook');
  
  if (!existsSync(storybookDir)) {
    mkdirSync(storybookDir, { recursive: true });
  }

  // Update preview.js/ts for Tailwind CSS
  const previewPath = join(storybookDir, frameworkResult.typescript ? 'preview.ts' : 'preview.js');
  const previewContent = generatePreviewConfig(frameworkResult);
  
  if (!existsSync(previewPath) || options.force) {
    writeFileSync(previewPath, previewContent, 'utf-8');
  } else {
    // Append Tailwind import if not present
    const existingContent = readFileSync(previewPath, 'utf-8');
    if (!existingContent.includes('../src/index.css') && !existingContent.includes('../src/styles')) {
      const updatedContent = `import '../src/index.css';\n\n${existingContent}`;
      writeFileSync(previewPath, updatedContent, 'utf-8');
    }
  }

  // Update main.js/ts configuration
  const mainPath = join(storybookDir, frameworkResult.typescript ? 'main.ts' : 'main.js');
  
  if (existsSync(mainPath)) {
    const mainContent = readFileSync(mainPath, 'utf-8');
    const updatedMain = updateMainConfig(mainContent, frameworkResult);
    
    if (updatedMain !== mainContent) {
      writeFileSync(mainPath, updatedMain, 'utf-8');
    }
  }

  return { updated: true };
}

/**
 * Generates preview configuration
 */
function generatePreviewConfig(frameworkResult: FrameworkDetectionResult): string {
  const { framework, typescript } = frameworkResult;
  const typeAnnotation = typescript ? ': Preview' : '';
  const importType = typescript ? "import type { Preview } from '@storybook/react';\n" : '';
  
  return `${importType}import '../src/index.css';

/** @type { import('@storybook/${getStorybookFramework(framework)}').Preview } */
const preview${typeAnnotation} = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    themes: {
      default: 'light',
      list: [
        { name: 'light', class: '', color: '#ffffff' },
        { name: 'dark', class: 'dark', color: '#000000' }
      ]
    }
  },
};

export default preview;
`;
}

/**
 * Updates main configuration
 */
function updateMainConfig(content: string, frameworkResult: FrameworkDetectionResult): string {
  let updated = content;
  
  // Add PostCSS addon if not present
  if (!content.includes('@storybook/addon-postcss')) {
    // Find addons array
    const addonsMatch = content.match(/addons:\s*\[([\s\S]*?)\]/);
    
    if (addonsMatch) {
      const addonsContent = addonsMatch[1];
      const newAddons = addonsContent.trim() 
        ? `${addonsContent.trim()},\n    {\n      name: '@storybook/addon-postcss',\n      options: {\n        cssLoaderOptions: {\n          importLoaders: 1,\n        },\n        postcssLoaderOptions: {\n          implementation: require('postcss'),\n        },\n      },\n    }`
        : `\n    {\n      name: '@storybook/addon-postcss',\n      options: {\n        cssLoaderOptions: {\n          importLoaders: 1,\n        },\n        postcssLoaderOptions: {\n          implementation: require('postcss'),\n        },\n      },\n    }\n  `;
      
      updated = content.replace(
        addonsMatch[0],
        `addons: [${newAddons}]`
      );
    }
  }
  
  // Update stories pattern to include TypeScript files
  if (frameworkResult.typescript && !content.includes('.stories.@(js|jsx|mjs|ts|tsx)')) {
    updated = updated.replace(
      /\.stories\.@\(js\|jsx\|mjs\)/g,
      '.stories.@(js|jsx|mjs|ts|tsx)'
    );
  }
  
  return updated;
}

/**
 * Gets Storybook framework package name
 */
function getStorybookFramework(framework: string): string {
  switch (framework) {
    case 'react':
    case 'next':
      return 'react';
    case 'vue':
      return 'vue3';
    case 'angular':
      return 'angular';
    case 'svelte':
      return 'svelte';
    default:
      return 'react';
  }
}

/**
 * Installs Storybook addons
 */
async function installStorybookAddons(
  packageManager: PackageManagerInfo,
  projectPath: string,
  options: StorybookConfigOptions
): Promise<{ installed: string[] }> {
  const addonsToInstall = [...STORYBOOK_ADDONS];
  
  // Add custom addons
  if (options.customAddons) {
    addonsToInstall.push(...options.customAddons);
  }

  // Add PostCSS addon for Tailwind support
  addonsToInstall.push('@storybook/addon-postcss');

  // Check which addons are already installed
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const missingAddons = addonsToInstall.filter(addon => !(addon in allDeps));
    
    if (missingAddons.length === 0) {
      return { installed: [] };
    }

    // Install missing addons
    const installCommand = `${packageManager.addCommand} -D ${missingAddons.join(' ')}`;
    const result = executePackageManagerCommand(installCommand, {
      cwd: projectPath,
      silent: false
    });

    if (!result.success) {
      throw new Error(`Failed to install Storybook addons: ${result.error}`);
    }

    return { installed: missingAddons };
  }

  return { installed: [] };
}

/**
 * Creates example stories
 */
async function createExampleStories(
  projectPath: string,
  frameworkResult: FrameworkDetectionResult,
  options: StorybookConfigOptions
): Promise<{ created: boolean }> {
  const { framework, typescript } = frameworkResult;
  const storiesDir = join(projectPath, 'src', 'stories');
  
  if (!existsSync(storiesDir)) {
    mkdirSync(storiesDir, { recursive: true });
  }

  // Create a Button example story
  const buttonStoryPath = join(
    storiesDir, 
    `Button.stories.${typescript ? 'tsx' : 'jsx'}`
  );
  
  if (!existsSync(buttonStoryPath) || options.force) {
    const storyContent = generateButtonStory(framework, typescript);
    writeFileSync(buttonStoryPath, storyContent, 'utf-8');
  }

  // Create a Card example story
  const cardStoryPath = join(
    storiesDir,
    `Card.stories.${typescript ? 'tsx' : 'jsx'}`
  );
  
  if (!existsSync(cardStoryPath) || options.force) {
    const cardContent = generateCardStory(framework, typescript);
    writeFileSync(cardStoryPath, cardContent, 'utf-8');
  }

  return { created: true };
}

/**
 * Generates Button story example
 */
function generateButtonStory(framework: string, typescript: boolean): string {
  if (framework !== 'react' && framework !== 'next') {
    return '// Add your component stories here\n';
  }

  const imports = typescript
    ? `import type { Meta, StoryObj } from '@storybook/react';`
    : ``;

  return `${imports}
import { Button } from '../components/ui/button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
${typescript ? 'const meta = {' : 'export default {'}
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
}${typescript ? ' satisfies Meta<typeof Button>;' : ';'}

${typescript ? 'export default meta;\ntype Story = StoryObj<typeof meta>;\n' : ''}

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary${typescript ? ': Story' : ''} = {
  args: {
    children: 'Button',
  },
};

export const Secondary${typescript ? ': Story' : ''} = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Large${typescript ? ': Story' : ''} = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Small${typescript ? ': Story' : ''} = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const WithClick${typescript ? ': Story' : ''} = {
  args: {
    children: 'Click me!',
    onClick: () => alert('Button clicked!'),
  },
};
`;
}

/**
 * Generates Card story example
 */
function generateCardStory(framework: string, typescript: boolean): string {
  if (framework !== 'react' && framework !== 'next') {
    return '// Add your component stories here\n';
  }

  const imports = typescript
    ? `import type { Meta, StoryObj } from '@storybook/react';`
    : ``;

  return `${imports}
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

${typescript ? 'const meta = {' : 'export default {'}
  title: 'Example/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}${typescript ? ' satisfies Meta<typeof Card>;' : ';'}

${typescript ? 'export default meta;\ntype Story = StoryObj<typeof meta>;\n' : ''}

export const Default${typescript ? ': Story' : ''} = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="name">Name</label>
              <input id="name" placeholder="Name of your project" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple${typescript ? ': Story' : ''} = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
    </Card>
  ),
};
`;
}

/**
 * Validates Storybook setup
 */
export function validateStorybookSetup(projectPath = process.cwd()): {
  isInstalled: boolean;
  hasConfig: boolean;
  hasPreview: boolean;
  hasAddons: string[];
  missingAddons: string[];
  issues: string[];
} {
  const result = {
    isInstalled: false,
    hasConfig: false,
    hasPreview: false,
    hasAddons: [] as string[],
    missingAddons: [] as string[],
    issues: [] as string[]
  };

  // Check if Storybook is installed
  result.isInstalled = checkStorybookInstallation(projectPath);
  
  if (!result.isInstalled) {
    result.issues.push('Storybook is not installed');
    return result;
  }

  // Check for .storybook directory
  const storybookDir = join(projectPath, '.storybook');
  if (existsSync(storybookDir)) {
    result.hasConfig = true;
    
    // Check for preview configuration
    const previewFiles = ['preview.js', 'preview.ts'];
    result.hasPreview = previewFiles.some(file => 
      existsSync(join(storybookDir, file))
    );
    
    if (!result.hasPreview) {
      result.issues.push('No preview configuration found');
    } else {
      // Check if Tailwind CSS is imported
      const previewPath = previewFiles.find(file => 
        existsSync(join(storybookDir, file))
      );
      
      if (previewPath) {
        const previewContent = readFileSync(join(storybookDir, previewPath), 'utf-8');
        if (!previewContent.includes('index.css') && !previewContent.includes('styles')) {
          result.issues.push('Tailwind CSS not imported in preview configuration');
        }
      }
    }
  } else {
    result.issues.push('.storybook directory not found');
  }

  // Check installed addons
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      STORYBOOK_ADDONS.forEach(addon => {
        if (addon in allDeps) {
          result.hasAddons.push(addon);
        } else {
          result.missingAddons.push(addon);
        }
      });

      // Check for PostCSS addon
      if (!('@storybook/addon-postcss' in allDeps)) {
        result.issues.push('PostCSS addon not installed for Tailwind support');
      }

    } catch {
      result.issues.push('Failed to read package.json');
    }
  }

  return result;
}