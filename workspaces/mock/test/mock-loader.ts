import { randomUUID } from 'node:crypto';
import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock, { type Mock as JestMock } from 'jest-mock';

import { globalCacheProperty } from '../src/module-cache.js';
import { buildMockedSpecifierUrl } from '../src/url-protocol.js';

describe('mock-loader', () => {
  describe('load', () => {
    let cacheId;
    let mockedJoin;
    let mockedDefault: JestMock;
    let specifier;

    beforeEach(() => {
      cacheId = randomUUID();
      mockedJoin = jestMock.fn();
      mockedDefault = jestMock.fn();
      specifier = 'node:path';

      global[globalCacheProperty] = {
        mocked: {
          [cacheId]: {
            [specifier]: {
              merged: {
                default: mockedDefault,
                join: mockedJoin,
                bar: jestMock.fn(),
              },
            },
          },
        },
      };
    });

    afterEach(() => {
      delete global[globalCacheProperty];
    });

    it('should import the mocked module with exported name', async () => {
      const mockUrl = buildMockedSpecifierUrl({
        cacheId,
        // ParentSpecifier,
        specifier,
        // ResolvedSpecifier,
      } as any);
      const mockedModule = await import(mockUrl);
      expect(mockedModule.join).toBe(mockedJoin);
    });
    it('should import the mocked module with default export', async () => {
      const mockUrl = buildMockedSpecifierUrl({
        cacheId,
        // ParentSpecifier,
        specifier,
        // ResolvedSpecifier,
      } as any);
      const mockedModule = await import(mockUrl);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mockedModule.default();
      expect(mockedDefault).toBeCalled();
    });
  });
});
