import { type Format } from '@node-loaders/core';

export const globalEsbuildCacheProperty = '@node-loaders/esbuild';

if (!global[globalEsbuildCacheProperty]) {
  Object.defineProperty(global, globalEsbuildCacheProperty, {
    writable: false,
    value: {},
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const esbuildGlobal: EsbuildCacheStore = global[globalEsbuildCacheProperty];

type EsbuildCacheStore = {
  cache: CacheStore;
};

type CacheStore = Record<string, EsbuildCacheEntry>;

type EsbuildCacheEntry = {
  source: string;
  format: Format;
};

export class EsbuildCache {
  get(resolvedUrl: string): EsbuildCacheEntry | undefined {
    return this.getCache()[resolvedUrl];
  }

  set(resolvedUrl: string, value: EsbuildCacheEntry) {
    this.getCache()[resolvedUrl] = value;
  }

  private getCache(): CacheStore {
    if (!esbuildGlobal.cache) {
      esbuildGlobal.cache = {};
    }

    return esbuildGlobal.cache;
  }
}
