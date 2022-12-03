import loader from './index.js';

export * from './index.js';

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();
export const transformSource = loader.exportTransformSource();

export { default } from './index.js';
