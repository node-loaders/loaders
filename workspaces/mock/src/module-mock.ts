export const importAndMergeModule = async (specifier: string, mocked: any): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actualImplementation = await import(specifier);

  const handler1: ProxyHandler<any> = {
    get(target: any, property: string) {
      if (property in mocked) {
        return mocked[property];
      }
      return Reflect.get(target, property);
    }
  };

  return new Proxy(actualImplementation, handler1);
};

export const getNamedExports = (module: any): string[] => {
  return Object.getOwnPropertyNames(module);
};
