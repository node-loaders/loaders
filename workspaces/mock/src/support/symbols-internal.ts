import { getGlobalInternalSymbols } from './globals.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const globalInternalSymbols = getGlobalInternalSymbols();

for (const symbol of ['cacheId']) {
  if (!globalInternalSymbols[symbol]) {
    Object.defineProperty(globalInternalSymbols, symbol, {
      writable: false,
      value: Symbol(symbol),
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const cacheId: unique symbol = globalInternalSymbols.cacheId;
