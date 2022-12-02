import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { getMockedModuleStore, addMockedData, globalCacheProperty, getMockedData, deleteMockedData } from '../src/module-cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('module-cache', () => {
  afterEach(() => {
    delete global[globalCacheProperty];
  });

  describe('getMockedModuleStore', () => {
    it('should create a store', () => {
      expect(getMockedModuleStore()).toBeTruthy();
    });
    it('should reuse globalCacheProperty store', () => {
      const globalProperty = {} as any;
      global[globalCacheProperty] = globalProperty;
      expect(getMockedModuleStore()).toBe(globalProperty.mocked);
    });
    it('should reuse the store', () => {
      const mocked = {};
      global[globalCacheProperty] = { mocked };
      expect(getMockedModuleStore()).toBe(mocked);
    });
  });

  describe('addMockedData', () => {
    describe('for esm modules', () => {
      it('should return the mocked named export', async () => {
        const mockedFunction = () => {};
        const cacheId = await addMockedData({ 'node:path': { join: mockedFunction } }, join(__dirname, './fixtures/esm/direct.mjs'));

        const { mock } = global[globalCacheProperty].mocked[cacheId]['node:path'];
        expect(mock.join).toBe(mockedFunction);
      });
      it('should return the mocked named default export', async () => {
        const mockedFunction = () => {};
        const cacheId = await addMockedData({ 'node:path': { default: mockedFunction } }, join(__dirname, './fixtures/esm/direct.mjs'));

        const { mock } = global[globalCacheProperty].mocked[cacheId]['node:path'];
        expect(mock.default).toBe(mockedFunction);
      });
    });
  });

  describe('getMockedData', () => {
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
      expect(getMockedData(cacheId, specifier)).toBe(target);
    });
  });

  describe('deleteMockedData', () => {
    it('should get the mocked module', () => {
      const cacheId = 'foo';
      global[globalCacheProperty] = {
        mocked: {
          [cacheId]: {},
        },
      };
      deleteMockedData(cacheId);
      expect(global[globalCacheProperty].mocked[cacheId]).toBe(undefined);
    });
  });
});
