import { pathToFileURL } from 'node:url';
import { createCheckUrl, specifierToFilePath } from '@node-loaders/core';
import { addMockedData } from './support/module-cache.js';
import { resolveCallerUrl } from './support/caller-resolve.js';
import { buildMockUrl } from './support/url-protocol.js';
import { mockedModule } from './support/module-mock.js';
import { type MockedModule } from './support/types.js';

let checked = false;

async function internalImportMock<MockedType = any>(
  url: string,
  specifier: string,
  mockedSpecifiers: Record<string, Record<string, any>>,
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

  const cacheId = addMockedData(mockedSpecifiers);
  const fileUrl = pathToFileURL(specifierToFilePath(specifier, url)).href;
  const mockedSpecifier = buildMockUrl({ specifier, cacheId, resolvedSpecifier: fileUrl, depth: 0 });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return mockedModule(await import(mockedSpecifier), cacheId);
}

export function createImportMock(url: string): typeof mock {
  return async (specifier, mockedSpecifiers) => internalImportMock(url, specifier, mockedSpecifiers);
}

export async function mock<MockedType = any>(
  specifier: string,
  mockedSpecifiers: Record<string, Record<string, any>>,
): Promise<MockedModule<MockedType>> {
  return createImportMock(resolveCallerUrl())(specifier, mockedSpecifiers);
}
