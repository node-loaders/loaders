import { deleteAllMockedData, deleteMockedData, getAllMockedData, getMockedModuleStore, type MockCache } from './support/module-cache.js';
import { cacheId as cacheIdSymbol } from './support/symbols-internal.js';
import { ignoreUnused } from './symbols.js';
import { type MockedModule } from './support/types.js';

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
