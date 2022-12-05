import { inspect } from 'node:util';
import BaseLoader, {
  type LoadContext,
  type LoadedModule,
  type LoaderBaseOptions,
  type NextResolve,
  type NextLoad,
  type ResolveContext,
  type ResolvedModule,
  isFileSpecifier,
} from '@node-loaders/core';
import { buildMockedSpecifierUrl, mockedSpecifierProtocol, mockedOriginProtocol, parseProtocol } from './url-protocol.js';

import { getMockedData } from './module-cache.js';
import { generateSource, getNamedExports, importAndMergeModule } from './module-mock.js';

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
      const { cacheId, resolvedSpecifier: parentSpecifier } = mockedParent;

      // Resolve the specifier using the chain
      const resolvedSpecifier = await nextResolve(specifier, { ...context, parentURL: parentSpecifier });
      return {
        url: buildMockedSpecifierUrl(resolvedSpecifier.url, {
          cacheId,
          specifier,
        }),
        shortCircuit: true,
        format: resolvedSpecifier.format,
      };
    }

    const mockData = parseProtocol(specifier)!;
    this.log(`Handling mocked ${inspect(mockData)}`);
    const { type, cacheId } = mockData;
    if (type === mockedOriginProtocol) {
      const parentURL = mockData.mockOrigin;
      const resolvedSpecifier = await nextResolve(mockData.specifier, { ...context, parentURL });

      // Rebuild the url with resolved specifier
      return {
        url: buildMockedSpecifierUrl(resolvedSpecifier.url, {
          cacheId,
          specifier,
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
      const mockedSpecifierDef = getMockedData(cacheId, specifier);

      if (mockedSpecifierDef) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        mockedSpecifierDef.merged =
          mockedSpecifierDef.merged ?? (await importAndMergeModule(mockData.resolvedSpecifier, mockedSpecifierDef.mock));
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
