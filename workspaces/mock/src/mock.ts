import { addMock } from './module-cache.js';
import { buildUrl } from './url-protocol.js';

export const importMocked = async (specifier: string, mockedSpecifiers: Record<string, Record<string, any>>) => {
  // Const resolvedFile = resolvePath(specifier, resolveOriginUrl());
  const cacheId = addMock(mockedSpecifiers);
  return buildUrl({ specifier, cacheId });
};
