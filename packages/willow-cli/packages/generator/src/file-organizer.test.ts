/**
 * Tests for FileOrganizer class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as ts from 'typescript';
import { FileOrganizer } from './file-organizer';
import {
  FileOrganizationConfig,
  DirectoryStructure,
  FileNamingConvention,
  CodeGenerationResult,
} from './types';

describe('FileOrganizer', () => {
  let fileOrganizer: FileOrganizer;
  let testConfig: FileOrganizationConfig;
  let testFiles: CodeGenerationResult[];

  beforeEach(() => {
    fileOrganizer = new FileOrganizer();
    testConfig = {
      outputDir: '/test/output',
      structure: DirectoryStructure.Mirror,
      preserveStructure: false,
      fileNaming: FileNamingConvention.Original,
    };
    testFiles = [
      {
        code: 'export const Button = () => <button>Click</button>;',
        filePath: 'src/components/Button.tsx',
      },
      {
        code: 'export function useAuth() { return { user: null }; }',
        filePath: 'src/hooks/useAuth.ts',
      },
      {
        code: 'export const API_URL = "https://api.example.com";',
        filePath: 'src/utils/constants.ts',
      },
    ];
  });

  describe('organize', () => {
    it('should organize files with mirror structure', () => {
      const result = fileOrganizer.organize(testFiles, testConfig);

      expect(result.fileCount).toBe(3);
      expect(result.directories.size).toBe(3);
      expect(result.directories.has('/test/output/src/components')).toBe(true);
      expect(result.directories.has('/test/output/src/hooks')).toBe(true);
      expect(result.directories.has('/test/output/src/utils')).toBe(true);
    });

    it('should organize files with flat structure', () => {
      testConfig.structure = DirectoryStructure.Flat;

      const result = fileOrganizer.organize(testFiles, testConfig);

      expect(result.fileCount).toBe(3);
      expect(result.directories.size).toBe(1);
      expect(result.directories.has('/test/output')).toBe(true);

      const outputFiles = result.directories.get('/test/output')!;
      expect(outputFiles).toHaveLength(3);
      expect(outputFiles[0].filePath).toBe('/test/output/Button.tsx');
      expect(outputFiles[1].filePath).toBe('/test/output/useAuth.ts');
      expect(outputFiles[2].filePath).toBe('/test/output/constants.ts');
    });

    it('should organize files by type', () => {
      testConfig.structure = DirectoryStructure.Type;

      const result = fileOrganizer.organize(testFiles, testConfig);

      // Let's see what directories were actually created
      const dirs = Array.from(result.directories.keys());

      // Since the organizeByType preserves src structure, the paths will include src subdirs
      expect(result.directories.size).toBe(3);
      expect(dirs.some((d) => d.includes('components'))).toBe(true);
      expect(dirs.some((d) => d.includes('hooks'))).toBe(true);

      // Let's check the actual files were organized correctly
      const allFiles = Array.from(result.directories.values()).flat();
      expect(allFiles).toHaveLength(3);

      // Check that Button.tsx is in a components directory
      const buttonFile = allFiles.find((f) => f.filePath.includes('Button.tsx'));
      expect(buttonFile).toBeDefined();
      expect(buttonFile!.filePath).toContain('components');

      // Check that useAuth.ts is in a hooks directory
      const hookFile = allFiles.find((f) => f.filePath.includes('useAuth.ts'));
      expect(hookFile).toBeDefined();
      expect(hookFile!.filePath).toContain('hooks');
    });

    it('should organize files by feature', () => {
      testConfig.structure = DirectoryStructure.Feature;

      // Add files with feature structure
      const featureFiles: CodeGenerationResult[] = [
        {
          code: 'export const UserProfile = () => {};',
          filePath: 'src/features/user/components/UserProfile.tsx',
        },
        {
          code: 'export const useUser = () => {};',
          filePath: 'src/features/user/hooks/useUser.ts',
        },
        {
          code: 'export const AuthForm = () => {};',
          filePath: 'src/features/auth/components/AuthForm.tsx',
        },
      ];

      const result = fileOrganizer.organize(featureFiles, testConfig);

      expect(result.directories.has('/test/output/user/components')).toBe(true);
      expect(result.directories.has('/test/output/user/hooks')).toBe(true);
      expect(result.directories.has('/test/output/auth/components')).toBe(true);
    });

    it('should handle custom organization with mapper function', () => {
      testConfig.structure = DirectoryStructure.Custom;
      testConfig.customMapper = (filePath: string, sourceFile: ts.SourceFile) => {
        // Custom logic: organize by file extension
        const ext = filePath.endsWith('.tsx') ? 'components' : 'modules';
        const fileName = filePath.split('/').pop()!;
        return `${ext}/${fileName}`;
      };

      const result = fileOrganizer.organize(testFiles, testConfig);

      expect(result.directories.has('/test/output/components')).toBe(true);
      expect(result.directories.has('/test/output/modules')).toBe(true);
    });
  });

  describe('file naming conventions', () => {
    it('should convert to kebab-case', () => {
      testConfig.fileNaming = FileNamingConvention.KebabCase;

      const files: CodeGenerationResult[] = [
        {
          code: 'export const UserProfile = () => {};',
          filePath: 'UserProfile.tsx',
        },
        {
          code: 'export const useAuthToken = () => {};',
          filePath: 'useAuthToken.ts',
        },
      ];

      const result = fileOrganizer.organize(files, testConfig);
      const outputFiles = Array.from(result.directories.values()).flat();

      expect(outputFiles[0].filePath).toMatch(/user-profile\.tsx$/);
      expect(outputFiles[1].filePath).toMatch(/use-auth-token\.ts$/);
    });

    it('should convert to camelCase', () => {
      testConfig.fileNaming = FileNamingConvention.CamelCase;
      testConfig.structure = DirectoryStructure.Flat;

      const files: CodeGenerationResult[] = [
        {
          code: 'export const Button = () => {};',
          filePath: 'primary-button.tsx',
        },
        {
          code: 'export const Modal = () => {};',
          filePath: 'dialog-modal.tsx',
        },
      ];

      const result = fileOrganizer.organize(files, testConfig);
      const outputFiles = Array.from(result.directories.values()).flat();

      expect(outputFiles[0].filePath).toBe('/test/output/primaryButton.tsx');
      expect(outputFiles[1].filePath).toBe('/test/output/dialogModal.tsx');
    });

    it('should convert to PascalCase', () => {
      testConfig.fileNaming = FileNamingConvention.PascalCase;
      testConfig.structure = DirectoryStructure.Flat;

      const files: CodeGenerationResult[] = [
        {
          code: 'export const button = () => {};',
          filePath: 'primary-button.tsx',
        },
        {
          code: 'export const modal = () => {};',
          filePath: 'dialog_modal.tsx',
        },
      ];

      const result = fileOrganizer.organize(files, testConfig);
      const outputFiles = Array.from(result.directories.values()).flat();

      expect(outputFiles[0].filePath).toBe('/test/output/PrimaryButton.tsx');
      expect(outputFiles[1].filePath).toBe('/test/output/DialogModal.tsx');
    });
  });

  describe('file type detection', () => {
    it('should detect test files', () => {
      const testFileStructure: CodeGenerationResult[] = [
        {
          code: 'describe("Button", () => {});',
          filePath: 'Button.test.tsx',
        },
        {
          code: 'it("should work", () => {});',
          filePath: 'utils.spec.ts',
        },
      ];

      testConfig.structure = DirectoryStructure.Type;
      const result = fileOrganizer.organize(testFileStructure, testConfig);

      expect(result.directories.has('/test/output/__tests__')).toBe(true);
    });

    it('should detect component files by content', () => {
      const componentFiles: CodeGenerationResult[] = [
        {
          code: 'export const MyComp: React.FC = () => { return <div>Hi</div>; };',
          filePath: 'MyComp.tsx',
        },
        {
          code: 'class Button extends React.Component { render() { return <button/>; } }',
          filePath: 'Button.tsx',
        },
        {
          code: 'export default defineComponent({ template: "<div>Vue</div>" });',
          filePath: 'VueComp.ts',
        },
      ];

      testConfig.structure = DirectoryStructure.Type;
      const result = fileOrganizer.organize(componentFiles, testConfig);

      expect(result.directories.has('/test/output/components')).toBe(true);
      const components = result.directories.get('/test/output/components')!;
      expect(components).toHaveLength(3);
    });

    it('should detect hook files', () => {
      const hookFiles: CodeGenerationResult[] = [
        {
          code: 'export function useAuth() { return {}; }',
          filePath: 'auth.ts',
        },
        {
          code: 'export const useCustomHook = () => {};',
          filePath: 'customHook.ts',
        },
      ];

      testConfig.structure = DirectoryStructure.Type;
      const result = fileOrganizer.organize(hookFiles, testConfig);

      expect(result.directories.has('/test/output/hooks')).toBe(true);
    });

    it('should detect service files', () => {
      const serviceFiles: CodeGenerationResult[] = [
        {
          code: 'export class UserService { }',
          filePath: 'userService.ts',
        },
        {
          code: 'export const apiClient = {};',
          filePath: 'apiClient.ts',
        },
      ];

      testConfig.structure = DirectoryStructure.Type;
      const result = fileOrganizer.organize(serviceFiles, testConfig);

      expect(result.directories.has('/test/output/services')).toBe(true);
    });
  });

  describe('complex project structures', () => {
    it('should handle monorepo structure', () => {
      const monorepoFiles: CodeGenerationResult[] = [
        {
          code: 'export const Button = () => {};',
          filePath: 'packages/ui/src/components/Button.tsx',
        },
        {
          code: 'export const useAuth = () => {};',
          filePath: 'packages/auth/src/hooks/useAuth.ts',
        },
        {
          code: 'export const apiClient = {};',
          filePath: 'packages/core/src/services/api.ts',
        },
      ];

      testConfig.structure = DirectoryStructure.Mirror;
      testConfig.preserveStructure = true;

      const result = fileOrganizer.organize(monorepoFiles, testConfig);

      expect(result.directories.has('/test/output/packages/ui/src/components')).toBe(true);
      expect(result.directories.has('/test/output/packages/auth/src/hooks')).toBe(true);
      expect(result.directories.has('/test/output/packages/core/src/services')).toBe(true);
    });

    it('should handle Next.js app directory structure', () => {
      const nextjsFiles: CodeGenerationResult[] = [
        {
          code: 'export default function Page() { return <div>Home</div>; }',
          filePath: 'app/page.tsx',
        },
        {
          code: 'export default function Layout({ children }) { return children; }',
          filePath: 'app/layout.tsx',
        },
        {
          code: 'export default function Dashboard() { return <div>Dashboard</div>; }',
          filePath: 'app/dashboard/page.tsx',
        },
        {
          code: 'export const Button = () => {};',
          filePath: 'components/Button.tsx',
        },
      ];

      testConfig.structure = DirectoryStructure.Mirror;

      const result = fileOrganizer.organize(nextjsFiles, testConfig);

      expect(result.directories.has('/test/output/app')).toBe(true);
      expect(result.directories.has('/test/output/app/dashboard')).toBe(true);
      expect(result.directories.has('/test/output/components')).toBe(true);
    });

    it('should handle Angular module structure', () => {
      const angularFiles: CodeGenerationResult[] = [
        {
          code: '@NgModule({}) export class AppModule {}',
          filePath: 'src/app/app.module.ts',
        },
        {
          code: '@Component({}) export class UserComponent {}',
          filePath: 'src/app/features/user/user.component.ts',
        },
        {
          code: '@Injectable() export class UserService {}',
          filePath: 'src/app/features/user/user.service.ts',
        },
        {
          code: 'export class User {}',
          filePath: 'src/app/shared/models/user.model.ts',
        },
      ];

      testConfig.structure = DirectoryStructure.Mirror;

      const result = fileOrganizer.organize(angularFiles, testConfig);

      expect(result.directories.has('/test/output/src/app')).toBe(true);
      expect(result.directories.has('/test/output/src/app/features/user')).toBe(true);
      expect(result.directories.has('/test/output/src/app/shared/models')).toBe(true);
    });
  });

  describe('getOutputPath', () => {
    it('should get output path for a single source file', () => {
      const sourceFile = ts.createSourceFile(
        'src/components/Button.tsx',
        'export const Button = () => {};',
        ts.ScriptTarget.Latest,
        true
      );

      const outputPath = fileOrganizer.getOutputPath(sourceFile, testConfig);

      expect(outputPath).toBe('/test/output/src/components/Button.tsx');
    });
  });

  describe('structure visualization', () => {
    it('should generate tree structure visualization', () => {
      const result = fileOrganizer.organize(testFiles, testConfig);

      expect(result.structure).toBeDefined();
      expect(result.structure).toContain('src/');
      expect(result.structure).toContain('├── components/');
      expect(result.structure).toContain('├── hooks/');
      expect(result.structure).toContain('└── utils/');
      expect(result.structure).toContain('Button.tsx');
      expect(result.structure).toContain('useAuth.ts');
      expect(result.structure).toContain('constants.ts');
    });
  });

  describe('edge cases', () => {
    it('should handle empty file list', () => {
      const result = fileOrganizer.organize([], testConfig);

      expect(result.fileCount).toBe(0);
      expect(result.directories.size).toBe(0);
    });

    it('should handle files with no extension', () => {
      const files: CodeGenerationResult[] = [
        {
          code: '#!/usr/bin/env node',
          filePath: 'Dockerfile',
        },
        {
          code: 'FROM node:18',
          filePath: '.dockerignore',
        },
      ];

      const result = fileOrganizer.organize(files, testConfig);

      expect(result.fileCount).toBe(2);
    });

    it('should handle deeply nested structures', () => {
      const deepFiles: CodeGenerationResult[] = [
        {
          code: 'export const Deep = () => {};',
          filePath: 'src/features/user/profile/components/avatar/AvatarImage.tsx',
        },
      ];

      testConfig.structure = DirectoryStructure.Mirror;
      const result = fileOrganizer.organize(deepFiles, testConfig);

      expect(
        result.directories.has('/test/output/src/features/user/profile/components/avatar')
      ).toBe(true);
    });

    it('should handle special characters in file names', () => {
      testConfig.fileNaming = FileNamingConvention.KebabCase;

      const files: CodeGenerationResult[] = [
        {
          code: 'export const Component = () => {};',
          filePath: 'My Component (v2).tsx',
        },
        {
          code: 'export const Hook = () => {};',
          filePath: 'use@auth!hook.ts',
        },
      ];

      const result = fileOrganizer.organize(files, testConfig);
      const outputFiles = Array.from(result.directories.values()).flat();

      // Check that special characters are handled
      expect(outputFiles[0].filePath).toMatch(/my-component-v2\.tsx$/);
      expect(outputFiles[1].filePath).toMatch(/use-auth-hook\.ts$/);
    });
  });
});
