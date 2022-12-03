import createStack from './stack-calls.js';

const loadersList = [];

try {
  loadersList.push(await import('@node-loaders/mock'));
} catch {}

try {
  loadersList.push(await import('@node-loaders/esbuild'));
} catch {}

const filterPropertyStack = (list, property, last) => createStack([...list.map(loader => loader[property]).filter(Boolean), last]);

export const resolve = (identifier, context, next) => {
  return filterPropertyStack(loadersList, 'resolve', next)(identifier, context);
};

export const load = (url, context, next) => {
  return filterPropertyStack(loadersList, 'load', next)(url, context);
};

export const getFormat = (url, context, next) => {
  return filterPropertyStack(loadersList, 'getFormat', next)(url, context);
};

export const getSource = (url, context, next) => {
  return filterPropertyStack(loadersList, 'getSource', next)(url, context);
};

export const transformSource = (url, context, next) => {
  return filterPropertyStack(loadersList, 'transformSource', next)(url, context);
};
