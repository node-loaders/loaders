import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import {
  addMockedData,
  existsMockedData,
  useMockedData,
  deleteMockedData,
  addMockedSpecifier,
  globalStore,
  type MockStore,
  type MockedParentData,
  type CacheFlags,
} from '../src/support/module-cache.js';
import { fullMock, ignoreUnused } from '../src/symbols.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const existingCacheId = 'existingCacheId';
const existingSpecifier = 'existingSpecifier';
const nonExistingCacheId = 'nonExistingCacheId';
const nonExistingSpecifier = 'nonExistingSpecifier';

describe('module-cache', () => {
  let existingSpecifierData: MockedParentData & CacheFlags;
  let mockedStore: MockStore;

  afterEach(() => {
    delete globalStore.mocked;
  });

  beforeEach(() => {
    existingSpecifierData = {
      counter: 0,
      [ignoreUnused]: false,
      mock: {
        [fullMock]: false,
      },
    };

    mockedStore = {
      [existingCacheId]: {
        [existingSpecifier]: existingSpecifierData,
      },
    };

    globalStore.mocked = mockedStore;
  });

  describe('addMockedData', () => {
    describe('for esm modules', () => {
      it('should return the mocked named export', () => {
        const mockedFunction = () => {};
        const cacheId = addMockedData({ 'node:path': { join: mockedFunction } });

        const { mock } = mockedStore[cacheId]['node:path'];
        expect(mock.join).toBe(mockedFunction);
      });
      it('should return the mocked named default export', () => {
        const mockedFunction = () => {};
        const cacheId = addMockedData({ 'node:path': { default: mockedFunction } });

        const { mock } = mockedStore[cacheId]['node:path'];
        expect(mock.default).toBe(mockedFunction);
      });
    });
  });

  describe('existsMockedData', () => {
    it('should return true if the mocked module exists', () => {
      expect(existsMockedData(existingCacheId, existingSpecifier)).toBe(true);
    });
    it("should return false if the mocked module doesn't exist", () => {
      expect(existsMockedData(existingCacheId, nonExistingSpecifier)).toBe(false);
    });
    it("should return false if the cacheId doesn't exist", () => {
      expect(existsMockedData(nonExistingCacheId, existingSpecifier)).toBe(false);
    });
  });

  describe('useMockedData', () => {
    it('should increase the counter and get the mocked module', () => {
      const mockData = useMockedData(existingCacheId, existingSpecifier);
      expect(mockData).toBe(existingSpecifierData);
      expect(mockData.counter).toBe(1);
    });
  });

  describe('addMockedSpecifier', () => {
    it('should add a mocked data', () => {
      const specifier = 'bar';
      const target = {};
      addMockedSpecifier(existingCacheId, specifier, target);
      expect(mockedStore[existingCacheId][specifier].mock).toBe(target);
    });
  });

  describe('deleteMockedData', () => {
    it('should get the mocked module', () => {
      const cacheId = 'foo';
      mockedStore[cacheId] = {};
      expect(mockedStore[cacheId]).toBeTruthy();
      deleteMockedData(cacheId);
      expect(mockedStore[cacheId]).toBeUndefined();
    });
  });
});
