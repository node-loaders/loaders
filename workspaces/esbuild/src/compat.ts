import EsbuildLoader from './esbuild-loader.js';

const loader = new EsbuildLoader({ allowDefaults: true });

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();
