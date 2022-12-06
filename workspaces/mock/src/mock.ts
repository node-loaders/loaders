import { createCheckUrl } from '@node-loaders/core';
import {
  addMockedData,
  deleteAllMockedData,
  deleteMockedData,
  getAllMockedData,
  getMockedModuleStore,
  type MockCache,
} from './module-cache.js';
import { resolveCallerUrl } from './caller-resolve.js';
import { buildMockedOriginUrl } from './url-protocol.js';
import { cacheId as cacheIdSymbol } from './symbols-internal.js';
import { importMockedModule } from './module-mock.js';
import { ignoreUnused } from './symbols.js';

let checked = false;

export type MockedModule<MockedType = any> = {
  [cacheIdSymbol]: boolean;
} & MockedType;

export async function mock<MockedType = any>(
  specifier: string,
  mockedSpecifiers: Record<string, Record<string, any>>,
): Promise<MockedModule<MockedType>> {
  if (!checked) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockImport = await import(createCheckUrl('mock'));
      checked = mockImport.default as boolean;
      /* c8 ignore next */
    } catch {}

    // Tests have the loader installed, so the query will always succeed
    /* c8 ignore next 3 */
    if (!checked) {
      throw new Error('The mock loader is not loaded correctly. Refer to https://github.com/node-loaders/loaders#usage');
    }
  }

  const mockOrigin = resolveCallerUrl();
  const cacheId = addMockedData(mockedSpecifiers);
  const mockedSpecifier = buildMockedOriginUrl(mockOrigin, { specifier, cacheId });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return importMockedModule(mockedSpecifier, cacheId);
}

const getUnusedPaths = (mockCache: MockCache): string[] =>
  Object.entries(mockCache)
    .filter(([mockPath, mock]) => typeof mockPath === 'string' && mock.counter === 0 && !mock.mock[ignoreUnused])
    .map(([mockPath]) => mockPath);

export const checkMock = (mockedModule: MockedModule, deleteMock = true): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cacheId: string = mockedModule[cacheIdSymbol];
  if (!cacheId) {
    throw new Error(`Passed module is not a mocked module`);
  }

  const cache = getAllMockedData(cacheId)!;
  const unusedPaths = getUnusedPaths(cache);
  if (deleteMock) {
    deleteMockedData(cacheId);
  }

  if (unusedPaths.length > 0 && !cache[ignoreUnused]) {
    throw new Error(`Unused mock, ${unusedPaths.join(', ')} is unused at ${cacheId}.`);
  }
};

export const checkMocks = (deleteMocks = true) => {
  const unusedCaches: string[] = Object.entries(getMockedModuleStore())
    .map(([cacheId, cache]) => {
      const unusedPaths = getUnusedPaths(cache);
      if (cache[ignoreUnused]) {
        return undefined;
      }

      return unusedPaths.length > 0 ? `${unusedPaths.join(', ')} is unused at ${cacheId}` : undefined;
    })
    .filter(unused => typeof unused === 'string') as string[];

  if (deleteMocks) {
    deleteAllMockedData();
  }

  if (unusedCaches.length > 0) {
    throw new Error(`Unused mock, ${unusedCaches.join(', ')}.`);
  }
};
