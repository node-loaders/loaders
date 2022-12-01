import EsbuildLoader from './esbuild-loader.js';

const routerLoader = new EsbuildLoader();

export const resolve = routerLoader.exportResolve();
export const load = routerLoader.exportLoad();
