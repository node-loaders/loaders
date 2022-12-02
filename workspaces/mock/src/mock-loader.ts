import BaseLoader, {
  type LoadContext,
  type ResolveContext,
  type ResolvedModule,
  type NextResolve,
  type LoadedModule,
  type NextLoad,
  isFileSpecifier,
} from '@node-loaders/core';
import {
  buildMockedSpecifierUrl,
  mockedSpecifierProtocol,
  mockedOriginProtocol,
  parseProtocol,
  buildMockedModuleUrl,
} from './url-protocol.js';
import { getMockedData } from './module-cache.js';
import { generateSource, getNamedExports, importAndMergeModule } from './module-mock.js';
import { inspect } from 'node:util';

export default class MockLoader extends BaseLoader {
  override matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return parseProtocol(specifier) !== undefined || (context?.parentURL !== undefined && parseProtocol(context.parentURL) !== undefined);
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    const mockData = parseProtocol(specifier);
    if (mockData) {
      this.log(`Handling mocked ${inspect(mockData)}`);
      if (mockData.protocol === mockedOriginProtocol) {
        const resolvedSpecifier = await nextResolve(mockData.specifier, { ...context, parentURL: mockData.mockOrigin });
        // Rebuild the url with resolved specifier
        return {
          url: buildMockedModuleUrl({ cacheId: mockData.cacheId, specifier: resolvedSpecifier.url, resolvedParent: mockData.mockOrigin }),
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
        this.log(`Handling mocked ${specifier} with parent ${inspect(mockedParent)}`);
        // Resolving a specifier loaded by a mocked module
        const { cacheId } = mockedParent;
        let { specifier: parentSpecifier } = mockedParent;

        const parentProtocol = parseProtocol(parentSpecifier);
        if (parentProtocol) {
          const parentURL = parentProtocol.protocol === mockedOriginProtocol ? parentProtocol.mockOrigin : undefined;
          parentSpecifier = (await nextResolve(parentProtocol.specifier, { ...context, parentURL })).url;
        }
        if (!getMockedData(cacheId, specifier) && !isFileSpecifier(specifier)) {
          this.log(`Forwarding non mocked module ${specifier}`);
          return nextResolve(specifier, { ...context, parentURL: parentSpecifier });
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
      this.log(`Handling load mocked ${inspect(mockData)}`);
      const { cacheId, specifier, protocol } = mockData;
      if (protocol === mockedSpecifierProtocol) {
        const mockedSpecifierDef = getMockedData(cacheId, specifier);

        if (mockedSpecifierDef) {
          mockedSpecifierDef.merged = await importAndMergeModule(mockData.resolvedSpecifier, mockedSpecifierDef.mock);
          const namedExports = getNamedExports(mockedSpecifierDef.merged);
          return {
            format: 'module',
            shortCircuit: true,
            source: generateSource(cacheId, specifier, namedExports),
          };
        }

        return nextLoad(mockData.resolvedSpecifier, context)!;
      }

      return nextLoad(specifier, context)!;
    }

    return nextLoad(url, context)!;
  }
}
