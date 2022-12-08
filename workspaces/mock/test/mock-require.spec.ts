import { createRequire } from 'node:module';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import { mockRequire } from '../src/mock-require.js';
import { checkMocks, checkMock } from '../src/mock-check.js';
import { emptyMock } from '../src/support/symbols-internal.js';
import { fullMock, ignoreUnused, maxDepth } from '../src/symbols.js';

const require = createRequire(import.meta.url);

describe('mock-require', () => {
  let join;
  let resolve;
  let JestMock;
  let mockedData;

  beforeEach(() => {
    join = jestMock.fn();
    resolve = jestMock.fn();
    JestMock = jestMock.fn();
    mockedData = { path: { join, resolve }, 'jest-mock': { fn: JestMock } };
  });

  afterEach(() => {
    checkMocks(false);
  });

  describe('mockRequire', () => {
    describe('using flag', () => {
      describe('fullMock', () => {
        it('should throw on non exported name', () => {
          expect(mockRequire('./fixtures/cjs/direct.cjs', { [ignoreUnused]: true, path: { [fullMock]: true, resolve: {} } })).toMatchObject(
            {
              jestMock: expect.any(Function),
              join: undefined,
            },
          );
        });
      });
      describe('emptyMock', () => {
        it('should return the original module', () => {
          const actual = require('./fixtures/cjs/direct.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/direct.cjs', {
            path: { [emptyMock]: true, join },
          });
          expect(mockedFs.join).toBe(actual.join);
        });
      });
    });
    describe('javascript cjs modules', () => {
      describe('with direct mocked module', () => {
        it('should return the named export', () => {
          const actual = require('./fixtures/cjs/direct.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/direct.cjs', { [ignoreUnused]: true, foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
        });
        it('the mocked module should execute the mocked module', () => {
          const mockedFs = mockRequire('./fixtures/cjs/direct.cjs', { path: { join: {} } });
          mockedFs();
          expect(resolve).not.toBeCalled();
        });
        it('should return the mocked named export', () => {
          const actual = require('./fixtures/cjs/direct.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/direct.cjs', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('the mocked module should execute the mocked module', () => {
          const mockedFs = mockRequire('./fixtures/cjs/direct.cjs', mockedData);
          mockedFs();
          expect(resolve).toBeCalled();
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', () => {
          const actual = require('./fixtures/cjs/indirect.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/indirect.cjs', { ...mockedData, [maxDepth]: 2 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', () => {
          const actual = require('./fixtures/cjs/indirect.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/indirect.cjs', { ...mockedData, [ignoreUnused]: true });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', () => {
          const actual = require('./fixtures/cjs/three-levels.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/three-levels.cjs', { ...mockedData, [maxDepth]: 3 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', () => {
          const actual = require('./fixtures/cjs/three-levels.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/three-levels.cjs', { ...mockedData, [ignoreUnused]: true, [maxDepth]: 2 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', () => {
          const actual = require('./fixtures/cjs/four-levels.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/four-levels.cjs', { ...mockedData, [maxDepth]: -1 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', () => {
          const actual = require('./fixtures/cjs/four-levels.cjs');
          const mockedFs = mockRequire('./fixtures/cjs/four-levels.cjs', { ...mockedData, [ignoreUnused]: true, [maxDepth]: 3 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
        });
      });
    });
  });
});
