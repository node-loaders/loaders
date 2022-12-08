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
import { parseProtocol, buildMockUrl } from './support/url-protocol.js';

import { existsMockedData, type MockedParentData, useMockedData, getAllMockedData } from './support/module-cache.js';
import { generateEsmSource, getNamedExports, mergeModule } from './support/module-mock.js';
import { fullMock, maxDepth as maxDepthSymbol } from './symbols.js';
import { emptyMock } from './support/symbols-internal.js';
import { defaultMaxDepth } from './constants.js';

export default class MockLoader extends BaseLoader {
  constructor(options: LoaderBaseOptions = {}) {
    super('mock', options);
  }

  override _handlesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return parseProtocol(specifier) !== undefined || (context?.parentURL !== undefined && parseProtocol(context.parentURL) !== undefined);
  }

  async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    const mockData = parseProtocol(specifier);
    if (mockData) {
      // Entry point, will happen only once, when import() a cache protocol,
      this.log(`Handling mocked ${inspect(mockData)}`);
      // The resolvedSpecifier needs to be resolved against the chain.
      const resolved = await nextResolve(mockData.resolvedSpecifier, context);
      return {
        url: buildMockUrl({
          ...mockData,
          resolvedSpecifier: resolved.url,
        }),
        shortCircuit: true,
      };
    }

    const mockedParent = context?.parentURL && parseProtocol(context.parentURL);
    /* c8 ignore next 3 */
    if (!mockedParent) {
      throw new Error(`Error resolving mocked ${specifier}, at %${context?.parentURL ?? 'unknown'}`);
    }

    this.log(`Handling mocked ${specifier} with parent ${inspect(mockedParent)}`);
    // Resolving a specifier loaded by a mocked module
    const { cacheId, depth: parentDepth, resolvedSpecifier: parentSpecifier } = mockedParent;
    const cache = getAllMockedData(cacheId);
    const maxDepth: number = cache?.[maxDepthSymbol] ?? defaultMaxDepth;
    // Resolve the specifier using the chain
    const resolvedSpecifier = await nextResolve(specifier, { ...context, parentURL: parentSpecifier });
    if (maxDepth !== -1 && parentDepth >= maxDepth) {
      this.log(`Max depth has reached, forwarding`);
      return resolvedSpecifier;
    }

    return {
      url: buildMockUrl({
        resolvedSpecifier: resolvedSpecifier.url,
        cacheId,
        specifier,
        depth: parentDepth + 1,
      }),
      shortCircuit: true,
      format: resolvedSpecifier.format,
    };
  }

  async _load(url: string, context: LoadContext, nextLoad: NextLoad): Promise<LoadedModule> {
    const mockData = parseProtocol(url)!;
    this.log(`Handling load mocked ${inspect(mockData)}`);
    const { cacheId, specifier } = mockData;
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
          mockedSpecifierDef.merged = mergeModule(await import(mockData.resolvedSpecifier), mock);
        }
      }

      const namedExports = getNamedExports(mockedSpecifierDef.merged);
      return {
        format: 'module',
        shortCircuit: true,
        source: generateEsmSource(cacheId, specifier, namedExports),
      };
    }

    return nextLoad(mockData.resolvedSpecifier, context);
  }
}
