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

export const globalModulesProperty = '@node-loaders/mock/global-modules';

export function getMockedModules(): Record<string, Record<string, ((any) => any) | Record<string, any>>> {
  if (!global[globalModulesProperty]) {
    Object.defineProperty(global, globalModulesProperty, {
      writable: false,
      value: {},
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return global[globalModulesProperty];
}

export function getMockedModulesForUrl(url: string): Record<string, ((any) => any) | Record<string, any>> {
  return getMockedModules()[url];
}

export function clearMockedModulesForUrl(url: string) {
  const mockedModules = getMockedModules();
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete mockedModules[url];
}

export function addMockedModuleForUrl(url: string, module: string, mock: ((any) => any) | Record<string, any>) {
  const mockedModules = getMockedModules();
  if (!mockedModules[url]) {
    mockedModules[url] = {};
  }

  mockedModules[url][module] = mock;
}
