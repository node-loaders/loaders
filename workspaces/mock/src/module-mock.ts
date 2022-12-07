/* eslint-disable @typescript-eslint/no-unsafe-return */
import { globalCacheProperty } from './module-cache.js';
import { cacheId as cacheIdSymbol } from './symbols-internal.js';

export const mergeModule = (original: any, mocked: any): any => {
  const handler1: ProxyHandler<any> = {
    get(target: any, property: string | symbol) {
      if (property in mocked) {
        return mocked[property];
      }

      return Reflect.get(target, property);
    },
  };

  return new Proxy(original, handler1);
};

export const mockedModule = (actualImplementation: any, cacheId: string): any => {
  const handler1: ProxyHandler<any> = {
    get(target: any, property: string | symbol) {
      if (property === cacheIdSymbol) {
        return cacheId;
      }

      return Reflect.get(target, property);
    },
  };

  return new Proxy(actualImplementation, handler1);
};

export const getNamedExports = (module: any): string[] => {
  return Object.getOwnPropertyNames(module);
};

export const generateEsmSource = (cacheId: string, specifier: string, namedExports: string[]) => `
const { ${namedExports
  .map(name => (name === 'default' ? 'default: ___default' : name))
  .join(', ')} } = global['${globalCacheProperty}'].mocked['${cacheId}']['${specifier}'].merged;
export { ${namedExports.map(name => (name === 'default' ? '___default as default' : name)).join(', ')} };
`;
