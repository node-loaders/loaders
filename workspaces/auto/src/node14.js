import { Node14ChainLoader } from '@node-loaders/core';

const loadersList = [];

try {
  loadersList.push(await import('@node-loaders/mock/node14'));
} catch {}

try {
  loadersList.push(await import('@node-loaders/esbuild/node14'));
} catch {}

const loader = new Node14ChainLoader(loadersList);

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();

export const getFormat = loader.exportGetFormat();

export const getSource = loader.exportGetSource();
