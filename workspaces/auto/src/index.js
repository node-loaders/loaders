import createStack from './stack-calls.js';

const loadersList = [];

try {
  loadersList.push(await import('@node-loaders/mock'));
} catch {}

try {
  loadersList.push(await import('@node-loaders/esbuild'));
} catch {}

export const resolve = (identifier, context, nextResolve) => {
  return createStack([...loadersList.map(loader => loader.resolve), nextResolve])(identifier, context);
};

export const load = (url, context, nextLoad) => {
  return createStack([...loadersList.map(loader => loader.load), nextLoad])(url, context);
};
