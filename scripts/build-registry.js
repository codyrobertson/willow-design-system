const fs = require('fs').promises;
const path = require('path');

/**
 * Transform imports using enhanced regex patterns
 */
function transformImports(content, filePath) {
  // Pattern to match import statements (both relative and absolute)
  const importPattern = /from\s+['"]([^'"]+)['"]/g;
  
  return content.replace(importPattern, (match, importPath) => {
    // Handle utils imports - always use local utils
    if (importPath === './utils' || importPath.endsWith('/utils') || importPath.includes('lib/utils')) {
      return `from './utils'`;
    }
    
    // Handle @/components/ui imports - convert to relative imports
    if (importPath.startsWith('@/components/ui/')) {
      const componentName = importPath.replace('@/components/ui/', '');
      return `from './${componentName}'`;
    }
    
    // Handle @/lib imports - use local utils
    if (importPath.startsWith('@/lib/')) {
      return `from './utils'`;
    }
    
    // Handle relative imports that go to components/ui
    if (importPath.startsWith('.') && !importPath.startsWith('./utils')) {
      const fileDir = path.dirname(filePath);
      const resolvedPath = path.resolve(fileDir, importPath);
      
      // Special case: if we're in the icon directory and importing from same directory, keep it simple
      if (filePath.includes('/icon/') && (importPath.startsWith('./') && !importPath.includes('/'))) {
        return match; // Keep the import as-is for same-directory imports in icon folder
      }
      
      // Special case: if we're in the icon directory and importing from './XXX' (same dir), keep as-is
      if (filePath.includes('/icon/') && importPath.match(/^\.\/[^\/]+$/)) {
        return match;
      }
      
      if (resolvedPath.includes('/components/ui/')) {
        const relativePath = path.relative(path.join(process.cwd(), 'src/components/ui'), resolvedPath);
        const targetPath = `./${relativePath}`.replace(/\.tsx?$/, '');
        return `from '${targetPath}'`;
      }
    }
    
    return match;
  });
}

async function scanDirectory(dir, baseDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip stories and test files
      if (!entry.name.includes('stories') && !entry.name.includes('__tests__')) {
        files.push(...await scanDirectory(fullPath, baseDir));
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.includes('.stories.') && !entry.name.includes('.test.')) {
      files.push({
        path: path.relative(baseDir, fullPath),
        name: entry.name,
      });
    }
  }

  return files;
}

async function buildRegistry() {
  const registryPath = path.join(process.cwd(), 'registry');
  const componentsPath = path.join(process.cwd(), 'src/components');
  const distPath = path.join(registryPath, 'components');

  // Check if registry components already exist and are properly formatted
  const existingErrorBoundary = path.join(distPath, 'ui', 'ErrorBoundary.tsx');
  try {
    const content = await fs.readFile(existingErrorBoundary, 'utf-8');
    if (content.includes('./Button') || content.includes('./utils')) {
      console.log('✓ Registry components already exist and are properly formatted. Skipping rebuild.');
      console.log('✓ Registry build complete!');
      return;
    }
  } catch (error) {
    // File doesn't exist, continue with build
  }

  // Create dist directory structure
  await fs.mkdir(path.join(distPath, 'ui'), { recursive: true });
  await fs.mkdir(path.join(distPath, 'ui/icon'), { recursive: true });

  // Scan UI directory
  const componentDirs = ['ui'];
  const componentRegistry = [];

  for (const dir of componentDirs) {
    const dirPath = path.join(componentsPath, dir);
    
    try {
      const files = await scanDirectory(dirPath, componentsPath);
      
      for (const file of files) {
        const sourcePath = path.join(componentsPath, file.path);
        const targetPath = path.join(distPath, file.path);
        
        console.log(`Processing ${file.path}...`);
        
        try {
          // Read the component file
          let content = await fs.readFile(sourcePath, 'utf-8');
          
          // Transform imports using AST
          content = await transformImports(content, sourcePath);
          
          // Ensure target directory exists
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          
          // Write to dist
          await fs.writeFile(targetPath, content);
          
          // Add to registry
          const componentName = path.basename(file.name, path.extname(file.name));
          const existingComponent = componentRegistry.find(c => c.name === componentName);
          
          if (existingComponent) {
            existingComponent.files.push({ path: file.path });
          } else {
            componentRegistry.push({
              name: componentName,
              type: 'ui', // All components are UI components
              files: [{ path: file.path }],
              dependencies: extractDependencies(content),
            });
          }
          
          console.log(`  ✓ ${file.name}`);
        } catch (error) {
          console.error(`  ✗ Error processing ${file.name}:`, error.message);
        }
      }
    } catch (error) {
      console.warn(`Skipping ${dir}: ${error.message}`);
    }
  }

  // Create registry index
  const registryIndex = componentRegistry.map(component => ({
    name: component.name,
    type: component.type,
    files: component.files.map(f => ({
      path: `registry/components/${f.path}`,
      content: '', // Content will be loaded dynamically
      type: 'component',
    })),
    dependencies: [...new Set(component.dependencies)],
    devDependencies: [],
    registryDependencies: component.files
      .flatMap(f => extractRegistryDeps(f.path))
      .filter((v, i, a) => a.indexOf(v) === i),
  }));

  // Write registry index
  await fs.writeFile(
    path.join(registryPath, 'index.json'),
    JSON.stringify(registryIndex, null, 2)
  );

  // Create a manifest file
  const manifest = {
    version: require('../package.json').version,
    components: registryIndex.length,
    structure: {
      ui: componentRegistry.filter(c => c.type === 'ui').length,
    },
    updated: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(registryPath, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Also create root registry.json for API compatibility
  const rootRegistry = {
    name: "willow-design-system",
    version: require('../package.json').version,
    type: "registry",
    components: registryIndex.map(component => ({
      name: component.name.toLowerCase(),
      files: component.files.map(f => `src/components/${f.path}`),
      dependencies: component.dependencies
    }))
  };

  await fs.writeFile(
    path.join(process.cwd(), 'registry.json'),
    JSON.stringify(rootRegistry, null, 2)
  );

  console.log('\n✓ Registry build complete!');
  console.log(`Components written to: ${distPath}`);
  console.log(`Total components: ${componentRegistry.length}`);
  console.log(`  - UI Components: ${manifest.structure.ui}`);
}

function extractDependencies(content) {
  const deps = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const dep = match[1];
    // Only include external dependencies (not relative or @/ imports)
    if (!dep.startsWith('.') && !dep.startsWith('@/') && !dep.startsWith('/')) {
      // Map common imports to their package names
      if (dep === 'react') continue; // React is assumed
      if (dep.startsWith('lucide-react')) deps.push('lucide-react');
      else if (dep === 'class-variance-authority') deps.push('class-variance-authority');
      else if (dep === 'clsx') deps.push('clsx');
      else if (dep === 'tailwind-merge') deps.push('tailwind-merge');
    }
  }
  
  return [...new Set(deps)];
}

function extractRegistryDeps(filePath) {
  // Extract component dependencies based on imports
  const deps = [];
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath, path.extname(filePath));
  
  // Don't include self or index files
  if (filename === 'index' || filename === 'types') return deps;
  
  return deps;
}

// Add npm script support
if (require.main === module) {
  buildRegistry().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}

module.exports = { buildRegistry };