import chalk from 'chalk';
import { readFileContent, writeFileContent } from './fileSystem.js';
import { glob } from 'glob';

/**
 * Fix incorrect Willow component imports in TypeScript/JavaScript files
 */
export async function fixWillowImports(baseDir: string = process.cwd()): Promise<void> {
  console.log(chalk.blue('🔧 Checking for incorrect Willow imports...'));
  
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: baseDir,
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**']
  });
  let fixedFiles = 0;
  
  for (const file of files) {
    try {
      const content = await readFileContent(file);
      const originalContent = content;
      
      // Fix @willow/components imports
      let updatedContent = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*["']@willow\/components["'];?/g,
        (match, imports) => {
          console.log(chalk.yellow(`   ⚠️  Found incorrect import in ${file}`));
          console.log(chalk.gray(`       ${match.trim()}`));
          
          // Parse the imports and create individual import statements
          const importList = imports
            .split(',')
            .map((imp: string) => imp.trim())
            .filter((imp: string) => imp.length > 0);
          
          const individualImports = importList.map((componentName: string) => {
            const kebabCase = componentName
              .replace(/([A-Z])/g, '-$1')
              .toLowerCase()
              .replace(/^-/, '');
            
            return `import { ${componentName} } from "@/components/ui/${kebabCase}";`;
          }).join('\n');
          
          console.log(chalk.green(`   ✅ Fixed to individual imports:`));
          individualImports.split('\n').forEach((line: string) => {
            console.log(chalk.gray(`       ${line}`));
          });
          
          return individualImports;
        }
      );
      
      // Fix any other common incorrect patterns
      updatedContent = updatedContent.replace(
        /from\s*["']@willow\/([^"']+)["'];?/g,
        (match, path) => {
          console.log(chalk.yellow(`   ⚠️  Found incorrect @willow/ import in ${file}: ${match}`));
          const replacement = `from "@/components/ui/${path}";`;
          console.log(chalk.green(`   ✅ Fixed to: ${replacement}`));
          return replacement;
        }
      );
      
      // Fix relative imports with incorrect casing (e.g., ./Button -> ./button)
      updatedContent = updatedContent.replace(
        /from\s*["']\.\/([A-Z][a-zA-Z]+)["'];?/g,
        (match, componentName) => {
          const kebabCase = componentName.toLowerCase();
          console.log(chalk.yellow(`   ⚠️  Found incorrect casing in ${file}: ${match}`));
          const replacement = `from "./${kebabCase}";`;
          console.log(chalk.green(`   ✅ Fixed to: ${replacement}`));
          return replacement;
        }
      );
      
      if (updatedContent !== originalContent) {
        await writeFileContent(file, updatedContent);
        fixedFiles++;
        console.log(chalk.green(`   ✅ Fixed imports in ${file}`));
      }
      
    } catch (error) {
      console.log(chalk.yellow(`   ⚠️  Could not process ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  
  if (fixedFiles > 0) {
    console.log(chalk.green(`✅ Fixed incorrect imports in ${fixedFiles} file(s)`));
  } else {
    console.log(chalk.green('✅ No incorrect imports found'));
  }
}

/**
 * Convert component name to kebab-case for file path
 */
function componentNameToPath(componentName: string): string {
  // Handle common component names
  const mappings: Record<string, string> = {
    'Button': 'button',
    'Card': 'card',
    'CardContent': 'card',
    'CardHeader': 'card', 
    'CardTitle': 'card',
    'CardFooter': 'card',
    'Badge': 'badge',
    'Input': 'input',
    'Label': 'label',
    'Tabs': 'tabs',
    'TabsList': 'tabs',
    'TabsTrigger': 'tabs',
    'TabsContent': 'tabs',
    'Dialog': 'dialog',
    'DialogContent': 'dialog',
    'DialogHeader': 'dialog',
    'DialogTitle': 'dialog',
    'DialogTrigger': 'dialog',
    'Alert': 'alert',
    'AlertDialog': 'alert-dialog',
    'Avatar': 'avatar',
    'AvatarImage': 'avatar',
    'AvatarFallback': 'avatar',
    'Checkbox': 'checkbox',
    'RadioGroup': 'radio-group',
    'Select': 'select',
    'Switch': 'switch',
    'Textarea': 'textarea',
    'Toast': 'toast',
    'Tooltip': 'tooltip',
    'TooltipContent': 'tooltip',
    'TooltipProvider': 'tooltip',
    'TooltipTrigger': 'tooltip'
  };
  
  return mappings[componentName] || componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
}