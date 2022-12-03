import { inspect } from 'node:util';
import {
  type Format,
  type LoadContext,
  type ResolveContext,
  type ResolvedModule,
  type NextResolve,
  type LoadedModule,
  type NextLoad,
  isFileSpecifier,
  Node14Loader,
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

export default class MockLoader extends Node14Loader {
  override _handlesEspecifier(specifier: string, context?: ResolveContext | undefined): boolean {
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
    const { type, cacheId, mockOrigin } = mockData;
    if (type === mockedOriginProtocol) {
      const resolvedSpecifier = await nextResolve(mockData.specifier, { ...context, parentURL: mockOrigin });
      // Rebuild the url with resolved specifier
      return {
        url: buildMockedModuleUrl({ cacheId, specifier: resolvedSpecifier.url, resolvedParent: mockOrigin, mockOrigin }),
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

      return nextLoad(mockData.resolvedSpecifier, context);
    }

    return nextLoad(specifier, context);
  }
}

export class Node14MockLoader extends MockLoader {
  async _getFormat(url: string, context: Record<string, unknown>): Promise<{ format: string } | undefined> {
    return { format: 'module' };
  }

  async _getSource(
    url: string,
    context: { format: string },
    defaultGetSource: (url: string, context: { format: string }) => Promise<{ source: string | SharedArrayBuffer | Uint8Array }>,
  ): Promise<{ source: string | SharedArrayBuffer | Uint8Array } | undefined> {
    const loadedModule = await this._load(
      url,
      { format: context.format as Format, importAssertions: {}, conditions: [] },
      async (nextUrl: string, nextContext: LoadContext) => {
        const { source } = await defaultGetSource(nextUrl, { format: nextContext.format! });
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return { source: source.toString(), format: nextContext.format! };
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return { source: loadedModule.source.toString() };
  }
}
