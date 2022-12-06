// Symbols imported from the package doesn't match the used at the loader.
// Export it to the global context and use from there.
export const globalSymbolsProperty = '@node-loaders-symbols';

if (!global[globalSymbolsProperty]) {
  Object.defineProperty(global, globalSymbolsProperty, {
    writable: false,
    value: {},
  });
}

for (const symbol of ['fullMock', 'ignoreUnused']) {
  if (!global[globalSymbolsProperty][symbol]) {
    Object.defineProperty(global[globalSymbolsProperty], symbol, {
      writable: false,
      value: Symbol(symbol),
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const ignoreUnused: unique symbol = global[globalSymbolsProperty].ignoreUnused;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const fullMock: unique symbol = global[globalSymbolsProperty].fullMock;
