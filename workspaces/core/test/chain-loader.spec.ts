import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';

import LoaderBaseNode14 from '../src/loader-base-node14.js';
import { Node14ChainLoader } from '../src/chain-loader.js';
import { type LoaderFunction } from '../src/chain.js';

const loaderProperties = ['resolve', 'load', 'getSource', 'getFormat', 'transformSource'];

describe('chain-loader', () => {
  let loader1: LoaderBaseNode14;
  let loader2: LoaderBaseNode14;
  let chain: Node14ChainLoader;
  let returnValue;
  let returnValueSpy;

  beforeEach(() => {
    loader1 = new LoaderBaseNode14();
    loader2 = new LoaderBaseNode14();

    for (const prop of loaderProperties) {
      loader1[prop] = jestMock.fn<LoaderFunction>().mockImplementation((arg1, arg2, arg3) => {
        return arg3!(arg1, arg2);
      });
      loader2[prop] = jestMock.fn<LoaderFunction>().mockImplementation((arg1, arg2, arg3) => {
        return arg3!(arg1, arg2);
      });
    }

    chain = new Node14ChainLoader([loader1, loader2]);

    returnValue = jestMock.fn();
    returnValueSpy = jestMock.fn<LoaderFunction>().mockImplementation(() => {
      return returnValue;
    });
  });

  for (const prop of loaderProperties) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    it(`should chain ${prop} properties`, () => {
      const arg1 = 'foo';
      const arg2 = { conditions: [], importAssertions: {} };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      expect(chain[prop](arg1, arg2, returnValueSpy)).toBe(returnValue);
      expect(loader1[prop]).toHaveBeenCalledWith(arg1, arg2, expect.any(Function));
      expect(loader2[prop]).toBeCalledWith(arg1, arg2, expect.any(Function));
      expect(returnValueSpy).toBeCalledWith(arg1, arg2);
    });
  }
});