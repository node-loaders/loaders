import { Node14EsbuildLoader } from './node14.js';

const loader = new Node14EsbuildLoader({ allowDefaults: true });

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();
export const transformSource = loader.exportTransformSource();

export { Node14EsbuildLoader } from './node14.js';
