import EsbuildLoader from './esbuild-loader.js';
import EsbuildModuleResolver from './esbuild-module-resolver.js';

const loader = new EsbuildLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

export { globalPreload } from './index-default.js';
