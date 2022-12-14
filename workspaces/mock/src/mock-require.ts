import { createRequire } from 'node:module';
import { specifierToFilePath, asEsmSpecifier } from '@node-loaders/core';
import { addMockedData } from './support/module-cache.js';
import { resolveCallerUrl } from './support/caller-resolve.js';
import { mockedModule } from './support/module-mock.js';
import { type MockedModule } from './support/types.js';
import type MockModuleResolver from './mock-module-resolver.js';

function internalRequireMock<MockedType = any>(
  url: string,
  specifier: string,
  mockedSpecifiers: Record<string, Record<string, any>>,
): MockedModule<MockedType> {
  const cacheId = addMockedData(mockedSpecifiers);
  const filePath = specifierToFilePath(specifier, url);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const resolver: MockModuleResolver = global['@node-loaders/mock']?.resolver;
  /* c8 ignore next 3 */
  if (!resolver) {
    throw new Error(`Mock loader was not loaded correctly`);
  }

  const mockFile = resolver.registerFileRequest({
    cacheId,
    depth: 0,
    specifier,
    resolvedSpecifier: asEsmSpecifier(filePath),
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return mockedModule(createRequire(url)(mockFile), cacheId);
}

export function createRequireMock(url: string): typeof mockRequire {
  return (specifier, mockedSpecifiers) => internalRequireMock(url, specifier, mockedSpecifiers);
}

export function mockRequire<MockedType = any>(
  specifier: string,
  mockedSpecifiers: Record<string, Record<string, any>>,
): MockedModule<MockedType> {
  return createRequireMock(resolveCallerUrl())(specifier, mockedSpecifiers);
}
