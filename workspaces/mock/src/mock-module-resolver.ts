import Module, { createRequire } from 'node:module';
import { isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { normalizeNodeProtocol } from '@node-loaders/core';
import {
  existsMockedData,
  type MockedParentData,
  useMockedData,
  getAllMockedData,
  globalCacheProperty,
  addMockedSpecifier,
} from './support/module-cache.js';
import { fullMock, maxDepth as maxDepthSymbol } from './symbols.js';
import { emptyMock } from './support/symbols-internal.js';
import { mergeModule } from './support/module-mock.js';
import { createMockedFilePath, isMockedFilePath, mockExtension, parseMockedFilePath } from './support/file-path-protocol.js';
import { type MockedIdData } from './support/types.js';
import { defaultMaxDepth } from './constants.js';
import { createRequireMock, mockRequire } from './mock-require.js';

type ResolveFilename = (
  request: string,
  parent: {
    filename: string | undefined;
  },
  isMain: boolean,
  options?: any,
) => string;

const require = createRequire(import.meta.url);

export const generateCjsSource = (cacheId: string, specifier: string) => `
module.exports = global['${globalCacheProperty}'].mocked['${cacheId}']['${specifier}'].merged;
`;

export default class MockModuleResolver {
  readonly cache: Record<string, MockedIdData>;

  constructor() {
    this.cache = {};
  }

  registerFileRequest(data: MockedIdData): string {
    const fileId = randomUUID();
    this.cache[fileId] = data;
    return createMockedFilePath(data.resolvedSpecifier, fileId);
  }

  extensionHandler(module: Module, filePath: string): void {
    const parsed = parseMockedFilePath(filePath);
    const mockData = this.cache[parsed.id];
    const { cacheId, specifier, resolvedSpecifier } = mockData;
    let source: string;
    if (existsMockedData(cacheId, specifier)) {
      const mockedSpecifierDef: MockedParentData = useMockedData(cacheId, specifier);
      if (!mockedSpecifierDef.merged) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { mock } = mockedSpecifierDef;
        if (mock[emptyMock]) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          mockedSpecifierDef.merged = require(resolvedSpecifier);
        } else if (mock[fullMock]) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          mockedSpecifierDef.merged = { ...mock };
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          mockedSpecifierDef.merged = mergeModule(require(resolvedSpecifier), mock);
        }
      }

      source = generateCjsSource(cacheId, normalizeNodeProtocol(specifier));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (module as any)._compile(source, filePath);
      return;
    }

    if (!isAbsolute(resolvedSpecifier)) {
      const mockedSpecifierDef = addMockedSpecifier(cacheId, specifier, {});
      mockedSpecifierDef.counter++;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mockedSpecifierDef.merged = require(resolvedSpecifier);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (module as any)._compile(generateCjsSource(cacheId, normalizeNodeProtocol(specifier)), filePath);
      return;
    }

    const content = readFileSync(resolvedSpecifier).toString();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (module as any)._compile(content, filePath);
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

    if (isMockedFilePath(request) && !(parent?.filename && isMockedFilePath(parent.filename))) {
      const parsed = parseMockedFilePath(request);
      const mockData = this.cache[parsed.id];
      const resolved = nextResolveFilename(mockData.resolvedSpecifier, parent, isMain, options);
      mockData.resolvedSpecifier = resolved;
      return createMockedFilePath(resolved, parsed.id);
    }

    const parsedParent = parseMockedFilePath(parent.filename!);
    const { cacheId, depth: parentDepth } = this.cache[parsedParent.id];
    if (isMockedFilePath(request)) {
      const parsed = parseMockedFilePath(request);
      request = parsed.filePath;
    }

    const resolved = nextResolveFilename(request, parent, isMain, options);
    if (!isAbsolute(resolved)) {
      // F return resolved;
    }

    const depth = parentDepth + 1;
    if (!existsMockedData(cacheId, request)) {
      const cache = getAllMockedData(cacheId);
      const maxDepth: number = cache?.[maxDepthSymbol] ?? defaultMaxDepth;
      if (maxDepth !== -1 && depth >= maxDepth) {
        return resolved;
      }
    }

    return this.registerFileRequest({
      cacheId,
      specifier: request,
      depth,
      resolvedSpecifier: resolved,
    });
  }

  load(
    request: string,
    parent: {
      filename: string | undefined;
    },
    isMain: boolean,
    nextLoad: (...args: any[]) => any,
  ) {
    if (parent?.filename && isMockedFilePath(parent.filename)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return nextLoad(createMockedFilePath(request, randomUUID()), parent, isMain);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return nextLoad(request, parent, isMain);
  }

  register() {
    (Module as any)._extensions[mockExtension] = this.extensionHandler.bind(this);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextResolveFilename = (Module as any)._resolveFilename;
    (Module as any)._resolveFilename = (request, parent, isMain, options) =>
      this.resolveFilename(request, parent, isMain, options, nextResolveFilename);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nextLoad = (Module as any)._load;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (Module as any)._load = (request, parent, isMain) => this.load(request, parent, isMain, nextLoad);

    global['@node-loaders/mock'] = { resolver: this, mockRequire, createRequireMock };
  }
}
