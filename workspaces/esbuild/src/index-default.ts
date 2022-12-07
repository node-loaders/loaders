import EsbuildLoader from './esbuild-loader.js';
import EsbuildModuleResolver from './esbuild-module-resolver.js';

const loader = new EsbuildLoader({ allowDefaults: true });

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

export const globalPreload = () => {
  new EsbuildModuleResolver().register();
};

export { default as EsbuildLoader } from './esbuild-loader.js';
