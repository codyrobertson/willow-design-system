import { Command } from 'commander';
import chalk from 'chalk';
import { AVAILABLE_COMPONENTS, ComponentName } from '../types/index.js';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all available Willow components')
    .option('--json', 'Output as JSON')
    .option('--categories', 'Group components by category')
    .action((options) => {
      if (options.json) {
        console.log(JSON.stringify(AVAILABLE_COMPONENTS, null, 2));
        return;
      }
      
      if (options.categories) {
        const categories = groupComponentsByCategory();
        
        console.log(chalk.blue('\n🎨 Willow Design System Components\n'));
        
        for (const [category, components] of Object.entries(categories)) {
          console.log(chalk.yellow(`${category}:`));
          components.forEach(comp => {
            console.log(`  • ${comp}`);
          });
          console.log();
        }
      } else {
        console.log(chalk.blue('\n🎨 Available Willow Components:\n'));
        
        const columns = 3;
        const colWidth = 25;
        
        AVAILABLE_COMPONENTS.forEach((component, index) => {
          const padded = component.padEnd(colWidth);
          process.stdout.write(chalk.gray(padded));
          
          if ((index + 1) % columns === 0) {
            console.log();
          }
        });
        
        if (AVAILABLE_COMPONENTS.length % columns !== 0) {
          console.log();
        }
      }
      
      console.log(chalk.yellow(`\n📦 Total: ${AVAILABLE_COMPONENTS.length} components`));
      console.log(chalk.gray('\nUsage: willow add <component>'));
      console.log(chalk.gray('       willow add all (to install all components)'));
    });
}

function groupComponentsByCategory(): Record<string, ComponentName[]> {
  const categories: Record<string, ComponentName[]> = {
    'Form Controls': [],
    'Display': [],
    'Feedback': [],
    'Navigation': [],
    'Layout': [],
    'Special': []
  };
  
  const categoryMap: Record<ComponentName, string> = {
    // Form Controls
    'button': 'Form Controls',
    'checkbox': 'Form Controls',
    'input': 'Form Controls',
    'label': 'Form Controls',
    'select': 'Form Controls',
    'switch': 'Form Controls',
    'textarea': 'Form Controls',
    'form-field': 'Form Controls',
    'fancy-button': 'Form Controls',
    
    // Display
    'avatar': 'Display',
    'badge': 'Display',
    'card': 'Display',
    'chip': 'Display',
    'highlight': 'Display',
    'list': 'Display',
    'logo': 'Display',
    'tag': 'Display',
    'info-card': 'Display',
    'form-card': 'Display',
    
    // Feedback
    'modal': 'Feedback',
    'skeleton': 'Feedback',
    'toast': 'Feedback',
    'tooltip': 'Feedback',
    
    // Navigation
    'accordion': 'Navigation',
    'tabs': 'Navigation',
    
    // Special
    'gradient-bg': 'Special'
  };
  
  AVAILABLE_COMPONENTS.forEach(component => {
    const category = categoryMap[component] || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(component);
  });
  
  // Remove empty categories
  for (const key of Object.keys(categories)) {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  }
  
  return categories;
}