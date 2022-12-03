import MockLoader from './mock-loader.js';

export * from './mock.js';

const routerLoader = new MockLoader();

export const resolve = routerLoader.exportResolve();
export const load = routerLoader.exportLoad();

export { default } from './mock-loader.js';
