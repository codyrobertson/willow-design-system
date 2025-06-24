#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue('Testing Willow component installation...'));

const testCommand = `npx --yes shadcn add https://iridescent-brigadeiros-fe4174.netlify.app/r/button.json --overwrite --path components/ui`;

console.log(chalk.gray('Running command:'), testCommand);

try {
  const result = execSync(testCommand, {
    stdio: 'inherit',
    timeout: 30000,
    env: {
      ...process.env,
      CI: '1',
      FORCE_COLOR: '0'
    }
  });
  
  console.log(chalk.green('✅ Component installation succeeded!'));
} catch (error) {
  console.log(chalk.red('❌ Component installation failed:'));
  console.error(error.message);
}