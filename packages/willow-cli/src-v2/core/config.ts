/**
 * Configuration Management for Willow CLI
 * Handles loading and merging configuration from various sources
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { CLIOptions, RegistryConfig } from '../types';

export interface WillowConfig {
  registry?: RegistryConfig;
  paths?: {
    components?: string;
    styles?: string;
    docs?: string;
  };
  typescript?: boolean;
  framework?: string;
  defaults?: {
    dryRun?: boolean;
    skipDeps?: boolean;
    force?: boolean;
  };
}

export interface ServerConfig {
  port?: number;
  host?: string;
  cors?: boolean;
  database?: {
    type: 'sqlite' | 'postgres' | 'mysql';
    url?: string;
    file?: string;
  };
  storage?: {
    type: 'local' | 's3';
    path?: string;
    bucket?: string;
  };
  auth?: {
    enabled: boolean;
    providers?: string[];
  };
}

const DEFAULT_CONFIG: WillowConfig = {
  registry: {
    url: 'https://registry.willow.design',
    timeout: 30000,
    offline: false
  },
  paths: {
    components: 'src/components',
    styles: 'src/styles',
    docs: 'docs'
  },
  typescript: true,
  defaults: {
    dryRun: false,
    skipDeps: false,
    force: false
  }
};

const DEFAULT_SERVER_CONFIG: ServerConfig = {
  port: 3000,
  host: 'localhost',
  cors: true,
  database: {
    type: 'sqlite',
    file: 'willow-registry.db'
  },
  storage: {
    type: 'local',
    path: '.willow/storage'
  },
  auth: {
    enabled: false
  }
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function loadConfig(customPath?: string): Promise<WillowConfig> {
  const configs: (WillowConfig | null)[] = [];

  // 1. Load from custom path if provided
  if (customPath) {
    const custom = await loadJsonFile<WillowConfig>(customPath);
    if (custom) configs.push(custom);
  }

  // 2. Load from project root
  const projectConfig = await loadJsonFile<WillowConfig>('willow.config.json');
  if (projectConfig) configs.push(projectConfig);

  // 3. Load from .willowrc
  const rcConfig = await loadJsonFile<WillowConfig>('.willowrc');
  if (rcConfig) configs.push(rcConfig);

  // 4. Load from home directory
  const homeConfig = await loadJsonFile<WillowConfig>(
    join(homedir(), '.willow', 'config.json')
  );
  if (homeConfig) configs.push(homeConfig);

  // Merge all configs (later configs override earlier ones)
  const merged = configs.reduce((acc, config) => {
    if (!config) return acc;
    return deepMerge(acc, config);
  }, DEFAULT_CONFIG);

  // Check for components.json and merge if exists
  const componentsJson = await loadJsonFile<any>('components.json');
  if (componentsJson) {
    merged.paths = {
      ...merged.paths,
      components: componentsJson.resolvedPaths?.ui || merged.paths?.components
    };
    merged.typescript = componentsJson.tsx !== false;
  }

  return merged;
}

export async function loadServerConfig(): Promise<ServerConfig> {
  const configs: (ServerConfig | null)[] = [];

  // Load from various sources
  configs.push(await loadJsonFile<ServerConfig>('willow.server.json'));
  configs.push(await loadJsonFile<ServerConfig>('.willow/server.config.json'));
  
  // Environment variable overrides
  const envConfig: Partial<ServerConfig> = {};
  if (process.env.WILLOW_PORT) {
    envConfig.port = parseInt(process.env.WILLOW_PORT, 10);
  }
  if (process.env.WILLOW_HOST) {
    envConfig.host = process.env.WILLOW_HOST;
  }
  configs.push(envConfig);

  return configs.reduce((acc, config) => {
    if (!config) return acc;
    return deepMerge(acc, config);
  }, DEFAULT_SERVER_CONFIG);
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          (output as any)[key] = deepMerge(targetValue, sourceValue as any);
        } else {
          (output as any)[key] = sourceValue;
        }
      } else {
        (output as any)[key] = sourceValue;
      }
    }
  }
  
  return output;
}