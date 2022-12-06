import { randomUUID } from 'node:crypto';
import { ignoreCounterCheck } from './symbols-internal.js';

export const globalCacheProperty = '@node-loaders';

export type MockedParentData = {
  mock: any;
  counter: number;
  merged?: any;
};

type IgnoreCounter = {
  [ignoreCounterCheck]?: boolean;
};

export type MockCache = Record<string, MockedParentData> & IgnoreCounter;

export type MockStore = Record<string, MockCache>;

export type GlobalMock = {
  mocked?: MockStore;
};

if (!global[globalCacheProperty]) {
  Object.defineProperty(global, globalCacheProperty, {
    writable: false,
    value: {},
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const globalStore: GlobalMock = global[globalCacheProperty];

const initialMockData = {
  counter: 0,
};

export const getMockedModuleStore = (): MockStore => {
  if (!globalStore.mocked) {
    globalStore.mocked = {};
  }

  return globalStore.mocked as unknown as MockStore;
};

export const deleteAllMockedData = (): void => {
  delete globalStore.mocked;
};

export const addMockedData = (mockedModules: Record<string, any> & IgnoreCounter): string => {
  const cacheId = randomUUID();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cache: MockCache = Object.fromEntries(Object.entries(mockedModules).map(([key, mock]) => [key, { ...initialMockData, mock }]));
  cache[ignoreCounterCheck] = mockedModules[ignoreCounterCheck];
  getMockedModuleStore()[cacheId] = cache;
  return cacheId;
};

export const getAllMockedData = (cacheId: string): MockCache | undefined => {
  return getMockedModuleStore()[cacheId];
};

export const addMockedSpecifier = (cacheId: string, specifier, mock) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  getAllMockedData(cacheId)![specifier] = { ...initialMockData, mock };
};

export const existsMockedData = (cacheId: string, specifier: string): boolean => {
  return getAllMockedData(cacheId)?.[specifier] !== undefined;
};

export const useMockedData = (cacheId: string, specifier: string): MockedParentData => {
  const mockData = getAllMockedData(cacheId)![specifier]!;
  mockData.counter++;
  return mockData;
};

export const deleteMockedData = (cacheId: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete getMockedModuleStore()[cacheId];
};
