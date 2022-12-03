import { Node14EsbuildLoader } from './esbuild-loader.js';

const loader = new Node14EsbuildLoader({ allowDefaults: true });

export default loader;
export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

export { Node14EsbuildLoader } from './esbuild-loader.js';
