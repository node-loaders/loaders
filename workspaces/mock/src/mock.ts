import { pathToFileURL } from 'node:url';
import { isFileSpecifier, resolvePath } from '@node-loaders/core';
import { addCachedMock, deleteCachedMock } from './module-cache.js';
import { resolveCallerUrl } from './caller-resolve.js';
import { buildUrl } from './url-protocol.js';

export const importMocked = async (specifier: string, mockedSpecifiers: Record<string, Record<string, any>>) => {
  const parentSpecifier = pathToFileURL((await resolvePath(resolveCallerUrl()))!).href;
  if (isFileSpecifier(specifier)) {
    const resolvedModule = await resolvePath(specifier, parentSpecifier);
    specifier = pathToFileURL(resolvedModule!).href;
  } else {
    throw new Error(`Only files modules are supporte for mocking, got ${specifier}`);
  }

  const cacheId = await addCachedMock(mockedSpecifiers, specifier);
  const mockedSpecifier = buildUrl({ specifier, cacheId });
  const module = await import(mockedSpecifier);
  deleteCachedMock(cacheId);
  return module;
};
