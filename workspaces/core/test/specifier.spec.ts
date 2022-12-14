import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import {
  asCjsSpecifier,
  asEsmSpecifier,
  convertUrlDriveLetterToUpperCase,
  isBuiltinModule,
  isFileSpecifier,
  isNodeModulesSpecifier,
  isPackageSpecifier,
  specifierToFilePath,
} from '../src/specifier.js';

const builtinModulesToTest = [...builtinModules, ...builtinModules.map(builtinModule => `node:${builtinModule}`)];
const fileModulesToTest = ['.', '#', resolve('/foo'), pathToFileURL('/foo').href];
const packageModulesToTest = ['@foo/bar', '@foo/bar/exports', 'bar', 'bar/exports'];

describe('detect-module', () => {
  describe('isBuiltinModule', () => {
    for (const builtinModule of builtinModulesToTest) {
      it(`should return true for ${builtinModule}`, () => {
        expect(isBuiltinModule(builtinModule)).toBe(true);
      });
    }

    for (const nonBuiltinModule of [...fileModulesToTest, ...packageModulesToTest]) {
      it(`should return false for ${nonBuiltinModule}`, () => {
        expect(isBuiltinModule(nonBuiltinModule)).toBe(false);
      });
    }
  });

  describe('isFileSpecifier', () => {
    for (const fileModule of fileModulesToTest) {
      it(`should return true for ${fileModule}`, () => {
        expect(isFileSpecifier(fileModule)).toBe(true);
      });
    }

    for (const nonFileModule of [...builtinModulesToTest, ...packageModulesToTest]) {
      it(`should return false for ${nonFileModule}`, () => {
        expect(isFileSpecifier(nonFileModule)).toBe(false);
      });
    }
  });

  describe('isPackageSpecifier', () => {
    for (const packageModule of packageModulesToTest) {
      it(`should return true for ${packageModule}`, () => {
        expect(isPackageSpecifier(packageModule)).toBe(true);
      });
    }

    for (const nonPackageModule of [...builtinModulesToTest, ...fileModulesToTest]) {
      it(`should return false for ${nonPackageModule}`, () => {
        expect(isPackageSpecifier(nonPackageModule)).toBe(false);
      });
    }
  });

  describe('isNodeModulesSpecifier', () => {
    for (const nodeModulesSpecifier of ['/node_modules/', 'a/node_modules/b', 'a\\node_modules\\a', '\\\\node_modules\\\\']) {
      it(`should return true for ${nodeModulesSpecifier}`, () => {
        expect(isNodeModulesSpecifier(nodeModulesSpecifier)).toBe(true);
      });
    }

    for (const nonNodeModulesSpecifier of ['/anode_modules/', '/node_modulesb', 'anode_modulesb']) {
      it(`should return false for ${nonNodeModulesSpecifier}`, () => {
        expect(isNodeModulesSpecifier(nonNodeModulesSpecifier)).toBe(false);
      });
    }
  });

  describe('convertUrlDriveLetterToUpperCase', () => {
    it('converts drive letter to upper case', () => {
      expect(convertUrlDriveLetterToUpperCase('file:///c:')).toEqual('file:///C:');
    });
    it("don't touch others urls", () => {
      expect(convertUrlDriveLetterToUpperCase('file:///c')).toEqual('file:///c');
    });
  });

  describe('specifierToFilePath', () => {
    it('should return the filePath for existing path', async () => {
      const module = resolve('fixtures/default-modules/index.js');
      expect(specifierToFilePath(module)).toBe(module);
    });
    it('should return the filePath for url', async () => {
      const module = resolve('fixtures/default-modules/index.js');
      expect(specifierToFilePath(pathToFileURL(module).href)).toBe(module);
    });
    it('should return the filePath for relative path and parent path', async () => {
      const module = resolve('fixtures/default-modules/index.js');
      const parentUrl = pathToFileURL(resolve('index.js')).href;
      expect(specifierToFilePath('./fixtures/default-modules/index.js', parentUrl)).toBe(module);
    });
    it('should return the filePath for relative path and parent url', async () => {
      const module = resolve('fixtures/default-modules/index.js');
      const parentUrl = pathToFileURL(resolve('index.js')).href;
      expect(specifierToFilePath('./fixtures/default-modules/index.js', parentUrl)).toBe(module);
    });
    it('should throw for relative path and no parent url', async () => {
      expect(() => specifierToFilePath('./fixtures/default-modules/index.js')).toThrow(/^Error resolving module/);
    });
  });

  describe('asCjsSpecifier', () => {
    it('should convert file url to path', () => {
      const path = resolve('/foo');
      expect(asCjsSpecifier(pathToFileURL(path).href)).toBe(path);
    });
    it('should node protocol to module', () => {
      expect(asCjsSpecifier('node:path')).toBe('path');
    });
    it('should passthrough others protocols', () => {
      expect(asCjsSpecifier('jest-mock')).toBe('jest-mock');
    });
  });

  describe('asEsmSpecifier', () => {
    it('should convert path to file url', () => {
      const path = resolve('/foo');
      expect(asEsmSpecifier(path)).toBe(pathToFileURL(path).href);
    });
    it('should node protocol to module', () => {
      expect(asEsmSpecifier('path')).toBe('node:path');
    });
    it('should passthrough others protocols', () => {
      expect(asEsmSpecifier('jest-mock')).toBe('jest-mock');
    });
  });
});
