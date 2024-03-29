import Module, { createRequire } from 'node:module';
import { extname, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { asCjsSpecifier, asEsmSpecifier, normalizeNodeProtocol } from '@node-loaders/core';
import { existsMockedData, type MockedParentData, useMockedData, getAllMockedData, addMockedSpecifier } from './support/module-cache.js';
import { emptyMock, fullMock, maxDepth as maxDepthSymbol } from './symbols.js';
import { mergeModule } from './support/module-mock.js';
import { createMockedFilePath, isMockedFilePath, mockExtension, parseMockedFilePath } from './support/file-path-protocol.js';
import { type MockedIdData } from './support/types.js';
import { defaultMaxDepth } from './constants.js';
import { createRequireMock, mockRequire } from './mock-require.js';
import { globalCacheProperty, getModuleResolver, setGlobalRequire } from './support/globals.js';
import { addResolvedCache, getResolvedCache } from './support/global-resolved-cache.js';

type ResolveFilename = (
  request: string,
  parent: {
    filename: string | undefined;
  },
  isMain: boolean,
  options?: any,
) => string;

const require = createRequire(import.meta.url);

const cjsExtension = (filePath: string) => {
  const extension = extname(filePath);
  return extension === '.cjs' ? '.js' : extension;
};

export const generateCjsSource = (cacheId: string, specifier: string) => `
module.exports = global['${globalCacheProperty}'].mocked['${cacheId}']['${specifier}'].mergedCjs;
`;

export default class MockModuleResolver {
  static register() {
    /* c8 ignore next 4 */
    if (getModuleResolver()) {
      return;
    }

    const resolver = new MockModuleResolver();
    (Module as any)._extensions[mockExtension] = resolver.extensionHandler.bind(resolver);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextResolveFilename = (Module as any)._resolveFilename;

    (Module as any)._resolveFilename = (request, parent, isMain, options) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      resolver.resolveFilename(request, parent, isMain, options, nextResolveFilename);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextLoad = (Module as any)._load;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    (Module as any)._load = (request, parent, isMain) => resolver.load(request, parent, isMain, nextLoad);

    setGlobalRequire({ resolver, mockRequire, createRequireMock });
  }

  readonly cache: Record<string, MockedIdData>;

  constructor() {
    this.cache = {};
  }

  registerFileRequest(data: MockedIdData): string {
    const fileId = randomUUID();
    this.cache[fileId] = data;
    return createMockedFilePath(asCjsSpecifier(data.resolvedSpecifier), fileId);
  }

  extensionHandler(module: Module, filePath: string): void {
    const parsed = parseMockedFilePath(filePath);
    const mockData = this.cache[parsed.id];
    const { cacheId, specifier, resolvedSpecifier } = mockData;
    let mockedSpecifier: string | undefined;
    const cjsSpecifier = asCjsSpecifier(mockData.resolvedSpecifier);

    // Supports relative paths and packages specifiers.
    // Used at `await mockRequire(specifier, { './foo': any, 'path': foo })`
    if (existsMockedData(cacheId, specifier)) {
      mockedSpecifier = specifier;
    }

    // Supports absolute paths.
    // Used at `await mock(specifier); const spec = await import(anotherSpecifier)`
    if (existsMockedData(cacheId, resolvedSpecifier)) {
      mockedSpecifier = resolvedSpecifier;
    }

    if (mockedSpecifier) {
      const mockedSpecifierDef = useMockedData(cacheId, mockedSpecifier);
      if (!mockedSpecifierDef.mergedCjs) {
        const { mock } = mockedSpecifierDef;
        if (mock[emptyMock]) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          mockedSpecifierDef.mergedCjs = require(cjsSpecifier);
        } else if (mock[fullMock]) {
          mockedSpecifierDef.mergedCjs = mock;
        } else if (typeof mock === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          mockedSpecifierDef.mergedCjs = mock(require(cjsSpecifier), { type: 'cjs' });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          mockedSpecifierDef.mergedCjs = mergeModule(require(cjsSpecifier), mock);
        }
      }

      const source = generateCjsSource(cacheId, normalizeNodeProtocol(mockedSpecifier));
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        (module as any)._compile(source, filePath);
        /* c8 ignore next 8 */
      } catch (error: any) {
        // Add generated cjs to the error message
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        error.message = `${error.message} at:
${source}`;
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw error;
      }

      return;
    }

    if (!isAbsolute(cjsSpecifier)) {
      const mockedSpecifierDef = addMockedSpecifier(cacheId, specifier, {});
      mockedSpecifierDef.counter++;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockedSpecifierDef.mergedCjs = require(cjsSpecifier);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (module as any)._compile(generateCjsSource(cacheId, normalizeNodeProtocol(specifier)), filePath);
      return;
    }

    const extension = cjsExtension(cjsSpecifier);
    if (extension in (Module as any)._extensions) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (Module as any)._extensions[extension](module, cjsSpecifier);
      return;
      /* c8 ignore next 4 */
    }

    throw new Error(`Error resolving mocked ${filePath}`);
  }

  // eslint-disable-next-line max-params
  resolveFilename(
    request: string,
    parent: {
      filename: string | undefined;
    },
    isMain: boolean,
    options: any,
    nextResolveFilename: ResolveFilename,
  ): string {
    if (!isMockedFilePath(request) && !(parent?.filename && isMockedFilePath(parent.filename))) {
      return nextResolveFilename(request, parent, isMain, options);
    }

    if (isMockedFilePath(request)) {
      const parsed = parseMockedFilePath(request);
      const extension = cjsExtension(parsed.filePath);
      if (extension && !(extension in (Module as any)._extensions)) {
        // This is not a commonjs file, forward it
        return nextResolveFilename(parsed.filePath, parent, isMain, options);
      }
    }

    if (isMockedFilePath(request) && !(parent?.filename && isMockedFilePath(parent.filename))) {
      const parsed = parseMockedFilePath(request);
      const mockData = this.cache[parsed.id];
      const cjsSpecifier = asCjsSpecifier(mockData.resolvedSpecifier);
      const resolved = nextResolveFilename(cjsSpecifier, parent, isMain, options);
      mockData.resolvedSpecifier = asEsmSpecifier(resolved);
      return createMockedFilePath(resolved, parsed.id);
    }

    const parsedParent = parseMockedFilePath(parent.filename!);
    const { cacheId, depth: parentDepth } = this.cache[parsedParent.id];
    if (isMockedFilePath(request)) {
      const parsed = parseMockedFilePath(request);
      request = parsed.filePath;
    }

    const resolved = nextResolveFilename(request, parent, isMain, options);

    const specifier = isMockedFilePath(request) ? this.cache[parseMockedFilePath(request).id].specifier : request;
    const depth = parentDepth + 1;
    if (!existsMockedData(cacheId, specifier)) {
      const cache = getAllMockedData(cacheId);
      const maxDepth: number = cache?.[maxDepthSymbol] ?? defaultMaxDepth;
      if (maxDepth !== -1 && depth >= maxDepth) {
        return resolved;
      }
    }

    const esmResolved = asEsmSpecifier(resolved);
    const cachedResolved = getResolvedCache(cacheId, esmResolved);
    if (cachedResolved) {
      return cachedResolved;
    }

    const mockResolved = this.registerFileRequest({
      cacheId,
      specifier: normalizeNodeProtocol(request),
      depth,
      resolvedSpecifier: esmResolved,
    });
    addResolvedCache(cacheId, esmResolved, mockResolved);
    return mockResolved;
  }

  load(
    request: string,
    parent: {
      filename: string | undefined;
    },
    isMain: boolean,
    nextLoad: (...args: any[]) => any,
  ) {
    if (!isMockedFilePath(request) && parent?.filename && isMockedFilePath(parent.filename)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return nextLoad(createMockedFilePath(request, randomUUID()), parent, isMain);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return nextLoad(request, parent, isMain);
  }
}
