export const globalModulesProperty = '@node-loaders/mock/resolved-cache';

export function getResolvedCacheStores(): Record<string, Record<string, string>> {
  if (!global[globalModulesProperty]) {
    Object.defineProperty(global, globalModulesProperty, {
      writable: false,
      value: {},
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return global[globalModulesProperty];
}

export function getResolvedCacheStoreForId(cacheId: string): Record<string, string> {
  const resolvedCacheStores = getResolvedCacheStores();
  if (!resolvedCacheStores[cacheId]) {
    resolvedCacheStores[cacheId] = {};
  }

  return resolvedCacheStores[cacheId];
}

export function clearResolvedCacheForId(cacheId: string) {
  const resolvedCacheStores = getResolvedCacheStores();
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete resolvedCacheStores[cacheId];
}

export function addResolvedCache(cacheId: string, resolvedSpecifier: string, mockSpecifier: string) {
  getResolvedCacheStoreForId(cacheId)[resolvedSpecifier] = mockSpecifier;
}

export function getResolvedCache(cacheId: string, resolvedSpecifier: string): string | undefined {
  return getResolvedCacheStoreForId(cacheId)?.[resolvedSpecifier];
}
