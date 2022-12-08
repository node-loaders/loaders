import { Node14ChainLoader } from '@node-loaders/core';

let mock;
let esbuild;

try {
  mock = await import('@node-loaders/mock/node14');
} catch {}

try {
  esbuild = await import('@node-loaders/esbuild/node14');
} catch {}

const globalPreload = () => {
  esbuild?.globalPreload();
  mock?.globalPreload();
  return '';
};

const loader = new Node14ChainLoader([mock, esbuild].filter(Boolean));

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();

export const getFormat = loader.exportGetFormat();

export const getSource = loader.exportGetSource();

export { globalPreload as getGlobalPreloadCode, globalPreload };
