import { dirname, join as pathJoin } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { importAndMergeModule, getNamedExports } from '../src/module-mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('module-merge', () => {
  describe('importAndMergeModule', () => {
    describe('for builtin module', () => {
      it('should return the mocked named export function', async () => {
        const mockedFunction = () => {};
        const mockedFs = await importAndMergeModule('fs', { join: mockedFunction });
        expect(mockedFs.join).toBe(mockedFunction);
        expect(mockedFs.join).not.toBe(pathJoin);
      });
    });

    describe('for esm modules', () => {
      it('should return the mocked named export', async () => {
        const mockedFunction = () => {};
        const actual = await import('./fixtures/esm/direct.mjs');
        const mockedFs = await importAndMergeModule(pathToFileURL(pathJoin(__dirname, './fixtures/esm/direct.mjs')).href, {
          join: mockedFunction,
        });
        expect(mockedFs.join).toBe(mockedFunction);
        expect(mockedFs.join).not.toBe(actual.join);
      });
      it('should return the mocked named default export', async () => {
        const mockedFunction = () => {};
        const actual = await import('./fixtures/esm/direct.mjs');
        const mockedFs = await importAndMergeModule(pathToFileURL(pathJoin(__dirname, './fixtures/esm/direct.mjs')).href, {
          default: mockedFunction,
        });
        expect(mockedFs.default).toBe(mockedFunction);
        expect(mockedFs.default).not.toBe(actual.default);
      });
    });
  });

  describe('getNamedExports', () => {
    describe('for mocked esm modules', () => {
      it('should return the mocked named export function', async () => {
        const mockedFunction = () => {};
        const mockedFs = await importAndMergeModule(pathToFileURL(pathJoin(__dirname, './fixtures/esm/direct.mjs')).href, {
          join: mockedFunction,
        });
        expect(getNamedExports(mockedFs)).toEqual(['default', 'join']);
      });
    });
    describe('for native esm modules', () => {
      it('should return the mocked named export function', async () => {
        const mockedFs = await import('./fixtures/esm/direct.mjs');
        expect(getNamedExports(mockedFs)).toEqual(['default', 'join']);
      });
    });
  });
});
