import { getGlobalSymbols } from './support/globals.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const globalNodeLoaders = getGlobalSymbols();

for (const symbol of ['fullMock', 'ignoreUnused', 'maxDepth', 'emptyMock']) {
  if (!Object.getOwnPropertyDescriptor(globalNodeLoaders, symbol)) {
    Object.defineProperty(globalNodeLoaders, symbol, {
      writable: false,
      value: Symbol(symbol),
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const ignoreUnused: unique symbol = globalNodeLoaders.ignoreUnused;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const fullMock: unique symbol = globalNodeLoaders.fullMock;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const maxDepth: unique symbol = globalNodeLoaders.maxDepth;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring
export const emptyMock: unique symbol = globalNodeLoaders.emptyMock;
