import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import { type ResolvedModule, type NextResolve } from '@node-loaders/core';
import { buildMockUrl } from '../src/support/url-protocol.js';
import loader from '../src/index-default.js';
import { getModuleResolver } from '../src/mock-module-resolver.js';

describe('mock-loader', () => {
  describe('resolve', () => {
    describe('receiving origin urls', () => {
      it('should resolve the next url', async () => {
        const next = jestMock.fn<NextResolve>().mockResolvedValue({ url: 'file:///resolvedSpecifier', format: 'commonjs' });
        const result = await loader.resolve(
          buildMockUrl({
            cacheId: 'cacheId',
            specifier: 'specifier',
            resolvedSpecifier: 'file:///mock',
          }),
          { conditions: [], importAssertions: {} },
          next,
        );
        expect(result).toMatchInlineSnapshot(`
          {
            "format": "commonjs",
            "shortCircuit": true,
            "url": "file:///resolvedSpecifier?%40node-loaders%2Fmocked-depth=1&%40node-loaders%2Fmocked-id=cacheId&%40node-loaders%2Fmocked-specifier=specifier",
          }
        `);
      });
    });

    describe('not receiving nextResolve', () => {
      it('should throw', async () => {
        await expect(
          loader.resolve(
            buildMockUrl({
              resolvedSpecifier: 'file:///mock',
              cacheId: 'cacheId',
              specifier: 'specifier',
              depth: 1,
            }),
            { conditions: [], importAssertions: {} },
          ),
        ).rejects.toThrow(/nextResolve is required for chaining$/);
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
        const parentURL = buildMockUrl({
          resolvedSpecifier: 'file:///mock',
          cacheId: 'cacheId',
          specifier: 'specifier',
          depth: 1,
        });
        const result = await loader.resolve('specifier', { parentURL, conditions: [], importAssertions: {} }, next);
        expect(result).toMatchInlineSnapshot(`
          {
            "format": "commonjs",
            "url": "file:///resolvedspecifier",
          }
        `);
      });
    });
  });
});
