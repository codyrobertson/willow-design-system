/**
 * Dry run plugin that prevents actual file modifications
 */

import * as ts from 'typescript';
import {
  TransformerPlugin,
  TransformContext,
  TransformResult,
} from '../index';

/**
 * Plugin that enables dry run mode for transformations
 */
export class DryRunPlugin implements TransformerPlugin {
  readonly name = 'dry-run-plugin';
  readonly version = '1.0.0';

  private originalFiles = new Map<string, ts.SourceFile>();

  async beforeTransform(context: TransformContext): Promise<void> {
    context.logger.info('DRY RUN MODE: No files will be modified');
    context.config.dryRun = true;
  }

  async beforeTransformFile(
    sourceFile: ts.SourceFile,
    context: TransformContext
  ): Promise<void> {
    // Store original file
    this.originalFiles.set(sourceFile.fileName, sourceFile);
  }

  async afterTransformFile(
    sourceFile: ts.SourceFile,
    result: TransformResult,
    context: TransformContext
  ): Promise<TransformResult> {
    // In dry run mode, always return the original file
    const original = this.originalFiles.get(sourceFile.fileName);
    
    if (original && result.transformedFile) {
      // Log what would have changed
      if (result.changes.length > 0) {
        context.logger.info(
          `DRY RUN: Would apply ${result.changes.length} changes to ${sourceFile.fileName}`
        );
        
        for (const change of result.changes) {
          context.logger.debug(`  - ${change.type}: ${change.description}`);
        }
      }

      // Return result with original file to prevent actual changes
      return {
        ...result,
        transformedFile: original,
      };
    }

    return result;
  }

  /**
   * Get the changes that would be applied
   */
  getPlannedChanges(): Map<string, ts.SourceFile> {
    return new Map(this.originalFiles);
  }

  /**
   * Clear stored files
   */
  clear(): void {
    this.originalFiles.clear();
  }
}