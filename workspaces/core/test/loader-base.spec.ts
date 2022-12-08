/* eslint-disable max-nested-callbacks */
import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import LoaderBase from '../src/loader-base.js';
import { createCheckUrl } from '../src/specifier.js';
import { type LoadedModule, type NextLoad, type NextResolve, type ResolvedModule } from '../src/index.js';

const urls = ['node:fs', 'fs', 'stack-utils', '@node-loaders/core', '/node_modules/'];
const notFilteredUrls = ['./foo', 'file:///foo', 'http://foo', '/foo', 'c:\\foo'];

describe('loader-base', () => {
  describe('handleSpecifier', () => {
    describe('with default options', () => {
      let loader: LoaderBase;

      beforeEach(() => {
        loader = new LoaderBase();
        loader._handlesEspecifier = jestMock.fn<LoaderBase['_handlesEspecifier']>();
      });

      for (const url of [...urls, ...notFilteredUrls]) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        it(`should call _handleSpecifier for '${url}'`, () => {
          loader.handlesEspecifier(url);
          expect(loader._handlesEspecifier).toHaveBeenCalledWith(url, undefined);
        });
      }
    });

    describe('with default options', () => {
      let loader: LoaderBase;

      beforeEach(() => {
        loader = new LoaderBase('base', {
          forwardBuiltinSpecifiers: true,
          forwardNodeModulesParentSpecifiers: true,
          forwardNodeModulesSpecifiers: true,
          forwardPackageSpecifiers: true,
        });
        loader._handlesEspecifier = jestMock.fn<LoaderBase['_handlesEspecifier']>();
      });

      for (const url of urls) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        it(`should not call _handleSpecifier for '${url}'`, () => {
          expect(loader.handlesEspecifier(url)).toBeFalsy();
          expect(loader._handlesEspecifier).not.toHaveBeenCalled();
        });
      }

      for (const url of notFilteredUrls) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        it(`should call _handleSpecifier for '${url}'`, () => {
          loader.handlesEspecifier(url);
          expect(loader._handlesEspecifier).toHaveBeenCalledWith(url, undefined);
        });
      }

      it("should call _handleSpecifier for '/node_modules/' parentURL", () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        expect(loader.handlesEspecifier('file:///foo', { parentURL: '/node_modules/', conditions: [], importAssertions: {} })).toBeFalsy();
        expect(loader._handlesEspecifier).not.toHaveBeenCalled();
      });
    });
  });

  describe('resolve', () => {
    let loader: LoaderBase;

    beforeEach(() => {
      loader = new LoaderBase('base');
    });

    it('passing the check url, should return the resolved url location', async () => {
      expect(await loader.resolve(createCheckUrl('base'), { conditions: [], importAssertions: {} })).toMatchInlineSnapshot(`
        {
          "format": "module",
          "shortCircuit": true,
          "url": "node-loaders://base",
        }
      `);
    });

    it('not passing nextResolve, should throw', async () => {
      await expect(loader.resolve('./foo', { conditions: [], importAssertions: {} })).rejects.toThrow(
        /nextResolve is required for chaining$/,
      );
    });

    it('should forward to nextResolve', async () => {
      const nextResolve = jestMock.fn<NextResolve>();
      await loader.resolve('./foo', { conditions: [], importAssertions: {} }, nextResolve);
      expect(nextResolve).toHaveBeenCalled();
    });

    describe('when the loader handles the url', () => {
      beforeEach(() => {
        loader.handlesEspecifier = jestMock.fn<LoaderBase['handlesEspecifier']>().mockImplementation(() => true);
      });

      it('should throw not implemented', async () => {
        await expect(loader.resolve('file://foo', { conditions: [], importAssertions: {} }, jestMock.fn<NextResolve>())).rejects.toThrow(
          'not implemented',
        );
      });

      it('should forward to the _resolve', async () => {
        const result: ResolvedModule = { url: 'foo' };
        loader._resolve = jestMock.fn<LoaderBase['_resolve']>().mockImplementation(async () => result);
        expect(await loader.resolve('file://foo', { conditions: [], importAssertions: {} }, jestMock.fn<NextResolve>())).toBe(result);
      });
    });
  });

  describe('load', () => {
    let loader: LoaderBase;

    beforeEach(() => {
      loader = new LoaderBase('base');
    });

    it('passing the check url, should return the check content', async () => {
      expect(await loader.load(createCheckUrl('base'), { conditions: [], importAssertions: {} })).toMatchInlineSnapshot(`
        {
          "format": "module",
          "shortCircuit": true,
          "source": "export default true;",
        }
      `);
    });

    it('not passing nextLoad, should throw', async () => {
      await expect(loader.load('./foo', { conditions: [], importAssertions: {} })).rejects.toThrow(/nextLoad is required for chaining$/);
    });

    it('should forward to nextLoad', async () => {
      const nextLoad = jestMock.fn<NextLoad>();
      await loader.load('./foo', { conditions: [], importAssertions: {} }, nextLoad);
      expect(nextLoad).toHaveBeenCalled();
    });

    describe('when the loader handles the url', () => {
      beforeEach(() => {
        loader.handlesEspecifier = jestMock.fn<LoaderBase['handlesEspecifier']>().mockImplementation(() => true);
      });

      it('should throw not implemented', async () => {
        await expect(loader.load('file://foo', { conditions: [], importAssertions: {} }, jestMock.fn<NextLoad>())).rejects.toThrow(
          'not implemented',
        );
      });

      it('should return the _load value', async () => {
        const result: LoadedModule = { format: 'module', source: 'source' };
        loader._load = jestMock.fn<LoaderBase['_load']>().mockImplementation(async () => result);
        expect(await loader.load('file://foo', { conditions: [], importAssertions: {} }, jestMock.fn<NextLoad>())).toBe(result);
      });
    });
  });
});
