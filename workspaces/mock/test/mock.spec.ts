import { jestExpect as expect } from 'mocha-expect-snapshot';

import { importMocked } from '../src/mock.js';
import { globalCacheProperty } from '../src/module-cache.js';

describe('mock', () => {
  afterEach(() => {
    delete global[globalCacheProperty];
  });

  describe('importMocked', () => {
    describe('for esm modules', () => {
      it('should return the mocked named export', async () => {
        const join = {};
        const actual = await import('./fixtures/esm/direct.mjs');
        const mockedFs = await importMocked('./fixtures/esm/direct.mjs', { 'node:path': { join } });
        expect(mockedFs.default).toBe(actual.default);
        expect(mockedFs.join).toBe(join);
      });
    });
    describe('for indirect esm modules', () => {
      it('should return the mocked named export', async () => {
        const join = {};
        const actual = await import('./fixtures/esm/indirect.mjs');
        const mockedFs = await importMocked('./fixtures/esm/indirect.mjs', { 'node:path': { join } });
        expect(mockedFs.default).toBe(actual.default);
        expect(mockedFs.join).toBe(join);
      });
    });
  });
});
