export interface ProjectType {
  isVite: boolean;
  isNext: boolean;
  isOnlineIDE: boolean;
  type: 'vite' | 'nextjs' | 'nuxt' | 'remix' | 'react';
  hasTypeScript?: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  framework?: string;
}

export interface ComponentMeta {
  name: string;
  type: string;
  files: ComponentFile[];
  dependencies?: string[];
  registryDependencies?: string[];
  tailwind?: {
    config?: Record<string, any>;
  };
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

export interface ComponentFile {
  path?: string;
  name?: string;
  content: string;
  type?: string;
}

export interface InstallOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  baseDir?: string;
  isVite?: boolean;
  verbose?: boolean;
  skipDeps?: boolean;
  componentDir?: string;
  libDir?: string;
}

export interface InstallResult {
  installed: string[];
  failed: Array<{
    component: string;
    error: string;
  }>;
}

export interface ComponentsConfig {
  $schema: string;
  style: string;
  rsc: boolean;
  tsx: boolean;
  tailwind: {
    config: string;
    css: string;
    baseColor: string;
    cssVariables: boolean;
    prefix: string;
  };
  aliases: {
    components: string;
    utils: string;
    ui: string;
    lib: string;
  };
  registries: {
    default: string;
    willow: string;
    shadcn: string;
  };
  iconLibrary: string;
  url: string;
}

export const WILLOW_REGISTRY = 'https://iridescent-brigadeiros-fe4174.netlify.app/r' as const;

export const AVAILABLE_COMPONENTS = [
  'button', 'badge', 'card', 'input', 'label', 'select', 'textarea',
  'accordion', 'tabs', 'modal', 'avatar', 'checkbox', 'chip', 
  'fancy-button', 'form-card', 'form-field', 'gradient-bg', 
  'highlight', 'info-card', 'list', 'logo', 'skeleton', 
  'switch', 'tag', 'toast', 'tooltip'
] as const;

export type ComponentName = typeof AVAILABLE_COMPONENTS[number];