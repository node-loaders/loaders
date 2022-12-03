import { Node14MockLoader } from './mock-loader.js';

export * from './mock.js';

const loader = new Node14MockLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();
export const transformSource = loader.exportTransformSource();

export { Node14MockLoader } from './mock-loader.js';
