import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { ConfigFileLoader } from './loader';
import path from 'path';
import os from 'os';

describe('ConfigFileLoader', () => {
  let tempDir: string;
  let loader: ConfigFileLoader;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));
    loader = new ConfigFileLoader({ cwd: tempDir });
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('JSON loading', () => {
    it('should load valid JSON config', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const config = { name: 'test', version: '1.0.0' };
      
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      
      const loaded = await loader.load('config.json');
      expect(loaded).toEqual(config);
    });
    
    it('should throw on invalid JSON', async () => {
      const configPath = path.join(tempDir, 'config.json');
      await fs.writeFile(configPath, '{ invalid json }');
      
      await expect(loader.load('config.json')).rejects.toThrow();
    });
  });
  
  describe('YAML loading', () => {
    it('should load valid YAML config', async () => {
      const configPath = path.join(tempDir, 'config.yaml');
      const config = `
name: test
version: 1.0.0
features:
  - feature1
  - feature2
`;
      
      await fs.writeFile(configPath, config);
      
      const loaded = await loader.load('config.yaml');
      expect(loaded).toEqual({
        name: 'test',
        version: '1.0.0',
        features: ['feature1', 'feature2'],
      });
    });
    
    it('should support .yml extension', async () => {
      const configPath = path.join(tempDir, 'config.yml');
      await fs.writeFile(configPath, 'name: test');
      
      const loaded = await loader.load('config.yml');
      expect(loaded).toEqual({ name: 'test' });
    });
  });
  
  describe('JavaScript loading', () => {
    it('should load ES module config', async () => {
      const configPath = path.join(tempDir, 'config.mjs');
      const config = `
export default {
  name: 'test',
  version: '1.0.0',
  computed: 1 + 1
};
`;
      
      await fs.writeFile(configPath, config);
      
      const loaded = await loader.load('config.mjs');
      expect(loaded).toEqual({
        name: 'test',
        version: '1.0.0',
        computed: 2,
      });
    });
    
    it('should load CommonJS config', async () => {
      const configPath = path.join(tempDir, 'config.cjs');
      const config = `
module.exports = {
  name: 'test',
  version: '1.0.0'
};
`;
      
      await fs.writeFile(configPath, config);
      
      const loaded = await loader.load('config.cjs');
      expect(loaded).toEqual({
        name: 'test',
        version: '1.0.0',
      });
    });
  });
  
  describe('Caching', () => {
    it('should cache loaded configs', async () => {
      const cachedLoader = new ConfigFileLoader({ cwd: tempDir, cache: true });
      const configPath = path.join(tempDir, 'config.json');
      const config = { name: 'test', version: '1.0.0' };
      
      await fs.writeFile(configPath, JSON.stringify(config));
      
      // First load
      const loaded1 = await cachedLoader.load('config.json');
      
      // Modify file
      config.version = '2.0.0';
      await fs.writeFile(configPath, JSON.stringify(config));
      
      // Second load should return cached value
      const loaded2 = await cachedLoader.load('config.json');
      expect(loaded2).toEqual({ name: 'test', version: '1.0.0' });
      
      // Clear cache and reload
      cachedLoader.clearCache();
      const loaded3 = await cachedLoader.load('config.json');
      expect(loaded3).toEqual({ name: 'test', version: '2.0.0' });
    });
  });
  
  describe('Error handling', () => {
    it('should throw for unsupported formats', async () => {
      await expect(loader.load('config.xyz')).rejects.toThrow(
        'Unsupported configuration format: .xyz'
      );
    });
    
    it('should throw for non-existent files', async () => {
      await expect(loader.load('non-existent.json')).rejects.toThrow();
    });
  });
  
  describe('Custom loaders', () => {
    it('should support custom loaders', async () => {
      const customLoader = new ConfigFileLoader({
        cwd: tempDir,
        loaders: {
          ini: async (filepath) => {
            const content = await fs.readFile(filepath, 'utf-8');
            // Simple INI parser
            const result: Record<string, string> = {};
            content.split('\n').forEach(line => {
              const [key, value] = line.split('=');
              if (key && value) {
                result[key.trim()] = value.trim();
              }
            });
            return result;
          },
        },
      });
      
      const configPath = path.join(tempDir, 'config.ini');
      await fs.writeFile(configPath, 'name=test\nversion=1.0.0');
      
      const loaded = await customLoader.load('config.ini');
      expect(loaded).toEqual({
        name: 'test',
        version: '1.0.0',
      });
    });
  });
});