const loadersList = [];

try {
  loadersList.push(await import('@node-loaders/mock'));
} catch (error) {}

try {
  loadersList.push(await import('@node-loaders/esbuild'));
} catch (error) {}

const createStack = functions => {
  let stacked = functions.pop();
  while (functions.length > 0) {
    const last = functions.pop();
    const tmp = stacked;
    stacked = (arg1, arg2) => last(arg1, arg2, tmp);
  }
  return stacked;
};

export const resolve = (identifier, context, nextResolve) => {
  return createStack([...loadersList.map(loader => loader.resolve), nextResolve])(identifier, context);
};

export const load = (url, context, nextLoad) => {
  return createStack([...loadersList.map(loader => loader.load), nextLoad])(url, context);
};
