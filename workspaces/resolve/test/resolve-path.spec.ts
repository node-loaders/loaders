import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { jestExpect as expect } from 'mocha-expect-snapshot';
import { existingFile, lookForAlternativeFiles, lookForDefaultModule, resolvePath } from '../src/resolve-path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('resolve-module', () => {
  describe('isFileModule', () => {
    it('should return true for existing file', async () => {
      const filePath = join(__dirname, 'fixtures/foo.txt');
      expect(await existingFile(filePath)).toBe(filePath);
    });
    it('should return false for non existing file', async () => {
      const filePath = join(__dirname, 'fixtures/bar.txt');
      expect(await existingFile(filePath)).toBe(undefined);
    });
  });

  describe('lookForAlternativeFiles', () => {
    it('should return alternative extension for file', async () => {
      const module = join(__dirname, 'fixtures/alternative-files/module.js');
      const alternativeFiles = await lookForAlternativeFiles(module);
      const relativeFiles = alternativeFiles.map(alternative => relative(dirname(module), alternative));
      expect(relativeFiles).toEqual(['module.bar', 'module.foo', 'module.js']);
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

  describe('resolvePath', () => {
    it('should return the filePath for existing path', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      expect(await resolvePath(module)).toBe(module);
    });
    it('should return the filePath for url', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      expect(await resolvePath(pathToFileURL(module).href)).toBe(module);
    });
    it('should return the filePath for relative path and parent path', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      const parentUrl = join(__dirname, 'index.js');
      expect(await resolvePath('./fixtures/default-modules/index.js', parentUrl)).toBe(module);
    });
    it('should return the filePath for relative path and parent url', async () => {
      const module = join(__dirname, 'fixtures/default-modules/index.js');
      const parentUrl = pathToFileURL(join(__dirname, 'index.js')).href;
      expect(await resolvePath('./fixtures/default-modules/index.js', parentUrl)).toBe(module);
    });
  });
});
