import { Command } from 'commander';
import { Logger } from '../utils/logger.js';
import { detectProjectType } from '../utils/projectDetection.js';
import { validateWillowSetup, validateComponentImports, validateEssentials } from '../utils/validationChecker.js';

export const validateCommand = new Command('validate')
  .description('Validate Willow Design System setup')
  .option('--quick', 'Run quick validation (essential files only)')
  .option('--components', 'Validate component imports only')
  .option('--verbose', 'Show detailed validation results')
  .action(async (options) => {
    Logger.title('Validating Willow Design System Setup');
    
    try {
      // Detect project type
      const projectType = await detectProjectType();
      
      if (options.quick) {
        // Quick validation
        Logger.info('Running quick validation...');
        const isValid = await validateEssentials(projectType);
        
        if (isValid) {
          Logger.success('✅ Quick validation passed - essential files are present');
        } else {
          Logger.error('❌ Quick validation failed - missing essential files');
          process.exit(1);
        }
        return;
      }
      
      if (options.components) {
        // Component imports validation only
        Logger.info('Validating component imports...');
        const result = await validateComponentImports();
        
        if (result.isValid) {
          Logger.success('✅ Component imports validation passed');
          Logger.info(`Verified ${result.checkedFiles.length} files`);
        } else {
          Logger.error('❌ Component imports validation failed');
          result.errors.forEach(error => Logger.error(`  ${error}`));
          process.exit(1);
        }
        return;
      }
      
      // Full validation
      Logger.info('Running comprehensive validation...');
      
      const [setupValidation, importValidation] = await Promise.all([
        validateWillowSetup(projectType),
        validateComponentImports()
      ]);
      
      const allErrors = [...setupValidation.errors, ...importValidation.errors];
      const allWarnings = [...setupValidation.warnings, ...importValidation.warnings];
      const totalFiles = setupValidation.checkedFiles.length + importValidation.checkedFiles.length;
      
      // Display results
      Logger.spacer();
      
      if (allErrors.length === 0) {
        Logger.success('🎉 All validation checks passed!');
        Logger.info(`📁 Verified ${totalFiles} files`);
        
        if (allWarnings.length > 0) {
          Logger.spacer();
          Logger.warning('⚠️  Validation warnings:');
          allWarnings.forEach(warning => Logger.warning(`  ${warning}`));
        }
      } else {
        Logger.error('❌ Validation failed');
        Logger.error(`Found ${allErrors.length} errors and ${allWarnings.length} warnings`);
        
        Logger.spacer();
        Logger.error('Errors:');
        allErrors.forEach(error => Logger.error(`  ${error}`));
        
        if (allWarnings.length > 0) {
          Logger.spacer();
          Logger.warning('Warnings:');
          allWarnings.forEach(warning => Logger.warning(`  ${warning}`));
        }
        
        Logger.spacer();
        Logger.info('💡 To fix these issues, try running:');
        Logger.info('  npx willow-cli init --yes');
        
        process.exit(1);
      }
      
      if (options.verbose) {
        Logger.spacer();
        Logger.info('📋 Validation Summary:');
        Logger.info(`  Setup files: ${setupValidation.checkedFiles.length}`);
        Logger.info(`  Component files: ${importValidation.checkedFiles.length}`);
        Logger.info(`  Total verified: ${totalFiles}`);
        
        if (setupValidation.checkedFiles.length > 0) {
          Logger.info('  Verified files:');
          [...setupValidation.checkedFiles, ...importValidation.checkedFiles]
            .forEach(file => Logger.info(`    ✓ ${file}`));
        }
      }
      
    } catch (error) {
      Logger.error('Validation failed with error:');
      Logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });