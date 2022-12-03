import { Node14ChainLoader } from '@node-loaders/core';

const loadersList = [];

try {
  loadersList.push(await import('@node-loaders/mock'));
} catch {}

try {
  loadersList.push(await import('@node-loaders/esbuild'));
} catch {}

const loader = new Node14ChainLoader(loadersList);

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();

export const getFormat = loader.exportGetFormat();

export const getSource = loader.exportGetSource();

export const transformSource = loader.exportTransformSource();
