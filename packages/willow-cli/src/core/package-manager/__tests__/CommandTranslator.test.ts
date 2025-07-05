/**
 * CommandTranslator Tests
 */

import { describe, it, expect } from 'vitest';
import { CommandTranslator } from '../CommandTranslator.js';

describe('CommandTranslator', () => {
  describe('translate', () => {
    it('should translate install command correctly', () => {
      const npm = CommandTranslator.translate('install', 'npm');
      expect(npm.command).toBe('npm');
      expect(npm.args).toEqual(['install']);

      const yarn = CommandTranslator.translate('install', 'yarn');
      expect(yarn.command).toBe('yarn');
      expect(yarn.args).toEqual(['install']);

      const pnpm = CommandTranslator.translate('install', 'pnpm');
      expect(pnpm.command).toBe('pnpm');
      expect(pnpm.args).toEqual(['install']);
    });

    it('should translate add-dev command with package names', () => {
      const npm = CommandTranslator.translate('add-dev', 'npm', ['typescript', '@types/node']);
      expect(npm.command).toBe('npm');
      expect(npm.args).toEqual(['install', '--save-dev', 'typescript', '@types/node']);

      const yarn = CommandTranslator.translate('add-dev', 'yarn', ['typescript']);
      expect(yarn.args).toEqual(['add', '--dev', 'typescript']);
    });

    it('should handle unknown commands gracefully', () => {
      const result = CommandTranslator.translate('unknown-command', 'npm', ['arg1']);
      expect(result.command).toBe('npm');
      expect(result.args).toEqual(['unknown-command', 'arg1']);
    });

    it('should translate workspace commands', () => {
      const npm = CommandTranslator.translate('workspace-add', 'npm', ['package-name']);
      expect(npm.args).toContain('-w');

      const pnpm = CommandTranslator.translate('workspace-add', 'pnpm', ['package-name']);
      expect(pnpm.args).toContain('--filter');
    });

    it('should translate install-ci for different package managers', () => {
      const npm = CommandTranslator.translate('install-ci', 'npm');
      expect(npm.args).toEqual(['ci']);

      const yarn = CommandTranslator.translate('install-ci', 'yarn');
      expect(yarn.args).toEqual(['install', '--frozen-lockfile']);

      const pnpm = CommandTranslator.translate('install-ci', 'pnpm');
      expect(pnpm.args).toEqual(['install', '--frozen-lockfile']);
    });
  });

  describe('buildCommandString', () => {
    it('should build complete command strings', () => {
      const npmAdd = CommandTranslator.buildCommandString('add', 'npm', ['lodash']);
      expect(npmAdd).toBe('npm install lodash');

      const yarnAddDev = CommandTranslator.buildCommandString('add-dev', 'yarn', ['jest', '@types/jest']);
      expect(yarnAddDev).toBe('yarn add --dev jest @types/jest');

      const pnpmRun = CommandTranslator.buildCommandString('run', 'pnpm', ['build']);
      expect(pnpmRun).toBe('pnpm run build');
    });
  });

  describe('getGenericCommands', () => {
    it('should return all available generic commands', () => {
      const commands = CommandTranslator.getGenericCommands();
      
      expect(commands).toContain('install');
      expect(commands).toContain('add');
      expect(commands).toContain('remove');
      expect(commands).toContain('run');
      expect(commands).toContain('build');
      expect(commands).toContain('test');
    });
  });

  describe('getCommandDescription', () => {
    it('should return command descriptions', () => {
      expect(CommandTranslator.getCommandDescription('install')).toBe('Install all dependencies');
      expect(CommandTranslator.getCommandDescription('add-dev')).toBe('Add a dev dependency');
      expect(CommandTranslator.getCommandDescription('unknown')).toBe('Execute unknown');
    });
  });
});