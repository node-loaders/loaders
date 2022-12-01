import BaseLoader, {
  type LoadContext,
  type ResolveContext,
  type ResolvedModule,
  type NextResolve,
  type LoadedModule,
  type NextLoad,
} from '@node-loaders/core';
import { buildMockedSpecifierUrl, parseProtocol } from './url-protocol.js';
import { getCachedMock, globalCacheProperty } from './module-cache.js';
import { generateSource, getNamedExports, importAndMergeModule } from './module-mock.js';

export default class MockLoader extends BaseLoader {
  protected override _matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return parseProtocol(specifier) !== undefined || (context?.parentURL !== undefined && parseProtocol(context.parentURL) !== undefined);
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
        const cachedMock = getCachedMock(mockedParent.cacheId, specifier);
        if (cachedMock) {
          const resolvedSpecifier = (await this.resolveModuleUrl(specifier))!;
          return {
            url: buildMockedSpecifierUrl({
              specifier,
              cacheId: mockedParent.cacheId,
              resolvedSpecifier,
              parentSpecifier: context.parentURL,
            }),
            shortCircuit: true,
            format: 'module',
          };
        }
      }
    }

    if (nextResolve) {
      return nextResolve(specifier, context)!;
    }

    throw this.createModuleNotFoundError(specifier, context?.parentURL);
  }

  protected async _load(url: string, context: LoadContext, nextLoad?: NextLoad | undefined): Promise<LoadedModule> {
    const mockedModule = parseProtocol(url);
    if (mockedModule) {
      const { cacheId, specifier } = mockedModule;
      const mockedSpecifierDef = getCachedMock(cacheId, specifier);
      if (mockedSpecifierDef) {
        const namedExports = getNamedExports(mockedSpecifierDef.merged);
        return {
          format: 'module',
          shortCircuit: true,
          source: generateSource(cacheId, specifier, namedExports),
        };
      }

      return nextLoad?.(mockedModule.specifier, context)!;
    }

    return nextLoad?.(url, context)!;
  }
}
