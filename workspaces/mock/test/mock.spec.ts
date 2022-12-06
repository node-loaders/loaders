import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import { mock, checkMocks, checkMock } from '../src/mock.js';
import { emptyMock, ignoreCounterCheck } from '../src/symbols-internal.js';
import { fullMock } from '../src/symbols.js';

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
    checkMocks();
  });

  describe('checkMocks', () => {
    it('should throw on unused mock', async () => {
      await mock('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMocks();
      }).toThrow(/^Unused mock, /);
    });
    it('should delete mocks', async () => {
      await mock('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMocks();
      }).toThrow(/^Unused mock, /);
      checkMocks();
    });
    it('should delete mocks with param', async () => {
      await mock('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMocks(false);
      }).toThrow(/^Unused mock, /);
      expect(() => {
        checkMocks();
      }).toThrow(/^Unused mock, /);
    });
  });

  describe('checkMock', () => {
    it('should throw on not mock', async () => {
      expect(() => {
        checkMock({});
      }).toThrow('Passed module is not a mocked module');
    });
    it('should throw on unused mock', async () => {
      const mockedFs = await mock('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMock(mockedFs);
      }).toThrow(/^Unused mock, /);
    });
    it('should delete mocks', async () => {
      const mockedFs = await mock('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMock(mockedFs);
      }).toThrow(/^Unused mock, /);
      checkMocks();
    });
    it('should delete mocks with param', async () => {
      const mockedFs = await mock('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMock(mockedFs, false);
      }).toThrow(/^Unused mock, /);
      expect(() => {
        checkMock(mockedFs);
      }).toThrow(/^Unused mock, /);
    });
    it('should not throw on ignoreCounterCheck', async () => {
      const mockedFs = await mock('./fixtures/esm/direct.mjs', { [ignoreCounterCheck]: true, foo: { join } });
      checkMock(mockedFs);
    });
    it('should not throw on specific ignoreCounterCheck', async () => {
      const mockedFs = await mock('./fixtures/esm/direct.mjs', { foo: { [ignoreCounterCheck]: true, join } });
      checkMock(mockedFs);
    });
  });

  describe('mock', () => {
    describe('using flag', () => {
      describe('fullMock', () => {
        it('should throw on non exported name', async () => {
          await expect(
            mock('./fixtures/esm/direct.mjs', { [ignoreCounterCheck]: true, 'node:path': { [fullMock]: true } }),
          ).rejects.toThrow(/does not provide an export named 'join'/);
        });
      });
      describe('emptyMock', () => {
        it('should return the original module', async () => {
          const actual = await import('./fixtures/esm/direct.mjs');
          const mockedFs = await mock('./fixtures/esm/direct.mjs', {
            'node:path': { [emptyMock]: true, join },
          });
          expect(mockedFs.join).toBe(actual.join);
        });
      });
    });
    describe('javascript esm modules', () => {
      describe('with direct mocked module', () => {
        it('should return the named export', async () => {
          const actual = await import('./fixtures/esm/direct.mjs');
          const mockedFs = await mock('./fixtures/esm/direct.mjs', { [ignoreCounterCheck]: true, foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
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
          expect(mockedFs.jestMock).toBe(actual.jestMock);
          expect(() => {
            checkMock(mockedFs);
          }).toThrow();
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
