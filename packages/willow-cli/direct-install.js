#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

const WILLOW_REGISTRY = 'https://iridescent-brigadeiros-fe4174.netlify.app/r';
const COMPONENTS = [
  'button', 'badge', 'card', 'input', 'label', 'select', 'textarea',
  'accordion', 'tabs', 'modal', 'avatar', 'checkbox', 'chip', 
  'fancy-button', 'form-card', 'form-field', 'gradient-bg', 
  'highlight', 'info-card', 'list', 'logo', 'skeleton', 
  'switch', 'tag', 'toast', 'tooltip'
];

async function installComponents() {
  // Check for package.json
  try {
    await fs.access('package.json');
  } catch {
    console.error(chalk.red('❌ No package.json found. Please run this in a project directory.'));
    process.exit(1);
  }

  // Detect project type
  let componentDir = 'components/ui';
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    if (packageJson.devDependencies?.vite || packageJson.dependencies?.vite) {
      componentDir = 'src/components/ui';
      console.log(chalk.blue('📦 Vite project detected'));
    } else {
      console.log(chalk.blue('📦 Next.js/React project detected'));
    }
  } catch {}

  // Create component directory
  await fs.mkdir(componentDir, { recursive: true });
  console.log(chalk.blue(`🌳 Installing Willow components to ${componentDir}...`));

  const spinner = ora('Starting installation...').start();
  let successCount = 0;
  let failedComponents = [];

  for (const component of COMPONENTS) {
    spinner.text = `Installing ${component} (${successCount + 1}/${COMPONENTS.length})...`;
    
    try {
      // Fetch component data
      const response = await fetch(`${WILLOW_REGISTRY}/${component}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Extract content from the first file
      if (data.files && data.files[0] && data.files[0].content) {
        const content = data.files[0].content;
        const fileName = `${component}.tsx`;
        
        // Write component file
        await fs.writeFile(path.join(componentDir, fileName), content);
        successCount++;
      } else {
        throw new Error('Invalid component data');
      }
    } catch (error) {
      failedComponents.push(component);
    }
  }

  spinner.stop();

  console.log('');
  console.log(chalk.blue('📊 Installation complete!'));
  console.log(chalk.green(`✅ Successfully installed: ${successCount} components`));
  
  if (failedComponents.length > 0) {
    console.log(chalk.red(`❌ Failed: ${failedComponents.join(', ')}`));
  }

  console.log('');
  console.log(chalk.blue('💡 Import components like:'));
  console.log(chalk.gray('   import { Button } from "@/components/ui/button"'));
  console.log(chalk.gray('   import { Card } from "@/components/ui/card"'));
  
  // Also create utils.ts if it doesn't exist
  const libDir = componentDir.includes('src/') ? 'src/lib' : 'lib';
  await fs.mkdir(libDir, { recursive: true });
  
  const utilsPath = path.join(libDir, 'utils.ts');
  try {
    await fs.access(utilsPath);
  } catch {
    const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;
    await fs.writeFile(utilsPath, utilsContent);
    console.log(chalk.green(`\n✅ Created ${utilsPath}`));
  }
}

// Run the installer
installComponents().catch(console.error);