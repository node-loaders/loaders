export const globalCacheProperty = '@node-loaders';

if (!global[globalCacheProperty]) {
  global[globalCacheProperty] = { mocked: {} };
} else if (!global[globalCacheProperty].mocked) {
  global[globalCacheProperty].mocked = {};
}

const mockedStore: Record<string, Record<string, Record<string, any>>> = global[globalCacheProperty].mocked;

export const addMock = (mocked: Record<string, Record<string, any>>): string => {
  const uuid = 'foo';
  mockedStore[uuid] = mocked;
  return uuid;
};

export const getMock = (cacheId: string): Record<string, Record<string, any>> => {
  return mockedStore[cacheId];
};
