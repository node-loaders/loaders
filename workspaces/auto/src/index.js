import { ChainLoader } from '@node-loaders/core';

const loadersList = [];

let globalPreload = () => {};

try {
  loadersList.push(await import('@node-loaders/mock'));
} catch {}

try {
  const esbuild = await import('@node-loaders/esbuild');
  loadersList.push(esbuild);
  globalPreload = esbuild.globalPreload;
} catch {}

const loader = new ChainLoader(loadersList);

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();

export { globalPreload };
