import { randomUUID } from 'node:crypto';

export const globalCacheProperty = '@node-loaders';

export type MockedParentData = {
  mock: any;
  merged?: any;
};

export const getMockedModuleStore = (): Record<string, Record<string, MockedParentData>> => {
  if (!global[globalCacheProperty]) {
    global[globalCacheProperty] = { mocked: {} };
  } else if (!global[globalCacheProperty].mocked) {
    global[globalCacheProperty].mocked = {};
  }

  return global[globalCacheProperty].mocked as unknown as Record<string, Record<string, MockedParentData>>;
};

export const addMockedData = (mockedModules: Record<string, Record<string, any>>, parentSpecifier: string): string => {
  const cacheId = randomUUID();
  getMockedModuleStore()[cacheId] = Object.fromEntries(Object.entries(mockedModules).map(([key, mock]) => [key, { mock }]));
  return cacheId;
};

export const addMockedSpecifier = (cacheId: string, specifier, mock) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  getMockedModuleStore()[cacheId][specifier] = { mock };
};

export const getMockedData = (cacheId: string, specifier: string): undefined | MockedParentData => {
  return getMockedModuleStore()[cacheId]?.[specifier];
};

export const deleteMockedData = (cacheId: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete getMockedModuleStore()[cacheId];
};
