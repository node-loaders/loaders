import { randomUUID } from 'node:crypto';
import { normalizeNodeProtocol } from '@node-loaders/core';
import { type emptyMock, type fullMock, ignoreUnused, maxDepth } from '../symbols.js';
import { getGlobalCache } from './globals.js';
import type { MockFactory } from './types.js';

export type MockedParentData = {
  mock: MockFactory | (Record<string, any> & { [emptyMock]?: boolean; [fullMock]?: boolean });
  counter: number;
  merged?: any;
  esModule?: boolean;
  mergedCjs?: any;
};

export type CacheFlags = {
  [ignoreUnused]?: boolean;
  [maxDepth]?: number;
};

export type MockCache = Record<string, MockedParentData> & CacheFlags;

export type MockStore = Record<string, MockCache>;

export type GlobalMock = {
  mocked?: MockStore;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const globalStore: GlobalMock = getGlobalCache();

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

export const addMockedData = (mockedModules: Record<string, any> & Partial<CacheFlags>): string => {
  const cacheId = randomUUID();

  const cache: MockCache = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Object.entries(mockedModules).map(([key, mock]) => [normalizeNodeProtocol(key), { ...initialMockData, mock }]),
  );
  cache[ignoreUnused] = mockedModules[ignoreUnused];
  cache[maxDepth] = mockedModules[maxDepth];
  getMockedModuleStore()[cacheId] = cache;
  return cacheId;
};

export const getAllMockedData = (cacheId: string): MockCache | undefined => {
  return getMockedModuleStore()[cacheId];
};

export const addMockedSpecifier = (cacheId: string, specifier: string, mock: any): MockedParentData => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const mockedData = { ...initialMockData, mock };
  getAllMockedData(cacheId)![normalizeNodeProtocol(specifier)] = mockedData;
  return mockedData;
};

export const existsMockedData = (cacheId: string, specifier: string): boolean => {
  return getAllMockedData(cacheId)?.[normalizeNodeProtocol(specifier)] !== undefined;
};

export const useMockedData = (cacheId: string, specifier: string): MockedParentData => {
  const mockData = getAllMockedData(cacheId)![normalizeNodeProtocol(specifier)]!;
  mockData.counter++;
  return mockData;
};

export const deleteMockedData = (cacheId: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete getMockedModuleStore()[cacheId];
};
