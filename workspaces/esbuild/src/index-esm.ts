import EsbuildLoader from './esbuild-loader.js';

const loader = new EsbuildLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();
