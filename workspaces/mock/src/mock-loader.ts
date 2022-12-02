import BaseLoader, {
  type LoadContext,
  type ResolveContext,
  type ResolvedModule,
  type NextResolve,
  type LoadedModule,
  type NextLoad,
} from '@node-loaders/core';
import {
  buildMockedSpecifierUrl,
  mockedSpecifierProtocol,
  mockedModuleProtocol,
  parseProtocol,
  buildMockedModuleUrl,
} from './url-protocol.js';
import { getMockedData } from './module-cache.js';
import { generateSource, getNamedExports, importAndMergeModule } from './module-mock.js';

export default class MockLoader extends BaseLoader {
  override matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return parseProtocol(specifier) !== undefined || (context?.parentURL !== undefined && parseProtocol(context.parentURL) !== undefined);
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    const mockData = parseProtocol(specifier);
    if (mockData) {
      if (mockData.protocol === mockedModuleProtocol) {
        const resolvedSpecifier = await nextResolve(mockData.specifier, { ...context, parentURL: mockData.mockOrigin });
        // Rebuild the url with resolved specifier
        return {
          url: buildMockedModuleUrl({ ...mockData, specifier: resolvedSpecifier.url }),
          format: resolvedSpecifier.format,
          shortCircuit: true,
        };
      }

      // Pass through the specifier
      return {
        url: specifier,
        format: 'module',
        shortCircuit: true,
      };
    }

    if (context.parentURL) {
      const mockedParent = parseProtocol(context.parentURL);
      if (mockedParent) {
        // Resolving a specifier loaded by a mocked module
        const { protocol, cacheId, specifier: parentSpecifier } = mockedParent;
        if (!getMockedData(cacheId, specifier)) {
          throw new Error(`Error resolving mocked ${specifier} at ${parentSpecifier}, mocked object is unavailable`);
        }

        // Resolve the specifier using the chain
        const resolvedSpecifier = await nextResolve(specifier, { ...context, parentURL: parentSpecifier });
        return {
          url: buildMockedSpecifierUrl({
            cacheId,
            specifier,
            resolvedSpecifier: resolvedSpecifier.url,
          }),
          shortCircuit: true,
          format: 'module',
        };
      }
    }

    return nextResolve(specifier, context)!;
  }

  protected async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
    const mockData = parseProtocol(url);
    if (mockData) {
      const { cacheId, specifier, protocol } = mockData;
      if (protocol === mockedSpecifierProtocol) {
        const mockedSpecifierDef = getMockedData(cacheId, specifier);
        if (!mockedSpecifierDef) {
          throw new Error(`Error loading mocked ${specifier}, mocked object is unavailable`);
        }

        mockedSpecifierDef.merged = await importAndMergeModule(mockData.resolvedSpecifier, mockedSpecifierDef.mock);
        const namedExports = getNamedExports(mockedSpecifierDef.merged);
        return {
          format: 'module',
          shortCircuit: true,
          source: generateSource(cacheId, specifier, namedExports),
        };
      }

      return nextLoad(specifier, context)!;
    }

    return nextLoad(url, context)!;
  }
}
