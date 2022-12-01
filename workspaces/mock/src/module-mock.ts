import { globalCacheProperty } from './module-cache.js';

export const importAndMergeModule = async (specifier: string, mocked: any): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actualImplementation = await import(specifier);

  const handler1: ProxyHandler<any> = {
    get(target: any, property: string) {
      if (property in mocked) {
        return mocked[property];
      }

      return Reflect.get(target, property);
    },
  };

  return new Proxy(actualImplementation, handler1);
};

export const getNamedExports = (module: any): string[] => {
  return Object.getOwnPropertyNames(module);
};

export const generateSource = (cacheId: string, specifier: string, namedExports: string[]) => `
const { ${namedExports
  .map(name => (name === 'default' ? 'default: ___default' : name))
  .join(', ')} } = global['${globalCacheProperty}'].mocked['${cacheId}']['${specifier}'].merged;
export { ${namedExports.map(name => (name === 'default' ? '___default as default' : name)).join(', ')} };
`;
