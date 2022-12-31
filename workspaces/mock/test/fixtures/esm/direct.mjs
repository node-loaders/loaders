import { join, resolve } from 'node:path';
export { default as jestMockDefault, fn as jestMock } from '@node-loaders/test-samples';

const metaUrl = import.meta.url;
export default resolve;
export { join, metaUrl };
