import { ChainLoader } from '@node-loaders/core';

let mock;
let esbuild;

try {
  mock = await import('@node-loaders/mock');
} catch {}

try {
  // eslint-disable-next-line n/file-extension-in-import
  esbuild = await import('@node-loaders/esbuild/strict');
} catch {}

const globalPreload = () => {
  esbuild?.globalPreload();
  mock?.globalPreload();
};

const loader = new ChainLoader([mock, esbuild].filter(Boolean));

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();

export { globalPreload };
