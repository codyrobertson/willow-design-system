/**
 * Version Detection System
 * Detects Willow CLI versions and configuration formats
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

export interface VersionInfo {
  /** CLI version */
  cliVersion: string;
  /** Configuration version */
  configVersion: string;
  /** Configuration format (v1, v2, etc.) */
  configFormat: 'v1' | 'v2' | 'unknown';
  /** Whether this is a legacy installation */
  isLegacy: boolean;
  /** Detected features */
  features: {
    typescript: boolean;
    tailwind: boolean;
    cssVariables: boolean;
    registry: boolean;
    aliases: boolean;
    workspaces: boolean;
  };
}

export interface DetectionResult {
  success: boolean;
  versionInfo?: VersionInfo;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration schemas for different versions
 */
const ConfigSchemaV1 = z.object({
  componentsPath: z.string().optional(),
  registryUrl: z.string().optional(),
  style: z.string().optional(),
  tailwind: z.object({
    config: z.string().optional(),
    css: z.string().optional(),
  }).optional(),
});

const ConfigSchemaV2 = z.object({
  version: z.string().optional(),
  paths: z.object({
    components: z.string(),
    ui: z.string().optional(),
    lib: z.string().optional(),
    utils: z.string().optional(),
  }).optional(),
  registry: z.object({
    url: z.string().optional(),
    token: z.string().optional(),
  }).optional(),
  typescript: z.object({
    config: z.string().optional(),
    baseUrl: z.string().optional(),
    paths: z.record(z.string()).optional(),
  }).optional(),
  style: z.object({
    theme: z.string().optional(),
    cssVariables: z.boolean().optional(),
  }).optional(),
});

/**
 * Version detector for Willow CLI
 */
export class VersionDetector {
  /**
   * Detect version information from a project
   */
  async detectVersion(projectPath: string = '.'): Promise<DetectionResult> {
    const result: DetectionResult = {
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      // Check for Willow configuration file
      const configPath = await this.findConfigFile(projectPath);
      
      if (!configPath) {
        result.warnings.push('No Willow configuration file found');
      }

      // Detect CLI version from package.json
      const cliVersion = await this.detectCLIVersion(projectPath);
      
      // Detect configuration version and format
      const { configVersion, configFormat } = configPath 
        ? await this.detectConfigVersion(configPath)
        : { configVersion: 'unknown', configFormat: 'unknown' as const };

      // Detect features
      const features = await this.detectFeatures(projectPath, configPath);

      // Determine if legacy
      const isLegacy = this.isLegacyVersion(cliVersion, configVersion);

      result.versionInfo = {
        cliVersion,
        configVersion,
        configFormat,
        isLegacy,
        features,
      };
      result.success = true;

      // Add warnings for legacy versions
      if (isLegacy) {
        result.warnings.push(
          'Legacy Willow CLI version detected. Consider upgrading for the latest features.'
        );
      }

      return result;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  }

  /**
   * Find Willow configuration file
   */
  private async findConfigFile(projectPath: string): Promise<string | null> {
    const possibleFiles = [
      'willow.config.json',
      'willow.config.js',
      'willow.config.ts',
      '.willowrc.json',
      '.willowrc',
      'shadcn.config.json', // Legacy shadcn config
    ];

    for (const file of possibleFiles) {
      const filePath = path.join(projectPath, file);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // File doesn't exist, continue
      }
    }

    return null;
  }

  /**
   * Detect CLI version from package.json
   */
  private async detectCLIVersion(projectPath: string): Promise<string> {
    try {
      // Check local installation
      const localPackagePath = path.join(projectPath, 'node_modules', 'willow-cli', 'package.json');
      const localPackage = JSON.parse(await fs.readFile(localPackagePath, 'utf-8'));
      return localPackage.version;
    } catch {
      // Not locally installed
    }

    try {
      // Check global installation
      const { execSync } = await import('child_process');
      const version = execSync('willow --version', { encoding: 'utf-8' }).trim();
      return version.replace(/^v/, '');
    } catch {
      // CLI not found
    }

    try {
      // Check project's package.json dependencies
      const packagePath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
      
      const version = packageJson.dependencies?.['willow-cli'] || 
                     packageJson.devDependencies?.['willow-cli'];
      
      if (version) {
        return version.replace(/^[\^~]/, '');
      }
    } catch {
      // No package.json
    }

    return 'unknown';
  }

  /**
   * Detect configuration version and format
   */
  private async detectConfigVersion(configPath: string): Promise<{
    configVersion: string;
    configFormat: 'v1' | 'v2' | 'unknown';
  }> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      let config: any;

      // Parse based on file extension
      if (configPath.endsWith('.json')) {
        config = JSON.parse(content);
      } else if (configPath.endsWith('.js') || configPath.endsWith('.ts')) {
        // For JS/TS configs, we'd need to evaluate them
        // For now, we'll just return unknown
        return { configVersion: 'unknown', configFormat: 'unknown' };
      }

      // Check if config has explicit version
      if (config.version) {
        return {
          configVersion: config.version,
          configFormat: 'v2',
        };
      }

      // Try to detect format based on structure
      const v2Result = ConfigSchemaV2.safeParse(config);
      if (v2Result.success && config.paths) {
        return { configVersion: '2.0.0', configFormat: 'v2' };
      }

      const v1Result = ConfigSchemaV1.safeParse(config);
      if (v1Result.success) {
        return { configVersion: '1.0.0', configFormat: 'v1' };
      }

      return { configVersion: 'unknown', configFormat: 'unknown' };

    } catch {
      return { configVersion: 'unknown', configFormat: 'unknown' };
    }
  }

  /**
   * Detect enabled features
   */
  private async detectFeatures(
    projectPath: string,
    configPath: string | null
  ): Promise<VersionInfo['features']> {
    const features: VersionInfo['features'] = {
      typescript: false,
      tailwind: false,
      cssVariables: false,
      registry: false,
      aliases: false,
      workspaces: false,
    };

    // Check for TypeScript
    try {
      await fs.access(path.join(projectPath, 'tsconfig.json'));
      features.typescript = true;
    } catch {
      // No TypeScript
    }

    // Check for Tailwind
    try {
      await fs.access(path.join(projectPath, 'tailwind.config.js'));
      features.tailwind = true;
    } catch {
      try {
        await fs.access(path.join(projectPath, 'tailwind.config.ts'));
        features.tailwind = true;
      } catch {
        // No Tailwind
      }
    }

    // Check configuration for other features
    if (configPath) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        
        features.cssVariables = config.style?.cssVariables === true;
        features.registry = !!config.registry || !!config.registryUrl;
        features.aliases = !!config.aliases;
      } catch {
        // Can't parse config
      }
    }

    // Check for workspaces
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
      );
      features.workspaces = !!packageJson.workspaces;
    } catch {
      // No package.json
    }

    return features;
  }

  /**
   * Check if version is considered legacy
   */
  private isLegacyVersion(cliVersion: string, configVersion: string): boolean {
    if (cliVersion === 'unknown' || configVersion === 'unknown') {
      return false;
    }

    // Consider versions before 0.6.0 as legacy
    const [major, minor] = cliVersion.split('.').map(Number);
    return major === 0 && minor < 6;
  }

  /**
   * Get recommended migration path
   */
  getRecommendedMigration(versionInfo: VersionInfo): {
    targetVersion: string;
    steps: string[];
  } | null {
    if (!versionInfo.isLegacy) {
      return null;
    }

    const steps: string[] = [];
    
    // Recommend steps based on current state
    if (versionInfo.configFormat === 'v1') {
      steps.push('Migrate configuration to v2 format');
    }

    if (!versionInfo.features.typescript) {
      steps.push('Add TypeScript support');
    }

    if (!versionInfo.features.tailwind) {
      steps.push('Configure Tailwind CSS');
    }

    if (!versionInfo.features.cssVariables) {
      steps.push('Enable CSS variables for theming');
    }

    return {
      targetVersion: '0.7.0',
      steps,
    };
  }
}