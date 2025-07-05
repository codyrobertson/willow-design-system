/**
 * Willow CLI v2.0 - Consolidated Types
 * All essential TypeScript types in one place
 */

// Component Types
export interface ComponentMetadata {
  name: string;
  version: string;
  description?: string;
  category: 'ui' | 'layout' | 'utility' | 'hook' | 'provider';
  framework?: 'react' | 'vue' | 'svelte' | 'solid';
  dependencies?: string[];
  peerDependencies?: Record<string, string>;
  tags?: string[];
  author?: string;
  license?: string;
  publishedAt?: Date;
  downloads?: number;
  rating?: number;
}

export interface ComponentFiles {
  main: string;
  styles?: string;
  types?: string;
  docs?: string;
  examples?: string[];
  tests?: string[];
}

export interface Component {
  metadata: ComponentMetadata;
  files: ComponentFiles;
  content: Record<string, string>; // filename -> content
}

// Registry Types
export interface RegistryConfig {
  url: string;
  apiKey?: string;
  timeout?: number;
  offline?: boolean;
  cacheDir?: string;
}

export interface PublishOptions {
  component: Component;
  token: string;
  private?: boolean;
  tags?: string[];
}

export interface SearchOptions {
  query: string;
  category?: string;
  framework?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'date';
}

export interface SearchResult {
  components: ComponentMetadata[];
  total: number;
  facets?: {
    categories: Record<string, number>;
    frameworks: Record<string, number>;
    tags: Record<string, number>;
  };
}

// CLI Types
export interface CLIOptions {
  verbose?: boolean;
  debug?: boolean;
  color?: boolean;
  config?: string;
  yes?: boolean;
  dryRun?: boolean;
}

export interface CommandOptions extends CLIOptions {
  path?: string;
  force?: boolean;
  skipDeps?: boolean;
  registry?: string;
}

export interface InstallOptions extends CommandOptions {
  components: string[];
  all?: boolean;
  dev?: boolean;
}

// Documentation Types
export interface DocumentationConfig {
  outputDir: string;
  format: 'markdown' | 'html' | 'json';
  includeExamples?: boolean;
  includeTypes?: boolean;
  customTemplate?: string;
}

export interface ComponentDoc {
  name: string;
  description: string;
  props?: PropDoc[];
  methods?: MethodDoc[];
  examples?: Example[];
  notes?: string;
}

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface MethodDoc {
  name: string;
  parameters: ParamDoc[];
  returnType: string;
  description?: string;
}

export interface ParamDoc {
  name: string;
  type: string;
  description?: string;
}

export interface Example {
  title: string;
  code: string;
  language?: string;
}

// Error Types
export class WillowError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WillowError';
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncResult<T> = Promise<{
  success: boolean;
  data?: T;
  error?: Error;
}>;

// Framework Detection
export interface FrameworkInfo {
  type: 'nextjs' | 'vite' | 'remix' | 'gatsby' | 'cra' | 'unknown';
  version?: string;
  typescript: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  paths: {
    components: string;
    styles: string;
    public: string;
  };
}