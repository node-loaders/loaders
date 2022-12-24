import { inspect } from 'node:util';
import BaseLoader, {
  type LoadContext,
  type LoadedModule,
  type LoaderBaseOptions,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
  normalizeNodeProtocol,
  asEsmSpecifier,
  asCjsSpecifier,
} from '@node-loaders/core';

import { parseProtocol, buildMockUrl } from './support/url-protocol.js';
import { existsMockedData, type MockedParentData, useMockedData, getAllMockedData } from './support/module-cache.js';
import { generateEsmSource, getNamedExports, mergeModule } from './support/module-mock.js';
import { emptyMock, fullMock, maxDepth as maxDepthSymbol } from './symbols.js';
import { defaultMaxDepth } from './constants.js';
import type MockModuleResolver from './mock-module-resolver.js';
import { isMockedFilePath, parseMockedFilePath } from './support/file-path-protocol.js';

export default class MockLoader extends BaseLoader {
  constructor(options: LoaderBaseOptions = {}) {
    super('mock', options);
  }

  override _handlesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
    return (
      parseProtocol(specifier) !== undefined ||
      (context?.parentURL !== undefined && parseProtocol(context.parentURL) !== undefined) ||
      isMockedFilePath(specifier)
    );
  }

  async _resolve(specifier: string, context: ResolveContext, nextResolve: NextResolve): Promise<ResolvedModule> {
    if (isMockedFilePath(specifier)) {
      // Convert back to url
      const cjsSpecifier = asCjsSpecifier(specifier);
      const parsed = parseMockedFilePath(cjsSpecifier);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const moduleResolver: MockModuleResolver = global['@node-loaders/mock'].resolver;
      const data = moduleResolver.cache[parsed.id];
      specifier = buildMockUrl({
        ...data,
        specifier: asEsmSpecifier(data.specifier),
        resolvedSpecifier: asEsmSpecifier(data.resolvedSpecifier),
      });
    }

    specifier = normalizeNodeProtocol(specifier);
    const mockData = parseProtocol(specifier);
    if (mockData) {
      // Entry point, will happen only once, when import() a cache protocol,
      this.log?.(`Handling mocked ${inspect(mockData)}`);
      // The resolvedSpecifier needs to be resolved against the chain.
      const resolved = await nextResolve(mockData.resolvedSpecifier, context);
      return {
        url: buildMockUrl({
          ...mockData,
          resolvedSpecifier: resolved.url,
        }),
        format: resolved.format,
        shortCircuit: true,
      };
    }

    const mockedParent = context?.parentURL && parseProtocol(context.parentURL);
    /* c8 ignore next 3 */
    if (!mockedParent) {
      throw new Error(`Error resolving mocked ${specifier}, at %${context?.parentURL ?? 'unknown'}`);
    }

    this.log?.(`Handling mocked ${specifier} with parent ${inspect(mockedParent)}`);
    // Resolving a specifier loaded by a mocked module
    const { cacheId, depth: parentDepth, resolvedSpecifier: parentSpecifier } = mockedParent;
    const cache = getAllMockedData(cacheId);
    const maxDepth: number = cache?.[maxDepthSymbol] ?? defaultMaxDepth;
    // Resolve the specifier using the chain
    const resolvedSpecifier = await nextResolve(specifier, { ...context, parentURL: parentSpecifier });
    if (maxDepth !== -1 && parentDepth >= maxDepth) {
      this.log?.(`Max depth has reached, forwarding`);
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
    this.log?.(`Handling load mocked ${inspect(mockData)}, ${inspect(context)}`);
    const { cacheId, specifier, actual } = mockData;
    if (actual) {
      return nextLoad(mockData.resolvedSpecifier, context);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const importedSpecifier = await import(buildMockUrl({ ...mockData, actual: true }));
    if (context.format === 'commonjs' && !importedSpecifier.__esModule && global['@node-loaders/mock'].resolver) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const moduleResolver: MockModuleResolver = global['@node-loaders/mock'].resolver;
      const responseURL = asEsmSpecifier(moduleResolver.registerFileRequest(mockData));
      this.log?.(`Handling cjs mocked module ${responseURL}`);
      return { shortCircuit: true, format: 'commonjs', responseURL, source: null };
    }

    if (existsMockedData(cacheId, specifier)) {
      const mockedSpecifierDef: MockedParentData = useMockedData(cacheId, specifier);
      if (!mockedSpecifierDef.merged) {
        const { mock } = mockedSpecifierDef;
        if (typeof mock === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          mockedSpecifierDef.merged = mock(importedSpecifier);
        } else {
          if (mock.default === undefined && mockedSpecifierDef.esModule === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mockedSpecifierDef.esModule = importedSpecifier.__esModule;
          }

          this.log?.(`Preparing mocked module`);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const mockModule = mockedSpecifierDef.esModule ? { ...mock, default: mergeModule(importedSpecifier.default, mock) } : mock;
          if (mock[emptyMock]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mockedSpecifierDef.merged = importedSpecifier;
          } else if (mock[fullMock]) {
            mockedSpecifierDef.merged = { ...mockModule };
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mockedSpecifierDef.merged = mergeModule(importedSpecifier, mockModule);
          }
        }
      }

      const namedExports = getNamedExports(mockedSpecifierDef.merged);
      return {
        format: 'module',
        shortCircuit: true,
        source: generateEsmSource(cacheId, specifier, namedExports),
      };
    }

    this.log?.(`Fallback to next load`);
    return nextLoad(mockData.resolvedSpecifier, context);
  }
}
