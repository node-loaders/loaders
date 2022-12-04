/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
export const createChainMethod = (list, property) => (identifier, context, next) =>
  createChain([...list.map(loader => loader[property]).filter(Boolean), (...args) => next(...args)])(identifier, context);

export const createChain = functions => {
  let stacked = functions.pop();
  while (functions.length > 0) {
    const last = functions.pop();
    const temporary = stacked;
    stacked = (arg1, arg2) => last(arg1, arg2, temporary);
  }

  return stacked;
};
