import { createCheckUrl } from '@node-loaders/core';
import { addMockedData, deleteMockedData } from './module-cache.js';
import { resolveCallerUrl } from './caller-resolve.js';
import { buildMockedOriginUrl } from './url-protocol.js';

let checked = false;

export const importMocked = async (specifier: string, mockedSpecifiers: Record<string, Record<string, any>>): Promise<any> => {
  if (!checked) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockImport = await import(createCheckUrl('mock'));
      checked = mockImport.default as boolean;
    } catch {}

    if (!checked) {
      throw new Error('The mock loader is not loaded correctly. Refer to https://github.com/node-loaders/loaders#usage');
    }
  }

  const mockOrigin = resolveCallerUrl();
  const cacheId = await addMockedData(mockedSpecifiers, specifier);
  const mockedSpecifier = buildMockedOriginUrl({ specifier, cacheId, mockOrigin });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const module = await import(mockedSpecifier);
  deleteMockedData(cacheId);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return module;
};
