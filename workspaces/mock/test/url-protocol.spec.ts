import { jestExpect as expect } from 'mocha-expect-snapshot';

import { parseProtocol, buildMockUrl } from '../src/support/url-protocol.js';

describe('mock-url', () => {
  describe('buildMockUrl', () => {
    it('should build a file url', () => {
      expect(buildMockUrl({ resolvedSpecifier: 'file://origin', cacheId: 'id', specifier: 'specifier' })).toMatchInlineSnapshot(
        `"file://origin/?%40node-loaders%2Fmocked-depth=1&%40node-loaders%2Fmocked-id=id&%40node-loaders%2Fmocked-specifier=specifier"`,
      );
    });
    it('should fail on bad mockOrigin', () => {
      expect(() => buildMockUrl({ resolvedSpecifier: 'foo', cacheId: 'id', specifier: 'specifier' })).toThrow();
    });
  });

  describe('parseProtocol', () => {
    const basicUrl = 'file://origin/?%40node-loaders%2Fmocked-id=id';

    it('should return undefined for missing cacheId', () => {
      expect(parseProtocol('file:///foo?%40node-loaders%2Fmocked-specifier=specifier')).toBeUndefined();
    });
    it('should throw for missing data', () => {
      expect(() => parseProtocol(basicUrl)).toThrow();
    });
    it('should parse an url', () => {
      const url = buildMockUrl({ resolvedSpecifier: 'file://origin', cacheId: 'id', specifier: 'specifier' });
      expect(parseProtocol(url)).toMatchInlineSnapshot(`
        {
          "cacheId": "id",
          "depth": 1,
          "resolvedSpecifier": "file://origin/",
          "specifier": "specifier",
        }
      `);
    });
  });
});
