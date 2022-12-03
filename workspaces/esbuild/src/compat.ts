import EsbuildLoader from './esbuild-loader.js';

const loader = new EsbuildLoader({ allowDefaults: true });

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

export { default as EsbuildLoader } from './esbuild-loader.js';
