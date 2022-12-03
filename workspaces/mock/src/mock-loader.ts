import { inspect } from 'node:util';
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
  mockedModuleProtocol,
} from './url-protocol.js';
import { getMockedData } from './module-cache.js';
import { generateSource, getNamedExports, importAndMergeModule } from './module-mock.js';

export default class MockLoader extends BaseLoader {
  override matchesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return parseProtocol(specifier) !== undefined || (context?.parentURL !== undefined && parseProtocol(context.parentURL) !== undefined);
  }

  protected async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    const mockedParent = context?.parentURL && parseProtocol(context.parentURL);
    if (mockedParent) {
      this.log(`Handling mocked ${specifier} with parent ${inspect(mockedParent)}`);
      // Resolving a specifier loaded by a mocked module
      const { cacheId, mockOrigin } = mockedParent;
      let { specifier: parentSpecifier } = mockedParent;
      if (mockedParent.type === mockedSpecifierProtocol) {
        parentSpecifier = mockedParent.resolvedSpecifier;
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
          mockOrigin,
        }),
        shortCircuit: true,
        format: 'module',
      };
    }

    const mockData = parseProtocol(specifier)!;
    this.log(`Handling mocked ${inspect(mockData)}`);
    if (mockData.type === mockedOriginProtocol) {
      const { mockOrigin } = mockData;
      const resolvedSpecifier = await nextResolve(mockData.specifier, { ...context, parentURL: mockOrigin });
      // Rebuild the url with resolved specifier
      return {
        url: buildMockedModuleUrl({ cacheId: mockData.cacheId, specifier: resolvedSpecifier.url, resolvedParent: mockOrigin, mockOrigin }),
        format: resolvedSpecifier.format,
        shortCircuit: true,
      };
    }

    throw new Error(`Error resolving mocked ${specifier}, origin type is required`);
  }

  protected async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
    const mockData = parseProtocol(url)!;
    this.log(`Handling load mocked ${inspect(mockData)}`);
    const { cacheId, specifier, type } = mockData;
    if (type === mockedSpecifierProtocol) {
      const mockedSpecifierDef = getMockedData(cacheId, specifier);

      if (mockedSpecifierDef) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
}
