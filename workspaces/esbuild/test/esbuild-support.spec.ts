import { jestExpect as expect } from 'mocha-expect-snapshot';
import { existingFile } from '@node-loaders/resolve';
import {
  detectFormatForEsbuildFileExtension,
  isEsbuildExtensionSupported,
  lookForEsbuildReplacementFile,
  lookForEsbuildReplacementFileSync,
} from '../src/esbuild-support.js';
import { resolvePackage, resolveNonExisting } from '../../test/src/index.js';

const commonjsExtensions = ['.cts'];
const esmExtensions = ['.mts'];
const supportedExtensions = ['.ts', '.tsx', ...commonjsExtensions, ...esmExtensions];

describe('esbuild-support', () => {
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

  describe('lookForEsbuildReplacementFile', () => {
    it('should return ts file for js file', async () => {
      const module = resolvePackage('ts-esm-simple/simple.js');
      expect(await lookForEsbuildReplacementFile(module)).toMatch(/simple\.ts$/);
    });
    it('should return cts file for cjs file', async () => {
      const module = resolvePackage('cts-simple/simple.cjs');
      expect(await lookForEsbuildReplacementFile(module)).toMatch(/simple\.cts$/);
    });
    it('should return mts file for mjs file', async () => {
      const module = resolvePackage('mts-simple/simple.mjs');
      expect(await lookForEsbuildReplacementFile(module)).toMatch(/simple\.mts$/);
    });
    it('should return undefined for non existing alternative', async () => {
      const module = resolveNonExisting('esm/non-existing.mjs');
      expect(await lookForEsbuildReplacementFile(module)).toBeUndefined();
    });
    it('should return undefined for unknown mapping', async () => {
      const module = resolvePackage('ts-esm-simple/package.json');
      expect(existingFile(module)).toBeTruthy();
      expect(await lookForEsbuildReplacementFile(module)).toBeUndefined();
    });
  });

  describe('lookForEsbuildReplacementFileSync', () => {
    it('should return ts file for js file', () => {
      const module = resolvePackage('ts-esm-simple/simple.js');
      expect(lookForEsbuildReplacementFileSync(module)).toMatch(/simple\.ts$/);
    });
    it('should return cts file for cjs file', () => {
      const module = resolvePackage('cts-simple/simple.cjs');
      expect(lookForEsbuildReplacementFileSync(module)).toMatch(/simple\.cts$/);
    });
    it('should return mts file for mjs file', () => {
      const module = resolvePackage('mts-simple/simple.mjs');
      expect(lookForEsbuildReplacementFileSync(module)).toMatch(/simple\.mts$/);
    });
    it('should return undefined for non existing alternative', () => {
      const module = resolveNonExisting('esm/non-existing.mjs');
      expect(lookForEsbuildReplacementFileSync(module)).toBeUndefined();
    });
    it('should return undefined for unknown mapping', () => {
      const module = resolvePackage('ts-esm-simple/package.json');
      expect(existingFile(module)).toBeTruthy();
      expect(lookForEsbuildReplacementFileSync(module)).toBeUndefined();
    });
  });
});
