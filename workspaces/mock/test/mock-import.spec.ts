/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable unicorn/no-await-expression-member */
import process from 'node:process';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import { mock, checkMocks, checkMock, fullMock, ignoreUnused, maxDepth, emptyMock } from '@node-loaders/mock';

if (!global.before) {
  global.before = global.beforeAll;
}

describe('mock-import', () => {
  let join;
  let JestMock;
  let mockedData;

  beforeEach(() => {
    join = jestMock.fn();
    JestMock = jestMock.fn();
    mockedData = { 'node:path': { join }, '@node-loaders/test-samples': { fn: JestMock } };
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
      await mock<typeof import('./fixtures/esm/direct.mjs')>('./fixtures/esm/direct.mjs', { foo: { join } });
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
      const mockedFs = await mock<typeof import('./fixtures/esm/direct.mjs')>('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMock(mockedFs);
      }).toThrow(/^Unused mock, /);
    });
    it('should delete mocks', async () => {
      const mockedFs = await mock<typeof import('./fixtures/esm/direct.mjs')>('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMock(mockedFs);
      }).toThrow(/^Unused mock, /);
      checkMocks();
    });
    it('should delete mocks with param', async () => {
      const mockedFs = await mock<typeof import('./fixtures/esm/direct.mjs')>('./fixtures/esm/direct.mjs', { foo: { join } });
      expect(() => {
        checkMock(mockedFs, false);
      }).toThrow(/^Unused mock, /);
      expect(() => {
        checkMock(mockedFs);
      }).toThrow(/^Unused mock, /);
    });
    it('should not throw on ignoreUnused', async () => {
      const mockedFs = await mock<typeof import('./fixtures/esm/direct.mjs')>('./fixtures/esm/direct.mjs', {
        [ignoreUnused]: true,
        foo: { join },
      });
      checkMock(mockedFs);
    });
    it('should not throw on specific ignoreUnused', async () => {
      const mockedFs = await mock<typeof import('./fixtures/esm/direct.mjs')>('./fixtures/esm/direct.mjs', {
        foo: { [ignoreUnused]: true, join },
      });
      checkMock(mockedFs);
    });
  });

  describe('mock', () => {
    describe('using flag', () => {
      describe('fullMock', () => {
        it('should throw on non exported name', async () => {
          await expect(mock('./fixtures/esm/direct.mjs', { [ignoreUnused]: true, 'node:path': { [fullMock]: true } })).rejects.toThrow(
            /does not provide an export named 'join'/,
          );
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
          const mockedFs = await mock<typeof actual>('./fixtures/esm/direct.mjs', { [ignoreUnused]: true, foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
          expect(mockedFs.jestMockDefault.fn).toBe(actual.jestMock);
        });
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/esm/direct.mjs');
          const mockedFs = await mock<typeof actual>('./fixtures/esm/direct.mjs', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
          expect(mockedFs.jestMockDefault.fn).toBe(JestMock);
        });
        it('should accept factory', async () => {
          const actual = await import('./fixtures/esm/direct.mjs');
          const fn = jestMock.fn();
          const mockedFs = await mock<typeof actual>('./fixtures/esm/direct.mjs', {
            '@node-loaders/test-samples': () => ({ default: { fn }, fn }),
          });
          expect(mockedFs.jestMock).toBe(fn);
          expect(mockedFs.jestMockDefault.fn).toBe(fn);
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = await import('./fixtures/esm/indirect.mjs');
          const mockedFs = await mock<typeof actual>('./fixtures/esm/indirect.mjs', { ...mockedData, [maxDepth]: 2 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', async () => {
          const actual = await import('./fixtures/esm/indirect.mjs');
          const mockedFs = await mock<typeof actual>('./fixtures/esm/indirect.mjs', { ...mockedData, [ignoreUnused]: true });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = await import('./fixtures/esm/three-levels.mjs');
          const mockedFs = await mock<typeof actual>('./fixtures/esm/three-levels.mjs', { ...mockedData, [maxDepth]: 3 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', async () => {
          const actual = await import('./fixtures/esm/three-levels.mjs');
          const mockedFs = await mock<typeof actual>('./fixtures/esm/three-levels.mjs', {
            ...mockedData,
            [ignoreUnused]: true,
            [maxDepth]: 2,
          });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = await import('./fixtures/esm/four-levels.mjs');
          const mockedFs = await mock<typeof actual>('./fixtures/esm/four-levels.mjs', { ...mockedData, [maxDepth]: -1 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', async () => {
          const actual = await import('./fixtures/esm/four-levels.mjs');
          const mockedFs = await mock<typeof actual>('./fixtures/esm/four-levels.mjs', {
            ...mockedData,
            [ignoreUnused]: true,
            [maxDepth]: 3,
          });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
        });
      });
    });

    describe('javascript cjs modules', () => {
      before(function () {
        if (process.version.startsWith('v14')) {
          this.test!.parent!.pending = true;
          this.skip();
        }
      });

      describe('with direct mocked module', () => {
        it('should return the named export', async () => {
          const actual = await import('./fixtures/cjs/direct.cjs');
          const actualDefault = actual.default as any;
          const mockedFs = await mock('./fixtures/cjs/direct.cjs', { [ignoreUnused]: true, foo: { join } });
          expect(mockedFs.default).toBe(actualDefault);
          expect(mockedFs.default.join).toBe(actualDefault.join);
          expect(mockedFs.default.jestMock).toBe(actualDefault.jestMock);
        });
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/cjs/direct.cjs');
          const actualDefault = actual.default as any;
          const mockedFs = await mock('./fixtures/cjs/direct.cjs', mockedData);
          expect(mockedFs.default).toBe(actualDefault);
          expect(mockedFs.default.join).toBe(join);
          expect(mockedFs.default.jestMock).toBe(JestMock);
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = (await import('./fixtures/cjs/indirect.cjs')).default as any;
          const mockedFs = (await mock('./fixtures/cjs/indirect.cjs', { ...mockedData, [maxDepth]: 2 })).default;
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', async () => {
          const actual = (await import('./fixtures/cjs/indirect.cjs')).default as any;
          const mockedFs = (await mock('./fixtures/cjs/indirect.cjs', { ...mockedData, [ignoreUnused]: true })).default;
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = (await import('./fixtures/cjs/three-levels.cjs')).default as any;
          const mockedFs = (await mock('./fixtures/cjs/three-levels.cjs', { ...mockedData, [maxDepth]: 3 })).default;
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', async () => {
          const actual = (await import('./fixtures/cjs/three-levels.cjs')).default as any;
          const mockedFs = (await mock('./fixtures/cjs/three-levels.cjs', { ...mockedData, [ignoreUnused]: true, [maxDepth]: 2 })).default;
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = (await import('./fixtures/cjs/four-levels.cjs')).default as any;
          const mockedFs = (await mock('./fixtures/cjs/four-levels.cjs', { ...mockedData, [maxDepth]: -1 })).default;
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
        it('should return the original named export with non compatible maxDepth', async () => {
          const actual = (await import('./fixtures/cjs/four-levels.cjs')).default as any;
          const mockedFs = (await mock('./fixtures/cjs/four-levels.cjs', { ...mockedData, [ignoreUnused]: true, [maxDepth]: 3 })).default;
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
        });
      });
    });

    describe('typescript esm modules', () => {
      describe('with direct mocked module', () => {
        it('should return the named export', async () => {
          const actual = await import('./fixtures/ts-esm/direct.js');
          const mockedFs = await mock<typeof actual>('./fixtures/ts-esm/direct.js', { foo: { join } });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(actual.join);
          expect(mockedFs.jestMock).toBe(actual.jestMock);
          expect(() => {
            checkMock(mockedFs);
          }).toThrow();
        });
        it('should return the mocked named export', async () => {
          const actual = await import('./fixtures/ts-esm/direct.js');
          const mockedFs = await mock<typeof actual>('./fixtures/ts-esm/direct.js', mockedData);
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with indirect mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = await import('./fixtures/ts-esm/indirect.js');
          const mockedFs = await mock<typeof actual>('./fixtures/ts-esm/indirect.js', { ...mockedData, [maxDepth]: 2 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with 3 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = await import('./fixtures/ts-esm/three-levels.js');
          const mockedFs = await mock<typeof actual>('./fixtures/ts-esm/three-levels.js', { ...mockedData, [maxDepth]: 3 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
      describe('with 4 levels mocked module', () => {
        it('should return the mocked named export with compatible maxDepth', async () => {
          const actual = await import('./fixtures/ts-esm/four-levels.js');
          const mockedFs = await mock<typeof actual>('./fixtures/ts-esm/four-levels.js', { ...mockedData, [maxDepth]: -1 });
          expect(mockedFs.default).toBe(actual.default);
          expect(mockedFs.join).toBe(join);
          expect(mockedFs.jestMock).toBe(JestMock);
        });
      });
    });
  });
});
