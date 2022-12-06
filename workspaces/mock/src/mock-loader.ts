import { inspect } from 'node:util';
import BaseLoader, {
  type LoadContext,
  type LoadedModule,
  type LoaderBaseOptions,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
} from '@node-loaders/core';
import { buildMockedSpecifierUrl, mockedSpecifierProtocol, mockedOriginProtocol, parseProtocol } from './url-protocol.js';

import { existsMockedData, type MockedParentData, useMockedData, getAllMockedData } from './module-cache.js';
import { generateSource, getNamedExports, importAndMergeModule } from './module-mock.js';
import { fullMock, maxDepth as maxDepthSymbol } from './symbols.js';
import { emptyMock } from './symbols-internal.js';
import { defaultMaxDepth } from './constants.js';

export default class MockLoader extends BaseLoader {
  constructor(options: LoaderBaseOptions = {}) {
    super('mock', options);
  }

  override _handlesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return parseProtocol(specifier) !== undefined || (context?.parentURL !== undefined && parseProtocol(context.parentURL) !== undefined);
  }

  async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    const mockedParent = context?.parentURL && parseProtocol(context.parentURL);
    if (mockedParent) {
      if (mockedParent.type !== mockedSpecifierProtocol) {
        throw new Error(`Error resolving mocked ${specifier}, specifier type is mandatory for the parentURL param`);
      }

      this.log(`Handling mocked ${specifier} with parent ${inspect(mockedParent)}`);
      // Resolving a specifier loaded by a mocked module
      const { cacheId, depth: parentDepth, resolvedSpecifier: parentSpecifier } = mockedParent;
      const cache = getAllMockedData(cacheId);
      const maxDepth: number = cache?.[maxDepthSymbol] ?? defaultMaxDepth;
      if (maxDepth !== -1 && parentDepth > maxDepth) {
        this.log(`Max depth has reached, forwarding`);
        return nextResolve(specifier, { ...context, parentURL: parentSpecifier });
      }

      // Resolve the specifier using the chain
      const resolvedSpecifier = await nextResolve(specifier, { ...context, parentURL: parentSpecifier });
      return {
        url: buildMockedSpecifierUrl(resolvedSpecifier.url, {
          cacheId,
          specifier,
          depth: parentDepth + 1,
        }),
        shortCircuit: true,
        format: resolvedSpecifier.format,
      };
    }

    const mockData = parseProtocol(specifier)!;
    this.log(`Handling mocked ${inspect(mockData)}`);
    const { type, cacheId, specifier: originalSpecifier } = mockData;
    if (type === mockedOriginProtocol) {
      const parentURL = mockData.mockOrigin;
      const resolvedSpecifier = await nextResolve(mockData.specifier, { ...context, parentURL });

      // Rebuild the url with resolved specifier
      return {
        url: buildMockedSpecifierUrl(resolvedSpecifier.url, {
          cacheId,
          specifier: originalSpecifier,
          depth: 1,
        }),
        format: resolvedSpecifier.format,
        shortCircuit: true,
      };
    }

    throw new Error(`Error resolving mocked ${specifier}, origin type is mandatory for the specifier param`);
  }

  async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
    const mockData = parseProtocol(url)!;
    this.log(`Handling load mocked ${inspect(mockData)}`);
    const { cacheId, specifier, type } = mockData;
    if (type === mockedSpecifierProtocol) {
      if (existsMockedData(cacheId, specifier)) {
        const mockedSpecifierDef: MockedParentData = useMockedData(cacheId, specifier);
        if (!mockedSpecifierDef.merged) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const { mock } = mockedSpecifierDef;
          if (mock[emptyMock]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mockedSpecifierDef.merged = await import(mockData.resolvedSpecifier);
          } else if (mock[fullMock]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mockedSpecifierDef.merged = { ...mock };
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mockedSpecifierDef.merged = await importAndMergeModule(mockData.resolvedSpecifier, mock);
          }
        }

        const namedExports = getNamedExports(mockedSpecifierDef.merged);
        return {
          format: 'module',
          shortCircuit: true,
          source: generateSource(cacheId, specifier, namedExports),
        };
      }

      return nextLoad(mockData.resolvedSpecifier, context);
    }

    throw new Error(`Loading ${url} is not supported, protocol is invalid`);
  }
}
