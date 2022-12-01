import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import { isBuiltinModule, isFileModule, isPackageMapping } from '../src/detect-module.js';

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

  describe('isFileModule', () => {
    for (const fileModule of fileModulesToTest) {
      it(`should return true for ${fileModule}`, () => {
        expect(isFileModule(fileModule)).toBe(true);
      });
    }

    for (const nonFileModule of [...builtinModulesToTest, ...packageModulesToTest]) {
      it(`should return false for ${nonFileModule}`, () => {
        expect(isFileModule(nonFileModule)).toBe(false);
      });
    }
  });

  describe('isPackageMapping', () => {
    for (const packageModule of packageModulesToTest) {
      it(`should return true for ${packageModule}`, () => {
        expect(isPackageMapping(packageModule)).toBe(true);
      });
    }

    for (const nonPackageModule of [...builtinModulesToTest, ...fileModulesToTest]) {
      it(`should return false for ${nonPackageModule}`, () => {
        expect(isPackageMapping(nonPackageModule)).toBe(false);
      });
    }
  });
});
