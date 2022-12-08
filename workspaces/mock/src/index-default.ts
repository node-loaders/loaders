import MockLoader from './mock-loader.js';
import MockModuleResolver from './mock-module-resolver.js';

export * from './mock-import.js';
export * from './symbols.js';

const loader = new MockLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

export const globalPreload = () => {
  new MockModuleResolver().register();
};

export { default as MockLoader } from './mock-loader.js';
