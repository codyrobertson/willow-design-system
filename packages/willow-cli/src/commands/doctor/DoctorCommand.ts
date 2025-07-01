/**
 * Doctor Command Implementation
 */

import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  DoctorOptions,
  DoctorOptionsSchema,
  CommandResult,
  CLIError,
  CLIErrorCode 
} from '../../types/cli.js';
import { CommandContext } from '../../core/CommandRegistry.js';
import { configValidator } from '../../config/index.js';
import { argumentParser } from '../../core/ArgumentParser.js';

export class DoctorCommand {
  static command = 'doctor';
  static description = 'Diagnose and fix common issues';

  static builder(cmd: Command): void {
    cmd
      .option('--fix', 'attempt to fix issues')
      .option('--report <file>', 'save report to file')
      .option('--check <type>', 'specific check (deps, config, env)');
  }

  static async action(
    context: CommandContext,
    options: DoctorOptions
  ): Promise<CommandResult> {
    const { logger, progress } = context;
    const issues: Array<{ type: string; message: string; fix?: string }> = [];

    // Validate options
    const validatedOptions = argumentParser.parse(
      options,
      DoctorOptionsSchema,
      'doctor options'
    );

    try {
      progress.start('Running diagnostics...');

      // Check configuration
      if (!validatedOptions.check || validatedOptions.check === 'config') {
        progress.progress('Checking configuration...');
        await this.checkConfiguration(context, issues, validatedOptions.fix);
      }

      // Check dependencies
      if (!validatedOptions.check || validatedOptions.check === 'deps') {
        progress.progress('Checking dependencies...');
        await this.checkDependencies(context, issues, validatedOptions.fix);
      }

      // Check environment
      if (!validatedOptions.check || validatedOptions.check === 'env') {
        progress.progress('Checking environment...');
        await this.checkEnvironment(context, issues, validatedOptions.fix);
      }

      progress.stop();

      // Display results
      if (issues.length === 0) {
        logger.success('No issues found! Your setup looks good.');
      } else {
        logger.section('Issues Found');
        issues.forEach((issue, index) => {
          logger.error(`${index + 1}. [${issue.type}] ${issue.message}`);
          if (issue.fix && !validatedOptions.fix) {
            logger.info(`   Fix: ${issue.fix}`);
          }
        });
        
        if (validatedOptions.fix) {
          logger.info(`\nFixed ${issues.filter(i => i.fix).length} issues automatically.`);
        }
      }

      // Save report if requested
      if (validatedOptions.report) {
        await this.saveReport(context, issues, validatedOptions.report);
        logger.info(`Report saved to: ${validatedOptions.report}`);
      }

      return {
        success: issues.length === 0,
        data: { issues },
      };
    } catch (error) {
      progress.fail('Diagnostics failed');
      
      throw new CLIError(
        CLIErrorCode.UNKNOWN_ERROR,
        'Diagnostics failed',
        error
      );
    }
  }

  private static async checkConfiguration(
    context: CommandContext,
    issues: any[],
    autoFix: boolean
  ): Promise<void> {
    const { logger } = context;
    
    try {
      const { configManager } = await import('../../config/index.js');
      const config = await configManager.load();
      const validation = await configValidator.validate(config);
      
      validation.errors.forEach(error => {
        issues.push({
          type: 'CONFIG',
          message: `${error.path}: ${error.message}`,
        });
      });
      
      if (autoFix && validation.errors.length > 0) {
        const fixed = await configValidator.autoFix(config);
        await configManager.save(fixed);
        logger.debug('Configuration auto-fixed');
      }
    } catch (error) {
      issues.push({
        type: 'CONFIG',
        message: 'No configuration file found',
        fix: 'Run "willow init" to create configuration',
      });
    }
  }

  private static async checkDependencies(
    context: CommandContext,
    issues: any[],
    autoFix: boolean
  ): Promise<void> {
    // Check package.json exists
    try {
      await fs.access('package.json');
    } catch {
      issues.push({
        type: 'DEPS',
        message: 'No package.json found',
        fix: 'Run "npm init" in your project root',
      });
      return;
    }

    // Check node_modules exists
    try {
      await fs.access('node_modules');
    } catch {
      issues.push({
        type: 'DEPS',
        message: 'Dependencies not installed',
        fix: 'Run "npm install"',
      });
    }

    // TODO: Check for required peer dependencies
  }

  private static async checkEnvironment(
    context: CommandContext,
    issues: any[],
    autoFix: boolean
  ): Promise<void> {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      issues.push({
        type: 'ENV',
        message: `Node.js version ${nodeVersion} is too old`,
        fix: 'Update to Node.js 16 or higher',
      });
    }

    // Check Git
    try {
      await fs.access('.git');
    } catch {
      issues.push({
        type: 'ENV',
        message: 'Not a Git repository',
        fix: 'Run "git init" to initialize Git',
      });
    }

    // Check TypeScript if configured
    const { configManager } = await import('../../config/index.js');
    const config = configManager.get();
    if (config.typescript) {
      try {
        await fs.access('tsconfig.json');
      } catch {
        issues.push({
          type: 'ENV',
          message: 'TypeScript configured but tsconfig.json not found',
          fix: 'Create a tsconfig.json file',
        });
      }
    }
  }

  private static async saveReport(
    context: CommandContext,
    issues: any[],
    filepath: string
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      version: '0.0.0', // TODO: Get from package.json
      issues,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    await fs.writeFile(
      filepath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );
  }
}