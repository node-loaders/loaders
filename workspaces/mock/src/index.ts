import { Node14MockLoader } from './mock-loader.js';

export * from './mock.js';

const loader = new Node14MockLoader();

export default loader;
export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

export { default as MockLoader } from './mock-loader.js';

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();
