import { randomUUID } from 'node:crypto';
import { isFileSpecifier, resolvePath } from '@node-loaders/core';

import { importAndMergeModule } from './module-mock.js';

export const globalCacheProperty = '@node-loaders';

export type Mock = {
  mock: any;
  merged: any;
};

export const getMockStore = (): Record<string, Record<string, Mock>> => {
  if (!global[globalCacheProperty]) {
    global[globalCacheProperty] = { mocked: {} };
  } else if (!global[globalCacheProperty].mocked) {
    global[globalCacheProperty].mocked = {};
  }

  return global[globalCacheProperty].mocked;
};

export const addCachedMock = async (mockedModules: Record<string, Record<string, any>>, parentSpecifier: string): string => {
  const uuid = randomUUID();
  const mockStore = getMockStore();
  mockStore[uuid] = {};

  for (const [key, mock] of Object.entries(mockedModules)) {
    const resolvedSpecifier = isFileSpecifier(key) ? await resolvePath(key, parentSpecifier) : key;
    if (!resolvedSpecifier) {
      throw new Error(`Error resolving module ${key} imported from ${parentSpecifier}`);
    }

    const merged = await importAndMergeModule(resolvedSpecifier, mock);
    mockStore[uuid][key] = { mock, merged };
  }

  return uuid;
};

export const getCachedMock = (cacheId: string, specifier: string): undefined | Mock => {
  return getMockStore()[cacheId]?.[specifier];
};
