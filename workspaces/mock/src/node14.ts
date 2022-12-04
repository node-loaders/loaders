import { addNode14Support } from '@node-loaders/core';
import MockLoader from './mock-loader.js';

export class Node14MockLoader extends addNode14Support(MockLoader) {
  async _getFormat(url: string, context: Record<string, unknown>): Promise<{ format: string } | undefined> {
    return { format: 'module' };
  }
}

export * from './mock.js';

const loader = new Node14MockLoader();

export default loader;

export const resolve = loader.exportResolve();
export const load = loader.exportLoad();

// Keep node 14 compatibility
export const getFormat = loader.exportGetFormat();
export const getSource = loader.exportGetSource();
export const transformSource = loader.exportTransformSource();
