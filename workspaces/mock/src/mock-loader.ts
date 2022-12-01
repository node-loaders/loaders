import BaseLoader, {
  type LoadContext,
  type ResolveContext,
  type ResolvedModule,
  type NextResolve,
  type LoadedModule,
  type NextLoad,
} from '@node-loaders/core';
import { buildMockedSpecifierUrl, parseProtocol } from './url-protocol.js';
import { getMock, globalCacheProperty } from './module-cache.js';

export default class MockLoader extends BaseLoader {
  protected override _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return parseProtocol(specifier) !== undefined;
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve | undefined): Promise<ResolvedModule> {
    const mockData = parseProtocol(specifier);
    if (mockData) {
      return {
        url: specifier,
        shortCircuit: true,
      };
    }

    if (context.parentURL) {
      const mockedParent = parseProtocol(context.parentURL);
      if (mockedParent) {
        const parentMockedSpecifiers = getMock(mockedParent.cacheId);
        if (parentMockedSpecifiers[specifier]) {
          return {
            url: buildMockedSpecifierUrl({ cacheId: mockedParent.cacheId, specifier }),
            shortCircuit: true,
            format: 'module',
          };
        }
      }
    }

    return nextResolve?.(specifier, context)!;
  }

  protected async _load(url: string, context: LoadContext, nextLoad?: NextLoad | undefined): Promise<LoadedModule> {
    const mockedModule = parseProtocol(url);
    if (mockedModule) {
      return nextLoad?.(mockedModule.specifier, context)!;
    }

    const mockedSpecifier = parseProtocol(url);
    if (mockedSpecifier) {
      const mockedSpecifierDef = getMock(mockedSpecifier.cacheId)?.[mockedSpecifier.specifier];
      if (mockedSpecifierDef) {
        const namedExports = Object.keys(mockedSpecifierDef);
        const exports = namedExports.join(', ');
        return {
          format: 'module',
          shortCircuit: true,
          source: `
  const mockedModule = global['${globalCacheProperty}'].mocked['${mockedSpecifier.cacheId}'];
  export { ${exports} } from mockedModule;
  `,
        };
      }

      return nextLoad?.(mockedSpecifier.specifier, context)!;
    }

    return nextLoad?.(url, context)!;
  }
}
