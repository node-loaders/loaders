import { jestExpect as expect } from 'mocha-expect-snapshot';
import { mock, isMockFunction, clearAllMocks, checkMocks, resetAllMocks, restoreAllMocks } from '../src/index.js';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const mockedPath = await mock<typeof import('path')>('path');

describe('jest-mock', () => {
  after(() => {
    clearAllMocks();
    resetAllMocks();
    restoreAllMocks();
    checkMocks();
  });

  it('should use mocked module', async () => {
    const mockedDirect = await import('./fixtures/esm/direct.mjs');
    expect(isMockFunction(mockedDirect.join)).toBe(true);
    expect(mockedDirect.join).toBe(mockedPath.join);
  });
});
