import MockLoader from './mock-loader.js';

export * from './mock.js';

const loader = new MockLoader();

export { MockLoader };
export default loader;
export const resolve = loader.exportResolve();
export const load = loader.exportLoad();
