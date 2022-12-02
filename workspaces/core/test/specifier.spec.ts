import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import { isBuiltinModule, isFileSpecifier, isPackageSpecifier } from '../src/specifier.js';

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
});