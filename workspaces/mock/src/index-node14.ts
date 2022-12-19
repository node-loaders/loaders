import { addNode14Support, isBuiltinModule } from '@node-loaders/core';
import MockLoader from './mock-loader.js';
import { parseProtocol } from './support/url-protocol.js';
import { addMockedSpecifier, existsMockedData } from './support/module-cache.js';
import { emptyMock } from './symbols.js';
import MockModuleResolver from './mock-module-resolver.js';

export class Node14MockLoader extends addNode14Support(MockLoader) {
  async _getFormat(
    url: string,
    context: Record<string, unknown>,
    defaultGetFormat: (url: string, context: Record<string, unknown>) => Promise<{ format: string }>,
  ): Promise<{ format: string } | undefined> {
    const mockData = parseProtocol(url);
    if (mockData) {
      if (isBuiltinModule(mockData.specifier)) {
        if (!existsMockedData(mockData.cacheId, mockData.specifier)) {
          // At node 14 we always need to mock a builtin module
          addMockedSpecifier(mockData.cacheId, mockData.specifier, { [emptyMock]: true });
        }

        return { format: 'module' };
      }

      if (existsMockedData(mockData.cacheId, mockData.specifier)) {
        return { format: 'module' };
      }

      return defaultGetFormat(mockData.resolvedSpecifier, context);
    }

    return defaultGetFormat(url, context);
  }
}

const loader = new Node14MockLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();

export const globalPreload = () => {
  MockModuleResolver.register();
};

export const getGlobalPreloadCode = () => {
  MockModuleResolver.register();
  return '';
};
