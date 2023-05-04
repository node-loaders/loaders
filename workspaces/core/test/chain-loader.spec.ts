import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import LoaderBaseNode from '../src/loader-base.js';
import { ChainLoader } from '../src/chain-loader.js';
import { type LoaderFunction } from '../src/chain.js';

const loaderProperties = ['resolve', 'load'];

describe('chain-loader', () => {
  let loader1: LoaderBaseNode;
  let loader2: LoaderBaseNode;
  let chain: ChainLoader;
  let returnValue;
  let returnValueSpy;

  beforeEach(() => {
    loader1 = new LoaderBaseNode();
    loader2 = new LoaderBaseNode();

    for (const prop of loaderProperties) {
      loader1[prop] = jestMock.fn<LoaderFunction>().mockImplementation(async (arg1, arg2, arg3) => {
        return arg3!(arg1, arg2);
      });
      loader2[prop] = jestMock.fn<LoaderFunction>().mockImplementation(async (arg1, arg2, arg3) => {
        return arg3!(arg1, arg2);
      });
    }

    chain = new ChainLoader([loader1, loader2]);

    returnValue = jestMock.fn();
    returnValueSpy = jestMock.fn<LoaderFunction>().mockImplementation(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return returnValue;
    });
  });

  for (const prop of loaderProperties) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    it(`should chain ${prop} properties`, async () => {
      const arg1 = 'foo';
      const arg2 = { conditions: [], importAssertions: {} };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      expect(await chain[prop](arg1, arg2, returnValueSpy)).toBe(returnValue);
      expect(loader1[prop]).toHaveBeenCalledWith(arg1, arg2, expect.any(Function));
      expect(loader2[prop]).toBeCalledWith(arg1, arg2, expect.any(Function));
      expect(returnValueSpy).toBeCalledWith(arg1, arg2);
    });
  }
});
