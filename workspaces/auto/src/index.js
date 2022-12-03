import { Node14Loader } from '@node-loaders/core';
import { createChainMethod } from './chain.js';

const loadersList = [];

try {
  loadersList.push(await import('@node-loaders/mock'));
} catch {}

try {
  loadersList.push(await import('@node-loaders/esbuild'));
} catch {}

export class ChainLoader extends Node14Loader {
  constructor(loaders) {
    super();

    this.loaders = loaders;

    this.resolve = createChainMethod(this.loaders, 'resolve');
    this.load = createChainMethod(this.loaders, 'load');
  }
}

export class Node14ChainLoader extends Node14Loader {
  constructor(loaders) {
    super();

    this.loaders = loaders;

    this.getFormat = createChainMethod(this.loaders, 'getFormat');
    this.getSource = createChainMethod(this.loaders, 'getSource');
    this.transformSource = createChainMethod(this.loaders, 'transformSource');
  }
}

const loader = new ChainLoader(loadersList);

export const resolve = loader.exportResolve();

export const load = loader.exportLoad();

export const getFormat = loader.exportGetFormat();

export const getSource = loader.exportGetSource();

export const transformSource = loader.exportTransformSource();
