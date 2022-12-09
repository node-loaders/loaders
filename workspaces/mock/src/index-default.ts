import MockModuleResolver from './mock-module-resolver.js';

export * from './mock-import.js';
export * from './mock-require.js';
export * from './symbols.js';

export { default, resolve, load } from './index-esm.js';

export const globalPreload = () => {
  new MockModuleResolver().register();
};

export { default as MockLoader } from './mock-loader.js';
