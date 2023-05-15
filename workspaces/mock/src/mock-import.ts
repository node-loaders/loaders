import { pathToFileURL } from 'node:url';
import { createCheckUrl, specifierToFilePath } from '@node-loaders/core';
import { addMockedData } from './support/module-cache.js';
import { resolveCallerUrl } from './support/caller-resolve.js';
import { buildMockUrl } from './support/url-protocol.js';
import { mockedModule } from './support/module-mock.js';
import type { MockFactory, MockedModule } from './support/types.js';
import { getMockedModulesForUrl, addMockedModuleForUrl, clearMockedModulesForUrl } from './support/globals.js';
import { addCacheId, clearMockedModulesForCaller } from './support/global-cache-id.js';
import { clearResolvedCacheForId } from './support/global-resolved-cache.js';

let checked = false;

async function internalImportMock<MockedType = any>(
  url: string,
  specifier: string,
  mockedSpecifiers?: Record<string, ((any) => any) | Record<string, any>>,
): Promise<MockedModule<MockedType>> {
  if (!checked) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockImport = await import(createCheckUrl('mock'));
      checked = mockImport.default as boolean;
      /* c8 ignore next */
    } catch {}

    // Tests have the loader installed, so the query will always succeed
    /* c8 ignore next 3 */
    if (!checked) {
      throw new Error('The mock loader is not loaded correctly. Refer to https://github.com/node-loaders/loaders#usage');
    }
  }

  const globalMockedModules = getMockedModulesForUrl(url);
  const cacheId = addMockedData({ ...globalMockedModules, ...mockedSpecifiers });
  addCacheId(url, cacheId);
  const fileUrl = pathToFileURL(specifierToFilePath(specifier, url)).href;
  const mockedSpecifier = buildMockUrl({ specifier, cacheId, resolvedSpecifier: fileUrl, depth: 0 });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return mockedModule(await import(mockedSpecifier), cacheId);
}

/**
 * Create a import function for the url
 * @param url
 * @returns
 */
export function createImportMock(url: string): typeof importMock {
  return async (specifier, mockedSpecifiers) => internalImportMock(url, specifier, mockedSpecifiers);
}

/**
 * Import with local mocks and options
 * @param specifier
 * @param mockedSpecifiers
 * @returns
 */
export async function importMock<MockedType = any>(
  specifier: string,
  mockedSpecifiers?: Record<string, Record<string, any>>,
): Promise<MockedModule<MockedType>> {
  return createImportMock(resolveCallerUrl())(specifier, mockedSpecifiers);
}

/**
 * Register a mock for resolved specifier at a specific caller
 * @param caller
 * @param specifier
 * @param mocked
 * @returns
 */
export async function internalMockModule<MockedType = Record<string, any>>(
  caller: string,
  specifier: string,
  mocked: MockFactory<MockedType> | MockedType,
): Promise<MockedType>;
export async function internalMockModule<MockedType = Record<string, any>>(
  caller: string,
  specifier: string,
  mocked: <MockedType>(...args: any[]) => MockFactory<MockedType>,
): Promise<<MockedType>(...args: any[]) => MockFactory<MockedType>>;
export async function internalMockModule<MockedType = Record<string, any>>(
  caller: string,
  specifier: string,
  mocked: MockFactory<MockedType> | (<MockedType>(...args: any[]) => MockFactory<MockedType>) | MockedType,
): Promise<MockedType | MockFactory<MockedType>> {
  if (specifier.startsWith('.')) {
    specifier = pathToFileURL(specifierToFilePath(specifier, caller)).href;
  }

  let mockedModule: any = mocked;
  if (typeof mocked === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const actual = await import(specifier);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    mockedModule = mocked(actual);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  addMockedModuleForUrl(caller, specifier, mockedModule);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return mockedModule;
}

/**
 * Register a mock for a resolved specifier at the detected caller
 * @param specifier
 * @param mockedSpecifier
 * @returns
 */
export async function mockModule<MockedType = Record<string, any>>(
  specifier: string,
  mockedSpecifier: MockFactory<MockedType> | MockedType,
) {
  return internalMockModule<MockedType>(resolveCallerUrl(), specifier, mockedSpecifier);
}

/**
 * Remove global mocks at the detected caller
 */
export function removeMocks(): void {
  const caller = resolveCallerUrl();
  clearMockedModulesForUrl(caller);
  const cacheIds = clearMockedModulesForCaller(caller) ?? [];
  for (const cacheId of cacheIds) {
    clearResolvedCacheForId(cacheId);
  }
}

/**
 * Register a mock for a unresolved specifier at the detected caller
 * @param specifier
 * @param mockedSpecifier
 */
export function mockSpecifier(specifier: string, mockedSpecifier: ((any) => any) | Record<string, any>): void {
  addMockedModuleForUrl(resolveCallerUrl(), specifier, mockedSpecifier);
}
