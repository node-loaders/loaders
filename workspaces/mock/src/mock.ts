import { addMockedData, deleteMockedData } from './module-cache.js';
import { resolveCallerUrl } from './caller-resolve.js';
import { buildMockedOriginUrl } from './url-protocol.js';

export const importMocked = async (specifier: string, mockedSpecifiers: Record<string, Record<string, any>>) => {
  const mockOrigin = resolveCallerUrl();
  const cacheId = await addMockedData(mockedSpecifiers, specifier);
  const mockedSpecifier = buildMockedOriginUrl({ specifier, cacheId, mockOrigin });
  const module = await import(mockedSpecifier);
  deleteMockedData(cacheId);
  return module;
};
