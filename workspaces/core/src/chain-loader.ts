import BaseLoader from './loader-base.js';
import Node14Loader from './loader-base-node14.js';
import { createChainMethod } from './chain.js';

export class ChainLoader extends BaseLoader {
  protected loaders: any[];

  constructor(loaders) {
    super('chain');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.loaders = loaders;

    this.resolve = createChainMethod(this.loaders, 'resolve');
    this.load = createChainMethod(this.loaders, 'load');
  }
}

export class Node14ChainLoader extends Node14Loader {
  protected loaders: any[];

  constructor(loaders) {
    super('chain');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.loaders = loaders;

    this.resolve = createChainMethod(this.loaders, 'resolve');
    this.load = createChainMethod(this.loaders, 'load');

    this.getFormat = createChainMethod(this.loaders, 'getFormat');
    this.getSource = createChainMethod(this.loaders, 'getSource');
    this.transformSource = createChainMethod(this.loaders, 'transformSource');
  }
}
