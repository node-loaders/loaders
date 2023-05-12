import BaseLoader, { type Loader } from './loader-base.js';
import { createChainMethod } from './chain.js';

export class ChainLoader extends BaseLoader {
  public loaders: Loader[];

  constructor(loaders) {
    super('chain');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.loaders = loaders;

    this.resolve = createChainMethod(this.loaders, 'resolve') as unknown as BaseLoader['resolve'];
    this.load = createChainMethod(this.loaders, 'load') as unknown as BaseLoader['load'];
  }
}
