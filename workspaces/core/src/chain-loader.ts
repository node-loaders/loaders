import { Node14Loader } from './loader-base.js';
import { createChainMethod } from './chain.js';

export class ChainLoader extends Node14Loader {
  protected loaders: any[];

  constructor(loaders) {
    super();

    this.loaders = loaders;

    this.resolve = createChainMethod(this.loaders, 'resolve');
    this.load = createChainMethod(this.loaders, 'load');
  }
}

export class Node14ChainLoader extends ChainLoader {
  constructor(loaders) {
    super(loaders);

    this.getFormat = createChainMethod(this.loaders, 'getFormat');
    this.getSource = createChainMethod(this.loaders, 'getSource');
    this.transformSource = createChainMethod(this.loaders, 'transformSource');
  }
}
