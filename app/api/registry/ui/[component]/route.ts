import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Component registry data
const componentRegistry: Record<string, any> = {};

// Utility function to extract dependencies from file content
function extractDependencies(content: string): string[] {
  const dependencies = new Set<string>();
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Only include npm packages (not relative imports)
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      // Handle scoped packages like @radix-ui/react-slot
      if (importPath.startsWith('@')) {
        const parts = importPath.split('/');
        dependencies.add(`${parts[0]}/${parts[1]}`);
      } else {
        dependencies.add(importPath.split('/')[0]);
      }
    }
  }

  return Array.from(dependencies);
}

// Pre-populate registry with all components
function initializeRegistry() {
  const registryPath = join(process.cwd(), 'registry', 'components', 'ui');
  
  try {
    const fs = require('fs');
    const files = fs.readdirSync(registryPath);
    
    files.forEach((file: string) => {
      if (file.endsWith('.tsx') && !['index.ts', 'utils.ts'].includes(file)) {
        const componentName = file.replace('.tsx', '').toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
        const filePath = join(registryPath, file);
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const dependencies = extractDependencies(content);
          
          componentRegistry[componentName] = {
            "$schema": "https://ui.shadcn.com/schema/registry-item.json",
            name: componentName,
            type: "registry:ui",
            dependencies: [...new Set([...dependencies, "clsx", "tailwind-merge"])],
            registryDependencies: ["utils"],
            files: [
              {
                path: `ui/${componentName}.tsx`,
                content: content,
                type: "registry:ui",
                target: ""
              }
            ]
          };
        }
      }
    });
    
    // Handle icon subdirectory
    const iconPath = join(registryPath, 'icon');
    if (fs.existsSync(iconPath)) {
      const iconFiles = fs.readdirSync(iconPath);
      iconFiles.forEach((file: string) => {
        if (file.endsWith('.tsx')) {
          const componentName = file.replace('.tsx', '').toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
          const filePath = join(iconPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const dependencies = extractDependencies(content);
          
          componentRegistry[componentName] = {
            "$schema": "https://ui.shadcn.com/schema/registry-item.json",
            name: componentName,
            type: "registry:ui",
            dependencies: [...new Set([...dependencies, "clsx", "tailwind-merge"])],
            registryDependencies: ["utils"],
            files: [
              {
                path: `ui/${componentName}.tsx`,
                content: content,
                type: "registry:ui",
                target: ""
              }
            ]
          };
        }
      });
    }
  } catch (error) {
    console.error('Error initializing registry:', error);
  }
}

// Initialize registry on module load
initializeRegistry();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ component: string }> }
) {
  const { component } = await params;
  
  try {
    // Check if component exists in registry
    if (!componentRegistry[component]) {
      return NextResponse.json(
        { error: `Component '${component}' not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(componentRegistry[component], {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching component:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component' },
      { status: 500 }
    );
  }
}