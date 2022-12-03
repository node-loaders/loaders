import { ChainLoader } from '@node-loaders/core';

const loadersList = [];

try {
  loadersList.push(await import('@node-loaders/mock'));
} catch {}

try {
  loadersList.push(await import('@node-loaders/esbuild'));
} catch {}

const loader = new ChainLoader(loadersList);

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();
