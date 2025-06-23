#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories
const componentsDir = '/Users/Cody/code_projects/willow-design-system/registry/components/ui';
const outputDir = '/Users/Cody/code_projects/willow-design-system/public/registry/ui';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert PascalCase to kebab-case
function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Extract dependencies from import statements
function extractDependencies(content) {
  const dependencies = new Set();
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') && trimmed.includes('from ')) {
      const match = trimmed.match(/from\s+['"]([^'"]+)['"]/);
      if (match) {
        const importPath = match[1];
        // Only include non-relative imports (npm packages)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // Handle scoped packages and sub-imports
          const parts = importPath.split('/');
          if (importPath.startsWith('@')) {
            // Scoped package: @scope/package
            dependencies.add(parts.slice(0, 2).join('/'));
          } else {
            // Regular package: package-name
            dependencies.add(parts[0]);
          }
        }
      }
    }
  }
  
  return Array.from(dependencies).sort();
}

// Process a single component file
function processComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const componentName = path.parse(fileName).name;
  
  // Skip certain files
  if (componentName === 'index' || componentName === 'utils' || fileName.includes('.test.') || fileName.includes('.stories.')) {
    return null;
  }
  
  // Extract dependencies
  const dependencies = extractDependencies(content);
  
  // Convert component name to kebab-case
  const kebabName = toKebabCase(componentName);
  
  // Create registry entry
  const registryEntry = {
    name: kebabName,
    type: "registry:ui",
    dependencies: dependencies,
    registryDependencies: ["utils"],
    files: [
      {
        name: `${kebabName}.tsx`,
        content: content
      }
    ]
  };
  
  return { kebabName, registryEntry };
}

// Main processing function
function generateRegistryFiles() {
  let processedCount = 0;
  const errors = [];
  
  console.log('🔍 Scanning for component files...');
  
  // Get all .tsx files
  const getAllTsxFiles = (dir) => {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllTsxFiles(fullPath));
      } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.stories.')) {
        files.push(fullPath);
      }
    }
    
    return files;
  };
  
  const componentFiles = getAllTsxFiles(componentsDir);
  
  console.log(`📁 Found ${componentFiles.length} component files`);
  
  for (const filePath of componentFiles) {
    try {
      const result = processComponent(filePath);
      
      if (result) {
        const { kebabName, registryEntry } = result;
        const outputPath = path.join(outputDir, `${kebabName}.json`);
        
        // Write JSON file
        fs.writeFileSync(outputPath, JSON.stringify(registryEntry, null, 2));
        
        console.log(`✅ Generated: ${kebabName}.json`);
        processedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      errors.push({ file: filePath, error: error.message });
    }
  }
  
  console.log(`\n🎉 Successfully generated ${processedCount} registry JSON files`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred:`);
    errors.forEach(({ file, error }) => {
      console.log(`   - ${path.basename(file)}: ${error}`);
    });
  }
  
  // List all generated files
  console.log('\n📋 Generated files:');
  const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json')).sort();
  generatedFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
}

// Run the script
if (require.main === module) {
  generateRegistryFiles();
}

module.exports = { generateRegistryFiles };