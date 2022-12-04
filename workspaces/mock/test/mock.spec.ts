import { jestExpect as expect } from 'mocha-expect-snapshot';

import { mock } from '../src/mock.js';
import { globalCacheProperty } from '../src/module-cache.js';

describe('mock', () => {
  afterEach(() => {
    delete global[globalCacheProperty];
  });

  describe('mock', () => {
    describe('javascript esm modules', () => {
      describe('with direct mocked module', () => {
        it('should return the named export', async () => {
          const join = {};
          const actual = await import('./fixtures/esm/direct.mjs');
          const mockedFs = await mock('./fixtures/esm/direct.mjs', { foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
        });
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/esm/direct.mjs');
          const mockedFs = await mock('./fixtures/esm/direct.mjs', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/esm/indirect.mjs');
          const mockedFs = await mock('./fixtures/esm/indirect.mjs', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/esm/three-levels.mjs');
          const mockedFs = await mock('./fixtures/esm/three-levels.mjs', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/esm/four-levels.mjs');
          const mockedFs = await mock('./fixtures/esm/four-levels.mjs', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
    });

    describe('typescript esm modules', () => {
      describe('with direct mocked module', () => {
        it('should return the named export', async () => {
          const join = {};
          const actual = await import('./fixtures/ts-esm/direct.js');
          const mockedFs = await mock('./fixtures/ts-esm/direct.js', { foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
        });
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/ts-esm/direct.js');
          const mockedFs = await mock('./fixtures/ts-esm/direct.js', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/ts-esm/indirect.js');
          const mockedFs = await mock('./fixtures/ts-esm/indirect.js', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/ts-esm/three-levels.js');
          const mockedFs = await mock('./fixtures/ts-esm/three-levels.js', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const join = {};
          const actual = await import('./fixtures/ts-esm/four-levels.js');
          const mockedFs = await mock('./fixtures/ts-esm/four-levels.js', { 'node:path': { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
        });
      });
    });
  });
});
