// Symbols imported from the package doesn't match the used at the loader.
// Export it to the global context and use from there.
export const globalInternalSymbolsProperty = '@node-loaders-internal-symbols';

if (!global[globalInternalSymbolsProperty]) {
  Object.defineProperty(global, globalInternalSymbolsProperty, {
    writable: false,
    value: {},
  });
}

for (const symbol of ['emptyMock', 'cacheId']) {
  if (!global[globalInternalSymbolsProperty][symbol]) {
    Object.defineProperty(global[globalInternalSymbolsProperty], symbol, {
      writable: false,
      value: Symbol(symbol),
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const emptyMock: unique symbol = global[globalInternalSymbolsProperty].emptyMock;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const cacheId: unique symbol = global[globalInternalSymbolsProperty].cacheId;
