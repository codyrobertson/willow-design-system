import path from 'path';
import { stat } from 'fs/promises';
import chalk from 'chalk';
import type { 
  ComponentMeta, 
  ComponentFile, 
  InstallOptions, 
  InstallResult, 
  ProjectType,
  ComponentName 
} from '../types/index.js';
import { WILLOW_REGISTRY, AVAILABLE_COMPONENTS, STABLE_COMPONENTS, UNSTABLE_COMPONENTS } from '../types/index.js';
import { 
  fileExists, 
  getComponentDir, 
  createDirectory, 
  writeFileContent,
  readFileContent,
  listDirectory 
} from './fileSystem.js';

// Fetch component metadata from registry
export async function fetchComponentMeta(
  component: string, 
  registry: string = WILLOW_REGISTRY
): Promise<ComponentMeta> {
  const url = `${registry}/${component}.json`;
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json() as ComponentMeta;
    
    // Validate the response structure
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid component metadata structure');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error(`Network error fetching ${component}: ${error.message}`);
    }
    throw error;
  }
}

// Write component files with proper error handling
export async function writeComponentFiles(
  files: ComponentFile[], 
  options: InstallOptions = {}
): Promise<{ writtenFiles: string[]; errors: Array<{ file: string; error: string }> }> {
  const { dryRun = false, overwrite = true, baseDir = process.cwd() } = options;
  const writtenFiles: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];
  
  for (const file of files) {
    try {
      // Determine the actual file path
      let filePath = file.path || file.name || '';
      console.log(chalk.gray(`    Processing file: ${filePath}`));
      
      // Handle registry paths like "registry/components/ui/button.tsx"
      if (filePath.startsWith('registry/')) {
        filePath = filePath.replace('registry/', '');
      }
      
      // Adjust paths based on project structure
      if (options.componentDir && filePath.includes('components/ui/')) {
        // Extract filename and ensure lowercase for component files
        const fileName = path.basename(filePath);
        const normalizedFileName = fileName.toLowerCase();
        filePath = path.join(options.componentDir, normalizedFileName);
        console.log(chalk.gray(`    Target path: ${filePath} (normalized from ${fileName})`));
      } else if (options.libDir && filePath.includes('lib/')) {
        // Extract just the filename (keep case for lib files)
        const fileName = path.basename(filePath);
        filePath = path.join(options.libDir, fileName);
        console.log(chalk.gray(`    Target path: ${filePath}`));
      }
      
      const fullPath = path.resolve(baseDir, filePath);
      const dir = path.dirname(fullPath);
      
      // Check if file exists (case-sensitive)
      const exists = await fileExists(fullPath);
      
      // Also check for case variants of the same component to ensure we replace shadcn components
      const fileName = path.basename(fullPath);
      const fileNameLower = fileName.toLowerCase();
      const fileNameUpper = fileName.charAt(0).toUpperCase() + fileName.slice(1);
      
      // Check for existing files with different casing
      let existingVariants: string[] = [];
      try {
        const dirFiles = await listDirectory(dir);
        existingVariants = dirFiles.filter(f => 
          f.toLowerCase() === fileNameLower && f !== fileName
        );
      } catch (e) {
        // Directory might not exist yet
      }
      
      // Remove existing case variants before installing
      if (existingVariants.length > 0 && overwrite) {
        console.log(chalk.blue(`🔄 Found ${existingVariants.length} existing variant(s) for ${fileName}`));
        for (const variant of existingVariants) {
          const variantPath = path.resolve(dir, variant);
          try {
            const { unlink } = await import('fs/promises');
            await unlink(variantPath);
            console.log(chalk.blue(`🗑️  Removed existing variant: ${variant}`));
          } catch (e) {
            console.log(chalk.yellow(`⚠️  Could not remove ${variant}: ${e instanceof Error ? e.message : 'Unknown error'}`));
          }
        }
      }
      
      // Special handling for utils.ts - don't overwrite if it has our enhanced version
      if (fullPath.includes('utils.ts') && exists) {
        const content = await readFileContent(fullPath);
        if (content.includes('Theme utilities') || content.includes('initializeTheme')) {
          console.log(chalk.gray(`  → Keeping enhanced ${filePath}`));
          writtenFiles.push(filePath);
          continue;
        }
      }
      
      if (exists && !overwrite && !dryRun) {
        console.log(chalk.yellow(`⚠️  Skipping existing file: ${filePath}`));
        continue;
      }
      
      if (exists && overwrite) {
        console.log(chalk.blue(`🔄 Overwriting existing file: ${filePath}`));
      }
      
      if (dryRun) {
        console.log(chalk.blue(`[DRY RUN] Would write: ${filePath}`));
        writtenFiles.push(filePath);
        continue;
      }
      
      // Create directory if it doesn't exist
      await createDirectory(dir);
      
      // Process content (handle imports, etc)
      let content = file.content;
      content = patchImports(content, options);
      
      // Write the file
      await writeFileContent(fullPath, content);
      
      // Verify the file was written
      const stats = await stat(fullPath);
      if (stats && stats.size > 0) {
        writtenFiles.push(filePath);
        console.log(chalk.green(`✓ Created: ${filePath} (${stats.size} bytes)`));
      } else {
        throw new Error('File created but empty');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ file: file.name || 'unknown', error: errorMessage });
      console.error(chalk.red(`✗ Failed to write ${file.name}: ${errorMessage}`));
    }
  }
  
  return { writtenFiles, errors };
}

// Patch imports to ensure they work in the target project
export function patchImports(content: string, options: InstallOptions = {}): string {
  const { isVite = false } = options;
  
  // Ensure @/lib/utils imports are correct
  content = content.replace(
    /from ['"]@\/lib\/utils['"]/g,
    'from "@/lib/utils"'
  );
  
  // Fix component imports
  content = content.replace(
    /from ['"]@\/components\/ui\//g,
    'from "@/components/ui/'
  );
  
  // Handle registry imports
  content = content.replace(
    /from ['"]registry\/[^'"]+['"]/g,
    (match) => {
      const componentName = match.match(/\/([^/'"]*)['"]$/)?.[1];
      return `from "@/components/ui/${componentName}"`;
    }
  );
  
  return content;
}

// Update barrel export file (index.ts)
export async function updateBarrelExport(
  baseDir: string, 
  options: { dryRun?: boolean } = {}
): Promise<void> {
  const { dryRun = false } = options;
  const indexPath = path.join(baseDir, 'index.ts');
  
  try {
    // Ensure directory exists
    await createDirectory(baseDir);
    
    // Read all component files
    const files = await listDirectory(baseDir);
    
    // Filter for component files (not index.ts itself)
    const componentFiles = files
      .filter(file => {
        return (file.endsWith('.tsx') || file.endsWith('.ts')) && 
               file !== 'index.ts' && 
               file !== 'index.js';
      })
      .sort();
    
    // Generate export statements
    const exports = componentFiles
      .map(file => {
        const name = file.replace(/\.(tsx?|jsx?)$/, '');
        return `export * from './${name}';`;
      })
      .join('\n');
    
    if (dryRun) {
      console.log(chalk.blue(`[DRY RUN] Would update barrel exports with ${componentFiles.length} components`));
      return;
    }
    
    // Write the index file
    if (exports) {
      const content = `// Willow Design System Component Exports\n// Auto-generated - do not edit manually\n\n${exports}\n`;
      await writeFileContent(indexPath, content);
      console.log(chalk.gray(`📦 Updated barrel exports: ${baseDir}/index.ts`));
    }
    
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not update barrel exports: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

// Get component dependencies (only registry components, not npm packages)
export function getComponentDependencies(meta: ComponentMeta): string[] {
  const deps = new Set<string>();
  
  // Only add registry dependencies (other components)
  if (meta.registryDependencies) {
    meta.registryDependencies.forEach(dep => deps.add(dep));
  }
  
  return Array.from(deps);
}

// Get npm package dependencies
export function getNpmDependencies(meta: ComponentMeta): string[] {
  if (!meta.dependencies) return [];
  return [...meta.dependencies];
}

// Install multiple components with dependency resolution
export async function installComponents(
  components: string[], 
  registry: string = WILLOW_REGISTRY, 
  options: InstallOptions = {}
): Promise<InstallResult & { npmDependencies: string[] }> {
  const installed = new Set<string>();
  const failed: Array<{ component: string; error: string }> = [];
  const toInstall = [...components];
  const allNpmDeps = new Set<string>();
  
  // Process components including dependencies
  while (toInstall.length > 0) {
    const component = toInstall.shift()!;
    
    // Skip if already installed
    if (installed.has(component)) continue;
    
    try {
      console.log(chalk.blue(`\n📦 Installing ${component}...`));
      
      // Fetch metadata
      const meta = await fetchComponentMeta(component, registry);
      
      // Add registry dependencies to install queue
      const registryDeps = getComponentDependencies(meta);
      registryDeps.forEach(dep => {
        if (!installed.has(dep) && !toInstall.includes(dep)) {
          console.log(chalk.gray(`  → Adding component dependency: ${dep}`));
          toInstall.unshift(dep); // Add to front to install deps first
        }
      });
      
      // Collect npm dependencies
      const npmDeps = getNpmDependencies(meta);
      npmDeps.forEach(dep => allNpmDeps.add(dep));
      
      // Write component files with proper directory paths
      const result = await writeComponentFiles(meta.files, {
        ...options,
        componentDir: options.componentDir,
        libDir: options.libDir
      });
      
      if (result.errors.length === 0) {
        installed.add(component);
      } else {
        failed.push({ component, error: result.errors.map(e => e.error).join(', ') });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failed.push({ component, error: errorMessage });
      console.error(chalk.red(`✗ Failed to install ${component}: ${errorMessage}`));
    }
  }
  
  return { 
    installed: Array.from(installed), 
    failed,
    npmDependencies: Array.from(allNpmDeps)
  };
}

// Install all Willow components
export async function installAllWillowComponents(
  options: InstallOptions & { projectType?: ProjectType } = {}
): Promise<InstallResult & { npmDependencies: string[] }> {
  const { projectType, ...installOptions } = options;
  
  if (projectType) {
    const componentDir = await getComponentDir(projectType);
    console.log(chalk.gray(`Target directory: ${componentDir}`));
  }
  
  return installComponents([...AVAILABLE_COMPONENTS], WILLOW_REGISTRY, installOptions);
}