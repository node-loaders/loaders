// Symbols imported from the package doesn't match the used at the loader.
// Export it to the global context and use from there.
export const globalSymbolsProperty = '@node-loaders-symbols';

if (!global[globalSymbolsProperty]) {
  Object.defineProperty(global, globalSymbolsProperty, {
    writable: false,
    value: {},
  });
}

if (!global[globalSymbolsProperty].fullMock) {
  Object.defineProperty(global[globalSymbolsProperty], 'fullMock', {
    writable: false,
    value: Symbol('fullMock'),
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const fullMock: unique symbol = global[globalSymbolsProperty].fullMock;
