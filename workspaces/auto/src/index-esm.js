import { ChainLoader } from '@node-loaders/core';

let mock;
let esbuild;

try {
  mock = await import('@node-loaders/mock/esm');
} catch {}

try {
  // eslint-disable-next-line n/file-extension-in-import
  esbuild = await import('@node-loaders/esbuild/esm');
} catch {}

const loader = new ChainLoader([mock, esbuild].filter(Boolean));

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();
