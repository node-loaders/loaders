// Symbols imported from the package doesn't match the used at the loader.
// Export it to the global context and use from there.
export const globalSymbolsProperty = '@node-loaders-symbols';

if (!Object.getOwnPropertyDescriptor(global, globalSymbolsProperty)) {
  Object.defineProperty(global, globalSymbolsProperty, {
    writable: false,
    value: {},
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const globalNodeLoaders = global[globalSymbolsProperty];

for (const symbol of ['fullMock', 'ignoreUnused', 'maxDepth', 'emptyMock']) {
  if (!Object.getOwnPropertyDescriptor(globalNodeLoaders, symbol)) {
    Object.defineProperty(globalNodeLoaders, symbol, {
      writable: false,
      value: Symbol(symbol),
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const ignoreUnused: unique symbol = global[globalSymbolsProperty].ignoreUnused;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const fullMock: unique symbol = global[globalSymbolsProperty].fullMock;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const maxDepth: unique symbol = global[globalSymbolsProperty].maxDepth;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const emptyMock: unique symbol = global[globalSymbolsProperty].emptyMock;
