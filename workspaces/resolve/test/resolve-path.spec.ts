import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { jestExpect as expect } from 'mocha-expect-snapshot';
import {
  existingFile,
  detectPackageJsonType,
  resolveAlternativeFile,
  lookForDefaultModule,
  resolvePackageJsonImports,
  specifierToFilePath,
} from '../src/resolve-path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('resolve-module', () => {
  describe('existingFile', () => {
    it('should return true for existing file', async () => {
      const filePath = join(__dirname, 'fixtures/foo.txt');
      expect(await existingFile(filePath)).toBe(filePath);
    });
    it('should return undefined for non existing file', async () => {
      const filePath = join(__dirname, 'fixtures/bar.txt');
      expect(await existingFile(filePath)).toBe(undefined);
    });
    it('should return undefined for directory', async () => {
      const filePath = join(__dirname, 'fixtures');
      expect(await existingFile(filePath)).toBe(undefined);
    });
  });

  describe('resolvePackageJsonImports', () => {
    it('should resolve imports', async () => {
      const module = join(__dirname, 'fixtures/detect-format/esm/module.mts');
      expect(await resolvePackageJsonImports('#local', module)).toMatch(/module.mjs$/);
    });
  });

  describe('detectFormatForEsbuildFilePath', () => {
    it('should return commonjs when nearest package.json type field is undefined', async () => {
      const module = join(__dirname, 'fixtures/detect-format/commonjs/module.cts');
      expect(await detectPackageJsonType(module)).toBe('commonjs');
    });
    it('should return the nearest package.json type field', async () => {
      const module = join(__dirname, 'fixtures/detect-format/esm/module.mts');
      expect(await detectPackageJsonType(module)).toBe('module');
    });
  });

  describe('resolveAlternativeFile', () => {
    it('should return alternative extension for file', async () => {
      const module = join(__dirname, 'fixtures/alternative-files/module.js');
      const alternativeFile = await resolveAlternativeFile(module, ['.unknown', '.bar', '.foo']);
      expect(alternativeFile).toEqual(join(__dirname, 'fixtures/alternative-files/module.bar'));
    });
  });

  describe('lookForDefaultModule', () => {
    it('should add extension to the non existing file', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index');
      expect(await lookForDefaultModule(module)).toBe(`${module}.js`);
    });
    it('should add index.js to the directory', async () => {
      const module = join(__dirname, 'fixtures/default-modules');
      expect(await lookForDefaultModule(module)).toBe(`${module}/index.js`);
    });
  });

  describe('specifierToFilePath', () => {
    it('should return the filePath for existing path', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      expect(specifierToFilePath(module)).toBe(module);
    });
    it('should return the filePath for url', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      expect(specifierToFilePath(pathToFileURL(module).href)).toBe(module);
    });
    it('should return the filePath for relative path and parent path', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      const parentUrl = pathToFileURL(join(__dirname, 'index.js')).href;
      expect(specifierToFilePath('./fixtures/default-modules/index.js', parentUrl)).toBe(module);
    });
    it('should return the filePath for relative path and parent url', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      const parentUrl = pathToFileURL(join(__dirname, 'index.js')).href;
      expect(specifierToFilePath('./fixtures/default-modules/index.js', parentUrl)).toBe(module);
    });
    it('should throw for relative path and no parent url', async () => {
      expect(() => specifierToFilePath('./fixtures/default-modules/index.js')).toThrow(/^Error resolving module/);
    });
  });
});
