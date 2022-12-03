import { Node14EsbuildLoader } from './esbuild-loader.js';

const loader = new Node14EsbuildLoader();

export default loader;
export const resolve = loader.exportResolve();
export const load = loader.exportLoad();
export { default as EsbuildLoader } from './esbuild-loader.js';

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();
