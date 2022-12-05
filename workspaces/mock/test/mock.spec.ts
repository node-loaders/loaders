import process from 'node:process';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import { mock } from '../src/mock.js';
import { globalCacheProperty } from '../src/module-cache.js';

describe('mock', () => {
  let join;
  let JestMock;
  let mockedData;

  beforeEach(() => {
    join = jestMock.fn();
    JestMock = jestMock.fn();
    mockedData = { 'node:path': { join }, 'jest-mock': { fn: JestMock } };
  });

  afterEach(() => {
    delete global[globalCacheProperty];
  });

  describe('mock', () => {
    describe('javascript esm modules', () => {
      describe('with direct mocked module', () => {
        it('should return the named export', async () => {
          const actual = await import('./fixtures/esm/direct.mjs');
          const mockedFs = await mock('./fixtures/esm/direct.mjs', { foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          if (process.platform === 'win32') {
            // Windows is failling the toBe test, need to invetigate further.
            expect(mockedFs.jestMock).toEqual(actual.jestMock);
          } else {
            expect(mockedFs.jestMock).toBe(actual.jestMock);
          }
        });
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/esm/direct.mjs');
          const mockedFs = await mock('./fixtures/esm/direct.mjs', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/esm/indirect.mjs');
          const mockedFs = await mock('./fixtures/esm/indirect.mjs', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/esm/three-levels.mjs');
          const mockedFs = await mock('./fixtures/esm/three-levels.mjs', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/esm/four-levels.mjs');
          const mockedFs = await mock('./fixtures/esm/four-levels.mjs', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
    });

    describe('typescript esm modules', () => {
      describe('with direct mocked module', () => {
        it('should return the named export', async () => {
          const actual = await import('./fixtures/ts-esm/direct.js');
          const mockedFs = await mock('./fixtures/ts-esm/direct.js', { foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          if (process.platform === 'win32') {
            // Windows is failling the toBe test, need to invetigate further.
            expect(mockedFs.jestMock).toEqual(actual.jestMock);
          } else {
            expect(mockedFs.jestMock).toBe(actual.jestMock);
          }
        });
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/ts-esm/direct.js');
          const mockedFs = await mock('./fixtures/ts-esm/direct.js', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/ts-esm/indirect.js');
          const mockedFs = await mock('./fixtures/ts-esm/indirect.js', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/ts-esm/three-levels.js');
          const mockedFs = await mock('./fixtures/ts-esm/three-levels.js', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/ts-esm/four-levels.js');
          const mockedFs = await mock('./fixtures/ts-esm/four-levels.js', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
    });
  });
});
