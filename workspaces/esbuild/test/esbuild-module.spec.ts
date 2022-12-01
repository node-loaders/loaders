import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { jestExpect as expect } from 'mocha-expect-snapshot';
import {
  detectFormatForEsbuildFileExtension,
  isEsbuildExtensionSupported,
  detectFormatForEsbuildFilePath,
  lookForEsbuildReplacementFile,
} from '../src/esbuild-module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commonjsExtensions = ['.cts'];
const esmExtensions = ['.mts'];
const supportedExtensions = ['.ts', '.tsx', ...commonjsExtensions, ...esmExtensions];

describe('esbuild-module', () => {
  describe('detectFormatForEsbuildFileExtension', () => {
    for (const commonjsExtension of commonjsExtensions) {
      it(`should return commonjs for ${commonjsExtension} extension`, () => {
        expect(detectFormatForEsbuildFileExtension(`file.${commonjsExtension}`)).toBe('commonjs');
      });
    }

    for (const esmExtension of esmExtensions) {
      it(`should return module for ${esmExtension} extension`, () => {
        expect(detectFormatForEsbuildFileExtension(`file.${esmExtension}`)).toBe('module');
      });
    }

    it('should return undefined not known extension', () => {
      expect(detectFormatForEsbuildFileExtension('file.foo')).toBe(undefined);
    });
  });

  describe('isEsbuildExtensionSupported', () => {
    for (const supportedExtension of supportedExtensions) {
      it(`should return true for ${supportedExtension} extension`, () => {
        expect(isEsbuildExtensionSupported(`file.${supportedExtension}`)).toBe(true);
      });
    }

    it('should return false not known extension', () => {
      expect(isEsbuildExtensionSupported('file.foo')).toBe(false);
    });
  });

  describe('detectFormatForEsbuildFilePath', () => {
    it('should return commonjs when nearest package.json type field is undefined', async () => {
      const module = join(__dirname, 'fixtures/detect-format/commonjs/module.cts');
      expect(await detectFormatForEsbuildFilePath(module)).toBe('commonjs');
    });
    it('should return the nearest package.json type field', async () => {
      const module = join(__dirname, 'fixtures/detect-format/esm/module.mts');
      expect(await detectFormatForEsbuildFilePath(module)).toBe('module');
    });
  });

  describe('lookForEsbuildReplacementFile', () => {
    it('should return ts file for js file', async () => {
      const module = join(__dirname, 'fixtures/detect-format/ts/module.js');
      expect(await lookForEsbuildReplacementFile(module)).toMatch(/module\.ts$/);
    });
    it('should return cts file for cjs file', async () => {
      const module = join(__dirname, 'fixtures/detect-format/commonjs/module.cjs');
      expect(await lookForEsbuildReplacementFile(module)).toMatch(/module\.cts$/);
    });
    it('should return mts file for mjs file', async () => {
      const module = join(__dirname, 'fixtures/detect-format/esm/module.mjs');
      expect(await lookForEsbuildReplacementFile(module)).toMatch(/module\.mts$/);
    });
  });
});
