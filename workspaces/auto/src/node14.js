import { Node14ChainLoader } from '@node-loaders/core';

const loadersList = [];

let globalPreload = () => {};
let getGlobalPreloadCode = () => {};

try {
  loadersList.push(await import('@node-loaders/mock/node14'));
} catch {}

try {
  const esbuild = await import('@node-loaders/esbuild/node14');
  loadersList.push(esbuild);
  globalPreload = esbuild.globalPreload;
  getGlobalPreloadCode = esbuild.getGlobalPreloadCode;
} catch {}

const loader = new Node14ChainLoader(loadersList);

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();

export const getFormat = loader.exportGetFormat();

export const getSource = loader.exportGetSource();

export { getGlobalPreloadCode, globalPreload };
