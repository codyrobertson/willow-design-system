/**
 * Statistics plugin that collects transformation metrics
 */

import * as ts from 'typescript';
import {
  TransformerPlugin,
  TransformContext,
  TransformResult,
  BatchTransformResult,
} from '../index';

export interface TransformationStats {
  totalFiles: number;
  successfulTransformations: number;
  failedTransformations: number;
  totalErrors: number;
  totalWarnings: number;
  totalChanges: number;
  totalDuration: number;
  fileStats: Map<string, FileStats>;
}

export interface FileStats {
  fileName: string;
  success: boolean;
  errors: number;
  warnings: number;
  changes: number;
  duration: number;
  originalSize: number;
  transformedSize: number;
}

/**
 * Plugin that collects statistics about transformations
 */
export class StatsPlugin implements TransformerPlugin {
  readonly name = 'stats-plugin';
  readonly version = '1.0.0';

  private stats: TransformationStats = {
    totalFiles: 0,
    successfulTransformations: 0,
    failedTransformations: 0,
    totalErrors: 0,
    totalWarnings: 0,
    totalChanges: 0,
    totalDuration: 0,
    fileStats: new Map(),
  };

  private startTime: number = 0;

  /**
   * Get collected statistics
   */
  getStats(): TransformationStats {
    return { ...this.stats, fileStats: new Map(this.stats.fileStats) };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.stats = {
      totalFiles: 0,
      successfulTransformations: 0,
      failedTransformations: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalChanges: 0,
      totalDuration: 0,
      fileStats: new Map(),
    };
  }

  async beforeTransform(context: TransformContext): Promise<void> {
    this.startTime = Date.now();
    context.logger.info('Starting transformation statistics collection');
  }

  async afterTransformFile(
    sourceFile: ts.SourceFile,
    result: TransformResult,
    context: TransformContext
  ): Promise<void> {
    const fileName = sourceFile.fileName;
    const originalSize = sourceFile.text.length;
    const transformedSize = result.transformedFile?.text.length || 0;

    const fileStats: FileStats = {
      fileName,
      success: result.success,
      errors: result.errors.length,
      warnings: result.warnings.length,
      changes: result.changes.length,
      duration: result.metrics?.duration || 0,
      originalSize,
      transformedSize,
    };

    this.stats.fileStats.set(fileName, fileStats);
    this.stats.totalFiles++;

    if (result.success) {
      this.stats.successfulTransformations++;
    } else {
      this.stats.failedTransformations++;
    }

    this.stats.totalErrors += result.errors.length;
    this.stats.totalWarnings += result.warnings.length;
    this.stats.totalChanges += result.changes.length;
  }

  async afterTransform(
    results: BatchTransformResult,
    context: TransformContext
  ): Promise<void> {
    this.stats.totalDuration = Date.now() - this.startTime;

    // Log summary
    context.logger.info('Transformation completed');
    context.logger.info(`Total files: ${this.stats.totalFiles}`);
    context.logger.info(`Successful: ${this.stats.successfulTransformations}`);
    context.logger.info(`Failed: ${this.stats.failedTransformations}`);
    context.logger.info(`Total errors: ${this.stats.totalErrors}`);
    context.logger.info(`Total warnings: ${this.stats.totalWarnings}`);
    context.logger.info(`Total changes: ${this.stats.totalChanges}`);
    context.logger.info(`Duration: ${this.stats.totalDuration}ms`);
  }

  /**
   * Generate a detailed report
   */
  generateReport(): string {
    const report: string[] = [
      '# Transformation Statistics Report',
      '',
      '## Summary',
      `- Total files processed: ${this.stats.totalFiles}`,
      `- Successful transformations: ${this.stats.successfulTransformations}`,
      `- Failed transformations: ${this.stats.failedTransformations}`,
      `- Total errors: ${this.stats.totalErrors}`,
      `- Total warnings: ${this.stats.totalWarnings}`,
      `- Total changes: ${this.stats.totalChanges}`,
      `- Total duration: ${this.stats.totalDuration}ms`,
      '',
      '## File Details',
      '',
    ];

    for (const [fileName, stats] of this.stats.fileStats) {
      report.push(`### ${fileName}`);
      report.push(`- Status: ${stats.success ? '✅ Success' : '❌ Failed'}`);
      report.push(`- Errors: ${stats.errors}`);
      report.push(`- Warnings: ${stats.warnings}`);
      report.push(`- Changes: ${stats.changes}`);
      report.push(`- Duration: ${stats.duration}ms`);
      report.push(`- Size: ${stats.originalSize} → ${stats.transformedSize} bytes`);
      report.push('');
    }

    return report.join('\n');
  }
}