import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import StackUtils from 'stack-utils';
import { cachedRoutes } from '@node-loaders/core';
import { type LoadContext, type ResolveContext, type ResolvedModule, type NextResolve } from '@node-loaders/core';

const MOCKED_SEARCHPARAM = '@node-loaders/mocked';

const getCaller = (): string => {
  const stack = new StackUtils();
  const error = new Error();
  const lines = error.stack?.split('\n');
  if (lines && lines.length > 3) {
    const parsed = stack.parseLine(lines[3]);
    if (parsed?.file) {
      if (isAbsolute(parsed.file)) {
        return pathToFileURL(parsed.file).href;
      }

      return parsed.file;
    }
  }

  throw new Error(`Could not find the source`);
};

const resolvedWithMocked = (resolved: ResolvedModule): ResolvedModule => {
  const url = new URL('node-loader://mocked');
  url.searchParams.set(MOCKED_SEARCHPARAM, resolved.url);
  return {
    ...resolved,
    url: url.href,
  };
};

export function mock(module: string, localMocks, globalMocks) {
  const parentModule = getCaller();
  cachedRoutes.foo = {
    matchParent: parentModule,
    matchSpecifier: module,
    async resolve(specifier: string, context: ResolveContext, nextResolve?: NextResolve): Promise<ResolvedModule> {
      return nextResolve!(specifier, context);
    },
    load(url: string, context: LoadContext) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
const forward = await import('node-loader://file?');

`,
      };
    },
  };
}

export function mockImport(module: () => any, mocks: Record<string, any>) {
  const testModule = getCaller();
  cachedRoutes['@node-loaders/mock'] = {
    matchSpecifier: /^node-loaders-mock:/,
    async resolve(specifier, context) {
      return {
        url: specifier,
        shortCircuit: true,
        format: 'module',
      };
    },
    load(url: string, context: LoadContext) {
      const parsed = new URL(url);
      return {
        format: 'module',
        shortCircuit: true,
        source: `
const forward = await import('${parsed.searchParams.get(MOCKED_SEARCHPARAM)}');
const clone = Object.create(Object.getPrototypeOf(forward));
Object.defineProperties(clone, Object.getOwnPropertyDescriptors(forward));

const mocked = global['@node-loaders'].mocked[''];
Object.defineProperties(clone, Object.getOwnPropertyDescriptors(mocked));

`,
      };
    },
  };
  /*
   *
  CachedRoutes.foo = {
    matchSpecifier: new RegExp(Object.keys(mocks).join("|")),
    resolve: async (specifier: string, context: ResolveContext, nextResolve?: NextResolve): Promise<ResolvedModule> => {
      const resolved = await nextResolve!(specifier, context);
      return resolvedWithMocked(resolved);
    },
  }
  */
}
