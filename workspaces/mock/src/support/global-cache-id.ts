export const globalModulesProperty = '@node-loaders/mock/cache-id';

export function getCacheIdStores(): Record<string, string[]> {
  if (!global[globalModulesProperty]) {
    Object.defineProperty(global, globalModulesProperty, {
      writable: false,
      value: {},
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return global[globalModulesProperty];
}

export function getCacheIdStoreForCaller(caller: string): string[] {
  const cacheIdStores = getCacheIdStores();
  if (!cacheIdStores[caller]) {
    cacheIdStores[caller] = [];
  }

  return cacheIdStores[caller];
}

export function clearMockedModulesForCaller(caller: string): string[] | undefined {
  const cacheIdStores = getCacheIdStores();
  const cacheIds = cacheIdStores[caller];
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete cacheIdStores[caller];
  return cacheIds;
}

export function addCacheId(caller: string, cacheId: string) {
  getCacheIdStoreForCaller(caller).push(cacheId);
}
