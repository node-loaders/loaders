import { jestExpect as expect } from 'mocha-expect-snapshot';
import { mock, isMockFunction, clearAllMocks, checkMocks, resetAllMocks, restoreAllMocks, importMock } from '../src/index.js';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const mockedPath = await mock<typeof import('path')>('path');
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const mockedCjs = await mock<typeof import('./fixtures/cjs/func.cjs')>('./fixtures/cjs/func.cjs');

describe('jest-mock', () => {
  after(() => {
    clearAllMocks();
    restoreAllMocks();
  });

  afterEach(() => {
    resetAllMocks();
  });

  it('should use mocked esm module', async () => {
    const mockedDirect = await import('./fixtures/esm/direct.mjs');
    expect(isMockFunction(mockedDirect.join)).toBe(true);
    expect(mockedDirect.join).toBe(mockedPath.join);
  });

  it('should use mocked cjs module', async () => {
    const { default: mockedDirect } = await import('./fixtures/cjs/direct.mjs');
    expect(isMockFunction(mockedDirect)).toBe(true);
  });
});
