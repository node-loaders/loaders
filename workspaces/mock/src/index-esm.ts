import MockLoader from './mock-loader.js';

const loader = new MockLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();
