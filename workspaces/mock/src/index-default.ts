import MockModuleResolver from './mock-module-resolver.js';

export * from './mock-import.js';
export * from './mock-require.js';
export * from './mock-check.js';
export * from './symbols.js';
export { type MockedModule } from './support/types.js';
export { resolveCallerUrl } from './support/caller-resolve.js';

export { default, resolve, load } from './index-esm.js';

export const globalPreload = () => {
  MockModuleResolver.register();
};

export { default as MockLoader } from './mock-loader.js';
