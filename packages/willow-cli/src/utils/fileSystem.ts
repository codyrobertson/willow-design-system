import { access, mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { ProjectType } from '../types/index.js';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function createDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeFileContent(path: string, content: string): Promise<void> {
  const dir = dirname(path);
  await createDirectory(dir);
  await writeFile(path, content, 'utf8');
}

export async function readFileContent(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

// Note: detectProjectType has been moved to projectDetection.ts
// This function is kept for backward compatibility but will be deprecated
export async function detectProjectType(): Promise<ProjectType> {
  const { detectProjectType: newDetectProjectType } = await import('./projectDetection.js');
  return newDetectProjectType();
}

export async function getComponentDir(projectType: ProjectType): Promise<string> {
  // Check for existing component directories
  const possiblePaths = [
    'src/components/ui',
    'components/ui',
    'app/components/ui'
  ];
  
  for (const path of possiblePaths) {
    if (await fileExists(path)) {
      return path;
    }
  }
  
  // Default based on project type
  return projectType.isVite ? 'src/components/ui' : 'components/ui';
}

export async function getLibDir(projectType: ProjectType): Promise<string> {
  // Check for existing lib directories
  const possiblePaths = [
    'src/lib',
    'lib',
    'app/lib'
  ];
  
  for (const path of possiblePaths) {
    if (await fileExists(path)) {
      return path;
    }
  }
  
  // Default based on project type
  return projectType.isVite ? 'src/lib' : 'lib';
}

export function getCssPath(projectType: ProjectType): string {
  if (projectType.isVite) {
    return 'src/index.css';
  }
  return 'app/globals.css';
}

export async function findCssFile(projectType: ProjectType): Promise<string | null> {
  // More comprehensive CSS file search
  const possiblePaths = [
    // Vite paths
    'src/index.css',
    'src/App.css',
    'src/main.css',
    'src/style.css',
    'src/styles/index.css',
    'src/styles/globals.css',
    'src/styles/global.css',
    // Next.js paths
    'app/globals.css',
    'src/app/globals.css',
    'styles/globals.css',
    'src/styles/globals.css',
    // Generic paths
    'index.css',
    'style.css',
    'styles.css',
    'global.css',
    'globals.css'
  ];
  
  for (const path of possiblePaths) {
    if (await fileExists(path)) {
      return path;
    }
  }
  
  return null;
}

export async function listDirectory(path: string): Promise<string[]> {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}