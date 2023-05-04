import { jestExpect as expect } from 'mocha-expect-snapshot';
import jestMock from 'jest-mock';
import { type LoaderFunction, createChain, createChainMethod } from '../src/chain.js';

describe('chain', () => {
  let order: string[];
  let returnValue;
  let spy1;
  let spy2;

  beforeEach(() => {
    order = [];
    returnValue = {};
    spy1 = jestMock.fn<LoaderFunction>().mockImplementation(async (arg1, arg2, arg3) => {
      order.push('spy1');
      return arg3!(arg1, arg2);
    });
    spy2 = jestMock.fn<LoaderFunction>().mockImplementation(async () => {
      order.push('spy2');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return returnValue;
    });
  });

  describe('createChain', () => {
    it('should chain functions', async () => {
      const arg1 = {};
      const arg2 = {};
      expect(await createChain(spy1, spy2)(arg1, arg2)).toBe(returnValue);
      expect(order).toEqual(['spy1', 'spy2']);
      expect(spy1).toHaveBeenCalledWith(arg1, arg2, spy2);
      expect(spy2).toBeCalledWith(arg1, arg2);
    });
    it('should throw on no function', () => {
      expect(() => createChain()).toThrow('At least 1 method is required');
    });
  });
  describe('createChainMethod', () => {
    it('should chain properties', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const object1 = { spy: spy1 };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const object2 = { spy: spy1 };
      const arg1 = {};
      const arg2 = {};
      expect(await createChainMethod([object1, object2], 'spy')(arg1, arg2, spy2)).toBe(returnValue);
      expect(order).toEqual(['spy1', 'spy1', 'spy2']);
      expect(spy1).toHaveBeenNthCalledWith(1, arg1, arg2, expect.any(Function));
      expect(spy1).toHaveBeenNthCalledWith(2, arg1, arg2, expect.any(Function));
      expect(spy2).toBeCalledWith(arg1, arg2);
    });
  });
});
