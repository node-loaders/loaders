import { randomUUID } from 'node:crypto';

export const globalCacheProperty = '@node-loaders';

export type MockedModuleData = {
  mock: any;
  merged?: any;
};

export const getMockedModuleStore = (): Record<string, Record<string, MockedModuleData>> => {
  if (!global[globalCacheProperty]) {
    global[globalCacheProperty] = { mocked: {} };
  } else if (!global[globalCacheProperty].mocked) {
    global[globalCacheProperty].mocked = {};
  }

  return global[globalCacheProperty].mocked;
};

export const addMockedData = async (mockedModules: Record<string, Record<string, any>>, parentSpecifier: string): Promise<string> => {
  const uuid = randomUUID();
  const mockStore = getMockedModuleStore();
  mockStore[uuid] = Object.fromEntries(Object.entries(mockedModules).map(([key, mock]) => [key, { mock }]));
  return uuid;
};

export const getMockedData = (cacheId: string, specifier: string): undefined | MockedModuleData => {
  return getMockedModuleStore()[cacheId]?.[specifier];
};

export const deleteMockedData = (cacheId: string): void => {
  delete getMockedModuleStore()[cacheId];
};
