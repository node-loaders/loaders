import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock, { type Mock as JestMock } from 'jest-mock';

import { type ResolvedModule, type NextResolve } from '@node-loaders/core';
import { buildMockedSpecifierUrl, buildMockedOriginUrl } from '../src/url-protocol.js';
import loader from '../src/index.js';

describe('mock-loader', () => {
  describe('resolve', () => {
    describe('receiving origin urls', () => {
      it('should convert to module urls', async () => {
        const next = jestMock.fn<NextResolve>().mockResolvedValue({ url: 'file:///resolvedSpecifier', format: 'commonjs' });
        const result = await loader.resolve(
          buildMockedOriginUrl('file:///mock', {
            cacheId: 'cacheId',
            specifier: 'specifier',
          }),
          { conditions: [], importAssertions: {} },
          next,
        );
        expect(result).toMatchInlineSnapshot(`
          {
            "format": "commonjs",
            "shortCircuit": true,
            "url": "file:///resolvedSpecifier?%40node-loaders%2Fmocked-type=node-loaders-mock-specifier%3A&%40node-loaders%2Fmocked-id=cacheId&%40node-loaders%2Fmocked-specifier=specifier&%40node-loaders%2Fmocked-depth=1",
          }
        `);
      });
    });

    describe('receiving specifier protocol', () => {
      it('should throw', async () => {
        await expect(
          loader.resolve(
            buildMockedSpecifierUrl('file:///mock', {
              cacheId: 'cacheId',
              specifier: 'specifier',
              depth: 1,
            }),
            { conditions: [], importAssertions: {} },
          ),
        ).rejects.toThrow(/nextResolve is required for chaining$/);
      });
    });

    describe('receiving origin parentURL', () => {
      it('should convert to module urls', async () => {
        const next = jestMock.fn<NextResolve>();
        const parentURL = buildMockedOriginUrl('file:///mock', {
          cacheId: 'cacheId',
          specifier: 'specifier',
        });
        await expect(loader.resolve('./foo', { parentURL, conditions: [], importAssertions: {} }, next)).rejects.toThrow(
          /specifier type is mandatory for the parentURL param$/,
        );
      });
    });

    describe('receiving specifier parentURL', () => {
      it('should convert to module urls', async () => {
        const next = jestMock.fn<NextResolve>().mockImplementation(async (url: string): Promise<ResolvedModule> => {
          return {
            url: `file:///resolved${url}`,
            format: 'commonjs',
          };
        });
        const parentURL = buildMockedSpecifierUrl('file:///mock', {
          cacheId: 'cacheId',
          specifier: 'specifier',
          depth: 1,
        });
        const result = await loader.resolve('specifier', { parentURL, conditions: [], importAssertions: {} }, next);
        expect(result).toMatchInlineSnapshot(`
          {
            "format": "commonjs",
            "shortCircuit": true,
            "url": "file:///resolvedspecifier?%40node-loaders%2Fmocked-type=node-loaders-mock-specifier%3A&%40node-loaders%2Fmocked-id=cacheId&%40node-loaders%2Fmocked-specifier=specifier&%40node-loaders%2Fmocked-depth=2",
          }
        `);
      });
    });
  });

  describe('load', () => {
    describe('receiving origin urls', () => {
      it('should throw', async () => {
        await expect(
          loader.load(
            buildMockedOriginUrl('file:///mock', {
              cacheId: 'cacheId',
              specifier: 'specifier',
            }),
            { conditions: [], importAssertions: {} },
            (() => {}) as any,
          ),
        ).rejects.toThrow(/is not supported, protocol is invalid$/);
      });
    });
  });
});
