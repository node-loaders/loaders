import { jestExpect as expect } from 'mocha-expect-snapshot';

import { buildMockedOriginUrl, buildMockedSpecifierUrl, parseProtocol, buildUrl } from '../src/support/url-protocol.js';

describe('mock-url', () => {
  describe('buildMockedOriginUrl', () => {
    it('should build a file url', () => {
      expect(buildMockedOriginUrl('file://origin', { cacheId: 'id', specifier: 'specifier' })).toMatchInlineSnapshot(
        `"file://origin/?%40node-loaders%2Fmocked-type=node-loaders-mock-origin%3A&%40node-loaders%2Fmocked-id=id&%40node-loaders%2Fmocked-specifier=specifier"`,
      );
    });
    it('should fail on bad mockOrigin', () => {
      expect(() => buildMockedOriginUrl('foo', { cacheId: 'id', specifier: 'specifier' })).toThrow();
    });
  });

  describe('buildMockedSpecifierUrl', () => {
    it('should build a file url', () => {
      expect(
        buildMockedSpecifierUrl('file://origin', {
          cacheId: 'id',
          specifier: 'specifier',
          depth: 1,
        }),
      ).toMatchInlineSnapshot(
        `"file://origin/?%40node-loaders%2Fmocked-type=node-loaders-mock-specifier%3A&%40node-loaders%2Fmocked-id=id&%40node-loaders%2Fmocked-specifier=specifier&%40node-loaders%2Fmocked-depth=1"`,
      );
    });
    it('should fail on bad resolvedUrl', () => {
      expect(() => buildMockedSpecifierUrl('foo', { cacheId: 'id', specifier: 'specifier', depth: 1 })).toThrow();
    });
  });

  describe('parseProtocol', () => {
    it('should return undefined for non mock urls', () => {
      expect(parseProtocol('file:///foo')).toBeUndefined();
    });
    it('should throw for missing cacheId', () => {
      expect(() =>
        parseProtocol(
          'file://origin/?%40node-loaders%2Fmocked-type=node-loaders-mock-specifier%3A&%40node-loaders%2Fmocked-specifier=specifier',
        ),
      ).toThrow();
    });
    it('should throw for missing specifier', () => {
      expect(() =>
        parseProtocol('file://origin/?%40node-loaders%2Fmocked-type=node-loaders-mock-specifier%3A&%40node-loaders%2Fmocked-id=id'),
      ).toThrow();
    });
    it('should parse a origin url', () => {
      const url = buildMockedOriginUrl('file://origin', { cacheId: 'id', specifier: 'specifier' });
      expect(parseProtocol(url)).toMatchInlineSnapshot(`
        {
          "cacheId": "id",
          "mockOrigin": "file://origin/",
          "specifier": "specifier",
          "type": "node-loaders-mock-origin:",
        }
      `);
    });
    it('should parse a specifier url', () => {
      const url = buildMockedSpecifierUrl('file://origin', {
        cacheId: 'id',
        specifier: 'specifier',
        depth: 3,
      });
      expect(parseProtocol(url)).toMatchInlineSnapshot(`
        {
          "cacheId": "id",
          "depth": 3,
          "resolvedSpecifier": "file://origin/",
          "specifier": "specifier",
          "type": "node-loaders-mock-specifier:",
        }
      `);
    });
    it('should fail with a bad type', () => {
      const url = buildUrl('foo', 'file://origin', {
        cacheId: 'cacheId',
        specifier: 'bar',
      }).href;
      expect(() => parseProtocol(url)).toThrow();
    });
  });
});
