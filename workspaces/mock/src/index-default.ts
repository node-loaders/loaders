import MockLoader from './mock-loader.js';

export * from './mock-import.js';
export * from './symbols.js';

const loader = new MockLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

export { default as MockLoader } from './mock-loader.js';
