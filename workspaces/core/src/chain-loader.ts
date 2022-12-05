import BaseLoader from './loader-base.js';
import { addNode14Support } from './loader-base-node14.js';
import { createChainMethod } from './chain.js';

export class ChainLoader extends BaseLoader {
  public loaders: any[];

  constructor(loaders) {
    super('chain');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.loaders = loaders;

    this.resolve = createChainMethod(this.loaders, 'resolve') as unknown as BaseLoader['resolve'];
    this.load = createChainMethod(this.loaders, 'load') as unknown as BaseLoader['load'];
  }
}

export class Node14ChainLoader extends addNode14Support(ChainLoader) {
  constructor(loaders) {
    super(loaders);

    this.getFormat = createChainMethod(this.loaders, 'getFormat') as unknown as Node14ChainLoader['getFormat'];
    this.getSource = createChainMethod(this.loaders, 'getSource') as unknown as Node14ChainLoader['getSource'];
    this.transformSource = createChainMethod(this.loaders, 'transformSource') as unknown as Node14ChainLoader['transformSource'];
  }
}
