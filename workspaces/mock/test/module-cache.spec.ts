import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { getMockStore, addCachedMock, globalCacheProperty, getCachedMock, extractCachedMock } from '../src/module-cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('module-cache', () => {
  afterEach(() => {
    delete global[globalCacheProperty];
  });

  describe('getMockStore', () => {
    it('should create a store', () => {
      expect(getMockStore()).toBeTruthy();
    });
    it('should reuse globalCacheProperty store', () => {
      const globalProperty = {} as any;
      global[globalCacheProperty] = globalProperty;
      expect(getMockStore()).toBe(globalProperty.mocked);
    });
    it('should reuse the store', () => {
      const mocked = {};
      global[globalCacheProperty] = { mocked };
      expect(getMockStore()).toBe(mocked);
    });
  });

  describe('addCachedMock', () => {
    describe('for esm modules', () => {
      it('should return the mocked named export', async () => {
        const mockedFunction = () => {};
        const actual = await import('./fixtures/esm/module.mjs');
        const cacheId = await addCachedMock({ 'node:path': { join: mockedFunction } }, join(__dirname, './fixtures/esm/module.mjs'));

        const { merged } = global[globalCacheProperty].mocked[cacheId]['node:path'];
        expect(merged.join).toBe(mockedFunction);
        expect(merged.join).not.toBe(actual.join);
      });
      it('should return the mocked named default export', async () => {
        const mockedFunction = () => {};
        const actual = await import('./fixtures/esm/module.mjs');
        const cacheId = await addCachedMock({ 'node:path': { default: mockedFunction } }, join(__dirname, './fixtures/esm/module.mjs'));

        const { merged } = global[globalCacheProperty].mocked[cacheId]['node:path'];
        expect(merged.default).toBe(mockedFunction);
        expect(merged.default).not.toBe(actual.default);
      });
    });
  });

  describe('getCachedMock', () => {
    it('should get the mocked module', () => {
      const cacheId = 'foo';
      const specifier = 'bar';
      const target = {};
      global[globalCacheProperty] = {
        mocked: {
          [cacheId]: {
            [specifier]: target,
          },
        },
      };
      expect(getCachedMock(cacheId, specifier)).toBe(target);
    });
  });
});
