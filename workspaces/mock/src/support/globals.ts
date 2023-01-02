import type MockModuleResolver from '../mock-module-resolver.js';

import { type createRequireMock, type mockRequire } from '../mock-require.js';

export const globalModuleResolverProperty = '@node-loaders/mock/module-resolver';

type GlobalRequire = {
  resolver: MockModuleResolver;
  mockRequire: typeof mockRequire;
  createRequireMock: typeof createRequireMock;
};

export function getGlobalRequire(): GlobalRequire | undefined {
  return global[globalModuleResolverProperty] as GlobalRequire;
}

export function getModuleResolver(): MockModuleResolver | undefined {
  return getGlobalRequire()?.resolver;
}

export function setGlobalRequire(globalRequire: GlobalRequire) {
  global[globalModuleResolverProperty] = globalRequire;
}

// Symbols imported from the package doesn't match the used at the loader.
// Export it to the global context and use from there.
export const globalSymbolsProperty = '@node-loaders/mock/symbols';

export function getGlobalSymbols(): any {
  if (!Object.getOwnPropertyDescriptor(global, globalSymbolsProperty)) {
    Object.defineProperty(global, globalSymbolsProperty, {
      writable: false,
      value: {},
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return global[globalSymbolsProperty];
}

// Symbols imported from the package doesn't match the used at the loader.
// Export it to the global context and use from there.
const globalInternalSymbolsProperty = '@node-loaders/mock/internal-symbols';

export function getGlobalInternalSymbols(): any {
  if (!global[globalInternalSymbolsProperty]) {
    Object.defineProperty(global, globalInternalSymbolsProperty, {
      writable: false,
      value: {},
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return global[globalInternalSymbolsProperty];
}

export const globalCacheProperty = '@node-loaders/mock/cache';

export function getGlobalCache(): any {
  if (!global[globalCacheProperty]) {
    Object.defineProperty(global, globalCacheProperty, {
      writable: false,
      value: {},
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return global[globalCacheProperty];
}
